"use client";

import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Zap } from "lucide-react";
import StrategyCard from "./StrategyCard";
import PerformanceStats from "./PerformanceStats";
import { StrategyCardData } from "./types";

interface DashboardContentProps {
	activeMenu: string;
	menuLabel: string;
}

const strategies: StrategyCardData[] = [
	{
		name: "Go Scalp",
		description: "Quick Profit Strategy",
		winRate: 78,
		todayPnL: "+₹8.5K",
		trades: 24,
		capitalDeployed: "₹50,000",
		avgTradeDuration: "2-5 minutes",
		riskLevel: "Medium",
		riskLevelColor: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
		icon: Zap,
		gradientFrom: "from-green-50",
		gradientTo: "to-emerald-50",
		borderColor: "border-green-200 hover:border-green-400 dark:border-green-800 dark:hover:border-green-600",
		badgeColor: "bg-green-500",
		textColor: "text-green-600 dark:text-green-400",
	},
	{
		name: "Go Money",
		description: "Wealth Builder Strategy",
		winRate: 82,
		todayPnL: "+₹12.3K",
		trades: 16,
		capitalDeployed: "₹1,00,000",
		avgTradeDuration: "15-30 minutes",
		riskLevel: "Low",
		riskLevelColor: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
		icon: TrendingUp,
		gradientFrom: "from-blue-50",
		gradientTo: "to-cyan-50",
		borderColor: "border-blue-200 hover:border-blue-400 dark:border-blue-800 dark:hover:border-blue-600",
		badgeColor: "bg-blue-500",
		textColor: "text-blue-600 dark:text-blue-400",
	},
	{
		name: "Go Trend",
		description: "Trend Following Strategy",
		winRate: 75,
		todayPnL: "+₹15.2K",
		trades: 32,
		capitalDeployed: "₹75,000",
		avgTradeDuration: "30-60 minutes",
		riskLevel: "Medium",
		riskLevelColor: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
		icon: BarChart3,
		gradientFrom: "from-purple-50",
		gradientTo: "to-pink-50",
		borderColor: "border-purple-200 hover:border-purple-400 dark:border-purple-800 dark:hover:border-purple-600",
		badgeColor: "bg-purple-500",
		textColor: "text-purple-600 dark:text-purple-400",
	},
];

const performanceStats = [
	{
		label: "Total Profit",
		value: "₹20,800",
		icon: "💰",
		color: "text-green-600 dark:text-green-400",
	},
	{
		label: "Total Trades",
		value: "40",
		icon: "📊",
		color: "text-blue-600 dark:text-blue-400",
	},
	{
		label: "Win Rate",
		value: "80%",
		icon: "🎯",
		color: "text-purple-600 dark:text-purple-400",
	},
	{
		label: "Active Time",
		value: "6.5 hrs",
		icon: "⏱️",
		color: "text-orange-600 dark:text-orange-400",
	},
];

export default function DashboardContent({
	activeMenu,
	menuLabel,
}: DashboardContentProps) {
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
					{menuLabel || "Dashboard"}
				</h1>
				<p className="text-xs lg:text-sm text-gray-600 font-medium dark:text-gray-300">
					Welcome to your AlgoTrade dashboard
				</p>
			</div>

			{/* Strategy Cards - 3 columns */}
			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
				{strategies.map((strategy, index) => (
					<StrategyCard key={index} strategy={strategy} index={index} />
				))}
			</div>

			{/* Overall Stats - Hidden on Mobile */}
			<div className="hidden md:block">
				<PerformanceStats stats={performanceStats} />
			</div>
		</motion.div>
	);
}

