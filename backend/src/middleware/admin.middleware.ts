import { Request, Response, NextFunction } from 'express';
import { AuthorizationError } from '../utils/errors';
import logger from '../utils/logger';

/**
 * Middleware to require admin role
 */
export const requireAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void | Response> => {
    try {
        if (!req.user) {
            throw new AuthorizationError('Authentication required');
        }

        // Check if user has admin role
        if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            logger.warn(`Non-admin user attempted to access admin route: ${req.user.email}`, {
                userId: req.user.userId,
                role: req.user.role,
                path: req.path,
                method: req.method
            });
            throw new AuthorizationError('Admin privileges required');
        }

        logger.info(`Admin access granted: ${req.user.email} (${req.user.role})`, {
            userId: req.user.userId,
            role: req.user.role,
            path: req.path,
            method: req.method
        });

        next();
    } catch (error) {
        if (error instanceof AuthorizationError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }

        logger.error('Admin check error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authorization check failed'
        });
    }
};

/**
 * Middleware to require super admin role
 */
export const requireSuperAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void | Response> => {
    try {
        if (!req.user) {
            throw new AuthorizationError('Authentication required');
        }

        // Check if user has super admin role
        if (req.user.role !== 'SUPER_ADMIN') {
            logger.warn(`Non-super-admin user attempted to access super admin route: ${req.user.email}`, {
                userId: req.user.userId,
                role: req.user.role,
                path: req.path,
                method: req.method
            });
            throw new AuthorizationError('Super admin privileges required');
        }

        logger.info(`Super admin access granted: ${req.user.email}`, {
            userId: req.user.userId,
            role: req.user.role,
            path: req.path,
            method: req.method
        });

        next();
    } catch (error) {
        if (error instanceof AuthorizationError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }

        logger.error('Super admin check error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authorization check failed'
        });
    }
};
