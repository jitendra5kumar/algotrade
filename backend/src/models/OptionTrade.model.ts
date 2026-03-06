import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IOptionTrade extends Document {
    userId: Types.ObjectId;
    strategyId: Types.ObjectId; // Reference to OptionStrategy
    
    // Trade details
    symbol: string; // Option symbol (e.g., "NIFTY25NOV2425200CE")
    baseSymbol: string; // Base index symbol (e.g., "NIFTY 50")
    exchangeSegment: string;
    exchangeInstrumentID: number; // Option instrument ID
    strikePrice: number;
    optionType: 'CE' | 'PE';
    expiry: string;
    
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
    exitReason?: 'TAKE_PROFIT' | 'STOP_LOSS' | 'TRAILING_STOP' | 'MANUAL' | 'TIME_EXIT' | 'ERROR' | 'RECOMMENDATION' | 'TREND_FLIP';
    
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
    
    createdAt: Date;
    updatedAt: Date;
}

const OptionTradeSchema = new Schema<IOptionTrade>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        strategyId: {
            type: Schema.Types.ObjectId,
            ref: 'OptionStrategy',
            required: true,
            index: true,
        },
        symbol: {
            type: String,
            required: true,
            uppercase: true,
            index: true,
        },
        baseSymbol: {
            type: String,
            required: true,
            uppercase: true,
        },
        exchangeSegment: {
            type: String,
            required: true,
        },
        exchangeInstrumentID: {
            type: Number,
            required: true,
        },
        strikePrice: {
            type: Number,
            required: true,
        },
        optionType: {
            type: String,
            enum: ['CE', 'PE'],
            required: true,
        },
        expiry: {
            type: String,
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
            enum: ['TAKE_PROFIT', 'STOP_LOSS', 'TRAILING_STOP', 'MANUAL', 'TIME_EXIT', 'ERROR', 'RECOMMENDATION', 'TREND_FLIP'],
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
            default: 0,
        },
        takeProfitPrice: {
            type: Number,
            default: 0,
        },
        trailingStopPrice: Number,
        notes: String,
        tags: [String],
    },
    {
        timestamps: true,
        collection: 'optionTrades',
    }
);

// Indexes for performance
OptionTradeSchema.index({ userId: 1, status: 1, createdAt: -1 });
OptionTradeSchema.index({ strategyId: 1, status: 1 });
OptionTradeSchema.index({ symbol: 1, createdAt: -1 });
OptionTradeSchema.index({ baseSymbol: 1, createdAt: -1 });

// Calculate P&L before saving
OptionTradeSchema.pre('save', function (next) {
    if (this.exitPrice && this.exitQuantity) {
        // Calculate gross profit
        if (this.side === 'BUY') {
            this.grossProfit = (this.exitPrice - this.entryPrice) * this.entryQuantity;
        } else {
            this.grossProfit = (this.entryPrice - this.exitPrice) * this.entryQuantity;
        }
        
        // Calculate net profit
        this.netProfit = this.grossProfit - this.fees - this.taxes;
        
        // Calculate profit percentage
        const totalInvestment = this.entryPrice * this.entryQuantity;
        this.profitPercentage = totalInvestment > 0 ? (this.netProfit / totalInvestment) * 100 : 0;
    }
    
    next();
});

const OptionTrade = mongoose.model<IOptionTrade>('OptionTrade', OptionTradeSchema);

export default OptionTrade;

