import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IStrategy extends Document {
    userId: Types.ObjectId;
    name: string;
    description?: string;
    type: 'GO_SCALP' | 'GO_MONEY' | 'CUSTOM' | 'NORMAL' | 'SCALPING' | 'OPTIONS' | 'FUTURES';
    status: 'ACTIVE' | 'INACTIVE' | 'PAUSED' | 'ERROR';
    
    // Template reference
    templateId?: Types.ObjectId; // Reference to StrategyTemplate
    isCustomStrategy: boolean; // true = user created, false = template-based
    
    // Trading parameters
    symbol: string;
    exchangeSegment: string;
    exchangeInstrumentID: number;
    timeframe: string; // '1min', '5min', '15min', '1hour', '1day'
    instrumentName?: string; // Name from xts_instruments
    instrumentDisplayName?: string; // Display name from xts_instruments
    
    // Strategy configuration
    config: {
        // Entry/Exit
        entryConditions: string[];
        exitConditions: string[];
        // Entry Mode and consensus
        entryMode?: 'candleClose' | 'highLowBreak';
        consensus?: 'all' | 'majority';
        
        // Indicators
        indicators: {
            // Basic indicators
            sma?: { period: number };
            ema?: { period?: number; fast?: number; slow?: number };
            rsi?: { period: number; overbought: number; oversold: number };
            macd?: { fast: number; slow: number; signal: number };
            bollingerBands?: { period: number; stdDev: number };
            atr?: { period: number };
            
            // Advanced library indicators
            stochastic?: { period: number; signalPeriod: number };
            adx?: { period: number };
            williamsR?: { period: number };
            cci?: { period: number };
            psar?: { step: number; max: number };
            vwap?: boolean;
            wma?: { period: number };
            obv?: boolean;
            mfi?: { period: number };
            
            // Custom indicators
            supertrend?: { period: number; multiplier: number };
            lsma?: { period: number };
            halftrend?: { amplitude: number; channelDeviation: number };
            orb?: { openingRangeMinutes: number; breakoutThreshold: number };
        };
        
        // Risk Management
        stopLoss?: number; // percentage (deprecated)
        takeProfit?: number; // percentage (deprecated)
        stopLossPoints?: number; // absolute points
        targetPoints?: number; // absolute points
        trailingStopLoss?: number; // percentage
        maxRiskPerTradePercent?: number; // percentage of capital
        maxPositionSize: number;
        maxDailyLoss: number; // percentage
        maxDailyProfit?: number; // percentage
        
        // Order settings
        orderType: 'MARKET' | 'LIMIT';
        productType: 'MIS' | 'NRML' | 'CNC';
        quantity: number;
        
        // Timing / Intraday
        intradayEnabled?: boolean;
        tradingWindowEnabled?: boolean;
        tradingStartTime?: string; // HH:mm
        tradingEndTime?: string; // HH:mm
        squareOffTime?: string; // HH:mm
        checkInterval: number; // milliseconds
        
        // Options specific fields
        expiry?: string; // Expiry date for options strategies
        tradeMode?: 'atm' | 'itm' | 'otm'; // Trade mode for options: ATM, ITM, OTM
        gap?: number; // Gap value for ITM/OTM options strategies
    };
    
    // Performance metrics
    performance: {
        totalTrades: number;
        winningTrades: number;
        losingTrades: number;
        winRate: number; // percentage
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
    
    // Visibility (for admin control)
    isVisibleToUsers?: boolean;
    
    // If template allows editing, store user overrides
    indicatorOverrides?: {
        [indicatorName: string]: Record<string, unknown>;
    };
    
    createdAt: Date;
    updatedAt: Date;
}

const StrategySchema = new Schema<IStrategy>(
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
            enum: ['GO_SCALP', 'GO_MONEY', 'CUSTOM', 'NORMAL', 'SCALPING', 'OPTIONS', 'FUTURES'],
            required: true,
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
        instrumentName: {
            type: String,
            trim: true,
        },
        instrumentDisplayName: {
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
                sma: {
                    period: Number,
                },
            ema: {
                period: Number,  // For single standalone EMA
                fast: Number,    // For crossover (optional)
                slow: Number,    // For crossover (optional)
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
                atr: {
                    period: Number,
                },
                lsma: {
                    period: Number,
                },
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
                default: 5, // 5%
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
                default: 60000, // 1 minute
            },
            // Options specific fields
            expiry: String, // Expiry date for options strategies
            tradeMode: {
                type: String,
                enum: ['atm', 'itm', 'otm'],
            },
            gap: Number, // Gap value for ITM/OTM options strategies
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
    }
);

// Indexes for performance
StrategySchema.index({ userId: 1, status: 1 });
StrategySchema.index({ symbol: 1 });
StrategySchema.index({ isMonitoring: 1 });
StrategySchema.index({ templateId: 1 });
StrategySchema.index({ exchangeInstrumentID: 1 });

const Strategy = mongoose.model<IStrategy>('Strategy', StrategySchema);

export default Strategy;

