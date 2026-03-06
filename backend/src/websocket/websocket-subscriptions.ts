import { AuthenticatedSocket } from './websocket.types';
import logger from '../utils/logger';

export class WebSocketSubscriptions {
    constructor(
        private marketDataSubscriptions: Map<string, Set<string>>,
        private strategyLogSubscriptions: Map<string, Set<string>>,
        private symbolToInstrumentMap: Map<string, { exchangeSegment: number, exchangeInstrumentID: number, fullSymbolName?: string }>,
        private instrumentToSymbolMap: Map<number, string>,
        private startMarketDataStreaming: () => Promise<void>
    ) {}

    /**
     * Handle subscription events
     */
    public setupSubscriptions(socket: AuthenticatedSocket): void {
        // Subscribe to market data
        socket.on('subscribe:market_data', async (data: { symbols: string[] }) => {
            await this.handleMarketDataSubscription(socket, data);
        });

        // Subscribe to strategy logs
        socket.on('subscribe:strategy_logs', async (data: { strategyId: string }) => {
            await this.handleStrategyLogsSubscription(socket, data);
        });

        // Unsubscribe from strategy logs
        socket.on('unsubscribe:strategy_logs', (data: { strategyId: string }) => {
            this.handleStrategyLogsUnsubscription(socket, data);
        });

        // Unsubscribe from market data
        socket.on('unsubscribe:market_data', (data: { symbols: string[] }) => {
            this.handleMarketDataUnsubscription(socket, data);
        });

        // Subscribe to strategy updates
        socket.on('subscribe:strategy', (data: { strategyId: string }) => {
            this.handleStrategySubscription(socket, data);
        });

        // Unsubscribe from strategy
        socket.on('unsubscribe:strategy', (data: { strategyId: string }) => {
            this.handleStrategyUnsubscription(socket, data);
        });

        // Subscribe to order updates
        socket.on('subscribe:orders', () => {
            this.handleOrdersSubscription(socket);
        });

        // Subscribe to position updates
        socket.on('subscribe:positions', () => {
            this.handlePositionsSubscription(socket);
        });
    }

    /**
     * Handle market data subscription
     */
    private async handleMarketDataSubscription(socket: AuthenticatedSocket, data: { symbols: string[] }): Promise<void> {
        logger.info(`User ${socket.userId} subscribed to market data:`, {
            userId: socket.userId,
            symbols: data.symbols,
            socketId: socket.id,
        });
        
        // Import Strategy model to get instrument mappings
        const Strategy = (await import('../models/Strategy.model')).default;
        
        try {
            // Normalize symbols for case-insensitive lookup
            const normalizedSymbols = data.symbols.map(s => s ? s.toUpperCase().trim() : '').filter(Boolean);
            
            // Get strategies for symbols to find exchangeInstrumentID mappings
            const strategies = await Strategy.find({
                $or: normalizedSymbols.map(symbol => ({
                    symbol: { $regex: new RegExp(`^${symbol}$`, 'i') }
                })),
                userId: socket.userId
            }).select('symbol exchangeSegment exchangeInstrumentID');
            
            logger.info('Found strategies for symbols', {
                requestedSymbols: normalizedSymbols,
                foundStrategies: strategies.length,
                strategySymbols: strategies.map(s => s.symbol),
            });

            // Build symbol to instrument mapping from strategies
            await this.buildStrategyMappings(strategies);

            logger.info('Strategy mappings created', {
                symbolCount: this.symbolToInstrumentMap.size,
                instrumentCount: this.instrumentToSymbolMap.size
            });

            // For symbols not found in strategies, try to find them directly in XtsInstrument
            const symbolsNotFoundInStrategies = normalizedSymbols.filter(symbol => {
                const userHasStrategy = strategies.some(s => 
                    s.symbol && s.symbol.toUpperCase().trim() === symbol
                );
                
                if (userHasStrategy) {
                    return false;
                }
                
                if (!this.symbolToInstrumentMap.has(symbol)) {
                    logger.debug('Symbol not in map, will lookup', { symbol });
                    return true;
                }
                
                logger.debug('Symbol already in map, skipping lookup', { symbol });
                return false;
            });

            if (symbolsNotFoundInStrategies.length > 0) {
                await this.lookupMissingSymbols(symbolsNotFoundInStrategies);
            }
        } catch (error: any) {
            logger.error('Error fetching strategy mappings for WebSocket subscription:', error);
        }
        
        // Add symbols to subscriptions
        data.symbols.forEach(symbol => {
            const normalizedSymbol = symbol ? symbol.toUpperCase().trim() : null;
            if (!normalizedSymbol) return;
            
            socket.join(`market_${normalizedSymbol}`);
            
            if (!this.marketDataSubscriptions.has(normalizedSymbol)) {
                this.marketDataSubscriptions.set(normalizedSymbol, new Set());
            }
            this.marketDataSubscriptions.get(normalizedSymbol)!.add(socket.id);
            
            const hasMapping = this.symbolToInstrumentMap.has(normalizedSymbol);
            const mapping = hasMapping ? this.symbolToInstrumentMap.get(normalizedSymbol) : null;
            
            // CRITICAL: If no mapping found, log warning but still allow subscription
            // The mapping will be created when quote arrives via dynamic lookup
            if (!hasMapping) {
                logger.warn('Subscribed to symbol but NO MAPPING FOUND - quotes may not forward until mapping is created', {
                    symbol: normalizedSymbol,
                    socketId: socket.id,
                    note: 'Mapping will be created dynamically when quote arrives, but subscription symbol must match'
                });
            }
            
            logger.info('Subscribed to symbol', {
                symbol: normalizedSymbol,
                socketId: socket.id,
                totalSubscribers: this.marketDataSubscriptions.get(normalizedSymbol)?.size || 0,
                hasMapping: hasMapping,
                mappingExchangeInstrumentID: mapping?.exchangeInstrumentID,
                mappingExchangeSegment: mapping?.exchangeSegment,
                totalSubscriptions: this.marketDataSubscriptions.size,
                allSubscriptions: Array.from(this.marketDataSubscriptions.keys())
            });
        });

        // Log final mapping state before starting streaming
        logger.info('Final mapping state before starting market data streaming', {
            requestedSymbols: data.symbols,
            symbolToInstrumentMapSize: this.symbolToInstrumentMap.size,
            instrumentToSymbolMapSize: this.instrumentToSymbolMap.size,
            mappings: Array.from(this.symbolToInstrumentMap.entries()).map(([sym, inst]) => ({
                symbol: sym,
                exchangeSegment: inst.exchangeSegment,
                exchangeInstrumentID: inst.exchangeInstrumentID,
                fullSymbolName: inst.fullSymbolName
            })),
            reverseMappings: Array.from(this.instrumentToSymbolMap.entries()).slice(0, 10).map(([id, sym]) => ({
                exchangeInstrumentID: id,
                symbol: sym
            }))
        });

        // Start or update market data streaming
        await this.startMarketDataStreaming();

        socket.emit('subscribed', {
            type: 'market_data',
            symbols: data.symbols,
        });
    }

    /**
     * Build symbol mappings from strategies
     */
    private async buildStrategyMappings(strategies: any[]): Promise<void> {
        const XtsInstrument = (await import('../models/XtsInstrument.model')).default;
        
        for (const strategy of strategies) {
            const shortSymbol = strategy.symbol ? strategy.symbol.toUpperCase().trim() : null;
            if (!shortSymbol || !strategy.exchangeInstrumentID) continue;

            let exchangeSegment = 1;
            if (strategy.exchangeSegment === 'NSECM') {
                exchangeSegment = 1;
            } else if (strategy.exchangeSegment === 'NSEFO') {
                exchangeSegment = 2;
            } else if (strategy.exchangeSegment === 'NSECD') {
                exchangeSegment = 3;
            } else if (strategy.exchangeSegment === 'BSECM') {
                exchangeSegment = 11;
            } else if (strategy.exchangeSegment === 'BSEFO') {
                exchangeSegment = 12;
            } else if (strategy.exchangeSegment === 'MCXFO') {
                exchangeSegment = 51;
            }

            let fullSymbolName = shortSymbol;
            try {
                const IndexInstrument = (await import('../models/IndexInstrument.model')).default;
                const indexInstrument = await IndexInstrument.findOne({
                    exchangeInstrumentId: strategy.exchangeInstrumentID
                }).select('name').lean();
                
                if (indexInstrument && (indexInstrument as any).name) {
                    fullSymbolName = (indexInstrument as any).name;
                } else {
                    // Try with the exchangeSegment from strategy first
                    let instrument = await XtsInstrument.findOne({
                        exchangeInstrumentID: strategy.exchangeInstrumentID,
                        exchangeSegment: exchangeSegment
                    }).select('name exchangeSegment').lean();
                    
                    // If not found, try all common exchange segments (NSECM, NSEFO, etc.)
                    if (!instrument) {
                        const exchangeSegments = [1, 2, 3, 11, 12, 51];
                        for (const seg of exchangeSegments) {
                            instrument = await XtsInstrument.findOne({
                                exchangeInstrumentID: strategy.exchangeInstrumentID,
                                exchangeSegment: seg
                            }).select('name exchangeSegment').lean();
                            
                            if (instrument) {
                                // Update exchangeSegment to the correct one found in database
                                exchangeSegment = seg;
                                logger.info('Found instrument with different exchangeSegment than strategy', {
                                    symbol: shortSymbol,
                                    strategyExchangeSegment: strategy.exchangeSegment,
                                    foundExchangeSegment: seg,
                                    exchangeInstrumentID: strategy.exchangeInstrumentID
                                });
                                break;
                            }
                        }
                    }
                    
                    if (instrument && (instrument as any).name) {
                        fullSymbolName = (instrument as any).name;
                    }
                }
            } catch (instError) {
                logger.warn('Could not fetch instrument name, using short symbol', { 
                    shortSymbol,
                    exchangeInstrumentID: strategy.exchangeInstrumentID,
                    error: (instError as Error).message 
                });
            }

            // CRITICAL: Always create mapping, even if exchangeSegment was wrong in strategy
            // This ensures subscription can find the mapping when quotes arrive
            this.symbolToInstrumentMap.set(shortSymbol, {
                exchangeSegment,
                exchangeInstrumentID: strategy.exchangeInstrumentID,
                fullSymbolName: fullSymbolName
            });
            this.instrumentToSymbolMap.set(strategy.exchangeInstrumentID, fullSymbolName);
            
            logger.debug('Created strategy mapping', {
                symbol: shortSymbol,
                exchangeSegment,
                exchangeInstrumentID: strategy.exchangeInstrumentID,
                fullSymbolName,
                strategyExchangeSegment: strategy.exchangeSegment
            });
        }
    }

    /**
     * Lookup missing symbols in database
     */
    private async lookupMissingSymbols(symbols: string[]): Promise<void> {
        logger.info('Looking up symbols in XtsInstrument (for holdings/non-strategy symbols)', {
            symbols
        });

        const XtsInstrument = (await import('../models/XtsInstrument.model')).default;
        const exchangeSegments = [1, 2, 3, 11, 12, 51];
        
        for (const symbol of symbols) {
            let found = false;
            
            for (const exchangeSegment of exchangeSegments) {
                try {
                    const instrument = await XtsInstrument.findOne({
                        name: { $regex: new RegExp(`^${symbol}$`, 'i') },
                        exchangeSegment: exchangeSegment
                    }).select('name exchangeSegment exchangeInstrumentID').lean();

                    if (instrument && (instrument as any).exchangeInstrumentID) {
                        const fullSymbolName = (instrument as any).name || symbol;
                        
                        this.symbolToInstrumentMap.set(symbol, {
                            exchangeSegment: (instrument as any).exchangeSegment,
                            exchangeInstrumentID: (instrument as any).exchangeInstrumentID,
                            fullSymbolName: fullSymbolName
                        });
                        
                        this.instrumentToSymbolMap.set(
                            (instrument as any).exchangeInstrumentID,
                            fullSymbolName
                        );
                        
                        logger.info('Found instrument for holdings symbol', {
                            symbol,
                            exchangeSegment: (instrument as any).exchangeSegment,
                            exchangeInstrumentID: (instrument as any).exchangeInstrumentID,
                            fullSymbolName,
                            note: 'Mapping will be used for quote forwarding'
                        });
                        
                        const verifyMapping = this.symbolToInstrumentMap.get(symbol);
                        const verifyReverseMapping = this.instrumentToSymbolMap.get((instrument as any).exchangeInstrumentID);
                        logger.info('Verified mapping after setting', {
                            symbol,
                            exchangeInstrumentID: (instrument as any).exchangeInstrumentID,
                            symbolToInstrumentMapHasSymbol: !!verifyMapping,
                            instrumentToSymbolMapHasId: !!verifyReverseMapping,
                            mappedExchangeInstrumentID: verifyMapping?.exchangeInstrumentID,
                            mappedSymbol: verifyReverseMapping
                        });
                        
                        found = true;
                        break;
                    }
                } catch (instError) {
                    logger.debug('Error looking up instrument', {
                        symbol,
                        exchangeSegment,
                        error: (instError as Error).message
                    });
                }
            }

            if (!found) {
                try {
                    const IndexInstrument = (await import('../models/IndexInstrument.model')).default;
                    const indexInstrument = await IndexInstrument.findOne({
                        name: { $regex: new RegExp(`^${symbol}$`, 'i') }
                    }).select('name exchangeInstrumentId').lean();

                    if (indexInstrument && (indexInstrument as any).exchangeInstrumentId) {
                        const fullSymbolName = (indexInstrument as any).name || symbol;
                        
                        this.symbolToInstrumentMap.set(symbol, {
                            exchangeSegment: 1,
                            exchangeInstrumentID: (indexInstrument as any).exchangeInstrumentId,
                            fullSymbolName: fullSymbolName
                        });
                        
                        this.instrumentToSymbolMap.set(
                            (indexInstrument as any).exchangeInstrumentId,
                            fullSymbolName
                        );
                        
                        logger.info('Found index instrument for symbol', {
                            symbol,
                            exchangeInstrumentID: (indexInstrument as any).exchangeInstrumentId,
                            fullSymbolName
                        });
                        
                        found = true;
                    }
                } catch (indexError) {
                    logger.debug('Error looking up index instrument', {
                        symbol,
                        error: (indexError as Error).message
                    });
                }
            }

            if (!found) {
                logger.warn('Could not find instrument mapping for symbol in subscribe handler', {
                    symbol,
                    note: 'Will try again in startMarketDataStreaming() if still missing'
                });
            }
        }

        logger.info('Completed instrument lookup for holdings symbols', {
            foundCount: symbols.filter(s => this.symbolToInstrumentMap.has(s)).length,
            totalSearched: symbols.length
        });
    }

    /**
     * Handle strategy logs subscription
     */
    private async handleStrategyLogsSubscription(socket: AuthenticatedSocket, data: { strategyId: string }): Promise<void> {
        const userId = socket.userId!;
        const strategyId = data.strategyId;
        
        logger.info(`User ${userId} subscribed to strategy logs: ${strategyId}`, {
            userId,
            strategyId,
            socketId: socket.id,
        });

        try {
            const Strategy = (await import('../models/Strategy.model')).default;
            const strategy = await Strategy.findOne({
                _id: strategyId,
                userId: userId
            }).select('_id name').lean();

            if (!strategy) {
                socket.emit('error', {
                    type: 'subscription_error',
                    message: 'Strategy not found or access denied'
                });
                return;
            }

            socket.join(`strategy_logs_${strategyId}`);
            
            if (!this.strategyLogSubscriptions.has(strategyId)) {
                this.strategyLogSubscriptions.set(strategyId, new Set());
            }
            this.strategyLogSubscriptions.get(strategyId)!.add(socket.id);
            
            logger.info('Subscribed to strategy logs', {
                strategyId,
                socketId: socket.id,
                totalSubscribers: this.strategyLogSubscriptions.get(strategyId)?.size || 0
            });

            socket.emit('subscribed', {
                type: 'strategy_logs',
                strategyId: strategyId,
            });
        } catch (error: any) {
            logger.error('Error subscribing to strategy logs:', error);
            socket.emit('error', {
                type: 'subscription_error',
                message: 'Failed to subscribe to strategy logs'
            });
        }
    }

    /**
     * Handle strategy logs unsubscription
     */
    private handleStrategyLogsUnsubscription(socket: AuthenticatedSocket, data: { strategyId: string }): void {
        const userId = socket.userId!;
        const strategyId = data.strategyId;
        
        logger.info(`User ${userId} unsubscribed from strategy logs: ${strategyId}`);
        
        socket.leave(`strategy_logs_${strategyId}`);
        
        if (this.strategyLogSubscriptions.has(strategyId)) {
            this.strategyLogSubscriptions.get(strategyId)!.delete(socket.id);
            
            if (this.strategyLogSubscriptions.get(strategyId)!.size === 0) {
                this.strategyLogSubscriptions.delete(strategyId);
            }
        }
        
        logger.info('Unsubscribed from strategy logs', {
            strategyId,
            socketId: socket.id
        });
    }

    /**
     * Handle market data unsubscription
     */
    private handleMarketDataUnsubscription(socket: AuthenticatedSocket, data: { symbols: string[] }): void {
        logger.info(`User ${socket.userId} unsubscribed from market data:`, data.symbols);
        
        data.symbols.forEach(symbol => {
            const normalizedSymbol = symbol ? symbol.toUpperCase().trim() : null;
            if (!normalizedSymbol) return;
            
            socket.leave(`market_${normalizedSymbol}`);
            
            if (this.marketDataSubscriptions.has(normalizedSymbol)) {
                this.marketDataSubscriptions.get(normalizedSymbol)!.delete(socket.id);
                
                if (this.marketDataSubscriptions.get(normalizedSymbol)!.size === 0) {
                    this.marketDataSubscriptions.delete(normalizedSymbol);
                }
            }
        });

        socket.emit('unsubscribed', {
            type: 'market_data',
            symbols: data.symbols,
        });
    }

    /**
     * Handle strategy subscription
     */
    private handleStrategySubscription(socket: AuthenticatedSocket, data: { strategyId: string }): void {
        logger.info(`User ${socket.userId} subscribed to strategy: ${data.strategyId}`);
        socket.join(`strategy_${data.strategyId}`);
        
        socket.emit('subscribed', {
            type: 'strategy',
            strategyId: data.strategyId,
        });
    }

    /**
     * Handle strategy unsubscription
     */
    private handleStrategyUnsubscription(socket: AuthenticatedSocket, data: { strategyId: string }): void {
        socket.leave(`strategy_${data.strategyId}`);
        
        socket.emit('unsubscribed', {
            type: 'strategy',
            strategyId: data.strategyId,
        });
    }

    /**
     * Handle orders subscription
     */
    private handleOrdersSubscription(socket: AuthenticatedSocket): void {
        logger.info(`User ${socket.userId} subscribed to order updates`);
        socket.join(`orders_${socket.userId}`);
        
        socket.emit('subscribed', {
            type: 'orders',
        });
    }

    /**
     * Handle positions subscription
     */
    private handlePositionsSubscription(socket: AuthenticatedSocket): void {
        logger.info(`User ${socket.userId} subscribed to position updates`);
        socket.join(`positions_${socket.userId}`);
        
        socket.emit('subscribed', {
            type: 'positions',
        });
    }
}

