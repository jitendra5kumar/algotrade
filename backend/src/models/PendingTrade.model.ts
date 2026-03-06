import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPendingTrade extends Document {
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
    quantity: number;
    
    // Signal details
    signalPrice: number;
    signalTime: Date;
    referenceCandle?: {
        high: number;
        low: number;
        timestamp: Date;
    };
    
    // Status
    status: 'PENDING' | 'EXECUTED' | 'CANCELLED';
    executedAt?: Date;
    executionError?: string;
    scheduledExecutionTime?: Date; // When to execute this trade
    
    // Metadata
    createdAt: Date;
    updatedAt: Date;
}

const PendingTradeSchema = new Schema<IPendingTrade>(
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
        quantity: {
            type: Number,
            required: true,
            min: [1, 'Quantity must be at least 1'],
        },
        signalPrice: {
            type: Number,
            required: true,
        },
        signalTime: {
            type: Date,
            required: true,
            default: Date.now,
        },
        referenceCandle: {
            high: Number,
            low: Number,
            timestamp: Date,
        },
        status: {
            type: String,
            enum: ['PENDING', 'EXECUTED', 'CANCELLED'],
            default: 'PENDING',
            index: true,
        },
        executedAt: Date,
        executionError: String,
        scheduledExecutionTime: Date, // When to execute this trade
    },
    {
        timestamps: true,
    }
);

// Index for efficient querying
PendingTradeSchema.index({ status: 1, signalTime: 1 });
PendingTradeSchema.index({ strategyId: 1, status: 1 });

const PendingTrade = mongoose.model<IPendingTrade>('PendingTrade', PendingTradeSchema);

export default PendingTrade;

