import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IOptionStrategy extends Document {
    userId: Types.ObjectId;
    name: string;
    description?: string;
    type: 'OPTIONS';
    status: 'ACTIVE' | 'INACTIVE' | 'PAUSED' | 'ERROR';
    
    // Template reference
    templateId?: Types.ObjectId;
    isCustomStrategy: boolean;
    
    // Trading parameters
    symbol: string; // Index name (e.g., "NIFTY 50")
    exchangeSegment: string;
    exchangeInstrumentID: number; // From index_instruments
    timeframe: string;
    
    // Options specific fields
    strikePrice?: number;
    optionType?: 'CE' | 'PE';
    expiry?: string;
    
    // Strategy configuration (same as Strategy)
    config: {
        entryConditions: string[];
        exitConditions: string[];
        entryMode?: 'candleClose' | 'highLowBreak';
        consensus?: 'all' | 'majority';
        
        indicators: {
            sma?: { period: number };
            ema?: { period?: number; fast?: number; slow?: number };
            rsi?: { period: number; overbought: number; oversold: number };
            macd?: { fast: number; slow: number; signal: number };
            bollingerBands?: { period: number; stdDev: number };
            atr?: { period: number };
            stochastic?: { period: number; signalPeriod: number };
            adx?: { period: number };
            williamsR?: { period: number };
            cci?: { period: number };
            psar?: { step: number; max: number };
            vwap?: boolean;
            wma?: { period: number };
            obv?: boolean;
            mfi?: { period: number };
            supertrend?: { period: number; multiplier: number };
            lsma?: { period: number };
            halftrend?: { amplitude: number; channelDeviation: number };
            orb?: { openingRangeMinutes: number; breakoutThreshold: number };
        };
        
        stopLoss?: number;
        takeProfit?: number;
        stopLossPoints?: number;
        targetPoints?: number;
        trailingStopLoss?: number;
        maxRiskPerTradePercent?: number;
        maxPositionSize: number;
        maxDailyLoss: number;
        maxDailyProfit?: number;
        
        orderType: 'MARKET' | 'LIMIT';
        productType: 'MIS' | 'NRML' | 'CNC';
        quantity: number;
        
        intradayEnabled?: boolean;
        tradingWindowEnabled?: boolean;
        tradingStartTime?: string;
        tradingEndTime?: string;
        squareOffTime?: string;
        checkInterval: number;
    };
    
    // Performance metrics
    performance: {
        totalTrades: number;
        winningTrades: number;
        losingTrades: number;
        winRate: number;
        totalProfit: number;
        totalLoss: number;
        netProfit: number;
        maxDrawdown: number;
        sharpeRatio?: number;
        avgWinAmount: number;
        avgLossAmount: number;
        profitFactor: number;
        lastUpdated: Date;
    };
    
    // Current state
    currentPosition?: {
        entryPrice: number;
        entryTime: Date;
        quantity: number;
        side: 'BUY' | 'SELL';
        currentPrice: number;
        unrealizedPnL: number;
        stopLossPrice: number;
        takeProfitPrice: number;
        trailingStopPrice?: number;
    };
    
    // Monitoring
    isMonitoring: boolean;
    lastCheckTime?: Date;
    lastSignalTime?: Date;
    lastErrorMessage?: string;
    
    isVisibleToUsers?: boolean;
    indicatorOverrides?: {
        [indicatorName: string]: Record<string, unknown>;
    };
    
    createdAt: Date;
    updatedAt: Date;
}

const OptionStrategySchema = new Schema<IOptionStrategy>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: [true, 'Strategy name is required'],
            trim: true,
            maxlength: [100, 'Name cannot exceed 100 characters'],
        },
        description: {
            type: String,
            maxlength: [500, 'Description cannot exceed 500 characters'],
        },
        type: {
            type: String,
            enum: ['OPTIONS'],
            default: 'OPTIONS',
        },
        status: {
            type: String,
            enum: ['ACTIVE', 'INACTIVE', 'PAUSED', 'ERROR'],
            default: 'INACTIVE',
        },
        templateId: {
            type: Schema.Types.ObjectId,
            ref: 'StrategyTemplate',
            index: true,
        },
        isCustomStrategy: {
            type: Boolean,
            default: true,
        },
        symbol: {
            type: String,
            required: true,
            uppercase: true,
        },
        exchangeSegment: {
            type: String,
            required: true,
            default: 'NSECM',
        },
        exchangeInstrumentID: {
            type: Number,
            required: true,
        },
        timeframe: {
            type: String,
            required: true,
            enum: ['1min', '5min', '15min', '30min', '1hour', '1day'],
        },
        strikePrice: {
            type: Number,
        },
        optionType: {
            type: String,
            enum: ['CE', 'PE'],
        },
        expiry: {
            type: String,
            trim: true,
        },
        config: {
            entryConditions: [String],
            exitConditions: [String],
            entryMode: {
                type: String,
                enum: ['candleClose', 'highLowBreak'],
                default: 'candleClose',
            },
            consensus: {
                type: String,
                enum: ['all', 'majority'],
                default: 'all',
            },
            indicators: {
                sma: { period: Number },
                ema: {
                    period: Number,
                    fast: Number,
                    slow: Number,
                },
                rsi: {
                    period: Number,
                    overbought: Number,
                    oversold: Number,
                },
                macd: {
                    fast: Number,
                    slow: Number,
                    signal: Number,
                },
                bollingerBands: {
                    period: Number,
                    stdDev: Number,
                },
                atr: { period: Number },
                lsma: { period: Number },
            },
            stopLoss: Number,
            takeProfit: Number,
            stopLossPoints: Number,
            targetPoints: Number,
            trailingStopLoss: Number,
            maxRiskPerTradePercent: Number,
            maxPositionSize: {
                type: Number,
                required: true,
                min: [1, 'Position size must be at least 1'],
            },
            maxDailyLoss: {
                type: Number,
                default: 5,
            },
            maxDailyProfit: Number,
            orderType: {
                type: String,
                enum: ['MARKET', 'LIMIT'],
                default: 'MARKET',
            },
            productType: {
                type: String,
                enum: ['MIS', 'NRML', 'CNC'],
                default: 'MIS',
            },
            quantity: {
                type: Number,
                required: true,
                min: [1, 'Quantity must be at least 1'],
            },
            intradayEnabled: {
                type: Boolean,
                default: false,
            },
            tradingWindowEnabled: {
                type: Boolean,
                default: false,
            },
            tradingStartTime: String,
            tradingEndTime: String,
            squareOffTime: String,
            checkInterval: {
                type: Number,
                default: 60000,
            },
        },
        performance: {
            totalTrades: { type: Number, default: 0 },
            winningTrades: { type: Number, default: 0 },
            losingTrades: { type: Number, default: 0 },
            winRate: { type: Number, default: 0 },
            totalProfit: { type: Number, default: 0 },
            totalLoss: { type: Number, default: 0 },
            netProfit: { type: Number, default: 0 },
            maxDrawdown: { type: Number, default: 0 },
            sharpeRatio: Number,
            avgWinAmount: { type: Number, default: 0 },
            avgLossAmount: { type: Number, default: 0 },
            profitFactor: { type: Number, default: 0 },
            lastUpdated: { type: Date, default: Date.now },
        },
        currentPosition: {
            entryPrice: Number,
            entryTime: Date,
            quantity: Number,
            side: {
                type: String,
                enum: ['BUY', 'SELL'],
            },
            currentPrice: Number,
            unrealizedPnL: Number,
            stopLossPrice: Number,
            takeProfitPrice: Number,
            trailingStopPrice: Number,
        },
        isMonitoring: {
            type: Boolean,
            default: false,
        },
        lastCheckTime: Date,
        lastSignalTime: Date,
        lastErrorMessage: String,
        isVisibleToUsers: {
            type: Boolean,
            default: true,
        },
        indicatorOverrides: {
            type: Map,
            of: Schema.Types.Mixed,
        },
    },
    {
        timestamps: true,
        collection: 'optionStrategies',
    }
);

// Indexes
OptionStrategySchema.index({ userId: 1, status: 1 });
OptionStrategySchema.index({ symbol: 1 });
OptionStrategySchema.index({ isMonitoring: 1 });
OptionStrategySchema.index({ templateId: 1 });
OptionStrategySchema.index({ exchangeInstrumentID: 1 });

const OptionStrategy = mongoose.model<IOptionStrategy>('OptionStrategy', OptionStrategySchema);

export default OptionStrategy;

