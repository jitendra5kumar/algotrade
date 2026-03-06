"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface StrategyPaginationProps {
	currentPage: number;
	totalPages: number;
	startIndex: number;
	endIndex: number;
	totalItems: number;
	onPageChange: (page: number) => void;
}

export default function StrategyPagination({
	currentPage,
	totalPages,
	startIndex,
	endIndex,
	totalItems,
	onPageChange,
}: StrategyPaginationProps) {
	if (totalPages <= 1) return null;

	return (
		<div className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-800">
			<div className="text-sm text-gray-600 dark:text-gray-300">
				Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of{" "}
				{totalItems} strategies
			</div>

			<div className="flex items-center gap-2">
				<button
					type="button"
					onClick={() => onPageChange(currentPage - 1)}
					disabled={currentPage === 1}
					className="p-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-emerald-500 hover:bg-green-50 dark:hover:bg-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
				>
					<ChevronLeft className="w-5 h-5" />
				</button>

				{[...Array(totalPages)].map((_, index) => {
					const pageNumber = index + 1;
					// Show first page, last page, current page, and pages around current
					if (
						pageNumber === 1 ||
						pageNumber === totalPages ||
						(pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
					) {
						return (
							<button
								key={pageNumber}
								type="button"
								onClick={() => onPageChange(pageNumber)}
								className={`px-4 py-2 rounded-lg font-medium transition-all ${
									currentPage === pageNumber
										? "bg-gradient-to-r from-green-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-500 text-white"
										: "border-2 border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-emerald-500 hover:bg-green-50 dark:hover:bg-emerald-900/20 text-gray-900 dark:text-gray-100"
								}`}
							>
								{pageNumber}
							</button>
						);
					} else if (
						pageNumber === currentPage - 2 ||
						pageNumber === currentPage + 2
					) {
						return (
							<span
								key={pageNumber}
								className="px-2 text-gray-500 dark:text-gray-400"
							>
								...
							</span>
						);
					}
					return null;
				})}

				<button
					type="button"
					onClick={() => onPageChange(currentPage + 1)}
					disabled={currentPage === totalPages}
					className="p-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-emerald-500 hover:bg-green-50 dark:hover:bg-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
				>
					<ChevronRight className="w-5 h-5" />
				</button>
			</div>
		</div>
	);
}

