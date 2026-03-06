import type { NextFunction, Request, Response } from "express";
import authService from "../services/auth.service";
import { sendError } from "../utils/helpers";
import logger from "../utils/logger";

// Extend Express Request type to include user
declare module 'express-serve-static-core' {
	interface Request {
		user?: {
			userId: string;
			email: string;
			accountType: string;
			role: string;
		};
	}
}

/**
 * Middleware to protect routes - requires authentication
 */
export const protect = async (
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void | Response> => {
	try {
		let token: string | undefined;

		// Check for token in Authorization header
		if (
			req.headers.authorization &&
			req.headers.authorization.startsWith("Bearer")
		) {
			token = req.headers.authorization.split(" ")[1];
			logger.debug("Auth middleware - Token from Authorization header:", {
				hasToken: !!token,
				tokenLength: token ? token.length : 0,
				endpoint: req.path,
				method: req.method,
			});
		}
		// Check for token in cookies
		else if (req.cookies?.token) {
			token = req.cookies.token;
			logger.debug("Auth middleware - Token from cookies:", {
				hasToken: !!token,
				tokenLength: token ? token.length : 0,
				endpoint: req.path,
				method: req.method,
			});
		}

		// Check if token exists
		if (!token) {
			logger.debug("Auth middleware - No token found:", {
				endpoint: req.path,
				method: req.method,
				hasAuthHeader: !!req.headers.authorization,
				hasCookies: !!req.cookies?.token,
			});
			return sendError(res, "Not authorized to access this route", 401);
		}

		// Verify token
		logger.debug("Auth middleware - Verifying token:", {
			tokenLength: token.length,
			endpoint: req.path,
			method: req.method,
		});

		const decoded = authService.verifyAccessToken(token);
		if (!decoded) {
			logger.warn("Auth middleware - Token verification failed:", {
				endpoint: req.path,
				method: req.method,
				tokenLength: token.length,
			});
			return sendError(res, "Invalid or expired token", 401);
		}

		// Add user to request
		req.user = {
			userId: decoded.userId,
			email: decoded.email,
			accountType: decoded.accountType,
			role: decoded.role,
		};

		logger.debug("Auth middleware - User authenticated:", {
			userId: req.user.userId,
			email: req.user.email,
			accountType: req.user.accountType,
			role: req.user.role,
		});

		next();
	} catch (error: unknown) {
		logger.error("Auth middleware error:", error);
		return sendError(res, "Not authorized to access this route", 401);
	}
};

/**
 * Middleware to restrict access based on account type
 */
export const restrictTo = (...accountTypes: string[]) => {
	return (req: Request, res: Response, next: NextFunction): void | Response => {
		if (!req.user) {
			return sendError(res, "Not authorized", 401);
		}

		if (!accountTypes.includes(req.user.accountType)) {
			return sendError(
				res,
				"You do not have permission to perform this action",
				403,
			);
		}

		next();
	};
};

/**
 * Middleware to check if user is verified
 */
export const requireVerified = async (
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void | Response> => {
	try {
		if (!req.user) {
			return sendError(res, "Not authorized", 401);
		}

		const user = await authService.getProfile(req.user.userId);
		if (!user) {
			return sendError(res, "User not found", 404);
		}

		if (!user.isEmailVerified) {
			return sendError(
				res,
				"Please verify your email to access this feature",
				403,
			);
		}

		next();
	} catch (error: unknown) {
		logger.error("Verification check error:", error);
		return sendError(res, "Verification check failed", 500);
	}
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = async (
	req: Request,
	_res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		let token: string | undefined;

		if (
			req.headers.authorization &&
			req.headers.authorization.startsWith("Bearer")
		) {
			token = req.headers.authorization.split(" ")[1];
		} else if (req.cookies?.token) {
			token = req.cookies.token;
		}

		if (token) {
			const decoded = authService.verifyAccessToken(token);
			if (decoded) {
				req.user = {
					userId: decoded.userId,
					email: decoded.email,
					accountType: decoded.accountType,
					role: decoded.role,
				};
			}
		}

		next();
	} catch {
		// Continue without authentication
		next();
	}
};

/**
 * Middleware to require admin role
 */
export const requireAdmin = async (
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void | Response> => {
	try {
		if (!req.user) {
			return sendError(res, "Not authorized", 401);
		}

		// Check if user has admin role
		if (req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN") {
			logger.warn(
				`Non-admin user attempted to access admin route: ${req.user.email}`,
			);
			return sendError(res, "Access denied. Admin privileges required.", 403);
		}

		logger.info(`Admin access granted: ${req.user.email} (${req.user.role})`);
		next();
	} catch (error: unknown) {
		logger.error("Admin check error:", error);
		return sendError(res, "Authorization check failed", 500);
	}
};
