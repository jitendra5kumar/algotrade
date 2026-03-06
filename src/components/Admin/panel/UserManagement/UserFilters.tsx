"use client";

import { motion } from "framer-motion";
import { Filter, Search, X } from "lucide-react";

interface UserFiltersProps {
	searchQuery: string;
	onSearchChange: (query: string) => void;
	filterStatus: string;
	onFilterStatusChange: (status: string) => void;
}

export default function UserFilters({
	searchQuery,
	onSearchChange,
	filterStatus,
	onFilterStatusChange,
}: UserFiltersProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-800"
		>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{/* Search */}
				<div className="relative group">
					<div className="absolute left-0 top-0 bottom-0 flex items-center pl-4 pointer-events-none">
						<Search className="w-5 h-5 text-gray-400 dark:text-gray-500 group-focus-within:text-emerald-500 dark:group-focus-within:text-emerald-400 transition-colors" />
					</div>
					<input
						type="text"
						placeholder="Search by name or email..."
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
						className="w-full pl-12 pr-10 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-green-500 dark:focus:border-emerald-500 focus:outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
					/>
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

				{/* Status Filter */}
				<div className="relative group">
					<div className="absolute left-0 top-0 bottom-0 flex items-center pl-4 pointer-events-none">
						<Filter className="w-5 h-5 text-gray-400 dark:text-gray-500 group-focus-within:text-emerald-500 dark:group-focus-within:text-emerald-400 transition-colors" />
					</div>
					<select
						value={filterStatus}
						onChange={(e) => onFilterStatusChange(e.target.value)}
						className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-green-500 dark:focus:border-emerald-500 focus:outline-none transition-all appearance-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
					>
						<option value="all">All Users</option>
						<option value="active">Active</option>
						<option value="inactive">Inactive</option>
					</select>
				</div>
			</div>
		</motion.div>
	);
}

