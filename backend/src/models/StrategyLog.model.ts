import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IStrategyLog extends Document {
    strategyId: Types.ObjectId;
    userId: Types.ObjectId;
    level: 'info' | 'warn' | 'error';
    category: 'create' | 'update' | 'signal' | 'order' | 'trend' | 'risk' | 'system';
    message: string;
    meta?: Record<string, unknown>;
    createdAt: Date;
}

const StrategyLogSchema = new Schema<IStrategyLog>({
    strategyId: { type: Schema.Types.ObjectId, ref: 'Strategy', index: true, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    level: { type: String, enum: ['info', 'warn', 'error'], default: 'info' },
    category: { type: String, enum: ['create', 'update', 'signal', 'order', 'trend', 'risk', 'system'], default: 'system' },
    message: { type: String, required: true },
    meta: { type: Schema.Types.Mixed },
}, { timestamps: { createdAt: true, updatedAt: false } });

StrategyLogSchema.index({ userId: 1, strategyId: 1, createdAt: -1 });

const StrategyLog = mongoose.model<IStrategyLog>('StrategyLog', StrategyLogSchema);

export default StrategyLog;


