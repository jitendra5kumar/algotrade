"use client";

interface StrategyTemplatePaginationProps {
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
}

export default function StrategyTemplatePagination({
	currentPage,
	totalPages,
	onPageChange,
}: StrategyTemplatePaginationProps) {
	if (totalPages <= 1) return null;

	return (
		<div className="flex items-center justify-center gap-2 mt-6">
			<button
				type="button"
				onClick={() => onPageChange(Math.max(1, currentPage - 1))}
				disabled={currentPage === 1}
				className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
			>
				Previous
			</button>
			<span className="px-4 py-2 text-gray-600 dark:text-gray-300">
				Page {currentPage} of {totalPages}
			</span>
			<button
				type="button"
				onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
				disabled={currentPage === totalPages}
				className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
			>
				Next
			</button>
		</div>
	);
}

