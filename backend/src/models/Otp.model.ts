import mongoose, { Document, Schema } from 'mongoose';

export interface IOtp extends Document {
    email: string;
    otp: string;
    purpose: 'REGISTRATION' | 'LOGIN' | 'PASSWORD_RESET';
    isVerified: boolean;
    expiresAt: Date;
    createdAt: Date;
}

const OtpSchema = new Schema<IOtp>(
    {
        email: {
            type: String,
            required: [true, 'Email is required'],
            lowercase: true,
            trim: true,
        },
        otp: {
            type: String,
            required: [true, 'OTP is required'],
        },
        purpose: {
            type: String,
            enum: ['REGISTRATION', 'LOGIN', 'PASSWORD_RESET'],
            required: true,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        expiresAt: {
            type: Date,
            required: true,
            default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        },
    },
    {
        timestamps: true,
    }
);

// Index for automatic deletion of expired OTPs
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for faster queries
OtpSchema.index({ email: 1, purpose: 1 });

const Otp = mongoose.model<IOtp>('Otp', OtpSchema);

export default Otp;

