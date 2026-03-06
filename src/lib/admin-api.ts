// @ts-nocheck
import api from "./api";

/**
 * Admin login
 */
export const adminLogin = async (email, password) => {
	try {
		const response = await api.post("/api/auth/admin/login", {
			email,
			password,
		});
		return response;
	} catch (error) {
		console.error("Error logging in admin:", error);
		throw error;
	}
};

/**
 * Admin logout
 */
export const adminLogout = async () => {
	try {
		// Clear admin token and user data from localStorage
		localStorage.removeItem("adminToken");
		localStorage.removeItem("adminUser");

		// Optionally call backend logout endpoint if you want to invalidate the token
		// await api.post("/api/auth/logout");

		return { success: true };
	} catch (error) {
		console.error("Error logging out admin:", error);
		throw error;
	}
};

/**
 * Get all users with stats
 */
export const getAllUsers = async () => {
	try {
		const response = await api.get("/api/admin/users");
		return response;
	} catch (error) {
		console.error("Error fetching users:", error);
		throw error;
	}
};

/**
 * Get all strategies across users
 */
export const getAllStrategies = async () => {
	try {
		const response = await api.get("/api/admin/strategies");
		return response;
	} catch (error) {
		console.error("Error fetching strategies:", error);
		throw error;
	}
};

/**
 * Get dashboard stats
 */
export const getDashboardStats = async () => {
	try {
		const response = await api.get("/api/admin/stats");
		return response;
	} catch (error) {
		console.error("Error fetching dashboard stats:", error);
		throw error;
	}
};

/**
 * Update user status
 */
export const updateUserStatus = async (userId, status) => {
	try {
		const response = await api.put(`/api/admin/users/${userId}/status`, {
			status,
		});
		return response;
	} catch (error) {
		console.error("Error updating user status:", error);
		throw error;
	}
};

/**
 * Update user details
 */
export const updateUser = async (userId, userData) => {
	try {
		const response = await api.put(`/api/admin/users/${userId}`, userData);
		return response;
	} catch (error) {
		console.error("Error updating user:", error);
		throw error;
	}
};

/**
 * Delete user
 */
export const deleteUser = async (userId) => {
	try {
		const response = await api.delete(`/api/admin/users/${userId}`);
		return response;
	} catch (error) {
		console.error("Error deleting user:", error);
		throw error;
	}
};

/**
 * Toggle strategy status
 */
export const toggleStrategyStatus = async (strategyId) => {
	try {
		const response = await api.put(
			`/api/admin/strategies/${strategyId}/toggle`,
		);
		return response;
	} catch (error) {
		console.error("Error toggling strategy:", error);
		throw error;
	}
};

/**
 * Get strategy templates
 */
export const getStrategyTemplates = async () => {
	try {
		const response = await api.get("/api/admin/strategy-templates");
		return response;
	} catch (error) {
		console.error("Error fetching strategy templates:", error);
		throw error;
	}
};

/**
 * Toggle strategy visibility
 */
export const toggleStrategyVisibility = async (strategyId, isVisible) => {
	try {
		const response = await api.put(
			`/api/admin/strategy-template/${strategyId}/visibility`,
			{ isVisible },
		);
		return response;
	} catch (error) {
		console.error("Error toggling strategy visibility:", error);
		throw error;
	}
};

/**
 * ========== Instruments Management ==========
 */

/**
 * Get all instruments with pagination
 */
export const getAllInstruments = async (page = 1, limit = 50, exchange, search, instrumentType) => {
	try {
		let query = `page=${page}&limit=${limit}`;
		if (exchange) query += `&exchange=${exchange}`;
		if (search) query += `&search=${search}`;
		if (instrumentType) query += `&instrumentType=${instrumentType}`;
		
		const response = await api.get(`/api/admin/instruments?${query}`);
		return response;
	} catch (error) {
		console.error("Error fetching instruments:", error);
		throw error;
	}
};

/**
 * Search instruments
 */
export const searchInstruments = async (q, exchange, instrumentType, limit = 20) => {
	try {
		const params = new URLSearchParams({ q, limit: String(limit) });
		if (exchange) params.append("exchange", exchange);
		if (instrumentType) params.append("instrumentType", instrumentType);
		const response = await api.get(`/api/admin/instruments/search?${params.toString()}`);
		return response;
	} catch (error) {
		console.error("Error searching instruments:", error);
		throw error;
	}
};

/**
 * Get instrument statistics
 */
export const getInstrumentStats = async () => {
	try {
		const response = await api.get("/api/admin/instruments/stats");
		return response;
	} catch (error) {
		console.error("Error fetching instrument stats:", error);
		throw error;
	}
};

/**
 * Get instrument details
 */
export const getInstrumentDetails = async (instrumentId) => {
	try {
		const response = await api.get(`/api/admin/instruments/${instrumentId}`);
		return response;
	} catch (error) {
		console.error("Error fetching instrument details:", error);
		throw error;
	}
};

/**
 * Update all instruments from XTS
 */
export const updateAllInstruments = async () => {
	try {
		const response = await api.post("/api/admin/instruments/update-all");
		return response;
	} catch (error) {
		console.error("Error updating instruments:", error);
		throw error;
	}
};

/**
 * Get all trades across all users (Admin)
 */
export const getAllTrades = async (params = {}) => {
	try {
		const queryParams = new URLSearchParams();
		
		if (params.status) queryParams.append('status', params.status);
		if (params.symbol) queryParams.append('symbol', params.symbol);
		if (params.userId) queryParams.append('userId', params.userId);
		if (params.strategyId) queryParams.append('strategyId', params.strategyId);
		if (params.page) queryParams.append('page', String(params.page));
		if (params.limit) queryParams.append('limit', String(params.limit));
		if (params.sortBy) queryParams.append('sortBy', params.sortBy);
		if (params.order) queryParams.append('order', params.order);

		const queryString = queryParams.toString();
		const endpoint = `/api/admin/trades${queryString ? `?${queryString}` : ''}`;
		
		const response = await api.get(endpoint);
		return response;
	} catch (error) {
		console.error("Error fetching trades:", error);
		throw error;
	}
};