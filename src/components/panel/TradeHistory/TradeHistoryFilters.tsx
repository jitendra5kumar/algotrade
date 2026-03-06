"use client";

import { motion } from "framer-motion";
import { Calendar, Filter, Search } from "lucide-react";

interface TradeHistoryFiltersProps {
	searchTerm: string;
	onSearchChange: (value: string) => void;
}

export default function TradeHistoryFilters({
	searchTerm,
	onSearchChange,
}: TradeHistoryFiltersProps) {
	return (
		<div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-3 mb-5 dark:bg-gray-950 dark:border-gray-800">
			<div className="flex flex-col sm:flex-row gap-2.5">
				{/* Search Bar */}
				<div className="flex-1 relative">
					<input
						type="text"
						placeholder="Search by symbol or strategy..."
						value={searchTerm}
						onChange={(e) => onSearchChange(e.target.value)}
						className="w-full pl-3 pr-3 py-2.5 border-2 border-gray-200 hover:border-green-400 focus:border-green-500 focus:outline-none rounded-xl transition-all bg-white hover:bg-white focus:bg-white font-medium text-sm text-gray-900 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 dark:focus:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
					/>
				</div>

				{/* Icons - Search, Filter, Date */}
				<div className="flex gap-2">
					<motion.button
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
						className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-all flex items-center gap-1.5 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200"
						title="Search"
					>
						<Search size={16} />
						<span className="hidden sm:inline">Search</span>
					</motion.button>
					<motion.button
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
						className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-all flex items-center gap-1.5 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200"
					>
						<Filter size={16} />
						<span className="hidden sm:inline">Filter</span>
					</motion.button>
					<motion.button
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
						className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-all flex items-center gap-1.5 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200"
					>
						<Calendar size={16} />
						<span className="hidden sm:inline">Date</span>
					</motion.button>
				</div>
			</div>
		</div>
	);
}

