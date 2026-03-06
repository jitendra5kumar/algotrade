import * as crypto from "node:crypto";
import jwt from "jsonwebtoken";
import config from "../config/environment";
import Otp from "../models/Otp.model";
import User, { type IUser } from "../models/User.model";
import logger from "../utils/logger";

interface TokenPayload {
	userId: string;
	email: string;
	accountType: string;
	role: string;
}

class AuthService {
	/**
	 * Generate JWT access token
	 */
	public generateAccessToken(user: IUser): string {
		const payload: TokenPayload = {
			userId: (user._id as string).toString(),
			email: user.email,
			accountType: user.accountType,
			role: user.role,
		};

		return jwt.sign(payload, config.JWT_SECRET, {
			expiresIn: config.JWT_EXPIRES_IN,
		} as jwt.SignOptions);
	}

	/**
	 * Generate JWT refresh token
	 */
	public generateRefreshToken(user: IUser): string {
		const payload: TokenPayload = {
			userId: (user._id as string).toString(),
			email: user.email,
			accountType: user.accountType,
			role: user.role,
		};

		return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
			expiresIn: config.JWT_REFRESH_EXPIRES_IN,
		} as jwt.SignOptions);
	}

	/**
	 * Verify access token
	 */
	public verifyAccessToken(token: string): TokenPayload | null {
		try {
			const decoded = jwt.verify(token, config.JWT_SECRET) as TokenPayload;
			return decoded;
		} catch (error: unknown) {
			logger.error("Error verifying access token:", (error as Error).message);
			return null;
		}
	}

	/**
	 * Verify refresh token
	 */
	public verifyRefreshToken(token: string): TokenPayload | null {
		try {
			const decoded = jwt.verify(
				token,
				config.JWT_REFRESH_SECRET,
			) as TokenPayload;
			return decoded;
		} catch (error: unknown) {
			logger.error("Error verifying refresh token:", (error as Error).message);
			return null;
		}
	}

	/**
	 * Register new user
	 */
	public async register(userData: {
		name: string;
		email: string;
		password: string;
		phone?: string;
	}): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
		// Check if user already exists
		const existingUser = await User.findOne({ email: userData.email });
		if (existingUser) {
			throw new Error("Email already registered");
		}

		// Create new user
		const user = await User.create(userData);

		// Generate tokens
		const accessToken = this.generateAccessToken(user);
		const refreshToken = this.generateRefreshToken(user);

		// Save refresh token to user
		user.refreshToken = refreshToken;
		await user.save();

		logger.info(`New user registered: ${user.email}`);

		return { user, accessToken, refreshToken };
	}

	/**
	 * Login user
	 */
	public async login(
		email: string,
		password: string,
	): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
		// Find user with password
		const user = await User.findOne({ email }).select("+password");
		if (!user) {
			throw new Error("Invalid email or password");
		}

		// Check if user is active
		if (user.isActive === false) {
			throw new Error(
				"Your account has been deactivated. Please contact administrator.",
			);
		}

		// Check password
		const isPasswordValid = await user.comparePassword(password);
		if (!isPasswordValid) {
			throw new Error("Invalid email or password");
		}

		// Generate tokens
		const accessToken = this.generateAccessToken(user);
		const refreshToken = this.generateRefreshToken(user);

		// Update user
		user.refreshToken = refreshToken;
		user.lastLogin = new Date();
		await user.save();

		logger.info(`User logged in: ${user.email}`);

		// Remove password from response
		user.password = undefined as never;

		return { user, accessToken, refreshToken };
	}

	/**
	 * Refresh access token
	 */
	public async refreshAccessToken(
		refreshToken: string,
	): Promise<{ accessToken: string; refreshToken: string }> {
		// Verify refresh token
		const decoded = this.verifyRefreshToken(refreshToken);
		if (!decoded) {
			throw new Error("Invalid refresh token");
		}

		// Find user
		const user = await User.findById(decoded.userId);
		if (!user || user.refreshToken !== refreshToken) {
			throw new Error("Invalid refresh token");
		}

		// Generate new tokens
		const newAccessToken = this.generateAccessToken(user);
		const newRefreshToken = this.generateRefreshToken(user);

		// Update refresh token
		user.refreshToken = newRefreshToken;
		await user.save();

		return {
			accessToken: newAccessToken,
			refreshToken: newRefreshToken,
		};
	}

	/**
	 * Logout user
	 */
	public async logout(userId: string): Promise<void> {
		const user = await User.findById(userId);
		if (user) {
			user.refreshToken = undefined;
			await user.save();
			logger.info(`User logged out: ${user.email}`);
		}
	}

	/**
	 * Get user profile
	 */
	public async getProfile(userId: string): Promise<IUser | null> {
		const user = await User.findById(userId);
		return user;
	}

	/**
	 * Update user profile
	 */
	public async updateProfile(
		userId: string,
		updateData: Partial<IUser>,
	): Promise<IUser | null> {
		// Remove sensitive fields
		const allowedUpdates = ["name", "phone", "location", "preferences"];
		const filteredData: Record<string, unknown> = {};

		Object.keys(updateData).forEach((key) => {
			if (allowedUpdates.includes(key)) {
				filteredData[key] = updateData[key as keyof IUser];
			}
		});

		const user = await User.findByIdAndUpdate(userId, filteredData, {
			new: true,
			runValidators: true,
		});

		if (user) {
			logger.info(`User profile updated: ${user.email}`);
		}

		return user;
	}

	/**
	 * Change password
	 */
	public async changePassword(
		userId: string,
		currentPassword: string,
		newPassword: string,
	): Promise<void> {
		const user = await User.findById(userId).select("+password");
		if (!user) {
			throw new Error("User not found");
		}

		// Verify current password
		const isPasswordValid = await user.comparePassword(currentPassword);
		if (!isPasswordValid) {
			throw new Error("Current password is incorrect");
		}

		// Update password
		user.password = newPassword;
		await user.save();

		logger.info(`Password changed for user: ${user.email}`);
	}

	/**
	 * Save broker credentials
	 */
	public async saveBrokerCredentials(
		userId: string,
		apiKey: string,
		apiSecret: string,
	): Promise<void> {
		const user = await User.findById(userId);
		if (!user) {
			throw new Error("User not found");
		}

		// Encrypt credentials before saving
		const encryptionKey =
			process.env.ENCRYPTION_KEY || "default-encryption-key";
		const iv = crypto.randomBytes(16);
		const cipher = crypto.createCipheriv(
			"aes-256-cbc",
			Buffer.from(encryptionKey, "hex"),
			iv,
		);

		let encryptedApiKey = cipher.update(apiKey, "utf8", "hex");
		encryptedApiKey += cipher.final("hex");

		const cipher2 = crypto.createCipheriv(
			"aes-256-cbc",
			Buffer.from(encryptionKey, "hex"),
			iv,
		);
		let encryptedApiSecret = cipher2.update(apiSecret, "utf8", "hex");
		encryptedApiSecret += cipher2.final("hex");

		user.brokerCredentials = {
			broker: "anandrathi",
			apiKey: encryptedApiKey,
			apiSecret: encryptedApiSecret,
			isConnected: false,
		};

		await user.save();
		logger.info(`Broker credentials saved for user: ${user.email}`);
	}

	/**
	 * Generate OTP
	 */
	private generateOTP(): string {
		// Generate 6-digit OTP
		return Math.floor(100000 + Math.random() * 900000).toString();
	}

	/**
	 * Send OTP via email
	 */
	private async sendOTP(
		email: string,
		otp: string,
		purpose: string,
	): Promise<void> {
		// For now, just log the OTP (in production, implement nodemailer)
		logger.info(`OTP generated for ${email}: ${otp} (Purpose: ${purpose})`);

		// TODO: Implement actual email sending with nodemailer
		const nodemailer = require("nodemailer");
		const transporter = nodemailer.createTransport({
			service: "gmail",
			auth: {
				user: process.env.SMTP_USER,
				pass: process.env.SMTP_PASS,
			},
		});

		await transporter.sendMail({
			from: process.env.SMTP_USER,
			to: email,
			subject: `OTP for ${purpose}`,
			text: `Your OTP is: ${otp}`,
		});
	}

	/**
	 * Request OTP for registration
	 */
	public async requestRegistrationOTP(userData: {
		name: string;
		email: string;
		password: string;
		phone?: string;
	}): Promise<{ message: string; email: string }> {
		// Check if user already exists
		const existingUser = await User.findOne({ email: userData.email });
		if (existingUser) {
			throw new Error("Email already registered");
		}

		// Generate OTP
		const otp = this.generateOTP();

		// Delete any existing OTPs for this email and purpose
		await Otp.deleteMany({
			email: userData.email,
			purpose: "REGISTRATION",
		});

		// Save OTP to database
		await Otp.create({
			email: userData.email,
			otp,
			purpose: "REGISTRATION",
			expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
		});

		// Store temporary user data (we'll create user after OTP verification)
		// Note: In production, you might want to encrypt this data
		const tempUser = await User.findOne({
			email: userData.email,
			otpVerified: false,
		});
		if (tempUser) {
			tempUser.tempData = userData;
			await tempUser.save();
		} else {
			await User.create({
				...userData,
				otpVerified: false,
				tempData: userData,
			});
		}

		// Send OTP via email (dummy for now)
		await this.sendOTP(userData.email, otp, "REGISTRATION");

		logger.info(`Registration OTP sent to: ${userData.email}`);

		return {
			message: "OTP sent to your email",
			email: userData.email,
		};
	}

	/**
	 * Verify OTP and complete registration
	 */
	public async verifyRegistrationOTP(
		email: string,
		otp: string,
	): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
		// Find OTP
		const otpRecord = await Otp.findOne({
			email,
			purpose: "REGISTRATION",
			isVerified: false,
		});

		if (!otpRecord) {
			throw new Error("OTP not found or already used");
		}

		// Check if expired
		if (otpRecord.expiresAt < new Date()) {
			await Otp.deleteOne({ _id: otpRecord._id });
			throw new Error("OTP has expired");
		}

		// Verify OTP
		if (otpRecord.otp !== otp) {
			throw new Error("Invalid OTP");
		}

		// Mark OTP as verified
		otpRecord.isVerified = true;
		await otpRecord.save();

		// Find temp user and complete registration
		const user = await User.findOne({ email, otpVerified: false });

		if (!user) {
			throw new Error("Registration data not found");
		}

		// Update user to verified
		user.otpVerified = true;
		user.isEmailVerified = true;
		user.tempData = undefined;
		await user.save();

		// Generate tokens
		const accessToken = this.generateAccessToken(user);
		const refreshToken = this.generateRefreshToken(user);

		user.refreshToken = refreshToken;
		await user.save();

		logger.info(`User registration completed: ${user.email}`);

		return { user, accessToken, refreshToken };
	}

	/**
	 * Request OTP for login
	 */
	public async requestLoginOTP(
		email: string,
	): Promise<{ message: string; email: string }> {
		// Find user
		const user = await User.findOne({ email, otpVerified: true });
		if (!user) {
			throw new Error("User not found or not verified");
		}

		// Generate OTP
		const otp = this.generateOTP();

		// Delete any existing OTPs for this email and purpose
		await Otp.deleteMany({
			email,
			purpose: "LOGIN",
		});

		// Save OTP to database
		await Otp.create({
			email,
			otp,
			purpose: "LOGIN",
			expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
		});

		// Send OTP via email (dummy for now)
		await this.sendOTP(email, otp, "LOGIN");

		logger.info(`Login OTP sent to: ${email}`);

		return {
			message: "OTP sent to your email",
			email,
		};
	}

	/**
	 * Verify login OTP
	 */
	public async verifyLoginOTP(
		email: string,
		otp: string,
	): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
		// Find OTP
		const otpRecord = await Otp.findOne({
			email,
			purpose: "LOGIN",
			isVerified: false,
		});

		if (!otpRecord) {
			throw new Error("OTP not found or already used");
		}

		// Check if expired
		if (otpRecord.expiresAt < new Date()) {
			await Otp.deleteOne({ _id: otpRecord._id });
			throw new Error("OTP has expired");
		}

		// Verify OTP
		if (otpRecord.otp !== otp) {
			throw new Error("Invalid OTP");
		}

		// Mark OTP as verified
		otpRecord.isVerified = true;
		await otpRecord.save();

		// Find user
		const user = await User.findOne({ email });
		if (!user) {
			throw new Error("User not found");
		}

		// Generate tokens
		const accessToken = this.generateAccessToken(user);
		const refreshToken = this.generateRefreshToken(user);

		// Update user
		user.refreshToken = refreshToken;
		user.lastLogin = new Date();
		await user.save();

		logger.info(`User logged in with OTP: ${user.email}`);

		return { user, accessToken, refreshToken };
	}

	/**
	 * Request OTP for password reset
	 */
	public async requestPasswordResetOTP(
		email: string,
	): Promise<{ message: string; email: string }> {
		// Find user
		const user = await User.findOne({ email });
		if (!user) {
			throw new Error("User not found");
		}

		// Generate OTP
		const otp = this.generateOTP();

		// Delete any existing OTPs for this email and purpose
		await Otp.deleteMany({
			email,
			purpose: "PASSWORD_RESET",
		});

		// Save OTP to database
		await Otp.create({
			email,
			otp,
			purpose: "PASSWORD_RESET",
			expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
		});

		// Send OTP via email (dummy for now)
		await this.sendOTP(email, otp, "PASSWORD_RESET");

		logger.info(`Password reset OTP sent to: ${email}`);

		return {
			message: "OTP sent to your email",
			email,
		};
	}

	/**
	 * Verify password reset OTP and reset password
	 */
	public async verifyPasswordResetOTP(
		email: string,
		otp: string,
		newPassword: string,
	): Promise<{ message: string }> {
		// Find OTP
		const otpRecord = await Otp.findOne({
			email,
			purpose: "PASSWORD_RESET",
			isVerified: false,
		});

		if (!otpRecord) {
			throw new Error("OTP not found or already used");
		}

		// Check if expired
		if (otpRecord.expiresAt < new Date()) {
			await Otp.deleteOne({ _id: otpRecord._id });
			throw new Error("OTP has expired");
		}

		// Verify OTP
		if (otpRecord.otp !== otp) {
			throw new Error("Invalid OTP");
		}

		// Mark OTP as verified
		otpRecord.isVerified = true;
		await otpRecord.save();

		// Find user and update password
		const user = await User.findOne({ email });
		if (!user) {
			throw new Error("User not found");
		}

		user.password = newPassword;
		await user.save();

		logger.info(`Password reset completed for: ${user.email}`);

		return { message: "Password reset successful" };
	}

	/**
	 * Resend OTP
	 */
	public async resendOTP(
		email: string,
		purpose: "REGISTRATION" | "LOGIN" | "PASSWORD_RESET",
	): Promise<{ message: string }> {
		// Check if user exists for login/reset
		if (purpose === "LOGIN" || purpose === "PASSWORD_RESET") {
			const user = await User.findOne({ email });
			if (!user) {
				throw new Error("User not found");
			}
		}

		// Generate new OTP
		const otp = this.generateOTP();

		// Delete existing OTPs
		await Otp.deleteMany({ email, purpose });

		// Create new OTP
		await Otp.create({
			email,
			otp,
			purpose,
			expiresAt: new Date(Date.now() + 10 * 60 * 1000),
		});

		// Send OTP
		await this.sendOTP(email, otp, purpose);

		logger.info(`OTP resent to: ${email} for ${purpose}`);

		return { message: "OTP resent successfully" };
	}
}

export default new AuthService();
