// @ts-nocheck
"use client";

import { motion } from "framer-motion";
import { Bell, User } from "lucide-react";
import { useState } from "react";
import AdminBroadcast from "./AdminBroadcast";
import AdminChats from "./AdminChats";
import AdminDashboard from "./AdminDashboard";
import AdminSidebar from "./AdminSidebar";
import IndicatorManagement from "./IndicatorManagement";
import StrategyMonitor from "./StrategyMonitor";
import TradeHistory from "./TradeHistory";
import UserManagement from "./UserManagement";

export default function AdminPanel() {
	const [activeTab, setActiveTab] = useState("dashboard");

	const renderContent = () => {
		switch (activeTab) {
			case "dashboard":
				return <AdminDashboard />;
			case "users":
				return <UserManagement />;
			case "strategies":
				return <StrategyMonitor />;
			case "strategy-management":
				return <IndicatorManagement />;
			case "trades":
				return <TradeHistory />;
			case "chats":
				return <AdminChats />;
			case "broadcast":
				return <AdminBroadcast />;
			default:
				return <AdminDashboard />;
		}
	};

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
									{activeTab}
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
				<main className="flex-1 p-4 lg:p-8 overflow-auto">
					<motion.div
						key={activeTab}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -20 }}
						transition={{ duration: 0.3 }}
					>
						{renderContent()}
					</motion.div>
				</main>
			</div>
		</div>
	);
}
