import { Router } from "express";
import authController from "../controllers/auth.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register new user (OLD - kept for backward compatibility)
 * @access  Public
 */
router.post("/register", authController.register.bind(authController));

/**
 * @route   POST /api/auth/register/request-otp
 * @desc    Request OTP for registration
 * @access  Public
 */
router.post(
	"/register/request-otp",
	authController.requestRegistrationOTP.bind(authController),
);

/**
 * @route   POST /api/auth/register/verify-otp
 * @desc    Verify OTP and complete registration
 * @access  Public
 */
router.post(
	"/register/verify-otp",
	authController.verifyRegistrationOTP.bind(authController),
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user (OLD - kept for backward compatibility)
 * @access  Public
 */
router.post("/login", authController.login.bind(authController));

/**
 * @route   POST /api/auth/admin/login
 * @desc    Admin login with role validation
 * @access  Public
 */
router.post("/admin/login", authController.adminLogin.bind(authController));

/**
 * @route   POST /api/auth/login/request-otp
 * @desc    Request OTP for login
 * @access  Public
 */
router.post(
	"/login/request-otp",
	authController.requestLoginOTP.bind(authController),
);

/**
 * @route   POST /api/auth/login/verify-otp
 * @desc    Verify OTP and login
 * @access  Public
 */
router.post(
	"/login/verify-otp",
	authController.verifyLoginOTP.bind(authController),
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post("/logout", protect, authController.logout.bind(authController));

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/profile", protect, authController.getProfile.bind(authController));

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put(
	"/profile",
	protect,
	authController.updateProfile.bind(authController),
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post(
	"/change-password",
	protect,
	authController.changePassword.bind(authController),
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post("/refresh", authController.refreshToken.bind(authController));

/**
 * @route   POST /api/auth/broker-credentials
 * @desc    Save broker API credentials
 * @access  Private
 */
router.post(
	"/broker-credentials",
	protect,
	authController.saveBrokerCredentials.bind(authController),
);

/**
 * @route   POST /api/auth/forgot-password/request-otp
 * @desc    Request OTP for password reset
 * @access  Public
 */
router.post(
	"/forgot-password/request-otp",
	authController.requestPasswordResetOTP.bind(authController),
);

/**
 * @route   POST /api/auth/forgot-password/verify-otp
 * @desc    Verify OTP and reset password
 * @access  Public
 */
router.post(
	"/forgot-password/verify-otp",
	authController.verifyPasswordResetOTP.bind(authController),
);

/**
 * @route   POST /api/auth/resend-otp
 * @desc    Resend OTP
 * @access  Public
 */
router.post("/resend-otp", authController.resendOTP.bind(authController));

export default router;
