"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { AlertTriangle } from "lucide-react";
import StrategyFilters from "./StrategyFilters";
import StrategyTableRow from "./StrategyTableRow";
import StrategyCard from "./StrategyCard";
import StrategyPagination from "./StrategyPagination";
import type { Strategy } from "./types";

export default function StrategyMonitor() {
	const [strategies, setStrategies] = useState<Strategy[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [filterStatus, setFilterStatus] = useState("all");
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 10;

	useEffect(() => {
		fetchStrategies();
	}, []);

	const fetchStrategies = async () => {
		try {
			const { getAllStrategies } = await import("@/lib/admin-api");
			const response = await getAllStrategies();

			if (response.success) {
				setStrategies(response.data || []);
			} else {
				toast.error(response.message || "Failed to load strategies");
			}
		} catch (error: any) {
			console.error("Error fetching strategies:", error);
			toast.error(error.message || "Failed to load strategies");
		} finally {
			setLoading(false);
		}
	};

	const handleToggleStrategy = async (
		strategyId: string,
		currentStatus: string,
	) => {
		const loadingToast = toast.loading("Updating strategy...");

		try {
			const { toggleStrategyStatus } = await import("@/lib/admin-api");
			const response = await toggleStrategyStatus(strategyId);

			if (response.success) {
				const newStatus = response.data.status;
				setStrategies((prev: Strategy[]) =>
					prev.map((strategy: Strategy) => {
						const id = strategy.id || strategy._id || "";
						return id === strategyId
							? {
									...strategy,
									status: newStatus as "active" | "paused" | "inactive",
									isActive: response.data.isActive,
								}
							: strategy;
					}),
				);
				toast.success(
					response.message ||
						`Strategy ${newStatus === "active" ? "started" : "paused"}`,
					{ id: loadingToast },
				);
			} else {
				toast.error(response.message || "Failed to update strategy", {
					id: loadingToast,
				});
			}
		} catch (error: any) {
			toast.error(error.message || "Failed to update strategy", {
				id: loadingToast,
			});
		}
	};

	const filteredStrategies = strategies.filter((strategy) => {
		const matchesSearch =
			strategy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			strategy.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
			strategy.symbol.toLowerCase().includes(searchQuery.toLowerCase());

		const matchesFilter =
			filterStatus === "all" || strategy.status === filterStatus;

		return matchesSearch && matchesFilter;
	});

	// Pagination
	const totalPages = Math.ceil(filteredStrategies.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const currentPageStrategies = filteredStrategies.slice(startIndex, endIndex);

	const handlePageChange = (page: number) => {
		setCurrentPage(page);
	};

	const handleSearchChange = (value: string) => {
		setSearchQuery(value);
		setCurrentPage(1); // Reset to first page on search
	};

	const handleFilterChange = (value: string) => {
		setFilterStatus(value);
		setCurrentPage(1); // Reset to first page on filter change
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="w-12 h-12 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin"></div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
					Strategy Monitor
				</h1>
				<p className="text-gray-600 dark:text-gray-400 mt-1">
					Real-time monitoring of all active strategies
				</p>
			</div>

			{/* Filters */}
			<StrategyFilters
				searchQuery={searchQuery}
				onSearchChange={handleSearchChange}
				filterStatus={filterStatus}
				onFilterStatusChange={handleFilterChange}
			/>

			{/* Strategies Table - Desktop */}
			<div className="hidden lg:block bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
							<tr>
								<th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
									Strategy
								</th>
								<th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
									User
								</th>
								<th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
									Symbol
								</th>
								<th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
									Type
								</th>
								<th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
									P&L
								</th>
								<th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
									Trades
								</th>
								<th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
									Win Rate
								</th>
								<th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
									Last Signal
								</th>
								<th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
									Status
								</th>
								<th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
									Action
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
							{currentPageStrategies.map((strategy) => (
								<StrategyTableRow
									key={strategy.id || strategy._id}
									strategy={strategy}
									onToggleStrategy={handleToggleStrategy}
								/>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{/* Strategies Cards - Mobile */}
			<div className="lg:hidden space-y-4">
				{currentPageStrategies.map((strategy) => (
					<StrategyCard
						key={strategy.id || strategy._id}
						strategy={strategy}
						onToggleStrategy={handleToggleStrategy}
					/>
				))}
			</div>

			{/* No Results */}
			{filteredStrategies.length === 0 && !loading && (
				<div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800">
					<AlertTriangle className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
					<p className="text-gray-600 dark:text-gray-400">No strategies found</p>
				</div>
			)}

			{/* Pagination */}
			<StrategyPagination
				currentPage={currentPage}
				totalPages={totalPages}
				startIndex={startIndex}
				endIndex={endIndex}
				totalItems={filteredStrategies.length}
				onPageChange={handlePageChange}
			/>
		</div>
	);
}

