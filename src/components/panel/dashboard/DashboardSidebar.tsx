"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
	BarChart3,
	ChevronLeft,
	ChevronRight,
	History,
	Home,
	LogOut,
	Mail,
	TrendingUp,
	User,
	X,
	Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

interface DashboardSidebarProps {
	sidebarOpen: boolean;
	onSidebarClose: () => void;
	onLogout: () => void;
}

interface MenuItem {
	id: string;
	label: string;
	icon: React.ComponentType<{ size?: number; className?: string }>;
	href: string;
}

const menuItems: MenuItem[] = [
	{ id: "dashboard", label: "Dashboard", icon: Home, href: "/dashboard" },
	{
		id: "connect-broker",
		label: "Connect Broker",
		icon: Zap,
		href: "/dashboard/connect-broker",
	},
	{
		id: "algo-trading",
		label: "Algo Trading",
		icon: TrendingUp,
		href: "/dashboard/algo-trading",
	},
	{
		id: "broker-panel",
		label: "Broker Panel",
		icon: BarChart3,
		href: "/dashboard/broker-panel",
	},
	{
		id: "trade-history",
		label: "Trade History",
		icon: History,
		href: "/dashboard/trade-history",
	},
	{
		id: "my-account",
		label: "My Account",
		icon: User,
		href: "/dashboard/my-account",
	},
	{
		id: "contact",
		label: "Contact",
		icon: Mail,
		href: "/dashboard/contact",
	},
];

export default function DashboardSidebar({
	sidebarOpen,
	onSidebarClose,
	onLogout,
}: DashboardSidebarProps) {
	const pathname = usePathname();
	const [isCollapsed, setIsCollapsed] = useState(false);

	// Load collapsed state from localStorage on mount
	useEffect(() => {
		const savedState = localStorage.getItem("sidebarCollapsed");
		if (savedState !== null) {
			setIsCollapsed(savedState === "true");
		}
	}, []);

	// Save collapsed state to localStorage
	const toggleCollapse = () => {
		const newState = !isCollapsed;
		setIsCollapsed(newState);
		localStorage.setItem("sidebarCollapsed", String(newState));
	};

	return (
		<>
			{/* Mobile Sidebar Backdrop */}
			{sidebarOpen && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					onClick={onSidebarClose}
					className="fixed inset-0 bg-black/50 z-30 lg:hidden"
				/>
			)}

			{/* Sidebar */}
			<motion.div
				initial={false}
				animate={{
					width: isCollapsed ? "80px" : "280px",
				}}
				transition={{ duration: 0.3, ease: "easeInOut" }}
				className={`fixed lg:relative top-0 left-0 h-full bg-white border-r-2 border-gray-200 overflow-hidden flex flex-col z-40 dark:bg-gray-900 dark:border-gray-800 ${
					sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
				}`}
			>
				{/* Logo Area */}
				<div className={`${isCollapsed ? "p-4" : "p-6"} border-b border-gray-200 dark:border-gray-800 transition-all duration-300`}>
					<div className="flex items-center justify-between gap-3">
						<AnimatePresence mode="wait">
							{!isCollapsed && (
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									transition={{ delay: 0.1 }}
									className="flex items-center gap-3 flex-1 min-w-0"
								>
									<div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
										<TrendingUp size={20} className="text-white" />
									</div>
									<motion.div
										initial={{ opacity: 0, width: 0 }}
										animate={{ opacity: 1, width: "auto" }}
										exit={{ opacity: 0, width: 0 }}
										transition={{ duration: 0.2 }}
										className="flex flex-col overflow-hidden"
									>
										<span className="font-black text-green-600 dark:text-green-400 whitespace-nowrap">
											Gotrade										</span>
										<span className="text-xs text-gray-600 font-medium dark:text-gray-400 whitespace-nowrap">
											Trading Panel
										</span>
									</motion.div>
								</motion.div>
							)}
						</AnimatePresence>

						<div className="flex items-center gap-2 flex-shrink-0">
							{/* Collapse Toggle Button - Desktop Only */}
							<motion.button
								whileHover={{ scale: 1.1 }}
								whileTap={{ scale: 0.95 }}
								onClick={toggleCollapse}
								className="p-2 hover:bg-gray-100 rounded-lg transition-colors hidden lg:flex dark:hover:bg-gray-800"
								title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
							>
								<ChevronLeft
									size={20}
									className={`text-gray-600 dark:text-gray-300 transition-transform duration-300 ${
										isCollapsed ? "rotate-180" : ""
									}`}
								/>
							</motion.button>

							{/* Close Button - Mobile Only */}
							<motion.button
								whileHover={{ scale: 1.1 }}
								whileTap={{ scale: 0.95 }}
								onClick={onSidebarClose}
								className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 lg:hidden dark:hover:bg-gray-800"
							>
								<X size={20} className="text-gray-600 dark:text-gray-300" />
							</motion.button>
						</div>
					</div>
				</div>

				{/* Menu Items */}
				<nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
					{menuItems.map((item) => {
						const Icon = item.icon;
						const isActive = pathname === item.href;

						return (
							<Link key={item.id} href={item.href}>
								<motion.div
									onClick={() => onSidebarClose()}
									whileHover={isCollapsed ? {} : { x: 5 }}
									className={`w-full flex items-center ${
										isCollapsed ? "justify-center px-2" : "gap-3 px-4"
									} py-3 rounded-lg transition-all duration-200 group relative cursor-pointer ${
										isActive
											? "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-200 dark:from-green-900/20 dark:to-emerald-900/20 dark:border-green-700"
											: "hover:bg-gray-100 dark:hover:bg-gray-800"
									}`}
									title={isCollapsed ? item.label : undefined}
								>
									{/* Active indicator */}
									{isActive && !isCollapsed && (
										<motion.div
											layoutId="activeIndicator"
											className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-green-500 to-emerald-500 rounded-r-lg"
										/>
									)}

									<Icon
										size={18}
										className={`flex-shrink-0 transition-colors ${
											isActive
												? "text-green-600 dark:text-green-400"
												: "text-gray-600 group-hover:text-green-600 dark:text-gray-300 dark:group-hover:text-green-400"
										}`}
									/>

									<AnimatePresence mode="wait">
										{!isCollapsed && (
											<motion.div
												initial={{ opacity: 0, width: 0 }}
												animate={{ opacity: 1, width: "auto" }}
												exit={{ opacity: 0, width: 0 }}
												transition={{ duration: 0.2 }}
												className="flex-1 text-left overflow-hidden"
											>
												<span
													className={`text-xs font-semibold transition-colors whitespace-nowrap ${
														isActive
															? "text-gray-900 dark:text-gray-100"
															: "text-gray-700 group-hover:text-gray-900 dark:text-gray-300 dark:group-hover:text-gray-100"
													}`}
												>
													{item.label}
												</span>
											</motion.div>
										)}
									</AnimatePresence>

									{isActive && !isCollapsed && (
										<motion.div
											initial={{ x: -10, opacity: 0 }}
											animate={{ x: 0, opacity: 1 }}
											exit={{ x: -10, opacity: 0 }}
											transition={{ delay: 0.1 }}
										>
											<ChevronRight
												size={16}
												className="text-green-600 dark:text-green-400"
											/>
										</motion.div>
									)}
								</motion.div>
							</Link>
						);
					})}
				</nav>

				{/* Logout */}
				<div className="p-3 border-t border-gray-200 space-y-2 dark:border-gray-800">
					<motion.button
						onClick={onLogout}
						whileHover={isCollapsed ? {} : { x: 5 }}
						className={`w-full flex items-center ${
							isCollapsed ? "justify-center px-2" : "gap-3 px-4"
						} py-3 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all group dark:text-gray-300 dark:hover:bg-red-900/20 dark:hover:text-red-400`}
						title={isCollapsed ? "Logout" : undefined}
					>
						<LogOut size={18} className="flex-shrink-0" />
						<AnimatePresence mode="wait">
							{!isCollapsed && (
								<motion.span
									initial={{ opacity: 0, width: 0 }}
									animate={{ opacity: 1, width: "auto" }}
									exit={{ opacity: 0, width: 0 }}
									transition={{ duration: 0.2 }}
									className="text-xs font-semibold whitespace-nowrap overflow-hidden"
								>
									Logout
								</motion.span>
							)}
						</AnimatePresence>
					</motion.button>
				</div>
			</motion.div>
		</>
	);
}
