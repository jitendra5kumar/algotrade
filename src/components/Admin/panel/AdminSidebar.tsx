// @ts-nocheck
"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	Activity,
	Bell,
	Database,
	Layers,
	LayoutDashboard,
	LogOut,
	Megaphone,
	Menu,
	MessageCircle,
	Settings,
	ShieldCheck,
	TrendingUp,
	Users,
	X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-hot-toast";

export default function AdminSidebar({ activeTab }) {
	const router = useRouter();
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	const menuItems = [
		{
			id: "dashboard",
			label: "Dashboard",
			icon: LayoutDashboard,
			color: "from-blue-500 to-blue-600",
			path: "/admin/dashboard",
		},
		{
			id: "users",
			label: "User Management",
			icon: Users,
			color: "from-green-500 to-green-600",
			path: "/admin/users",
		},
		{
			id: "strategies",
			label: "Strategy Monitor",
			icon: TrendingUp,
			color: "from-purple-500 to-purple-600",
			path: "/admin/strategies",
		},
		{
			id: "strategy-management",
			label: "Strategy Templates",
			icon: Layers,
			color: "from-indigo-500 to-indigo-600",
			path: "/admin/strategy-management",
		},
		{
			id: "instruments",
			label: "Instruments",
			icon: Database,
			color: "from-cyan-500 to-cyan-600",
			path: "/admin/instruments",
		},
		{
			id: "trades",
			label: "Trade History",
			icon: Activity,
			color: "from-orange-500 to-orange-600",
			path: "/admin/trades",
		},
		{
			id: "chats",
			label: "Support Chats",
			icon: MessageCircle,
			color: "from-blue-500 to-blue-600",
			path: "/admin/chats",
		},
		{
			id: "broadcast",
			label: "Broadcast",
			icon: Megaphone,
			color: "from-purple-500 to-purple-600",
			path: "/admin/broadcast",
		},
	];

	const handleLogout = () => {
		localStorage.removeItem("adminToken");
		localStorage.removeItem("adminUser");
		toast.success("Logged out successfully");
		router.push("/admin/login");
	};

	const handleMenuClick = (path) => {
		router.push(path);
		setIsMobileMenuOpen(false);
	};

	return (
		<>
			{/* Mobile Menu Button */}
			<button
				type="button"
				onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
				className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
			>
				{isMobileMenuOpen ? (
					<X className="w-6 h-6 text-gray-900 dark:text-gray-100" />
				) : (
					<Menu className="w-6 h-6 text-gray-900 dark:text-gray-100" />
				)}
			</button>

			{/* Overlay */}
			<AnimatePresence>
				{isMobileMenuOpen && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={() => setIsMobileMenuOpen(false)}
						className="lg:hidden fixed inset-0 bg-black/50 z-40"
					/>
				)}
			</AnimatePresence>

			{/* Sidebar */}
			<aside
				className={`
          fixed
          top-0 left-0 h-screen w-72 
          bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900
          border-r border-gray-700
          z-40
          transform transition-transform duration-300
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
			>
				<div className="flex flex-col h-full p-6 overflow-y-auto">
					{/* Logo */}
					<div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-700">
						<div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
							<ShieldCheck className="w-6 h-6 text-white" />
						</div>
						<div>
							<h2 className="text-xl font-bold text-white">Admin Panel</h2>
							<p className="text-sm text-gray-400">Control Center</p>
						</div>
					</div>

					{/* Menu Items */}
					<nav className="flex-1 space-y-2">
						{menuItems.map((item) => (
							<motion.button
								key={item.id}
								whileHover={{ scale: 1.02, x: 4 }}
								whileTap={{ scale: 0.98 }}
								onClick={() => handleMenuClick(item.path)}
								className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl
                  transition-all duration-300
                  ${
										activeTab === item.id
											? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg"
											: "text-gray-400 hover:bg-gray-800 hover:text-white"
									}
                `}
							>
								<item.icon className="w-5 h-5" />
								<span className="font-medium">{item.label}</span>
							</motion.button>
						))}
					</nav>

					{/* Logout Button */}
					<motion.button
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
						onClick={handleLogout}
						className="w-full flex items-center gap-3 px-4 py-3 rounded-xl
              bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300
              border border-red-500/20 transition-all duration-300"
					>
						<LogOut className="w-5 h-5" />
						<span className="font-medium">Logout</span>
					</motion.button>
				</div>
			</aside>
		</>
	);
}
