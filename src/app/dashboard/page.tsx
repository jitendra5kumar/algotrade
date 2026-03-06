// @ts-nocheck
"use client";

import { motion } from "framer-motion";
import { 
	TrendingUp, 
	Zap, 
	BarChart3, 
	Sparkles, 
	ArrowRight, 
	Activity,
	Clock,
	Target,
	Rocket,
	ChevronRight
} from "lucide-react";
import { useEffect, useState } from "react";
import { getVisibleTemplates } from "@/lib/template-api";

interface StrategyTemplate {
	_id?: string;
	name?: string;
	description?: string;
	type?: string;
	usageCount?: number;
	lastUsedAt?: Date;
	indicators?: {
		enabled?: string[];
		configurations?: Record<string, unknown>;
	};
	isActive?: boolean;
	isVisibleToUsers?: boolean;
	performanceStats?: {
		averagePnL: number;
		successRate: number;
		totalTrades: number;
	};
}

export default function DashboardHome() {
	const [templates, setTemplates] = useState<StrategyTemplate[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchTemplates = async () => {
			try {
				const response = await getVisibleTemplates();
				if (response.success && response.data) {
					setTemplates(response.data);
				}
			} catch (error) {
				console.error('Error fetching templates:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchTemplates();
	}, []);

	// Calculate overall stats from all templates
	const overallStats = templates.reduce((acc, template) => {
		return {
			totalUsage: acc.totalUsage + (template.usageCount || 0),
			totalTemplates: acc.totalTemplates + 1,
		};
	}, { totalUsage: 0, totalTemplates: 0 });

	const activeTemplates = templates.filter(t => t.isActive && t.isVisibleToUsers).length;
	const avgUsage = overallStats.totalTemplates > 0 
		? Math.round(overallStats.totalUsage / overallStats.totalTemplates) 
		: 0;

	// Stats cards data
	const statsCards = [
		{
			id: "total-templates",
			label: "Total Templates",
			value: overallStats.totalTemplates.toString(),
			icon: BarChart3,
			color: "from-blue-500 to-cyan-500",
			bgColor: "from-blue-50 to-cyan-50",
			borderColor: "border-blue-200",
			textColor: "text-blue-600",
			change: "+12%",
			isPositive: true,
		},
		{
			id: "total-usage",
			label: "Total Usage",
			value: overallStats.totalUsage.toString(),
			icon: Activity,
			color: "from-green-500 to-emerald-500",
			bgColor: "from-green-50 to-emerald-50",
			borderColor: "border-green-200",
			textColor: "text-green-600",
			change: "+8%",
			isPositive: true,
		},
		{
			id: "active-templates",
			label: "Active Templates",
			value: activeTemplates.toString(),
			icon: Target,
			color: "from-purple-500 to-pink-500",
			bgColor: "from-purple-50 to-pink-50",
			borderColor: "border-purple-200",
			textColor: "text-purple-600",
			change: "+5%",
			isPositive: true,
		},
		{
			id: "avg-usage",
			label: "Avg Usage",
			value: avgUsage.toString(),
			icon: TrendingUp,
			color: "from-orange-500 to-red-500",
			bgColor: "from-orange-50 to-red-50",
			borderColor: "border-orange-200",
			textColor: "text-orange-600",
			change: "+15%",
			isPositive: true,
		},
	];

	const colorSchemes = [
		{ 
			bg: 'from-emerald-50 via-green-50 to-teal-50', 
			border: 'border-emerald-200 hover:border-emerald-400', 
			badge: 'bg-gradient-to-r from-emerald-500 to-teal-500', 
			button: 'from-emerald-500 to-teal-600', 
			buttonText: 'text-emerald-600', 
			buttonBorder: 'border-emerald-500', 
			buttonHover: 'hover:bg-emerald-50', 
			icon: 'text-emerald-600',
			iconBg: 'from-emerald-500 to-teal-600',
			dark: {
				bg: 'dark:from-emerald-950/30 dark:via-green-950/20 dark:to-teal-950/30',
				border: 'dark:border-emerald-800 dark:hover:border-emerald-600',
			}
		},
		{ 
			bg: 'from-blue-50 via-cyan-50 to-indigo-50', 
			border: 'border-blue-200 hover:border-blue-400', 
			badge: 'bg-gradient-to-r from-blue-500 to-indigo-500', 
			button: 'from-blue-500 to-indigo-600', 
			buttonText: 'text-blue-600', 
			buttonBorder: 'border-blue-500', 
			buttonHover: 'hover:bg-blue-50', 
			icon: 'text-blue-600',
			iconBg: 'from-blue-500 to-indigo-600',
			dark: {
				bg: 'dark:from-blue-950/30 dark:via-cyan-950/20 dark:to-indigo-950/30',
				border: 'dark:border-blue-800 dark:hover:border-blue-600',
			}
		},
		{ 
			bg: 'from-purple-50 via-pink-50 to-rose-50', 
			border: 'border-purple-200 hover:border-purple-400', 
			badge: 'bg-gradient-to-r from-purple-500 to-pink-500', 
			button: 'from-purple-500 to-pink-600', 
			buttonText: 'text-purple-600', 
			buttonBorder: 'border-purple-500', 
			buttonHover: 'hover:bg-purple-50', 
			icon: 'text-purple-600',
			iconBg: 'from-purple-500 to-pink-600',
			dark: {
				bg: 'dark:from-purple-950/30 dark:via-pink-950/20 dark:to-rose-950/30',
				border: 'dark:border-purple-800 dark:hover:border-purple-600',
			}
		},
	];

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.5 }}
			className="min-h-screen w-full bg-[#f9fafb] dark:bg-gray-950 relative p-4 sm:p-6 lg:p-8"
		>
			{/* Diagonal Fade Center Grid Background - Light Mode */}
			<div
				className="absolute inset-0 z-0 dark:hidden opacity-30"
				style={{
					backgroundImage: `
						linear-gradient(to right, #e5e7eb 1px, transparent 1px),
						linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
					`,
					backgroundSize: "32px 32px",
					WebkitMaskImage:
						"radial-gradient(ellipse 60% 60% at 50% 50%, #000 30%, transparent 70%)",
					maskImage:
						"radial-gradient(ellipse 60% 60% at 50% 50%, #000 30%, transparent 70%)",
				}}
			/>
			{/* Diagonal Fade Center Grid Background - Dark Mode */}
			<div
				className="absolute inset-0 z-0 hidden dark:block opacity-20"
				style={{
					backgroundImage: `
						linear-gradient(to right, #4b5563 1px, transparent 1px),
						linear-gradient(to bottom, #4b5563 1px, transparent 1px)
					`,
					backgroundSize: "32px 32px",
					WebkitMaskImage:
						"radial-gradient(ellipse 60% 60% at 50% 50%, #000 30%, transparent 70%)",
					maskImage:
						"radial-gradient(ellipse 60% 60% at 50% 50%, #000 30%, transparent 70%)",
				}}
			/>
			<div className="relative z-10">
			{/* Hero Section */}
			<motion.div
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6 }}
				className="mb-8 lg:mb-12"
			>
				<div className="mb-5">
					<div>
						<h1 className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent dark:from-gray-100 dark:via-gray-200 dark:to-gray-100 mb-1.5">
							Dashboard
						</h1>
					</div>
				</div>

				{/* Stats Grid - Hidden on Mobile */}
				<div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
					{statsCards.map((stat, index) => (
						<motion.div
							key={stat.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.1 }}
							whileHover={{ y: -4, scale: 1.02 }}
							className={`relative overflow-hidden bg-gradient-to-br ${stat.bgColor} dark:from-gray-800 dark:to-gray-900 border-2 ${stat.borderColor} dark:border-gray-700 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all group`}
						>
							{/* Background Pattern */}
							<div className="absolute inset-0 opacity-5 dark:opacity-10">
								<div className={`absolute inset-0 bg-gradient-to-br ${stat.color}`} />
							</div>
							
							<div className="relative z-10">
								<div className="flex items-start justify-between mb-3">
									<div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}>
										<stat.icon className="w-5 h-5 text-white" />
									</div>
									<div className={`px-2 py-1 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm ${stat.isPositive ? 'text-green-600' : 'text-red-600'} text-xs font-bold`}>
										{stat.change}
									</div>
								</div>
								<p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide">
									{stat.label}
								</p>
								<p className={`text-2xl font-black ${stat.textColor} dark:text-gray-100`}>
									{stat.value}
								</p>
							</div>
						</motion.div>
					))}
				</div>
			</motion.div>

			{/* Template Cards Section */}
			<div className="mb-8">
				<div className="flex items-center justify-between mb-5">
					<div>
						<h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 mb-1">
							Strategy Templates
						</h2>
						<p className="text-xs text-gray-600 dark:text-gray-400">
							Choose from our curated collection of trading strategies
						</p>
					</div>
				</div>

				{loading ? (
					<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
						{[1, 2, 3].map((i) => (
							<div
								key={i}
								className="h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse"
							/>
						))}
					</div>
				) : templates.length === 0 ? (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className="col-span-full text-center py-12 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700"
					>
						<Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-3" />
						<div className="text-gray-600 dark:text-gray-400 font-medium mb-2 text-sm">
							No strategy templates found
						</div>
						<p className="text-xs text-gray-500 dark:text-gray-500">
							Admin will create templates for you
						</p>
					</motion.div>
				) : (
					<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
						{templates.map((template, index) => {
							const colorScheme = colorSchemes[index % colorSchemes.length];
							const icons = [Zap, TrendingUp, BarChart3];
							const IconComponent = icons[index % icons.length];
							
							return (
								<motion.div
									key={template._id || index}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.1 }}
									whileHover={{ y: -8, scale: 1.02 }}
									className={`relative overflow-hidden bg-gradient-to-br ${colorScheme.bg} ${colorScheme.dark.bg} border-2 ${colorScheme.border} ${colorScheme.dark.border} rounded-3xl p-5 lg:p-6 transition-all shadow-xl hover:shadow-2xl group`}
								>
									{/* Decorative Elements */}
									<div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-3xl" />
									<div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-white/10 to-transparent rounded-full blur-2xl" />

									<div className="relative z-10">
										{/* Header */}
										<div className="flex items-start justify-between mb-5">
											<div className="flex items-center gap-3">
												<div className={`w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br ${colorScheme.iconBg} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
													<IconComponent
														size={24}
														className="text-white"
														strokeWidth={2.5}
													/>
												</div>
												<div>
													<h3 className="text-lg lg:text-xl font-black text-gray-900 dark:text-gray-100 mb-1">
														{template.name || 'Strategy Template'}
													</h3>
													<p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
														{template.type || 'Trading Strategy'}
													</p>
												</div>
											</div>
											<div className={`px-2.5 py-1 ${colorScheme.badge} text-white text-xs font-bold rounded-full shadow-md`}>
												{template.type?.toUpperCase() || 'TEMPLATE'}
											</div>
										</div>

										{/* Stats Grid */}
										<div className="grid grid-cols-3 gap-2.5 mb-5">
											<div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-2.5 lg:p-3 border border-white/50 dark:border-gray-700/50">
												<p className="text-[10px] text-gray-600 dark:text-gray-400 font-semibold mb-1 uppercase tracking-wide">
													Usage
												</p>
												<p className={`text-lg lg:text-xl font-black ${colorScheme.textColor} dark:text-gray-100`}>
													{template.usageCount || 0}
												</p>
											</div>
											<div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-2.5 lg:p-3 border border-white/50 dark:border-gray-700/50">
												<p className="text-[10px] text-gray-600 dark:text-gray-400 font-semibold mb-1 uppercase tracking-wide">
													Indicators
												</p>
												<p className={`text-lg lg:text-xl font-black ${colorScheme.textColor} dark:text-gray-100`}>
													{template.indicators?.enabled?.length || 0}
												</p>
											</div>
											<div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-2.5 lg:p-3 border border-white/50 dark:border-gray-700/50">
												<p className="text-[10px] text-gray-600 dark:text-gray-400 font-semibold mb-1 uppercase tracking-wide">
													Type
												</p>
												<p className="text-lg lg:text-xl font-black text-gray-900 dark:text-gray-100">
													{template.type?.[0]?.toUpperCase() || 'N/A'}
												</p>
											</div>
										</div>

										{/* Description */}
										<div className="mb-5">
											<p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2 font-medium">
												{template.description || 'No description available'}
											</p>
										</div>

										{/* Footer */}
										<div className="flex items-center justify-between pt-3 border-t border-white/30 dark:border-gray-700/30">
											{template.lastUsedAt && (
												<div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
													<Clock size={12} />
													<span className="font-medium">
														{new Date(template.lastUsedAt).toLocaleDateString()}
													</span>
												</div>
											)}
											<motion.button
												whileHover={{ x: 4 }}
												whileTap={{ scale: 0.95 }}
												className={`ml-auto flex items-center gap-2 px-3 py-2 bg-gradient-to-r ${colorScheme.button} text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all`}
											>
												<span>View Details</span>
												<ChevronRight size={14} />
											</motion.button>
										</div>
									</div>
								</motion.div>
							);
						})}
					</div>
				)}
			</div>

			{/* Quick Actions */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.4 }}
				className="bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-800 rounded-3xl p-5 lg:p-6 shadow-xl"
			>
				<h2 className="text-lg lg:text-xl font-black text-gray-900 dark:text-gray-100 mb-5">
					Quick Actions
				</h2>
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
					{[
						{ label: 'Create Strategy', icon: Rocket, color: 'from-blue-500 to-indigo-600' },
						{ label: 'View Analytics', icon: BarChart3, color: 'from-green-500 to-emerald-600' },
						{ label: 'Manage Templates', icon: Sparkles, color: 'from-purple-500 to-pink-600' },
						{ label: 'Settings', icon: Target, color: 'from-orange-500 to-red-600' },
					].map((action, index) => (
						<motion.button
							key={action.label}
							whileHover={{ y: -4, scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
							className={`p-3 bg-gradient-to-br ${action.color} rounded-2xl text-white font-bold text-xs shadow-lg hover:shadow-xl transition-all flex flex-col items-center gap-2`}
						>
							<action.icon size={20} />
							<span>{action.label}</span>
						</motion.button>
					))}
				</div>
			</motion.div>
			</div>
		</motion.div>
	);
}
