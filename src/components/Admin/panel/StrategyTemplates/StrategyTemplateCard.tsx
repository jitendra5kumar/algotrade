"use client";

import { motion } from "framer-motion";
import {
	Copy,
	Edit,
	Eye,
	EyeOff,
	Trash2,
	TrendingUp,
	Zap,
} from "lucide-react";
import { StrategyTemplate } from "./types";

interface StrategyTemplateCardProps {
	template: StrategyTemplate;
	onEdit: (template: StrategyTemplate) => void;
	onDelete: (id: string, name: string) => void;
	onClone: (id: string, name: string) => void;
	onToggleVisibility: (template: StrategyTemplate) => void;
}

export default function StrategyTemplateCard({
	template,
	onEdit,
	onDelete,
	onClone,
	onToggleVisibility,
}: StrategyTemplateCardProps) {
	const indicatorCount = template.indicators?.enabled?.length || 0;
	const usageCount = template.usageCount || 0;

	const getTypeColor = (type: string) => {
		switch (type) {
			case "scalping":
				return "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800";
			case "trend following":
				return "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800";
			default:
				return "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800";
		}
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			whileHover={{ y: -4 }}
			transition={{ type: "spring", stiffness: 300, damping: 30 }}
			className="relative bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden hover:border-emerald-300 dark:hover:border-emerald-600 transition-all duration-300 shadow-sm hover:shadow-lg group"
		>
			{/* Status Indicator */}
			<div
				className={`absolute top-0 right-0 w-1 h-16 transition-all ${
					template.isVisibleToUsers
						? "bg-gradient-to-b from-emerald-500 to-emerald-400"
						: "bg-gradient-to-b from-gray-400 to-gray-300"
				}`}
			/>

			{/* Header Section */}
			<div className="p-6">
				<div className="flex items-start justify-between mb-3">
					<div className="flex-1 pr-4">
						<div className="flex items-center gap-2 mb-1">
							<h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
								{template.name}
							</h3>
							{usageCount > 0 && (
								<div className="flex items-center gap-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-900 rounded-full">
									<Zap className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
									<span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
										{usageCount}
									</span>
								</div>
							)}
						</div>
						<p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
							{template.description || "No description provided"}
						</p>
					</div>
				</div>

				{/* Type and Tags Badges */}
				<div className="flex flex-wrap gap-2 mb-4">
					<span
						className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${getTypeColor(template.tags || "normal")} transition-all`}
					>
						<TrendingUp className="w-3 h-3 mr-1" />
						{template.tags === "scalping"
							? "Scalping"
							: template.tags === "trend following"
								? "Trend Following"
								: "Normal"}
					</span>
					{template.type && (
						<span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
							{template.type}
						</span>
					)}
				</div>

				{/* Indicators Section */}
				{indicatorCount > 0 && (
					<div className="mb-4">
						<p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
							Indicators ({indicatorCount})
						</p>
						<div className="flex flex-wrap gap-1.5">
							{template.indicators?.enabled?.slice(0, 4).map((indicator) => (
								<span
									key={indicator}
									className="inline-flex items-center px-2.5 py-1 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-600 hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors"
								>
									{indicator.toUpperCase()}
								</span>
							))}
							{indicatorCount > 4 && (
								<span className="inline-flex items-center px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-600">
									+{indicatorCount - 4}
								</span>
							)}
						</div>
					</div>
				)}
			</div>

			{/* Action Bar */}
			<div className="px-6 py-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between">
				<div className="flex gap-1">
					<motion.button
						type="button"
						whileHover={{ scale: 1.1 }}
						whileTap={{ scale: 0.95 }}
						onClick={() => onEdit(template)}
						className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg transition-all"
						title="Edit template"
					>
						<Edit className="w-4 h-4" />
					</motion.button>

					<motion.button
						type="button"
						whileHover={{ scale: 1.1 }}
						whileTap={{ scale: 0.95 }}
						onClick={() => onToggleVisibility(template)}
						className={`p-2 rounded-lg transition-all ${
							template.isVisibleToUsers
								? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
								: "text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700"
						}`}
						title={
							template.isVisibleToUsers
								? "Hide from users"
								: "Show to users"
						}
					>
						{template.isVisibleToUsers ? (
							<Eye className="w-4 h-4" />
						) : (
							<EyeOff className="w-4 h-4" />
						)}
					</motion.button>

					<motion.button
						type="button"
						whileHover={{ scale: 1.1 }}
						whileTap={{ scale: 0.95 }}
						onClick={() => onClone(template._id, template.name)}
						className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all"
						title="Clone template"
					>
						<Copy className="w-4 h-4" />
					</motion.button>

					<motion.button
						type="button"
						whileHover={{ scale: 1.1 }}
						whileTap={{ scale: 0.95 }}
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							onDelete(template._id, template.name);
						}}
						className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all"
						title="Delete template"
					>
						<Trash2 className="w-4 h-4" />
					</motion.button>
				</div>

				{/* Visibility Status */}
				<div className="flex items-center gap-2">
					<div className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
					<span className="text-xs font-medium text-gray-600 dark:text-gray-400">
						{template.isVisibleToUsers ? "Active" : "Hidden"}
					</span>
				</div>
			</div>
		</motion.div>
	);
}