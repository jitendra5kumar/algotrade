"use client";

import { motion } from "framer-motion";
import { Filter, Search, X, ChevronDown } from "lucide-react";

interface StrategyFiltersProps {
	searchQuery: string;
	onSearchChange: (query: string) => void;
	filterStatus: string;
	onFilterStatusChange: (status: string) => void;
}

const STATUS_OPTIONS = [
	{ value: "all", label: "All Status", color: "bg-gray-100 dark:bg-gray-800" },
	{
		value: "active",
		label: "Active",
		color: "bg-emerald-100 dark:bg-emerald-900",
	},
	{
		value: "paused",
		label: "Paused",
		color: "bg-amber-100 dark:bg-amber-900",
	},
	{
		value: "inactive",
		label: "Inactive",
		color: "bg-red-100 dark:bg-red-900",
	},
];

export default function StrategyFilters({
	searchQuery,
	onSearchChange,
	filterStatus,
	onFilterStatusChange,
}: StrategyFiltersProps) {
	const selectedStatus = STATUS_OPTIONS.find((opt) => opt.value === filterStatus);

	return (
		<motion.div
			initial={{ opacity: 0, y: -15 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3 }}
			className="bg-gradient-to-br from-white to-gray-50 dark:from-slate-900 dark:to-slate-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-slate-700 backdrop-blur-sm"
		>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				{/* Search Input */}
				<motion.div
					initial={{ opacity: 0, x: -20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ delay: 0.1 }}
					className="relative flex-1 group md:col-span-2"
				>
					<div className="absolute left-0 top-0 bottom-0 flex items-center pl-4 pointer-events-none">
						<Search className="w-5 h-5 text-gray-400 dark:text-gray-500 group-focus-within:text-emerald-500 dark:group-focus-within:text-emerald-400 transition-colors duration-200" />
					</div>
					<input
						type="text"
						placeholder="Search strategies by name, user, or symbol..."
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
						className="w-full pl-12 pr-10 py-3 border-2 border-gray-300 dark:border-slate-600 rounded-xl focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-400/20 focus:outline-none transition-all bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
					/>
					{searchQuery && (
						<motion.button
							initial={{ opacity: 0, scale: 0.8 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.8 }}
							type="button"
							onClick={() => onSearchChange("")}
							className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-all"
							title="Clear search"
						>
							<X className="w-4 h-4" />
						</motion.button>
					)}
				</motion.div>

				{/* Status Filter */}
				<motion.div
					initial={{ opacity: 0, x: 20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ delay: 0.1 }}
					className="relative w-full group"
				>
					<div className="absolute left-0 top-0 bottom-0 flex items-center pl-4 pointer-events-none z-10">
						<Filter className="w-5 h-5 text-gray-400 dark:text-gray-500 group-focus-within:text-emerald-500 dark:group-focus-within:text-emerald-400 transition-colors duration-200" />
					</div>

					<select
						value={filterStatus}
						onChange={(e) => onFilterStatusChange(e.target.value)}
						className="w-full pl-12 pr-10 py-3 border-2 border-gray-300 dark:border-slate-600 rounded-xl focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-400/20 focus:outline-none transition-all appearance-none bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 font-medium cursor-pointer"
					>
						{STATUS_OPTIONS.map((opt) => (
							<option key={opt.value} value={opt.value}>
								{opt.label}
							</option>
						))}
					</select>

					{/* Custom Dropdown Arrow */}
					<div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
						<ChevronDown className="w-5 h-5 text-gray-400 dark:text-gray-500 group-focus-within:text-emerald-500 dark:group-focus-within:text-emerald-400 transition-colors duration-200" />
					</div>
				</motion.div>
			</div>

			{/* Active Filters Display */}
			{(searchQuery || filterStatus !== "all") && (
				<motion.div
					initial={{ opacity: 0, height: 0 }}
					animate={{ opacity: 1, height: "auto" }}
					exit={{ opacity: 0, height: 0 }}
					className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700"
				>
					<div className="flex flex-wrap gap-2 items-center">
						<span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
							Active Filters:
						</span>
						{searchQuery && (
							<motion.div
								initial={{ scale: 0.8, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium"
							>
								<span>Search: &quot;{searchQuery}&quot;</span>
								<button
									onClick={() => onSearchChange("")}
									className="hover:opacity-70 transition-opacity"
								>
									<X className="w-3 h-3" />
								</button>
							</motion.div>
						)}
						{filterStatus !== "all" && (
							<motion.div
								initial={{ scale: 0.8, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								className={`inline-flex items-center gap-2 px-3 py-1 ${selectedStatus?.color} rounded-full text-sm font-medium`}
							>
								<span className={`${filterStatus === "active" ? "text-emerald-700 dark:text-emerald-300" : filterStatus === "paused" ? "text-amber-700 dark:text-amber-300" : "text-red-700 dark:text-red-300"}`}>
									Status: {selectedStatus?.label}
								</span>
								<button
									onClick={() => onFilterStatusChange("all")}
									className="hover:opacity-70 transition-opacity"
								>
									<X className="w-3 h-3" />
								</button>
							</motion.div>
						)}
					</div>
				</motion.div>
			)}
		</motion.div>
	);
}