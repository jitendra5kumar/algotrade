"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import marketDataApi from "@/lib/market-data-api";
import {
	createStrategy,
	deleteStrategy,
	getStrategies,
	getStrategyLogs,
	updateStrategy,
} from "@/lib/strategy-api";
import CreateSymbolDrawer from "../CreateSymbolDrawer";
import AlgoTradingHeader from "./AlgoTradingHeader";
import DeleteModal from "./DeleteModal";
import EmptyState from "./EmptyState";
import StrategyList from "./StrategyList";
import StrategyLogsDrawer from "./StrategyLogsDrawer";
import { useWebSocket } from "./useWebSocket";
import { Strategy, LiveData, StrategyLog } from "./types";

export default function AlgoTrading() {
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [strategies, setStrategies] = useState<Strategy[]>([]);
	const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);
	const [loading, setLoading] = useState(true);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [strategyToDelete, setStrategyToDelete] = useState<string | null>(null);
	const [liveData, setLiveData] = useState<LiveData>({});
	const [refreshingData, setRefreshingData] = useState(false);
	const [logsOpen, setLogsOpen] = useState(false);
	const [logsStrategy, setLogsStrategy] = useState<{ strategyId: string; name?: string } | null>(null);
	const [logs, setLogs] = useState<StrategyLog[]>([]);
	const [logsLoading, setLogsLoading] = useState(false);

	// Setup WebSocket
	useWebSocket(strategies, setLiveData);

	// Fetch strategies on component mount
	useEffect(() => {
		fetchStrategies();
		const handler = (e: CustomEvent) => {
			setLogsStrategy(e.detail);
			setLogsOpen(true);
			loadLogs(e.detail.strategyId);
		};
		window.addEventListener("open-strategy-logs", handler as EventListener);
		return () => window.removeEventListener("open-strategy-logs", handler as EventListener);
	}, []);

	// Fetch live data when strategies change (debounced to avoid multiple calls)
	useEffect(() => {
		if (strategies.length > 0) {
			// Initial fetch
			const timeoutId = setTimeout(() => {
				fetchLiveData();
			}, 300);
			
			// Polling fallback: Fetch every 15 seconds to refresh data
			// This ensures data stays updated even if WebSocket has issues
			const pollInterval = setInterval(() => {
				// Poll if we have strategies (regardless of existing data)
				// This keeps all symbols updated, not just missing ones
				if (strategies.length > 0) {
					fetchLiveData();
				}
			}, 15000); // Poll every 15 seconds to refresh all symbols
			
			return () => {
				clearTimeout(timeoutId);
				clearInterval(pollInterval);
			};
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [strategies.length]); // Only depend on length, not entire array

	const fetchStrategies = async (showLoading = true) => {
		try {
			if (showLoading) {
				setLoading(true);
			}
			const response = await getStrategies();
			if (response.success) {
				setStrategies(response.data || []);
			} else {
				setStrategies([]);
				if (showLoading) {
					toast.error(response.message || "Failed to load strategies");
				}
			}
		} catch (error: any) {
			setStrategies([]);
			if (showLoading) {
				toast.error(
					error.message ||
						"Failed to load strategies. Please check if backend is running.",
				);
			}
		} finally {
			if (showLoading) {
				setLoading(false);
			}
		}
	};

	const loadLogs = async (strategyId: string) => {
		try {
			setLogsLoading(true);
			const res = await getStrategyLogs(strategyId, { page: 1, limit: 50 });
			if (res.success) setLogs(res.data.items || []);
		} catch (e) {
			// Failed to load logs
		} finally {
			setLogsLoading(false);
		}
	};

	const fetchLiveData = async () => {
		if (strategies.length === 0) return;

		try {
			setRefreshingData(true);
			const instruments = strategies
				.filter((strategy) => {
					const hasValidId =
						strategy.exchangeInstrumentID && strategy.exchangeInstrumentID > 0;
					return hasValidId;
				})
				.map((strategy) => {
					// Exchange segment mapping: NSECM:1, NSEFO:2, NSECD:3, BSECM:11, BSEFO:12, MCXFO:51
					let exchangeSegment = 1; // Default to NSECM
					
					// Check if this is an index instrument (from index_instruments collection)
					// Index instruments should always use NSECM (1) segment
					// We can identify them by checking if exchangeSegment is already NSECM and 
					// the instrument ID is in a typical index range, or by checking strategy metadata
					const isIndexInstrument = strategy.exchangeSegment === "NSECM" && 
						(strategy.exchangeInstrumentID && strategy.exchangeInstrumentID >= 26000 && strategy.exchangeInstrumentID < 30000); // Typical index range
					
					if (isIndexInstrument) {
						exchangeSegment = 1; // NSECM for all index instruments
					} else if (strategy.exchangeSegment === "NSECM") {
						exchangeSegment = 1;
					} else if (strategy.exchangeSegment === "NSEFO") {
						exchangeSegment = 2;
					} else if (strategy.exchangeSegment === "NSECD") {
						exchangeSegment = 3;
					} else if (strategy.exchangeSegment === "BSECM") {
						exchangeSegment = 11;
					} else if (strategy.exchangeSegment === "BSEFO") {
						exchangeSegment = 12;
					} else if (strategy.exchangeSegment === "MCXFO") {
						exchangeSegment = 51;
					}

					return {
						exchangeSegment,
						exchangeInstrumentID: strategy.exchangeInstrumentID,
						symbol: strategy.symbol,
					};
				});

			if (instruments.length === 0) {
				setRefreshingData(false);
				return;
			}

			const response = await marketDataApi.getLiveQuotes(instruments);
			const quotes = response?.data?.quotes || response?.quotes || [];

			if (quotes && quotes.length > 0) {
				const newLiveData: LiveData = {};
				const instrumentMap = new Map();
				instruments.forEach((inst) => {
					instrumentMap.set(inst.exchangeInstrumentID, inst.symbol);
				});

				quotes.forEach((quote: any) => {
					if (!quote) return;

					// Handle string quotes (parse if needed)
					let quoteObj = quote;
					if (typeof quote === 'string') {
						try {
							quoteObj = JSON.parse(quote);
						} catch (e) {
							return;
						}
					}

					const quoteInstrumentId =
						quoteObj.exchangeInstrumentID ||
						quoteObj.ExchangeInstrumentID ||
						quoteObj.InstrumentIdentifier?.ExchangeInstrumentID;

					if (!quoteInstrumentId) return;

					const symbol = instrumentMap.get(quoteInstrumentId);
					if (!symbol) return;
					
					// Normalize symbol to uppercase for consistent matching
					const normalizedSymbol = symbol.toUpperCase().trim();

					// Extract price from Touchline if available (MarketDepth format)
					const touchline = quoteObj.Touchline || quoteObj.touchline;
					const lastPrice =
						touchline?.LastTradedPrice ||
						touchline?.lastTradedPrice ||
						quoteObj.LastTradedPrice ||
						quoteObj.lastTradedPrice ||
						quoteObj.LTP ||
						quoteObj.lastPrice;

					if (lastPrice !== undefined && lastPrice !== null) {
						const change =
							touchline?.Change ||
							touchline?.change ||
							quoteObj.Change ||
							quoteObj.change ||
							quoteObj.ChangeValue ||
							quoteObj.changeValue ||
							0;

						const changePercent =
							touchline?.PercentChange ||
							touchline?.percentChange ||
							quoteObj.PercentChange ||
							quoteObj.changePercent ||
							quoteObj.ChangePercent ||
							quoteObj.changePercentage ||
							(lastPrice && change ? (change / (lastPrice - change)) * 100 : 0);

						const volume =
							touchline?.TotalTradedQuantity ||
							touchline?.Volume ||
							quoteObj.TotalTradedQuantity ||
							quoteObj.Volume ||
							quoteObj.volume ||
							quoteObj.TotalVolume ||
							0;

						// Use normalized symbol for consistent matching
						newLiveData[normalizedSymbol] = {
							lastPrice: Number(lastPrice),
							change: Number(change || 0),
							changePercent: Number(changePercent || 0),
							volume: Number(volume || 0),
							timestamp: new Date(),
							isMockData: false,
						};
					}
				});

				if (Object.keys(newLiveData).length > 0) {
					// Merge with existing liveData instead of replacing
					// This preserves existing symbols when only some quotes are received
					setLiveData((prev: LiveData) => {
						const merged: LiveData = { ...prev };
						// Update/add new data while preserving existing symbols
						Object.keys(newLiveData).forEach(symbol => {
							merged[symbol] = newLiveData[symbol];
						});
						return merged;
					});
				} else {
					// Don't clear existing data if no new data received
					// This prevents symbols from disappearing when API returns empty
					console.log("No new live data received, keeping existing data");
				}
			}
		} catch (error: any) {
			// Log error but don't show to user - live data is not critical
			console.warn("Failed to fetch live data:", error?.message || error);
			// Don't clear existing live data on error
		} finally {
			setRefreshingData(false);
		}
	};

	const handleCreateStrategy = async (strategyData: any): Promise<void> => {
		const loadingToast = toast.loading(
			editingStrategy ? "Updating strategy..." : "Creating strategy...",
		);

		try {
			if (editingStrategy) {
				const response = await updateStrategy(
					editingStrategy._id || editingStrategy.id || "",
					strategyData,
				);

				if (response.success) {
					setStrategies((prev) =>
						prev.map((strategy) =>
							(strategy._id || strategy.id) ===
							(editingStrategy._id || editingStrategy.id)
								? { ...strategy, ...response.data }
								: strategy,
						),
					);
					toast.success("Strategy updated successfully!", { id: loadingToast });
					setEditingStrategy(null);
				} else {
					toast.error("Failed to update strategy", { id: loadingToast });
					throw new Error("Update failed");
				}
			} else {
				const response = await createStrategy(strategyData);

				if (response.success && response.data) {
					setStrategies((prev) => [...prev, response.data]);
					toast.success("Strategy created successfully!", { id: loadingToast });
				} else {
					toast.error("Failed to create strategy", { id: loadingToast });
					throw new Error("Create failed");
				}
			}
		} catch (error: any) {
			toast.error(error.message || "Failed to save strategy", {
				id: loadingToast,
			});
			throw error;
		}
	};

	const handleEditStrategy = (strategy: Strategy) => {
		setEditingStrategy(strategy);
		setDrawerOpen(true);
	};

	const handleDeleteStrategy = (id: string) => {
		setStrategyToDelete(id);
		setDeleteModalOpen(true);
	};

	const handleLogsClick = (strategyId: string, name?: string) => {
		window.dispatchEvent(
			new CustomEvent("open-strategy-logs", {
				detail: { strategyId, name },
			}),
		);
	};

	const handleStrategyUpdate = (strategyId: string, updates: Partial<Strategy>) => {
		setStrategies((prev) =>
			prev.map((strategy) =>
				(strategy._id || strategy.id) === strategyId
					? { ...strategy, ...updates }
					: strategy,
			),
		);
	};

	const confirmDelete = async () => {
		if (!strategyToDelete) return;

		const loadingToast = toast.loading("Deleting strategy...");

		try {
			const response = await deleteStrategy(strategyToDelete);
			if (response.success) {
				setStrategies((prev) =>
					prev.filter(
						(strategy) => (strategy._id || strategy.id) !== strategyToDelete,
					),
				);
				toast.success("Strategy deleted successfully!", { id: loadingToast });
			}
		} catch (error: any) {
			toast.error(error.message || "Failed to delete strategy", {
				id: loadingToast,
			});
		} finally {
			setDeleteModalOpen(false);
			setStrategyToDelete(null);
		}
	};

	return (
		<div className="p-4 sm:p-6 lg:p-8">
			<AlgoTradingHeader onCreateClick={() => setDrawerOpen(true)} />

			{/* Loading State */}
			{loading ? (
				<div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-10 text-center dark:bg-gray-950 dark:border-gray-800">
					<div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
					<p className="text-gray-600 font-medium text-sm dark:text-gray-300">
						Loading strategies...
					</p>
				</div>
			) : strategies.length === 0 ? (
				<EmptyState onCreateClick={() => setDrawerOpen(true)} />
			) : (
				<StrategyList
					strategies={strategies}
					liveData={liveData}
					refreshingData={refreshingData}
					onRefresh={fetchLiveData}
					onEdit={handleEditStrategy}
					onDelete={handleDeleteStrategy}
					onLogsClick={handleLogsClick}
					onStrategiesRefresh={() => fetchStrategies(false)}
					onStrategyUpdate={handleStrategyUpdate}
				/>
			)}

			{/* Logs Drawer */}
				<StrategyLogsDrawer
					isOpen={logsOpen}
					strategyName={logsStrategy?.name}
					strategyId={logsStrategy?.strategyId}
					logs={logs}
					logsLoading={logsLoading}
					onClose={() => {
						setLogsOpen(false);
						setLogsStrategy(null);
					}}
					onRefresh={() => {
						if (logsStrategy?.strategyId) {
							loadLogs(logsStrategy.strategyId);
						}
					}}
				/>

			{/* Create Symbol Drawer */}
			<CreateSymbolDrawer
				isOpen={drawerOpen}
				onClose={() => {
					setDrawerOpen(false);
					setEditingStrategy(null);
				}}
				onSubmit={handleCreateStrategy}
				editData={editingStrategy}
			/>

			{/* Delete Confirmation Modal */}
			<DeleteModal
				isOpen={deleteModalOpen}
				onConfirm={confirmDelete}
				onCancel={() => {
					setDeleteModalOpen(false);
					setStrategyToDelete(null);
				}}
			/>
		</div>
	);
}

