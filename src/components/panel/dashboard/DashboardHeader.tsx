"use client";

import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Menu, UserCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import NotificationBell from "../NotificationBell";

interface DashboardHeaderProps {
	userName: string;
	onMenuClick: () => void;
	onLogout: () => void;
}

export default function DashboardHeader({
	userName,
	onMenuClick,
	onLogout,
}: DashboardHeaderProps) {
	const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	// Close menu when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setIsProfileMenuOpen(false);
			}
		};

		if (isProfileMenuOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isProfileMenuOpen]);

	return (
		<div className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4 flex items-center justify-between dark:bg-gray-900 dark:border-gray-800 relative">
			{/* Mobile Menu Button */}
			<motion.button
				whileHover={{ scale: 1.1 }}
				whileTap={{ scale: 0.95 }}
				onClick={onMenuClick}
				className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors dark:hover:bg-gray-800"
			>
				<Menu size={20} className="text-gray-600 dark:text-gray-300" />
			</motion.button>

			{/* User Info */}
			<div className="flex items-center gap-3 ml-auto">
				<div className="hidden sm:block px-3 py-1.5 bg-green-100 text-green-700 rounded-lg font-semibold text-xs dark:bg-green-900/30 dark:text-green-300">
					Welcome back, {userName}!
				</div>
				<NotificationBell />
				<div className="relative" ref={menuRef}>
					<motion.button
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
						className="md:hidden w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center overflow-hidden p-0.5"
					>
						<UserCircle size={20} className="text-white flex-shrink-0 ml-0.5" />
					</motion.button>
					<button
						onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
						className="hidden md:block w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center overflow-hidden p-0.5 hover:opacity-90 transition-opacity"
					>
						<UserCircle size={20} className="text-white flex-shrink-0 ml-0.5" />
					</button>

					{/* Mobile Profile Dropdown */}
					<AnimatePresence>
						{isProfileMenuOpen && (
							<motion.div
								initial={{ opacity: 0, y: -10, scale: 0.95 }}
								animate={{ opacity: 1, y: 0, scale: 1 }}
								exit={{ opacity: 0, y: -10, scale: 0.95 }}
								transition={{ duration: 0.2 }}
								className="absolute right-0 top-full mt-2 w-40 bg-white border-2 border-gray-200 rounded-xl shadow-lg overflow-hidden dark:bg-gray-950 dark:border-gray-800 z-50"
							>
								<motion.button
									whileHover={{ backgroundColor: "#f3f4f6" }}
									whileTap={{ scale: 0.98 }}
									onClick={() => {
										onLogout();
										setIsProfileMenuOpen(false);
									}}
									className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-red-400 transition-colors"
								>
									<LogOut size={16} />
									Logout
								</motion.button>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</div>
		</div>
	);
}
