import mongoose, { Document, Schema } from 'mongoose';

export interface IIndicatorTemplate extends Document {
    name: string;
    displayName: string;
    description: string;
    category: 'trend' | 'momentum' | 'volatility' | 'volume';
    parameters: {
        name: string;
        label: string;
        type: 'number' | 'select';
        defaultValue: number | string;
        min?: number;
        max?: number;
        options?: string[];
        isVisible?: boolean; // Can hide individual parameters
        isEditable?: boolean; // Can lock parameter value
    }[];
    isVisibleToUsers: boolean;
    icon?: string;
    createdAt: Date;
    updatedAt: Date;
}

const IndicatorTemplateSchema = new Schema<IIndicatorTemplate>(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        displayName: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        category: {
            type: String,
            enum: ['trend', 'momentum', 'volatility', 'volume'],
            required: true
        },
        parameters: [{
            name: String,
            label: String,
            type: {
                type: String,
                enum: ['number', 'select']
            },
            defaultValue: Schema.Types.Mixed,
            min: Number,
            max: Number,
            options: [String],
            isVisible: {
                type: Boolean,
                default: true
            },
            isEditable: {
                type: Boolean,
                default: true
            }
        }],
        isVisibleToUsers: {
            type: Boolean,
            default: true
        },
        icon: String
    },
    {
        timestamps: true
    }
);

export const IndicatorTemplate = mongoose.model<IIndicatorTemplate>('IndicatorTemplate', IndicatorTemplateSchema);

