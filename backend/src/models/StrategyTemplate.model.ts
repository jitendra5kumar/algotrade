import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IStrategyTemplate extends Document {
    name: string;
    description: string;
    type: 'CUSTOM' | 'GO_SCALP' | 'GO_MONEY' | 'NORMAL' | 'SCALPING' | 'OPTIONS' | 'FUTURES';
    tags: 'normal' | 'scalping' | 'trend following';
    createdBy: Types.ObjectId;
    isActive: boolean;
    isVisibleToUsers: boolean;
    
    indicators: {
        enabled: string[];
        configurations: {
            [indicatorName: string]: {
                parameters: Record<string, unknown>;
                isVisible: boolean;
                isEditable: boolean;
                validationRules?: {
                    [paramName: string]: {
                        min?: number;
                        max?: number;
                        required?: boolean;
                    };
                };
            };
        };
    };
    
    usageCount: number;
    lastUsedAt?: Date;
    performanceStats?: {
        averagePnL: number;
        successRate: number;
        totalTrades: number;
    };
    
    createdAt: Date;
    updatedAt: Date;
}

const StrategyTemplateSchema = new Schema<IStrategyTemplate>(
    {
        name: {
            type: String,
            required: [true, 'Strategy name is required'],
            trim: true,
            maxlength: [100, 'Name cannot exceed 100 characters'],
            index: true,
        },
        description: {
            type: String,
            maxlength: [500, 'Description cannot exceed 500 characters'],
        },
        type: {
            type: String,
            enum: ['CUSTOM', 'GO_SCALP', 'GO_MONEY', 'NORMAL', 'SCALPING', 'OPTIONS', 'FUTURES'],
            required: true,
            index: true,
        },
        tags: {
            type: String,
            enum: ['normal', 'scalping', 'trend following'],
            required: true,
            index: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
        isVisibleToUsers: {
            type: Boolean,
            default: true,
            index: true,
        },
        indicators: {
            enabled: [String],
            configurations: {
                type: Map,
                of: {
                    parameters: Schema.Types.Mixed,
                    isVisible: Boolean,
                    isEditable: Boolean,
                    validationRules: Schema.Types.Mixed,
                },
            },
        },
        usageCount: {
            type: Number,
            default: 0,
        },
        lastUsedAt: Date,
        performanceStats: {
            averagePnL: Number,
            successRate: Number,
            totalTrades: Number,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
StrategyTemplateSchema.index({ name: 1, type: 1 });
StrategyTemplateSchema.index({ isActive: 1, isVisibleToUsers: 1 });
StrategyTemplateSchema.index({ createdBy: 1 });

const StrategyTemplate = mongoose.model<IStrategyTemplate>('StrategyTemplate', StrategyTemplateSchema);

export default StrategyTemplate;
