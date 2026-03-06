import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IOptionStrategyLog extends Document {
    strategyId: Types.ObjectId;
    userId: Types.ObjectId;
    level: 'info' | 'warn' | 'error';
    category: 'create' | 'update' | 'signal' | 'order' | 'trend' | 'risk' | 'system';
    message: string;
    meta?: Record<string, unknown>;
    createdAt: Date;
}

const OptionStrategyLogSchema = new Schema<IOptionStrategyLog>({
    strategyId: { 
        type: Schema.Types.ObjectId, 
        ref: 'OptionStrategy', 
        index: true, 
        required: true 
    },
    userId: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        index: true, 
        required: true 
    },
    level: { 
        type: String, 
        enum: ['info', 'warn', 'error'], 
        default: 'info' 
    },
    category: { 
        type: String, 
        enum: ['create', 'update', 'signal', 'order', 'trend', 'risk', 'system'], 
        default: 'system' 
    },
    message: { 
        type: String, 
        required: true 
    },
    meta: { 
        type: Schema.Types.Mixed 
    },
}, { 
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'optionStrategylogs'
});

OptionStrategyLogSchema.index({ userId: 1, strategyId: 1, createdAt: -1 });

const OptionStrategyLog = mongoose.model<IOptionStrategyLog>('OptionStrategyLog', OptionStrategyLogSchema);

export default OptionStrategyLog;

