"use client";

import { motion } from "framer-motion";
import { Search, X } from "lucide-react";

interface StrategyTemplateFiltersProps {
	searchQuery: string;
	onSearchChange: (query: string) => void;
	filter: string;
	onFilterChange: (filter: string) => void;
}

export default function StrategyTemplateFilters({
	searchQuery,
	onSearchChange,
	filter,
	onFilterChange,
}: StrategyTemplateFiltersProps) {
	const filters = [
		{ label: "All Templates", value: "ALL" },
		{ label: "My Templates", value: "CUSTOM" },
		{ label: "Active Only", value: "ACTIVE" },
	];

	return (
		<motion.div
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center"
		>
			{/* Search Input */}
			<div className="flex-1 relative group">
				<div className="absolute left-0 top-0 bottom-0 flex items-center pl-4 pointer-events-none">
					<Search className="w-5 h-5 text-gray-400 dark:text-gray-500 group-focus-within:text-emerald-500 dark:group-focus-within:text-emerald-400 transition-colors" />
				</div>

				<input
					type="text"
					placeholder="Search templates by name or indicators..."
					value={searchQuery}
					onChange={(e) => onSearchChange(e.target.value)}
					className="w-full pl-11 pr-10 py-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent transition-all"
				/>

				{/* Clear Button */}
				{searchQuery && (
					<motion.button
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.8 }}
						type="button"
						onClick={() => onSearchChange("")}
						className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
						title="Clear search"
					>
						<X className="w-4 h-4" />
					</motion.button>
				)}
			</div>

			{/* Filter Buttons */}
			<div className="flex gap-2 bg-gray-100 dark:bg-slate-800 p-1 rounded-lg border border-gray-200 dark:border-slate-700">
				{filters.map((f) => (
					<motion.button
						key={f.value}
						type="button"
						onClick={() => onFilterChange(f.value)}
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
						className={`px-4 py-2.5 rounded-md font-medium text-sm transition-all duration-200 whitespace-nowrap ${
							filter === f.value
								? "bg-gradient-to-r from-emerald-600 to-green-600 dark:from-emerald-500 dark:to-emerald-600 text-white shadow-lg shadow-emerald-500/30 dark:shadow-emerald-600/30"
								: "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-slate-700"
						}`}
					>
						<motion.span
							layout
							className="flex items-center gap-1.5"
						>
							{f.label}
						</motion.span>
					</motion.button>
				))}
			</div>
		</motion.div>
	);
}