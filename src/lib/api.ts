// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

// API Configuration
// Handle comma-separated URLs (take first one) and clean up
const getApiBaseUrl = () => {
	const envUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
	// If URL contains comma, split and take first one
	const url = envUrl.includes(',') ? envUrl.split(',')[0].trim() : envUrl.trim();
	// Remove trailing slash
	const finalUrl = url.replace(/\/$/, '');
	
	// Debug log in development
	if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
		console.log('[API Client] Base URL:', finalUrl, '| Env URL:', envUrl);
	}
	
	return finalUrl;
};

const API_BASE_URL = getApiBaseUrl();

class ApiClient {
	constructor() {
		this.baseURL = API_BASE_URL;
	}

	async request(endpoint, options = {}) {
		const url = `${this.baseURL}${endpoint}`;

		const config = {
			headers: {
				"Content-Type": "application/json",
				...options.headers,
			},
			credentials: "include",
			...options,
		};

		// Attach admin token only for admin routes; normal routes rely on httpOnly cookies
		if (typeof window !== "undefined") {
			const isAdminRoute = endpoint.includes("/admin");
			if (isAdminRoute) {
				const adminToken = localStorage.getItem("adminToken");
				if (adminToken) {
					config.headers.Authorization = `Bearer ${adminToken}`;
				}
			}

			// Also attach user access token for non-admin routes (helps in dev when cookies aren't sent cross-origin)
			const userToken = localStorage.getItem("accessToken");
			if (userToken && !config.headers.Authorization) {
				config.headers.Authorization = `Bearer ${userToken}`;
			}
			// if (process.env.NODE_ENV !== "production") {
			// 	console.log("API Request:", {
			// 		endpoint,
			// 		method: options.method || "GET",
			// 		isAdminRoute,
			// 	});
			// }
		}

		try {
			const response = await fetch(url, config);
			let data: any = null;

			try {
				data = await response.json();
			} catch {
				// Non-JSON responses are ignored; we'll surface generic error below
			}

			if (!response.ok) {
				const message =
					data?.error || data?.message || response.statusText || "Something went wrong";

				if (typeof window !== "undefined" && response.status === 401) {
					const isAdminRoute = endpoint.includes("/admin");

					if (isAdminRoute) {
						localStorage.removeItem("adminToken");
						if (!window.location.pathname.startsWith("/admin/login")) {
							window.location.href = "/admin/login";
						}
					} else {
						localStorage.removeItem("accessToken");
						if (!window.location.pathname.startsWith("/login")) {
							window.location.href = "/login";
						}
					}
				}

				throw new Error(message);
			}

			return data ?? {};
		} catch (error) {
			// Check if it's a connection error (network failure)
			const isConnectionError = 
				error instanceof TypeError && 
				(error.message.includes('Failed to fetch') || 
				 error.message.includes('ERR_CONNECTION_REFUSED') ||
				 error.message.includes('NetworkError'));
			
			// Only log non-connection errors or log connection errors once
			if (!isConnectionError) {
				if (process.env.NODE_ENV !== "production") {
					console.error("API Error:", error);
				}
			} else {
				// For connection errors, only log in development and only for critical endpoints
				// Suppress logs for non-critical endpoints like notifications
				const isCriticalEndpoint = !endpoint.includes('/broadcast/user/unread');
				if (process.env.NODE_ENV !== "production" && isCriticalEndpoint) {
					console.warn("API Connection Error (backend may be offline):", endpoint);
				}
			}
			throw error;
		}
	}

	get(endpoint, options = {}) {
		return this.request(endpoint, {
			method: "GET",
			...options,
		});
	}

	post(endpoint, body, options = {}) {
		return this.request(endpoint, {
			method: "POST",
			body: JSON.stringify(body),
			...options,
		});
	}

	put(endpoint, body, options = {}) {
		return this.request(endpoint, {
			method: "PUT",
			body: JSON.stringify(body),
			...options,
		});
	}

	delete(endpoint, options = {}) {
		return this.request(endpoint, {
			method: "DELETE",
			...options,
		});
	}
}

const apiClient = new ApiClient();
export default apiClient;
