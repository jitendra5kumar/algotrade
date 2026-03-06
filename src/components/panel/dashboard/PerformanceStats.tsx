"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Stat {
	label: string;
	value: string;
	icon: string;
	color: string;
	trend?: number; // Optional: percentage change (positive/negative)
	comparison?: string; // Optional: "vs yesterday" or similar
}

interface PerformanceStatsProps {
	stats: Stat[];
}

export default function PerformanceStats({ stats }: PerformanceStatsProps) {
	const containerVariants = {
		hidden: { opacity: 0, y: 20 },
		visible: {
			opacity: 1,
			y: 0,
			transition: {
				staggerChildren: 0.1,
				delayChildren: 0.2,
			},
		},
	};

	const itemVariants = {
		hidden: { opacity: 0, y: 10 },
		visible: {
			opacity: 1,
			y: 0,
			transition: { type: "spring", stiffness: 300, damping: 30 },
		},
	};

	// Get color classes based on trend
	const getTrendColor = (trend?: number) => {
		if (!trend) return "";
		return trend > 0
			? "text-emerald-600 dark:text-emerald-400"
			: "text-red-600 dark:text-red-400";
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.3, duration: 0.4 }}
			className="mt-6 lg:mt-8"
		>
			{/* Header */}
			<div className="mb-5">
				<motion.h2
					initial={{ opacity: 0, x: -20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ delay: 0.4 }}
					className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-2"
				>
					<div className="w-1.5 h-7 bg-gradient-to-b from-emerald-500 to-green-600 rounded-full"></div>
					Today&apos;s Performance
				</motion.h2>
				<p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
					Real-time trading metrics
				</p>
			</div>

			{/* Stats Grid */}
			<motion.div
				variants={containerVariants}
				initial="hidden"
				animate="visible"
				className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6"
			>
				{stats.map((stat, idx) => (
					<motion.div
						key={idx}
						variants={itemVariants as any}
						whileHover={{ y: -4, transition: { duration: 0.2 } }}
						className="group relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 rounded-2xl p-4 sm:p-5 border border-gray-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-600 transition-all duration-300 shadow-md hover:shadow-xl overflow-hidden"
					>
						{/* Background Gradient Accent */}
						<div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

						{/* Content */}
						<div className="relative z-10">
							{/* Icon Container */}
							<motion.div
								whileHover={{ rotate: 10, scale: 1.1 }}
								transition={{ type: "spring", stiffness: 400 }}
								className="text-3xl sm:text-4xl mb-2.5 inline-flex p-2.5 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-xl group-hover:shadow-lg transition-shadow"
							>
								{stat.icon}
							</motion.div>

							{/* Label */}
							<p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2 transition-colors group-hover:text-gray-700 dark:group-hover:text-gray-300">
								{stat.label}
							</p>

							{/* Value */}
							<motion.p
								initial={{ opacity: 0, scale: 0.8 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{ delay: 0.5 + idx * 0.1 }}
								className={`text-xl sm:text-2xl lg:text-3xl font-black mb-2 ${stat.color}`}
							>
								{stat.value}
							</motion.p>

							{/* Trend & Comparison */}
							{(stat.trend !== undefined || stat.comparison) && (
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									transition={{ delay: 0.6 + idx * 0.1 }}
									className="flex items-center gap-2 text-xs sm:text-sm"
								>
									{stat.trend !== undefined && (
										<div
											className={`flex items-center gap-1 px-2 py-1 rounded-full ${
												stat.trend > 0
													? "bg-emerald-100 dark:bg-emerald-900/30"
													: "bg-red-100 dark:bg-red-900/30"
											}`}
										>
											{stat.trend > 0 ? (
												<TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
											) : (
												<TrendingDown className="w-3 h-3 text-red-600 dark:text-red-400" />
											)}
											<span
												className={`font-bold ${getTrendColor(stat.trend)}`}
											>
												{stat.trend > 0 ? "+" : ""}
												{stat.trend}%
											</span>
										</div>
									)}
									{stat.comparison && (
										<span className="text-gray-500 dark:text-gray-400">
											{stat.comparison}
										</span>
									)}
								</motion.div>
							)}
						</div>

						{/* Animated Border on Hover */}
						<motion.div
							className="absolute inset-0 border-2 border-transparent rounded-2xl opacity-0 group-hover:opacity-100"
							initial={{ borderColor: "transparent" }}
							whileHover={{
								borderColor: "rgba(16, 185, 129, 0.2)",
								transition: { duration: 0.3 },
							}}
						/>
					</motion.div>
				))}
			</motion.div>

			{/* Summary Footer */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.8 }}
				className="mt-5 px-3 py-2.5 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800/50"
			>
				<p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
					💡 <span className="ml-2">Last updated: Just now</span>
				</p>
			</motion.div>
		</motion.div>
	);
}