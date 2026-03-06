import mongoose, { Document, Schema } from 'mongoose';

export interface IBroadcast extends Document {
    title: string;
    message: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    isActive: boolean;
    readBy: mongoose.Types.ObjectId[];
}

const BroadcastSchema = new Schema<IBroadcast>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200
        },
        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        isActive: {
            type: Boolean,
            default: true
        },
        readBy: [{
            type: Schema.Types.ObjectId,
            ref: 'User'
        }]
    },
    {
        timestamps: true
    }
);

// Index for faster queries
BroadcastSchema.index({ createdAt: -1 });
BroadcastSchema.index({ isActive: 1 });

export const Broadcast = mongoose.model<IBroadcast>('Broadcast', BroadcastSchema);

