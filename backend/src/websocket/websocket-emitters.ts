import io from 'socket.io';
import logger from '../utils/logger';

export class WebSocketEmitters {
    constructor(private io: io.Server | null) {}

    /**
     * Emit market data to subscribers
     */
    public emitMarketData(symbol: string, data: Record<string, unknown>): void {
        if (!this.io) {
            return;
        }

        const room = `market_${symbol}`;
        const adapter = this.io.sockets.adapter as any;
        const roomObj = adapter.rooms?.get?.(room);
        const roomSize = roomObj && typeof roomObj.size === "number" ? roomObj.size : 0;

        if (roomSize === 0) {
            logger.debug('No subscribers in room', {
                room,
                symbol,
            });
        } else {
            logger.debug('Emitting market data', {
                room,
                symbol,
                subscribers: roomSize,
                hasPrice: !!(data?.LastTradedPrice || data?.lastTradedPrice || data?.LTP),
            });
        }

        this.io.to(room).emit('market_data', {
            symbol,
            data,
            timestamp: Date.now(),
        });
    }

    /**
     * Emit order update to user
     */
    public emitOrderUpdate(userId: string, order: Record<string, unknown>): void {
        if (!this.io) return;

        this.io.to(`user_${userId}`).to(`orders_${userId}`).emit('order_update', {
            order,
            timestamp: Date.now(),
        });
    }

    /**
     * Emit position update to user
     */
    public emitPositionUpdate(userId: string, position: Record<string, unknown>): void {
        if (!this.io) return;

        this.io.to(`user_${userId}`).to(`positions_${userId}`).emit('position_update', {
            position,
            timestamp: Date.now(),
        });
    }

    /**
     * Emit strategy signal
     */
    public emitStrategySignal(strategyId: string, signal: Record<string, unknown>): void {
        if (!this.io) return;

        this.io.to(`strategy_${strategyId}`).emit('strategy_signal', {
            strategyId,
            signal,
            timestamp: Date.now(),
        });
    }

    /**
     * Emit event to a specific user
     */
    public emitToUser(userId: string, event: string, data: Record<string, unknown>): void {
        if (!this.io) return;

        this.io.to(`user_${userId}`).emit(event, {
            ...data,
            timestamp: Date.now(),
        });
    }

    /**
     * Emit notification to a specific user
     */
    public emitNotification(userId: string, notification: {
        type: string;
        title: string;
        message: string;
    }): void {
        if (!this.io) return;

        this.io.to(`user_${userId}`).emit('notification', {
            ...notification,
            timestamp: Date.now(),
        });
    }

    /**
     * Emit strategy log
     */
    public emitStrategyLog(strategyId: string, log: Record<string, unknown>): void {
        if (!this.io) return;

        this.io.to(`strategy_${strategyId}`).emit('strategy_log', {
            ...log,
            timestamp: Date.now(),
        });
    }

    /**
     * Emit trade execution
     */
    public emitTradeExecution(userId: string, trade: Record<string, unknown>): void {
        if (!this.io) return;

        this.io.to(`user_${userId}`).emit('trade_execution', {
            ...trade,
            timestamp: Date.now(),
        });
    }
}

