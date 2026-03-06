// @ts-nocheck
"use client";

import { Bell, User } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AdminSidebar from "../../components/Admin/panel/AdminSidebar";

/**
 * Admin Layout - Protects all admin routes and provides sidebar navigation
 * Checks if admin is authenticated before rendering children
 */
export default function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const router = useRouter();
	const pathname = usePathname();
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		// Skip authentication check for login page
		if (pathname === "/admin/login") {
			setIsLoading(false);
			setIsAuthenticated(true);
			return;
		}

		// Check authentication for all other admin routes
		const checkAuth = () => {
			try {
				const token = localStorage.getItem("adminToken");
				const userJson = localStorage.getItem("adminUser");

				if (!token) {
					console.log("No admin token found, redirecting to login...");
					router.push("/admin/login");
					return;
				}

				if (userJson) {
					const user = JSON.parse(userJson);

					// Verify the user has admin role
					if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
						setIsAuthenticated(true);
					} else {
						console.warn("User does not have admin privileges");
						localStorage.removeItem("adminToken");
						localStorage.removeItem("adminUser");
						router.push("/admin/login");
					}
				} else {
					console.log("No admin user data found, redirecting to login...");
					router.push("/admin/login");
				}
			} catch (error) {
				console.error("Error checking admin authentication:", error);
				router.push("/admin/login");
			} finally {
				setIsLoading(false);
			}
		};

		checkAuth();
	}, [pathname, router]);

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

	// For login page, render children without sidebar
	if (pathname === "/admin/login") {
		return <>{children}</>;
	}

	// For authenticated users, render with sidebar
	if (isAuthenticated) {
		// Get the current active tab from the pathname
		const getActiveTab = () => {
			const path = pathname.replace("/admin/", "");
			if (path === "dashboard" || path === "") return "dashboard";
			if (path === "users") return "users";
			if (path === "strategies") return "strategies";
			if (path === "strategy-management") return "strategy-management";
			if (path === "instruments") return "instruments";
			if (path === "trades") return "trades";
			if (path === "chats") return "chats";
			if (path === "broadcast") return "broadcast";
			if (path === "revenue") return "revenue";
			return "dashboard";
		};

		const activeTab = getActiveTab();
		const pageTitle =
			activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace("-", " ");

		return (
			<div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
				{/* Sidebar */}
				<AdminSidebar activeTab={activeTab} />

				{/* Main Content */}
				<div className="flex-1 flex flex-col lg:ml-72 overflow-hidden">
					{/* Top Bar */}
					<header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-8 py-4 sticky top-0 z-30">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-4">
								<div className="lg:hidden w-16"></div>{" "}
								{/* Spacer for mobile menu button */}
								<div>
									<h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 capitalize">
										{pageTitle}
									</h2>
									<p className="text-sm text-gray-500 dark:text-gray-400">Admin Control Panel</p>
								</div>
							</div>

							<div className="flex items-center gap-4">
								{/* Notifications */}
								<button
									type="button"
									className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
								>
									<Bell className="w-6 h-6 text-gray-600 dark:text-gray-300" />
									<span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
								</button>

								{/* Admin Profile */}
								<div className="flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
									<div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
										<User className="w-5 h-5 text-white" />
									</div>
									<div className="hidden md:block">
										<p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
											Admin User
										</p>
										<p className="text-xs text-gray-500 dark:text-gray-400">Administrator</p>
									</div>
								</div>
							</div>
						</div>
					</header>

					{/* Content Area */}
					<main className="flex-1 p-4 lg:p-8 overflow-auto">{children}</main>
				</div>
			</div>
		);
	}

	// If not authenticated and not on login page, return null (router will redirect)
	return null;
}
