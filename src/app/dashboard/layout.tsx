"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getUser } from "@/lib/auth-api";
import DashboardHeader from "@/components/panel/dashboard/DashboardHeader";
import DashboardSidebar from "@/components/panel/dashboard/DashboardSidebar";
import BottomBar from "@/components/panel/dashboard/BottomBar";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [userName, setUserName] = useState("User");
	const router = useRouter();

	// Load user data on component mount
	useEffect(() => {
		const user = getUser();
		if (user?.name) {
			setUserName(user.name);
		}

		// Check authentication
		const token = localStorage.getItem("accessToken");
		if (!token) {
			router.push("/login");
		}
	}, [router]);

	const handleLogout = () => {
		localStorage.removeItem("accessToken");
		localStorage.removeItem("refreshToken");
		localStorage.removeItem("user");
		router.push("/");
	};

	return (
		<div className="flex h-screen bg-gray-50 overflow-hidden dark:bg-gray-950">
			{/* Sidebar */}
			<DashboardSidebar
				sidebarOpen={sidebarOpen}
				onSidebarClose={() => setSidebarOpen(false)}
				onLogout={handleLogout}
			/>

			{/* Main Content */}
			<div className="flex-1 flex flex-col overflow-hidden w-full">
				{/* Top Navigation */}
				<DashboardHeader
					userName={userName}
					onMenuClick={() => setSidebarOpen(true)}
					onLogout={handleLogout}
				/>

				{/* Content Area */}
				<div className="flex-1 overflow-auto pb-16 md:pb-0">{children}</div>
			</div>

			{/* Bottom Bar */}
			<BottomBar />
		</div>
	);
}
