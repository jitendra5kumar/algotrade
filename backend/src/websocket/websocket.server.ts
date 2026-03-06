import io from 'socket.io';
import { Server as HTTPServer } from 'http';
import config from '../config/environment';
import authService from '../services/auth.service';
import logger from '../utils/logger';
import { AuthenticatedSocket } from './websocket.types';
import { WebSocketEmitters } from './websocket-emitters';
import { WebSocketSubscriptions } from './websocket-subscriptions';
import { WebSocketMarketData } from './websocket-market-data';
import { InstrumentMapping } from './websocket.types';

class WebSocketServer {
    private io: io.Server | null = null;
    private connectedClients: Map<string, AuthenticatedSocket> = new Map();
    private marketDataSubscriptions: Map<string, Set<string>> = new Map(); // symbol -> Set of socket IDs
    private strategyLogSubscriptions: Map<string, Set<string>> = new Map(); // strategyId -> Set of socket IDs
    private symbolToInstrumentMap: Map<string, InstrumentMapping> = new Map(); // symbol -> instrument
    private instrumentToSymbolMap: Map<number, string> = new Map(); // exchangeInstrumentID -> full symbol name
    
    private emitters: WebSocketEmitters;
    private subscriptions: WebSocketSubscriptions;
    private marketData: WebSocketMarketData;

    constructor() {
        // Initialize emitters with null io (will be updated in initialize)
        this.emitters = new WebSocketEmitters(null);
        
        // Initialize market data handler
        this.marketData = new WebSocketMarketData(
            this.marketDataSubscriptions,
            this.symbolToInstrumentMap,
            this.instrumentToSymbolMap,
            this.emitters
        );
        
        // Initialize subscriptions handler
        this.subscriptions = new WebSocketSubscriptions(
            this.marketDataSubscriptions,
            this.strategyLogSubscriptions,
            this.symbolToInstrumentMap,
            this.instrumentToSymbolMap,
            () => this.marketData.startMarketDataStreaming()
        );
    }

    /**
     * Initialize WebSocket server
     */
    public initialize(httpServer: HTTPServer): void {
        logger.info('🔧 [WebSocket] Initializing WebSocket server:', {
            path: config.WS_PATH,
            allowedOrigins: config.ALLOWED_ORIGINS,
            pingTimeout: config.WS_PING_TIMEOUT,
            pingInterval: config.WS_PING_INTERVAL
        });

        try {
            // Socket.IO v2 configuration
            this.io = io(httpServer, {
                path: config.WS_PATH,
                origins: config.ALLOWED_ORIGINS,
                pingTimeout: config.WS_PING_TIMEOUT,
                pingInterval: config.WS_PING_INTERVAL,
                transports: ['websocket', 'polling']
            } as any);

            // Update emitters with new io instance
            this.emitters = new WebSocketEmitters(this.io);

            this.setupMiddleware();
            this.setupConnectionHandlers();

            logger.info('✅ [WebSocket] WebSocket server initialized successfully');
        } catch (error: any) {
            logger.error('❌ [WebSocket] Failed to initialize WebSocket server:', error);
            throw error;
        }
    }

    /**
     * Setup authentication middleware
     */
    private setupMiddleware(): void {
        if (!this.io) {
            logger.error('Cannot setup middleware - io not initialized');
            return;
        }

        logger.info('Setting up authentication middleware');

        this.io.use(async (socket: AuthenticatedSocket, next) => {
            try {
                // Get token from handshake
                const token = socket.handshake.auth?.token || socket.handshake.query?.token as string;

                if (!token) {
                    logger.warn('No token provided in connection attempt', { 
                        socketId: socket.id,
                        hasAuthToken: !!socket.handshake.auth?.token,
                        hasQueryToken: !!socket.handshake.query?.token,
                        queryKeys: Object.keys(socket.handshake.query || {}),
                    });
                    return next(new Error('Authentication token required'));
                }

                // Validate token format
                if (typeof token !== 'string' || token.trim().length === 0) {
                    logger.warn('Invalid token format in connection attempt', { 
                        socketId: socket.id,
                        tokenType: typeof token,
                        tokenLength: token?.length,
                    });
                    return next(new Error('Invalid token format'));
                }

                // Check if token is JWT format
                const tokenParts = token.trim().split('.');
                if (tokenParts.length !== 3) {
                    logger.warn('Token is not in JWT format', { 
                        socketId: socket.id,
                        tokenParts: tokenParts.length,
                    });
                    return next(new Error('Invalid token format - expected JWT'));
                }

                // Verify token
                const decoded = authService.verifyAccessToken(token.trim());
                if (!decoded) {
                    logger.warn('Token verification failed', { 
                        socketId: socket.id,
                        tokenPrefix: token.substring(0, 20) + '...',
                    });
                    return next(new Error('Invalid or expired token'));
                }

                // Attach user info to socket
                socket.userId = decoded.userId;
                socket.email = decoded.email;

                logger.info(`WebSocket authenticated: ${decoded.email}`, {
                    socketId: socket.id,
                    userId: decoded.userId,
                });
                next();
            } catch (error: any) {
                logger.error('WebSocket authentication error:', {
                    error: error?.message || String(error),
                    stack: error?.stack,
                    socketId: socket.id,
                });
                next(new Error(`Authentication failed: ${error?.message || 'Unknown error'}`));
            }
        });
    }

    /**
     * Setup connection handlers
     */
    private setupConnectionHandlers(): void {
        if (!this.io) return;

        // Handle server-level errors (if engine supports it)
        if (this.io.engine && typeof (this.io.engine as any).on === 'function') {
            (this.io.engine as any).on('connection_error', (error: Error) => {
                logger.error('WebSocket server connection error:', {
                    message: error.message,
                    stack: error.stack,
                });
            });
        }

        this.io.on('connection', (socket: AuthenticatedSocket) => {
            const userId = socket.userId!;
            
            logger.info(`WebSocket client connected: ${socket.id} (User: ${userId})`, {
                socketId: socket.id,
                userId,
                email: socket.email,
            });
            
            // Store connection
            this.connectedClients.set(userId, socket);

            // Join user-specific room
            socket.join(`user_${userId}`);

            // Send connection confirmation
            socket.emit('connected', {
                message: 'Connected to AlgoTrade WebSocket',
                socketId: socket.id,
                userId,
            });

            // Handle subscriptions
            this.subscriptions.setupSubscriptions(socket);

            // Handle disconnection with better error handling
            socket.on('disconnect', (reason: string) => {
                logger.info(`WebSocket client disconnected: ${socket.id} (Reason: ${reason})`, {
                    userId,
                    reason,
                    socketId: socket.id,
                });
                
                // Clean up subscriptions
                try {
                    // Remove from connected clients
                    this.connectedClients.delete(userId);
                    
                    // Clean up market data subscriptions for this user
                    for (const [symbol, socketIds] of this.marketDataSubscriptions.entries()) {
                        socketIds.delete(socket.id);
                        if (socketIds.size === 0) {
                            this.marketDataSubscriptions.delete(symbol);
                        }
                    }
                    
                    // Clean up strategy log subscriptions
                    for (const [strategyId, socketIds] of this.strategyLogSubscriptions.entries()) {
                        socketIds.delete(socket.id);
                        if (socketIds.size === 0) {
                            this.strategyLogSubscriptions.delete(strategyId);
                        }
                    }
                } catch (cleanupError) {
                    logger.error('Error during WebSocket cleanup:', cleanupError);
                }

                // Log disconnect reason for debugging
                if (reason === 'io server disconnect') {
                    logger.warn('Server initiated disconnect - client may need to reconnect', {
                        userId,
                        socketId: socket.id,
                    });
                } else if (reason === 'transport close') {
                    logger.warn('Transport closed - network issue or timeout', {
                        userId,
                        socketId: socket.id,
                    });
                } else if (reason === 'transport error') {
                    logger.error('Transport error - connection problem', {
                        userId,
                        socketId: socket.id,
                    });
                }
            });

            // Handle errors with detailed logging
            socket.on('error', (error: Error) => {
                logger.error(`WebSocket error for ${socket.id}:`, {
                    error: error.message,
                    stack: error.stack,
                    userId,
                    socketId: socket.id,
                });
                
                // Emit error to client if still connected
                if (socket.connected) {
                    socket.emit('error', {
                        message: 'WebSocket error occurred',
                        timestamp: new Date().toISOString(),
                    });
                }
            });

            // Handle connection errors
            socket.on('connect_error', (error: Error) => {
                logger.error(`WebSocket connection error for ${socket.id}:`, {
                    error: error.message,
                    stack: error.stack,
                    userId,
                    socketId: socket.id,
                });
            });

            // Handle ping/pong for connection health
            socket.on('ping', () => {
                logger.debug(`Received ping from ${socket.id}`);
            });

            socket.on('pong', () => {
                logger.debug(`Received pong from ${socket.id}`);
            });
        });
    }

    /**
     * Emit market data to subscribers
     */
    public emitMarketData(symbol: string, data: Record<string, unknown>): void {
        this.emitters.emitMarketData(symbol, data);
    }

    /**
     * Emit order update to user
     */
    public emitOrderUpdate(userId: string, order: Record<string, unknown>): void {
        this.emitters.emitOrderUpdate(userId, order);
    }

    /**
     * Emit position update to user
     */
    public emitPositionUpdate(userId: string, position: Record<string, unknown>): void {
        this.emitters.emitPositionUpdate(userId, position);
    }

    /**
     * Emit strategy signal
     */
    public emitStrategySignal(strategyId: string, signal: Record<string, unknown>): void {
        this.emitters.emitStrategySignal(strategyId, signal);
    }

    /**
     * Emit event to a specific user
     */
    public emitToUser(userId: string, event: string, data: Record<string, unknown>): void {
        this.emitters.emitToUser(userId, event, data);
    }

    /**
     * Emit notification to a specific user
     */
    public emitNotification(userId: string, notification: {
        type: string;
        title: string;
        message: string;
    }): void {
        this.emitters.emitNotification(userId, notification);
    }

    /**
     * Emit strategy log
     */
    public emitStrategyLog(strategyId: string, log: Record<string, unknown>): void {
        this.emitters.emitStrategyLog(strategyId, log);
    }

    /**
     * Emit trade execution
     */
    public emitTradeExecution(userId: string, trade: Record<string, unknown>): void {
        this.emitters.emitTradeExecution(userId, trade);
    }

    /**
     * Close WebSocket server
     */
    public close(): void {
        if (this.io) {
            this.io.close();
            this.io = null;
            logger.info('WebSocket server closed');
        }
    }
}

// Export singleton instance
const websocketServer = new WebSocketServer();
export default websocketServer;
