import type { Request, Response } from "express";
import User, { type IUser } from "../models/User.model";
import { ActivityLogService } from "../services/activity-log.service";
import authService from "../services/auth.service";
import { sendError, sendSuccess } from "../utils/helpers";
import logger from "../utils/logger";

class AuthController {
	/**
	 * Register new user
	 * POST /api/auth/register
	 */
	public async register(req: Request, res: Response): Promise<Response> {
		try {
			const { name, email, password, phone } = req.body;

			// Validate required fields
			if (!name || !email || !password) {
				return sendError(res, "Please provide name, email, and password", 400);
			}

			// Register user
			const { user, accessToken, refreshToken } = await authService.register({
				name,
				email,
				password,
				phone,
			});

            // Set tokens in httpOnly cookies
			{
				const isProd = process.env.NODE_ENV === "production";
				const domain = process.env.COOKIE_DOMAIN || undefined; // e.g., .gotrade.co.in
				res.cookie("refreshToken", refreshToken, {
					httpOnly: true,
					secure: isProd,
					sameSite: isProd ? "none" : "lax",
					domain,
					maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
				});
				res.cookie("token", accessToken, {
					httpOnly: true,
					secure: isProd,
					sameSite: isProd ? "none" : "lax",
					domain,
					maxAge: 15 * 60 * 1000, // 15 minutes
				});
			}

			return sendSuccess(
				res,
				{
					user,
					accessToken,
				},
				"User registered successfully",
				201,
			);
		} catch (error: unknown) {
			logger.error("Registration error:", error);
			return sendError(res, (error as Error).message || "Registration failed", 400);
		}
	}

	/**
	 * Login user
	 * POST /api/auth/login
	 */
	public async login(req: Request, res: Response): Promise<Response> {
		try {
			const { email, password } = req.body;

			// Validate required fields
			if (!email || !password) {
				return sendError(res, "Please provide email and password", 400);
			}

			// Login user
			const { user, accessToken, refreshToken } = await authService.login(
				email,
				password,
			);

			{
				const isProd = process.env.NODE_ENV === "production";
				const domain = process.env.COOKIE_DOMAIN || undefined;
				res.cookie("refreshToken", refreshToken, {
					httpOnly: true,
					secure: isProd,
					sameSite: isProd ? "none" : "lax",
					domain,
					maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
				});
				res.cookie("token", accessToken, {
					httpOnly: true,
					secure: isProd,
					sameSite: isProd ? "none" : "lax",
					domain,
					maxAge: 15 * 60 * 1000, // 15 minutes
				});
			}
			// Log login activity (non-blocking)
			try {
				await ActivityLogService.logLogin((user as any)._id.toString(), {
					ip: req.ip,
					userAgent: req.headers["user-agent"],
				});
			} catch (logError) {
				logger.error("Failed to log login activity, but continuing:", logError);
			}

			return sendSuccess(
				res,
				{
					user,
                    accessToken,
				},
				"Login successful",
			);
		} catch (error: unknown) {
			logger.error("Login error:", error);
			return sendError(res, (error as Error).message || "Login failed", 401);
		}
	}

	/**
	 * Admin Login
	 * POST /api/auth/admin/login
	 */
	public async adminLogin(req: Request, res: Response): Promise<Response> {
		try {
			const { email, password } = req.body;

			// Validate required fields
			if (!email || !password) {
				return sendError(res, "Please provide email and password", 400);
			}

			// Find user with password
			const userWithPassword = await User.findOne({ email }).select(
				"+password",
			) as IUser | null;
			if (!userWithPassword) {
				logger.warn(`Admin login failed: User not found for email: ${email}`);
				return sendError(res, "Invalid email or password", 401);
			}

			// Log user role for debugging
			logger.info(`Admin login attempt - User found: ${email}, Role: ${userWithPassword.role}, Type: ${typeof userWithPassword.role}`);

			// Check if user has admin role
			if (
				userWithPassword.role !== "ADMIN" &&
				userWithPassword.role !== "SUPER_ADMIN"
			) {
				logger.warn(`Non-admin user attempted admin login: ${email}, Role: ${userWithPassword.role}`);
				return sendError(res, "Access denied. Admin privileges required.", 403);
			}

			// Check if user is active
			if (userWithPassword.isActive === false) {
				return sendError(
					res,
					"Your account has been deactivated. Please contact administrator.",
					403,
				);
			}

			// Check password
			const isPasswordValid = await userWithPassword.comparePassword(password);
			if (!isPasswordValid) {
				return sendError(res, "Invalid email or password", 401);
			}

			// Generate tokens
			const accessToken = authService.generateAccessToken(userWithPassword);
			const refreshToken = authService.generateRefreshToken(userWithPassword);

			// Update user
			userWithPassword.refreshToken = refreshToken;
			userWithPassword.lastLogin = new Date();
			await userWithPassword.save();

			// Remove password from response
			const userResponse = userWithPassword.toJSON();
			delete (userResponse as any).password;

			// Log admin login activity (non-blocking)
			try {
				await ActivityLogService.logLogin((userWithPassword._id as string).toString(), {
					ip: req.ip,
					userAgent: req.headers["user-agent"],
					loginMethod: "ADMIN_PASSWORD",
				});
			} catch (logError) {
				logger.error(
					"Failed to log admin login activity, but continuing:",
					logError,
				);
			}

			logger.info(`Admin logged in: ${userWithPassword.email}`);

            return sendSuccess(
				res,
				{
					user: userResponse,
                    accessToken,
				},
				"Admin login successful",
			);
		} catch (error: unknown) {
			logger.error("Admin login error:", error);
			return sendError(res, (error as Error).message || "Admin login failed", 401);
		}
	}

	/**
	 * Logout user
	 * POST /api/auth/logout
	 */
	public async logout(req: Request, res: Response): Promise<Response> {
		try {
			const userId = req.user?.userId;

			if (userId) {
				await authService.logout(userId);
			}

            // Clear auth cookies
			res.clearCookie("refreshToken");
            res.clearCookie("token");

			return sendSuccess(res, null, "Logout successful");
		} catch (error: unknown) {
			logger.error("Logout error:", error);
			return sendError(res, (error as Error).message || "Logout failed", 500);
		}
	}

	/**
	 * Get current user profile
	 * GET /api/auth/profile
	 */
	public async getProfile(req: Request, res: Response): Promise<Response> {
		try {
			const userId = req.user?.userId;

			if (!userId) {
				return sendError(res, "Not authorized", 401);
			}

			const user = await authService.getProfile(userId);

			if (!user) {
				return sendError(res, "User not found", 404);
			}

			return sendSuccess(res, user, "Profile retrieved successfully");
		} catch (error: unknown) {
			logger.error("Get profile error:", error);
			return sendError(res, (error as Error).message || "Failed to get profile", 500);
		}
	}

	/**
	 * Update user profile
	 * PUT /api/auth/profile
	 */
	public async updateProfile(req: Request, res: Response): Promise<Response> {
		try {
			const userId = req.user?.userId;

			if (!userId) {
				return sendError(res, "Not authorized", 401);
			}

			const updateData = req.body;
			const user = await authService.updateProfile(userId, updateData);

			if (!user) {
				return sendError(res, "User not found", 404);
			}

			return sendSuccess(res, user, "Profile updated successfully");
		} catch (error: unknown) {
			logger.error("Update profile error:", error);
			return sendError(res, (error as Error).message || "Failed to update profile", 500);
		}
	}

	/**
	 * Change password
	 * POST /api/auth/change-password
	 */
	public async changePassword(req: Request, res: Response): Promise<Response> {
		try {
			const userId = req.user?.userId;
			const { currentPassword, newPassword } = req.body;

			if (!userId) {
				return sendError(res, "Not authorized", 401);
			}

			if (!currentPassword || !newPassword) {
				return sendError(res, "Please provide current and new password", 400);
			}

			if (newPassword.length < 8) {
				return sendError(
					res,
					"New password must be at least 8 characters",
					400,
				);
			}

			await authService.changePassword(userId, currentPassword, newPassword);

			return sendSuccess(res, null, "Password changed successfully");
		} catch (error: unknown) {
			logger.error("Change password error:", error);
			return sendError(res, (error as Error).message || "Failed to change password", 400);
		}
	}

	/**
	 * Refresh access token
	 * POST /api/auth/refresh
	 */
	public async refreshToken(req: Request, res: Response): Promise<Response> {
		try {
			const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

			if (!refreshToken) {
				return sendError(res, "Refresh token not provided", 401);
			}

            const { accessToken, refreshToken: newRefreshToken } =
				await authService.refreshAccessToken(refreshToken);

			{
				const isProd = process.env.NODE_ENV === "production";
				const domain = process.env.COOKIE_DOMAIN || undefined;
				res.cookie("refreshToken", newRefreshToken, {
					httpOnly: true,
					secure: isProd,
					sameSite: isProd ? "none" : "lax",
					domain,
					maxAge: 30 * 24 * 60 * 60 * 1000,
				});
				res.cookie("token", accessToken, {
					httpOnly: true,
					secure: isProd,
					sameSite: isProd ? "none" : "lax",
					domain,
					maxAge: 15 * 60 * 1000,
				});
			}

			return sendSuccess(res, { accessToken }, "Token refreshed successfully");
		} catch (error: unknown) {
			logger.error("Refresh token error:", error);
			return sendError(res, (error as Error).message || "Failed to refresh token", 401);
		}
	}

	/**
	 * Save broker credentials
	 * POST /api/auth/broker-credentials
	 */
	public async saveBrokerCredentials(
		req: Request,
		res: Response,
	): Promise<Response> {
		try {
			const userId = req.user?.userId;
			const { apiKey, apiSecret } = req.body;

			if (!userId) {
				return sendError(res, "Not authorized", 401);
			}

			if (!apiKey || !apiSecret) {
				return sendError(res, "Please provide API key and secret", 400);
			}

			await authService.saveBrokerCredentials(userId, apiKey, apiSecret);

			return sendSuccess(res, null, "Broker credentials saved successfully");
		} catch (error: unknown) {
			logger.error("Save broker credentials error:", error);
			return sendError(
				res,
				(error as Error).message || "Failed to save broker credentials",
				500,
			);
		}
	}

	/**
	 * Request registration OTP
	 * POST /api/auth/register/request-otp
	 */
	public async requestRegistrationOTP(
		req: Request,
		res: Response,
	): Promise<Response> {
		try {
			const { name, email, password, phone } = req.body;

			// Validate required fields
			if (!name || !email || !password) {
				return sendError(res, "Please provide name, email, and password", 400);
			}

			// Validate email format
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(email)) {
				return sendError(res, "Please provide a valid email", 400);
			}

			// Validate password length
			if (password.length < 8) {
				return sendError(res, "Password must be at least 8 characters", 400);
			}

			const result = await authService.requestRegistrationOTP({
				name,
				email,
				password,
				phone,
			});

			return sendSuccess(
				res,
				result,
				"OTP sent successfully. Check your email.",
			);
		} catch (error: unknown) {
			logger.error("Request registration OTP error:", error);
			return sendError(res, (error as Error).message || "Failed to send OTP", 400);
		}
	}

	/**
	 * Verify registration OTP
	 * POST /api/auth/register/verify-otp
	 */
	public async verifyRegistrationOTP(
		req: Request,
		res: Response,
	): Promise<Response> {
		try {
			const { email, otp } = req.body;

			if (!email || !otp) {
				return sendError(res, "Please provide email and OTP", 400);
			}

			const { user, accessToken, refreshToken } =
				await authService.verifyRegistrationOTP(email, otp);

			{
				const isProd = process.env.NODE_ENV === "production";
				const domain = process.env.COOKIE_DOMAIN || undefined;
				res.cookie("refreshToken", refreshToken, {
					httpOnly: true,
					secure: isProd,
					sameSite: isProd ? "none" : "lax",
					domain,
					maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
				});
				res.cookie("token", accessToken, {
					httpOnly: true,
					secure: isProd,
					sameSite: isProd ? "none" : "lax",
					domain,
					maxAge: 15 * 60 * 1000, // 15 minutes
				});
			}

			return sendSuccess(
				res,
				{
					user,
					accessToken,
				},
				"Registration successful! Welcome aboard!",
				201,
			);
		} catch (error: unknown) {
			logger.error("Verify registration OTP error:", error);
			return sendError(res, (error as Error).message || "OTP verification failed", 400);
		}
	}

	/**
	 * Request login OTP
	 * POST /api/auth/login/request-otp
	 */
	public async requestLoginOTP(req: Request, res: Response): Promise<Response> {
		try {
			const { email } = req.body;

			if (!email) {
				return sendError(res, "Please provide email", 400);
			}

			const result = await authService.requestLoginOTP(email);

			return sendSuccess(
				res,
				result,
				"OTP sent successfully. Check your email.",
			);
		} catch (error: unknown) {
			logger.error("Request login OTP error:", error);
			return sendError(res, (error as Error).message || "Failed to send OTP", 400);
		}
	}

	/**
	 * Verify login OTP
	 * POST /api/auth/login/verify-otp
	 */
	public async verifyLoginOTP(req: Request, res: Response): Promise<Response> {
		try {
			const { email, otp } = req.body;

			if (!email || !otp) {
				return sendError(res, "Please provide email and OTP", 400);
			}

			const { user, accessToken, refreshToken } =
				await authService.verifyLoginOTP(email, otp);

			{
				const isProd = process.env.NODE_ENV === "production";
				const domain = process.env.COOKIE_DOMAIN || undefined;
				res.cookie("refreshToken", refreshToken, {
					httpOnly: true,
					secure: isProd,
					sameSite: isProd ? "none" : "lax",
					domain,
					maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
				});
				res.cookie("token", accessToken, {
					httpOnly: true,
					secure: isProd,
					sameSite: isProd ? "none" : "lax",
					domain,
					maxAge: 15 * 60 * 1000, // 15 minutes
				});
			}

			// Log login activity (non-blocking)
			try {
				await ActivityLogService.logLogin((user as any)._id.toString(), {
					ip: req.ip,
					userAgent: req.headers["user-agent"],
					loginMethod: "OTP",
				});
			} catch (logError) {
				logger.error("Failed to log login activity, but continuing:", logError);
			}

			return sendSuccess(
				res,
				{
					user,
					accessToken,
				},
				"Login successful! Welcome back!",
			);
		} catch (error: unknown) {
			logger.error("Verify login OTP error:", error);
			return sendError(res, (error as Error).message || "OTP verification failed", 401);
		}
	}

	/**
	 * Request password reset OTP
	 * POST /api/auth/forgot-password/request-otp
	 */
	public async requestPasswordResetOTP(
		req: Request,
		res: Response,
	): Promise<Response> {
		try {
			const { email } = req.body;

			if (!email) {
				return sendError(res, "Please provide email", 400);
			}

			const result = await authService.requestPasswordResetOTP(email);

			return sendSuccess(
				res,
				result,
				"OTP sent successfully. Check your email.",
			);
		} catch (error: unknown) {
			logger.error("Request password reset OTP error:", error);
			return sendError(res, (error as Error).message || "Failed to send OTP", 400);
		}
	}

	/**
	 * Verify password reset OTP and reset password
	 * POST /api/auth/forgot-password/verify-otp
	 */
	public async verifyPasswordResetOTP(
		req: Request,
		res: Response,
	): Promise<Response> {
		try {
			const { email, otp, newPassword } = req.body;

			if (!email || !otp || !newPassword) {
				return sendError(
					res,
					"Please provide email, OTP, and new password",
					400,
				);
			}

			if (newPassword.length < 8) {
				return sendError(res, "Password must be at least 8 characters", 400);
			}

			const result = await authService.verifyPasswordResetOTP(
				email,
				otp,
				newPassword,
			);

			return sendSuccess(res, result, "Password reset successful!");
		} catch (error: unknown) {
			logger.error("Verify password reset OTP error:", error);
			return sendError(res, (error as Error).message || "Password reset failed", 400);
		}
	}

	/**
	 * Resend OTP
	 * POST /api/auth/resend-otp
	 */
	public async resendOTP(req: Request, res: Response): Promise<Response> {
		try {
			const { email, purpose } = req.body;

			if (!email || !purpose) {
				return sendError(res, "Please provide email and purpose", 400);
			}

			if (!["REGISTRATION", "LOGIN", "PASSWORD_RESET"].includes(purpose)) {
				return sendError(res, "Invalid purpose", 400);
			}

			const result = await authService.resendOTP(email, purpose);

			return sendSuccess(res, result, "OTP resent successfully.");
		} catch (error: unknown) {
			logger.error("Resend OTP error:", error);
			return sendError(res, (error as Error).message || "Failed to resend OTP", 400);
		}
	}
}

export default new AuthController();
