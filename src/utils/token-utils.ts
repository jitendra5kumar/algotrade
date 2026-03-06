/**
 * Token utility functions for WebSocket and API authentication
 */

/**
 * Check if token is valid JWT format
 */
export function isValidJWT(token: string | null): boolean {
	if (!token || typeof token !== "string") {
		return false;
	}

	const trimmed = token.trim();
	if (trimmed.length === 0) {
		return false;
	}

	// JWT has 3 parts separated by dots
	const parts = trimmed.split(".");
	if (parts.length !== 3) {
		return false;
	}

	// Basic validation - each part should exist
	return parts.every((part) => part.length > 0);
}

/**
 * Decode JWT token to check expiry (without verification)
 * Returns null if token is invalid or expired
 */
export function decodeJWT(token: string): { exp?: number; iat?: number; userId?: string } | null {
	try {
		if (!isValidJWT(token)) {
			return null;
		}

		const parts = token.split(".");
		if (parts.length !== 3) {
			return null;
		}

		// Decode payload (second part)
		const payload = parts[1];
		const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));

		return decoded;
	} catch (error) {
		console.error("[TokenUtils] Error decoding JWT:", error);
		return null;
	}
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
	const decoded = decodeJWT(token);
	if (!decoded || !decoded.exp) {
		return true; // Consider invalid tokens as expired
	}

	// exp is in seconds, Date.now() is in milliseconds
	const expiryTime = decoded.exp * 1000;
	const currentTime = Date.now();

	return currentTime >= expiryTime;
}

/**
 * Get token from localStorage with fallback to cookies
 */
export function getAuthToken(): string | null {
	if (typeof window === "undefined") {
		return null;
	}

	// Try localStorage first
	let token = localStorage.getItem("accessToken") || localStorage.getItem("token");

	// If not found, try cookies
	if (!token) {
		const cookies = document.cookie.split(";");
		const tokenCookie = cookies.find((c) => c.trim().startsWith("token="));
		if (tokenCookie) {
			token = tokenCookie.split("=")[1]?.trim() || null;
		}
	}

	// Validate token format
	if (token && isValidJWT(token)) {
		return token;
	}

	return null;
}

/**
 * Check if we should attempt WebSocket connection
 */
export function shouldConnectWebSocket(): boolean {
	const token = getAuthToken();
	if (!token) {
		return false;
	}

	// Don't connect if token is expired
	if (isTokenExpired(token)) {
		console.warn("[TokenUtils] Token expired, skipping WebSocket connection");
		return false;
	}

	return true;
}

