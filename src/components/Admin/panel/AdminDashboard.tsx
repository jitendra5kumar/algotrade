// @ts-nocheck
"use client";

import { motion } from "framer-motion";
import {
	Activity,
	ArrowDownRight,
	ArrowUpRight,
	DollarSign,
	TrendingUp,
	Users,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function AdminDashboard() {
	const [stats, setStats] = useState({
		totalUsers: 0,
		activeStrategies: 0,
		totalRevenue: 0,
		activeTraders: 0,
	});

	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchDashboardStats();
	}, []);

	const fetchDashboardStats = async () => {
		try {
			const { getDashboardStats } = await import("@/lib/admin-api");
			const response = await getDashboardStats();

			if (response.success) {
				const data = response.data;
				setStats({
					totalUsers: data.totalUsers || 0,
					activeStrategies: data.activeStrategies || 0,
					totalRevenue: data.totalRevenue || 0,
					activeTraders: data.activeTraders || 0,
				});
			}
		} catch (error) {
			console.error("Error fetching stats:", error);
		} finally {
			setLoading(false);
		}
	};

	const statsCards = [
		{
			title: "Total Users",
			value: stats.totalUsers,
			icon: Users,
			color: "from-blue-500 to-blue-600",
			change: "+12.5%",
			isPositive: true,
		},
		{
			title: "Active Strategies",
			value: stats.activeStrategies,
			icon: TrendingUp,
			color: "from-green-500 to-green-600",
			change: "+8.2%",
			isPositive: true,
		},
		{
			title: "Total Revenue",
			value: `₹${stats.totalRevenue.toLocaleString()}`,
			icon: DollarSign,
			color: "from-purple-500 to-purple-600",
			change: "+15.3%",
			isPositive: true,
		},
		{
			title: "Active Traders",
			value: stats.activeTraders,
			icon: Activity,
			color: "from-orange-500 to-orange-600",
			change: "-2.1%",
			isPositive: false,
		},
	];

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="w-12 h-12 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin"></div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard Overview</h1>
				<p className="text-gray-600 dark:text-gray-400 mt-1">Welcome back, Admin</p>
			</div>

			{/* Stats Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				{statsCards.map((stat, index) => (
					<motion.div
						key={stat.title}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: index * 0.1 }}
						className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-800"
					>
						<div className="flex items-start justify-between">
							<div>
								<p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">
									{stat.title}
								</p>
								<h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
									{stat.value}
								</h3>
								<div className="flex items-center gap-1 mt-2">
									{stat.isPositive ? (
										<ArrowUpRight className="w-4 h-4 text-green-500" />
									) : (
										<ArrowDownRight className="w-4 h-4 text-red-500" />
									)}
									<span
										className={`text-sm font-medium ${stat.isPositive ? "text-green-500" : "text-red-500"}`}
									>
										{stat.change}
									</span>
								</div>
							</div>
							<div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
								<stat.icon className="w-6 h-6 text-white" />
							</div>
						</div>
					</motion.div>
				))}
			</div>

			{/* Recent Activity */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.4 }}
				className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-800"
			>
				<h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
					Recent Activity
				</h2>
				<div className="space-y-4">
					{[1, 2, 3, 4, 5].map((item) => (
						<div
							key={item}
							className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl"
						>
							<div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
								<Users className="w-5 h-5 text-white" />
							</div>
							<div className="flex-1">
								<p className="text-gray-900 dark:text-gray-100 font-medium">
									New user registration
								</p>
								<p className="text-gray-500 dark:text-gray-400 text-sm">
									user@example.com joined the platform
								</p>
							</div>
							<span className="text-gray-400 dark:text-gray-500 text-sm">2 mins ago</span>
						</div>
					))}
				</div>
			</motion.div>
		</div>
	);
}
