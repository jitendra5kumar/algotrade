import bcrypt from "bcryptjs";
import mongoose, { type Document, Schema } from "mongoose";

export interface IUser extends Document {
	name: string;
	email: string;
	password: string;
	phone?: string;
	location?: string;
	role: "USER" | "ADMIN" | "SUPER_ADMIN";
	accountType: "FREE" | "BASIC" | "PREMIUM" | "ENTERPRISE";
	kycStatus: "PENDING" | "VERIFIED" | "REJECTED";
	tradingStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED";
	totalCapital: number;
	availableBalance: number;
	isActive: boolean;

	// Broker credentials (encrypted)
	brokerCredentials?: {
    tokenEnc?: string | Buffer;
		broker?: string;
		clientId?: string;
		password?: string;
		apiKey?: string;
		apiSecret?: string;
		marketDataApiKey?: string;
		marketDataSecret?: string;
		token?: string;
		isConnected: boolean;
		connectedAt?: Date;
		tokenGeneratedAt?: Date;
		dealerUserId?: string;
		lastTokenRefresh?: Date;
	};

	// Market data credentials
	marketDataCredentials?: {
		token?: string;
		expiry?: Date;
		lastRefresh?: Date;
		isActive: boolean;
		connectedAt?: Date;
	};

	// Preferences
	preferences: {
		notifications: boolean;
		emailAlerts: boolean;
		smsAlerts: boolean;
		theme: "light" | "dark";
	};

	// Metadata
	isEmailVerified: boolean;
	isPhoneVerified: boolean;
	lastLogin?: Date;
	refreshToken?: string;
	resetPasswordToken?: string;
	resetPasswordExpire?: Date;

	// OTP fields
	otpVerified?: boolean;
	tempData?: Record<string, unknown>; // Temporary data for registration flow

	createdAt: Date;
	updatedAt: Date;

	// Methods
	comparePassword(candidatePassword: string): Promise<boolean>;
	generateAuthToken(): string;
}

const UserSchema = new Schema<IUser>(
	{
		name: {
			type: String,
			required: [true, "Please provide a name"],
			trim: true,
			maxlength: [50, "Name cannot be more than 50 characters"],
		},
		email: {
			type: String,
			required: [true, "Please provide an email"],
			unique: true,
			lowercase: true,
			trim: true,
			match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email"],
		},
		password: {
			type: String,
			required: [true, "Please provide a password"],
			minlength: [8, "Password must be at least 8 characters"],
			select: false, // Don't return password by default
		},
		phone: {
			type: String,
			match: [/^[6-9]\d{9}$/, "Please provide a valid Indian phone number"],
		},
		location: {
			type: String,
			trim: true,
		},
		role: {
			type: String,
			enum: ["USER", "ADMIN", "SUPER_ADMIN"],
			default: "USER",
		},
		accountType: {
			type: String,
			enum: ["FREE", "BASIC", "PREMIUM", "ENTERPRISE"],
			default: "FREE",
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		kycStatus: {
			type: String,
			enum: ["PENDING", "VERIFIED", "REJECTED"],
			default: "PENDING",
		},
		tradingStatus: {
			type: String,
			enum: ["ACTIVE", "INACTIVE", "SUSPENDED"],
			default: "INACTIVE",
		},
		totalCapital: {
			type: Number,
			default: 0,
			min: [0, "Capital cannot be negative"],
		},
		availableBalance: {
			type: Number,
			default: 0,
			min: [0, "Balance cannot be negative"],
		},
		brokerCredentials: {
			broker: {
				type: String,
				default: null,
			},
			clientId: {
				type: String,
				select: false, // Don't return by default
			},
			password: {
				type: String,
				select: false, // Don't return by default
			},
			apiKey: {
				type: String,
				select: false, // Don't return by default
			},
			apiSecret: {
				type: String,
				select: false, // Don't return by default
			},
			marketDataApiKey: {
				type: String,
				select: false, // Don't return by default
			},
			marketDataSecret: {
				type: String,
				select: false, // Don't return by default
			},
			token: {
				type: String,
				select: false, // Don't return by default
			},
			tokenEnc: {
				type: String,
				select: false, // Don't return by default
			},
			isConnected: {
				type: Boolean,
				default: false,
			},
			connectedAt: {
				type: Date,
				default: null,
			},
			tokenGeneratedAt: {
				type: Date,
				default: null,
			},
			dealerUserId:  {
				type: Date,
				select: false,
			},
			lastTokenRefresh:  {
				type: Date,
				select: false,
			},
		},
		marketDataCredentials: {
			token: {
				type: String,
				select: false, // Don't return by default
			},
			expiry: {
				type: Date,
				default: null,
			},
			lastRefresh: {
				type: Date,
				default: null,
			},
			isActive: {
				type: Boolean,
				default: false,
			},
			connectedAt: {
				type: Date,
				default: null,
			},
		},
		preferences: {
			notifications: {
				type: Boolean,
				default: true,
			},
			emailAlerts: {
				type: Boolean,
				default: true,
			},
			smsAlerts: {
				type: Boolean,
				default: false,
			},
			theme: {
				type: String,
				enum: ["light", "dark"],
				default: "light",
			},
		},
		isEmailVerified: {
			type: Boolean,
			default: false,
		},
		isPhoneVerified: {
			type: Boolean,
			default: false,
		},
		lastLogin: Date,
		refreshToken: String,
		resetPasswordToken: String,
		resetPasswordExpire: Date,
		otpVerified: {
			type: Boolean,
			default: false,
		},
		tempData: Schema.Types.Mixed,
	},
	{
		timestamps: true,
		toJSON: {
			transform: (_doc, ret) => {
				delete (ret as any).password;
				delete (ret as any).__v;
				return ret;
			},
		},
	},
);

// Hash password before saving
UserSchema.pre("save", async function (next) {
	if (!this.isModified("password")) {
		return next();
	}

	const salt = await bcrypt.genSalt(10);
	this.password = await bcrypt.hash(this.password, salt);
	next();
});

// Compare password method
UserSchema.methods.comparePassword = async function (
	candidatePassword: string,
): Promise<boolean> {
	return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model<IUser>("User", UserSchema);

export default User;
