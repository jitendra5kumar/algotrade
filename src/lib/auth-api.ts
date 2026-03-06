import api from "./api";

/**
 * Authentication API methods
 */
export const authAPI = {
	// Registration with OTP
	requestRegistrationOTP: async (userData) => {
		return api.post("/api/auth/register/request-otp", userData);
	},

	verifyRegistrationOTP: async (email, otp) => {
		return api.post("/api/auth/register/verify-otp", { email, otp });
	},

	// Login with OTP
	requestLoginOTP: async (email) => {
		return api.post("/api/auth/login/request-otp", { email });
	},

	verifyLoginOTP: async (email, otp) => {
		return api.post("/api/auth/login/verify-otp", { email, otp });
	},

	// Password Reset with OTP
	requestPasswordResetOTP: async (email) => {
		return api.post("/api/auth/forgot-password/request-otp", { email });
	},

	verifyPasswordResetOTP: async (email, otp, newPassword) => {
		return api.post("/api/auth/forgot-password/verify-otp", {
			email,
			otp,
			newPassword,
		});
	},

	// Resend OTP
	resendOTP: async (email, purpose) => {
		return api.post("/api/auth/resend-otp", { email, purpose });
	},

	// Old methods (backward compatibility)
	register: async (userData) => {
		return api.post("/api/auth/register", userData);
	},

	login: async (email, password) => {
		return api.post("/api/auth/login", { email, password });
	},

	logout: async (): Promise<any> => {
		return api.post("/api/auth/logout", {});
	},

	getProfile: async (): Promise<any> => {
		return api.get("/api/auth/profile");
	},
	updateProfile: async (profileData: any) => {
		return api.put("/api/auth/profile", profileData);
	}
};

/**
 * Auth helper functions
 */
export const saveAuthData = (accessToken, user) => {
	if (typeof window !== "undefined") {
		// Access token now set as httpOnly cookie by server; do not store in localStorage
		localStorage.setItem("accessToken", accessToken);
		localStorage.setItem("user", JSON.stringify(user));
	}
};

export const clearAuthData = () => {
	if (typeof window !== "undefined") {
		localStorage.removeItem("accessToken");
		localStorage.removeItem("user");
	}
};

export const getUser = () => {
	if (typeof window !== "undefined") {
		const userStr = localStorage.getItem("user");
		return userStr ? JSON.parse(userStr) : null;
	}
	return null;
};

export const isAuthenticated = () => {
	if (typeof window !== "undefined") {
		// With httpOnly cookies, client cannot directly check token; fallback to presence of user data
		return !!localStorage.getItem("user");
	}
	return false;
};
