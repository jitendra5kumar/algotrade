// @ts-nocheck
"use client";

import { motion } from "framer-motion";
import {
	Activity,
	AlertCircle,
	Calendar,
	Clock,
	Edit2,
	Info,
	LogOut,
	Mail,
	MapPin,
	Phone,
	Settings,
	Shield,
	TrendingUp,
	User,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { getUser } from "@/lib/auth-api";

export default function MyAccount() {
	const [isEditing, setIsEditing] = useState(false);
	const [userDetails, setUserDetails] = useState({
		name: "User",
		email: "user@example.com",
		phone: "Not Available",
		location: "India",
		joinDate: "N/A",
		accountType: "Standard",
		kycStatus: "Pending",
		tradingStatus: "Active",
		totalCapital: "₹0",
		availableBalance: "₹0",
	});

	// Load user details from localStorage
	useEffect(() => {
		const user = getUser();
		if (user) {
			setUserDetails((prev) => ({
				...prev,
				name: user.name || "User",
				email: user.email || "user@example.com",
				phone: user.phone || "Not Available",
				joinDate: user.createdAt
					? new Date(user.createdAt).toLocaleDateString("en-IN", {
							day: "numeric",
							month: "short",
							year: "numeric",
						})
					: "N/A",
			}));
		}
	}, []);

	const [activityLogs, setActivityLogs] = useState([]);
	const [loadingLogs, setLoadingLogs] = useState(true);

	// Load activity logs from API
	useEffect(() => {
		const loadActivityLogs = async () => {
			try {
				const token = localStorage.getItem("accessToken");
				if (!token) {
					console.log("No token found, skipping activity logs");
					setActivityLogs([]);
					setLoadingLogs(false);
					return;
				}

				// Import here to avoid circular dependency
				const { getActivityLogs } = await import("@/lib/activity-api");
				const response = await getActivityLogs(50);

				if (response.success) {
					// Map API logs to component format
					const formattedLogs = response.data.map((log) => ({
						...log,
						icon: getIconForType(log.type),
					}));
					setActivityLogs(formattedLogs);
				} else {
					setActivityLogs([]);
				}
			} catch (error) {
				console.error("Error loading activity logs:", error);
				// Show empty state on error - this is normal if backend isn't ready
				setActivityLogs([]);
			} finally {
				setLoadingLogs(false);
			}
		};

		loadActivityLogs();
	}, []);

	const getIconForType = (type) => {
		switch (type) {
			case "trade":
				return TrendingUp;
			case "login":
				return Shield;
			case "setting":
			case "strategy":
				return Settings;
			case "broker":
				return Activity;
			case "alert":
				return AlertCircle;
			case "info":
				return Info;
			default:
				return Info;
		}
	};

	const getStatusColor = (status) => {
		switch (status) {
			case "success":
				return "bg-green-100 text-green-700 border-green-300";
			case "warning":
				return "bg-yellow-100 text-yellow-700 border-yellow-300";
			case "info":
				return "bg-blue-100 text-blue-700 border-blue-300";
			default:
				return "bg-gray-100 text-gray-700 border-gray-300";
		}
	};

	const getIconBg = (status) => {
		switch (status) {
			case "success":
				return "bg-green-500";
			case "warning":
				return "bg-yellow-500";
			case "info":
				return "bg-blue-500";
			default:
				return "bg-gray-500";
		}
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
			className="p-4 sm:p-6 lg:p-8"
		>
			{/* Header */}
            <div className="mb-5 lg:mb-6">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 mb-1.5 dark:text-gray-100">
					My Account
				</h1>
                <p className="text-xs lg:text-sm text-gray-600 font-medium dark:text-gray-300">
					Manage your profile and view account activity
				</p>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
				{/* Left Side - User Details */}
				<div className="lg:col-span-1 space-y-6">
					{/* Profile Card */}
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: 0.1 }}
                        className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-5 shadow-lg dark:bg-gray-950 dark:border-gray-800"
					>
						{/* Profile Section */}
						<div className="flex items-center gap-3 mb-5">
                            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg flex-shrink-0">
								<User size={24} className="text-white" />
							</div>
							<div className="flex-1 min-w-0">
								<h2 className="text-base font-black text-gray-900 dark:text-gray-100">
									{userDetails.name}
								</h2>
								<span className="inline-block px-2.5 py-0.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full mt-1">
									{userDetails.accountType}
								</span>
							</div>
						</div>

						{/* Action Buttons */}
						<div className="flex gap-2.5 mb-5">
							<motion.button
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
								onClick={() => setIsEditing(!isEditing)}
								className="flex-1 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 hover:shadow-lg transition-all"
							>
								<Edit2 size={14} />
								Edit Profile
							</motion.button>
						</div>

						{/* Details */}
						<div className="space-y-3">
                            <div className="flex items-center gap-2.5 p-2.5 bg-gray-100 rounded-xl dark:bg-gray-900 dark:border dark:border-gray-800">
								<Mail size={16} className="text-green-600 flex-shrink-0" />
								<div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-500 font-medium dark:text-gray-400">Email</p>
                                    <p className="text-xs font-semibold text-gray-900 truncate dark:text-gray-100">
										{userDetails.email}
									</p>
								</div>
							</div>

                            <div className="flex items-center gap-2.5 p-2.5 bg-gray-100 rounded-xl dark:bg-gray-900 dark:border dark:border-gray-800">
								<Phone size={16} className="text-green-600 flex-shrink-0" />
								<div className="flex-1">
                                    <p className="text-xs text-gray-500 font-medium dark:text-gray-400">Phone</p>
                                    <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
										{userDetails.phone}
									</p>
								</div>
							</div>

                            <div className="flex items-center gap-2.5 p-2.5 bg-gray-100 rounded-xl dark:bg-gray-900 dark:border dark:border-gray-800">
								<MapPin size={16} className="text-green-600 flex-shrink-0" />
								<div className="flex-1">
                                    <p className="text-xs text-gray-500 font-medium dark:text-gray-400">Location</p>
                                    <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
										{userDetails.location}
									</p>
								</div>
							</div>

                            <div className="flex items-center gap-2.5 p-2.5 bg-gray-100 rounded-xl dark:bg-gray-900 dark:border dark:border-gray-800">
								<Calendar size={16} className="text-green-600 flex-shrink-0" />
								<div className="flex-1">
                                    <p className="text-xs text-gray-500 font-medium dark:text-gray-400">
										Member Since
									</p>
                                    <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
										{userDetails.joinDate}
									</p>
								</div>
							</div>
						</div>
					</motion.div>
				</div>

				{/* Right Side - Activity Logs */}
				<div className="lg:col-span-2">
					<motion.div
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: 0.2 }}
                        className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-5 shadow-lg dark:bg-gray-950 dark:border-gray-800"
					>
                        <h3 className="text-lg font-black text-gray-900 mb-5 flex items-center gap-2 dark:text-gray-100">
							<Activity size={20} className="text-green-600" />
							Activity Logs
						</h3>

						{/* Activity List */}
						<div className="space-y-3 max-h-[800px] overflow-y-auto pr-2">
							{loadingLogs ? (
                                <div className="flex items-center justify-center py-10">
                                    <div className="text-gray-500 text-sm font-medium dark:text-gray-400">
										Loading activity logs...
									</div>
								</div>
							) : activityLogs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <Activity size={40} className="text-gray-300 mb-2.5" />
                                    <h4 className="text-gray-600 font-black mb-1 text-sm dark:text-gray-300">
										No Activity Yet
									</h4>
                                    <p className="text-gray-500 text-xs dark:text-gray-400">
										Your recent activities will appear here
									</p>
								</div>
							) : (
								activityLogs.map((log, index) => {
									const IconComponent = log.icon;
									return (
										<motion.div
											key={log.id}
											initial={{ opacity: 0, y: 10 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: index * 0.05 }}
                                            className="flex gap-3 p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all border border-gray-200 dark:bg-gray-900 dark:hover:bg-gray-800 dark:border-gray-800"
										>
											{/* Icon */}
											<div
												className={`flex-shrink-0 w-9 h-9 ${getIconBg(log.status)} rounded-full flex items-center justify-center`}
											>
												<IconComponent size={18} className="text-white" />
											</div>

											{/* Content */}
											<div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2 mb-0.5">
                                                    <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">
														{log.title}
													</h4>
                                                    <span className="text-xs text-gray-500 font-medium whitespace-nowrap flex items-center gap-1 dark:text-gray-400">
														<Clock size={11} />
														{log.time}
													</span>
												</div>
                                                <p className="text-xs text-gray-600 font-medium mb-1.5 dark:text-gray-300">
													{log.description}
												</p>
												<span
													className={`inline-block px-2 py-0.5 text-xs font-bold rounded-full border ${getStatusColor(log.status)}`}
												>
													{log.status.charAt(0).toUpperCase() +
														log.status.slice(1)}
												</span>
											</div>
										</motion.div>
									);
								})
							)}
						</div>

						{/* Load More Button */}
                        <motion.button
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
                            className="w-full mt-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition-all dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200"
						>
							Load More Activities
						</motion.button>
					</motion.div>
				</div>
			</div>
		</motion.div>
	);
}
