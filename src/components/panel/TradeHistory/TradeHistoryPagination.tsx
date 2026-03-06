"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TradeHistoryPaginationProps {
	currentPage: number;
	totalPages: number;
	totalItems: number;
	itemsPerPage: number;
	startIndex: number;
	endIndex: number;
	onPageChange: (page: number) => void;
}

export default function TradeHistoryPagination({
	currentPage,
	totalPages,
	totalItems,
	itemsPerPage,
	startIndex,
	endIndex,
	onPageChange,
}: TradeHistoryPaginationProps) {
	if (totalPages <= 1) return null;

	return (
		<div className="mt-3 bg-gray-50 border-2 border-gray-200 rounded-xl px-3 sm:px-5 py-3 dark:bg-gray-950 dark:border-gray-800">
			<div className="flex flex-col sm:flex-row items-center justify-between gap-3">
				{/* Page Info */}
				<div className="text-xs text-gray-600 font-medium text-center sm:text-left dark:text-gray-300">
					Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of{" "}
					{totalItems} trades
				</div>

				{/* Pagination Controls */}
				<div className="flex items-center gap-1.5">
					<motion.button
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
						disabled={currentPage === 1}
						className="p-1.5 rounded-lg border-2 border-gray-300 hover:border-green-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all dark:border-gray-700 dark:hover:border-green-600"
					>
						<ChevronLeft
							size={16}
							className="text-gray-700 dark:text-gray-300"
						/>
					</motion.button>

					{/* Page Numbers */}
					<div className="flex gap-1">
						{Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
							let page;
							if (totalPages <= 5) {
								page = i + 1;
							} else if (currentPage <= 3) {
								page = i + 1;
							} else if (currentPage >= totalPages - 2) {
								page = totalPages - 4 + i;
							} else {
								page = currentPage - 2 + i;
							}
							return (
								<motion.button
									key={page}
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									onClick={() => onPageChange(page)}
									className={`px-2 py-1 rounded-lg font-bold text-xs transition-all ${
										currentPage === page
											? "bg-green-500 text-white"
											: "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
									}`}
								>
									{page}
								</motion.button>
							);
						})}
					</div>

					<motion.button
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
						disabled={currentPage === totalPages}
						className="p-1.5 rounded-lg border-2 border-gray-300 hover:border-green-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all dark:border-gray-700 dark:hover:border-green-600"
					>
						<ChevronRight
							size={16}
							className="text-gray-700 dark:text-gray-300"
						/>
					</motion.button>
				</div>
			</div>
		</div>
	);
}

