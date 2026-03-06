// @ts-nocheck
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Custom hook to check if admin is authenticated
 * @returns {Object} { isAuthenticated, isLoading, adminUser }
 */
export function useAdminAuth() {
	const router = useRouter();
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [adminUser, setAdminUser] = useState(null);

	useEffect(() => {
		// Check if we're on the client side
		if (typeof window === "undefined") {
			return;
		}

		try {
			// Get admin token and user data from localStorage
			const token = localStorage.getItem("adminToken");
			const userJson = localStorage.getItem("adminUser");

			if (!token) {
				// No token found, redirect to login
				setIsAuthenticated(false);
				setIsLoading(false);
				router.push("/admin/login");
				return;
			}

			if (userJson) {
				const user = JSON.parse(userJson);

				// Verify the user has admin role
				if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
					setAdminUser(user);
					setIsAuthenticated(true);
				} else {
					// User doesn't have admin role
					console.warn("User does not have admin privileges");
					localStorage.removeItem("adminToken");
					localStorage.removeItem("adminUser");
					setIsAuthenticated(false);
					router.push("/admin/login");
				}
			} else {
				// No user data found
				setIsAuthenticated(false);
				router.push("/admin/login");
			}
		} catch (error) {
			console.error("Error checking admin authentication:", error);
			setIsAuthenticated(false);
			router.push("/admin/login");
		} finally {
			setIsLoading(false);
		}
	}, [router]);

	return { isAuthenticated, isLoading, adminUser };
}

/**
 * Higher-order component to protect admin routes
 * Usage: export default withAdminAuth(YourComponent);
 */
export function withAdminAuth(Component) {
	return function ProtectedComponent(props) {
		const { isAuthenticated, isLoading, adminUser } = useAdminAuth();

		// Show loading state while checking authentication
		if (isLoading) {
			return (
				<div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
					<div className="text-center">
						<div className="w-16 h-16 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto mb-4"></div>
						<p className="text-gray-400 text-lg">Verifying admin access...</p>
					</div>
				</div>
			);
		}

		// If not authenticated, return null (router will redirect)
		if (!isAuthenticated) {
			return null;
		}

		// If authenticated, render the component
		return <Component {...props} adminUser={adminUser} />;
	};
}
