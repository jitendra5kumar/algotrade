import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage {
    sender: 'user' | 'admin';
    message: string;
    timestamp: Date;
    isRead: boolean;
}

export interface IChat extends Document {
    userId: mongoose.Types.ObjectId;
    userName: string;
    userEmail: string;
    messages: IMessage[];
    lastMessage: string;
    lastMessageTime: Date;
    unreadCount: number;
    status: 'open' | 'closed';
    createdAt: Date;
    updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
    sender: {
        type: String,
        enum: ['user', 'admin'],
        required: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    isRead: {
        type: Boolean,
        default: false
    }
});

const ChatSchema = new Schema<IChat>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        userName: {
            type: String,
            required: true
        },
        userEmail: {
            type: String,
            required: true
        },
        messages: [MessageSchema],
        lastMessage: {
            type: String,
            default: ''
        },
        lastMessageTime: {
            type: Date,
            default: Date.now
        },
        unreadCount: {
            type: Number,
            default: 0
        },
        status: {
            type: String,
            enum: ['open', 'closed'],
            default: 'open'
        }
    },
    {
        timestamps: true
    }
);

// Index for faster queries
ChatSchema.index({ userId: 1 });
ChatSchema.index({ status: 1, lastMessageTime: -1 });

export const Chat = mongoose.model<IChat>('Chat', ChatSchema);

