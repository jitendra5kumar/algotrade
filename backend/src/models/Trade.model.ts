import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITrade extends Document {
    userId: Types.ObjectId;
    strategyId: Types.ObjectId;
    
    // Trade details
    symbol: string;
    exchangeSegment: string;
    exchangeInstrumentID: number;
    
    // Order details
    orderType: 'MARKET' | 'LIMIT';
    productType: 'MIS' | 'NRML' | 'CNC';
    side: 'BUY' | 'SELL';
    
    // Entry
    entryOrderId?: string;
    entryPrice: number;
    entryTime: Date;
    entryQuantity: number;
    
    // Exit
    exitOrderId?: string;
    exitPrice?: number;
    exitTime?: Date;
    exitQuantity?: number;
    exitReason?: 'TAKE_PROFIT' | 'STOP_LOSS' | 'TRAILING_STOP' | 'MANUAL' | 'TIME_EXIT' | 'ERROR'| 'RECOMMENDATION' | 'TREND_FLIP';
    
    // P&L
    grossProfit: number;
    fees: number;
    taxes: number;
    netProfit: number;
    profitPercentage: number;
    
    // Status
    status: 'OPEN' | 'CLOSED' | 'CANCELLED' | 'ERROR';
    
    // Risk management
    stopLossPrice: number;
    takeProfitPrice: number;
    trailingStopPrice?: number;
    
    // Metadata
    notes?: string;
    tags?: string[];
    metadata?: Record<string, unknown>; // Additional metadata for trade tracking
    
    createdAt: Date;
    updatedAt: Date;
}

const TradeSchema = new Schema<ITrade>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        strategyId: {
            type: Schema.Types.ObjectId,
            ref: 'Strategy',
            required: true,
            index: true,
        },
        symbol: {
            type: String,
            required: true,
            uppercase: true,
            index: true,
        },
        exchangeSegment: {
            type: String,
            required: true,
        },
        exchangeInstrumentID: {
            type: Number,
            required: true,
        },
        orderType: {
            type: String,
            enum: ['MARKET', 'LIMIT'],
            required: true,
        },
        productType: {
            type: String,
            enum: ['MIS', 'NRML', 'CNC'],
            required: true,
        },
        side: {
            type: String,
            enum: ['BUY', 'SELL'],
            required: true,
        },
        entryOrderId: String,
        entryPrice: {
            type: Number,
            required: true,
        },
        entryTime: {
            type: Date,
            required: true,
            default: Date.now,
        },
        entryQuantity: {
            type: Number,
            required: true,
            min: [1, 'Quantity must be at least 1'],
        },
        exitOrderId: String,
        exitPrice: Number,
        exitTime: Date,
        exitQuantity: Number,
        exitReason: {
            type: String,
            enum: ['TAKE_PROFIT', 'STOP_LOSS', 'TRAILING_STOP', 'MANUAL', 'TIME_EXIT', 'ERROR','RECOMMENDATION', 'TREND_FLIP'],
        },
        grossProfit: {
            type: Number,
            default: 0,
        },
        fees: {
            type: Number,
            default: 0,
        },
        taxes: {
            type: Number,
            default: 0,
        },
        netProfit: {
            type: Number,
            default: 0,
        },
        profitPercentage: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: ['OPEN', 'CLOSED', 'CANCELLED', 'ERROR'],
            default: 'OPEN',
            index: true,
        },
        stopLossPrice: {
            type: Number,
            required: true,
        },
        takeProfitPrice: {
            type: Number,
            required: true,
        },
        trailingStopPrice: Number,
        notes: String,
        tags: [String],
        metadata: {
            type: Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for performance
TradeSchema.index({ userId: 1, status: 1, createdAt: -1 });
TradeSchema.index({ strategyId: 1, status: 1 });
TradeSchema.index({ symbol: 1, createdAt: -1 });

// Calculate P&L before saving
TradeSchema.pre('save', function (next) {
    if (this.exitPrice && this.exitQuantity) {
        // Calculate gross profit
        if (this.side === 'BUY') {
            this.grossProfit = (this.exitPrice - this.entryPrice) * this.exitQuantity;
        } else {
            this.grossProfit = (this.entryPrice - this.exitPrice) * this.exitQuantity;
        }
        
        // Calculate net profit
        this.netProfit = this.grossProfit - this.fees - this.taxes;
        
        // Calculate profit percentage
        const totalInvestment = this.entryPrice * this.entryQuantity;
        this.profitPercentage = (this.netProfit / totalInvestment) * 100;
    }
    
    next();
});

const Trade = mongoose.model<ITrade>('Trade', TradeSchema);

export default Trade;

