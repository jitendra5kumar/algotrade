"use client";

import { useState, useEffect, useRef } from "react";
import { RefreshCw, Search, X, Filter, Trash2 } from "lucide-react";
import { StrategyLog } from "./types";
import type { Socket } from "socket.io-client";
import { deleteStrategyLog, deleteAllStrategyLogs } from "@/lib/strategy-api";
import { getAuthToken, isValidJWT, isTokenExpired } from "@/utils/token-utils";

interface StrategyLogsDrawerProps {
	isOpen: boolean;
	strategyName?: string;
	strategyId?: string;
	logs: StrategyLog[];
	logsLoading: boolean;
	onClose: () => void;
	onRefresh?: () => void;
}

export default function StrategyLogsDrawer({
	isOpen,
	strategyName,
	strategyId,
	logs: initialLogs,
	logsLoading,
	onClose,
	onRefresh,
}: StrategyLogsDrawerProps) {
	const [logs, setLogs] = useState<StrategyLog[]>(initialLogs);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedLevel, setSelectedLevel] = useState<"all" | "info" | "warn" | "error">("all");
	const [socketRef, setSocketRef] = useState<Socket | null>(null);
	const [deletingLogId, setDeletingLogId] = useState<string | null>(null);
	const [deletingAll, setDeletingAll] = useState(false);
	const logsContainerRef = useRef<HTMLDivElement>(null);

	// Update logs when initialLogs change
	useEffect(() => {
		setLogs(initialLogs);
		// Reset scroll to top when logs are refreshed
		if (logsContainerRef.current) {
			logsContainerRef.current.scrollTop = 0;
		}
	}, [initialLogs]);

	// Reset scroll to top when modal opens
	useEffect(() => {
		if (isOpen && logsContainerRef.current) {
			logsContainerRef.current.scrollTop = 0;
		}
	}, [isOpen]);

	// Setup WebSocket for real-time log streaming
	useEffect(() => {
		if (!isOpen || !strategyId) return;

		// Use token utility for consistent token handling
		const token = getAuthToken();
		
		if (!token || !isValidJWT(token)) {
			console.warn("[StrategyLogs] No valid token found");
			return;
		}

		if (isTokenExpired(token)) {
			console.warn("[StrategyLogs] Token expired, skipping connection");
			return;
		}

		// Dynamic import for socket.io-client (client-side only)
		const setupSocket = async () => {
			try {
				const socketIoClient = await import("socket.io-client");
				const io = socketIoClient.io || socketIoClient.default || socketIoClient;
				
				if (!io || typeof io !== "function") {
					return;
				}

				// Socket.IO v2.2.0 configuration - uses 'query' instead of 'auth'
				// Handle comma-separated URLs (take first one)
				const envUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
				const baseUrl = (envUrl.includes(',') ? envUrl.split(',')[0].trim() : envUrl.trim()).replace(/\/$/, "");
				const socket = io(baseUrl, {
					path: "/socket.io",
					query: { token: token.trim() }, // v2 uses 'query' instead of 'auth'
					transports: ["polling", "websocket"], // Try polling first
					reconnection: true,
					reconnectionDelay: 1000,
					reconnectionAttempts: 3,
					forceNew: true,
				});

				socket.on("connect", () => {
					socket.emit("subscribe:strategy_logs", { strategyId });
				});

				socket.on("strategy_log", (logData: StrategyLog) => {
					setLogs((prev) => [logData, ...prev].slice(0, 100)); // Keep last 100 logs
				});

				socket.on("error", (error: any) => {
					console.error("[StrategyLogs] Socket error:", error);
				});

				socket.on("connect_error", (error: any) => {
					console.error("[StrategyLogs] Connection error:", error);
					if (error?.message?.includes("400") || error?.message?.includes("Authentication")) {
						console.warn("[StrategyLogs] Authentication error - token may be invalid");
					}
				});

				socket.on("disconnect", (reason: string) => {
					console.log("[StrategyLogs] Disconnected:", reason);
				});

				setSocketRef(socket);
			} catch (error) {
				// Failed to setup socket
			}
		};

		setupSocket();

		return () => {
			// Cleanup socket on unmount or when dependencies change
			if (socketRef && socketRef.connected) {
				try {
					socketRef.emit("unsubscribe:strategy_logs", { strategyId });
					socketRef.disconnect();
				} catch (error) {
					// Error cleaning up logs socket
				}
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen, strategyId]);

	// Filter logs based on search and level
	const filteredLogs = logs.filter((log) => {
		const matchesSearch = searchTerm === "" || 
			log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
			log.category.toLowerCase().includes(searchTerm.toLowerCase());
		
		const matchesLevel = selectedLevel === "all" || log.level === selectedLevel;
		
		return matchesSearch && matchesLevel;
	});

	// Handle delete single log
	const handleDeleteLog = async (logId: string) => {
		if (!strategyId || !window.confirm("Are you sure you want to delete this log?")) {
			return;
		}

		try {
			setDeletingLogId(logId);
			await deleteStrategyLog(strategyId, logId);
			setLogs((prev) => prev.filter((log) => log._id !== logId));
			if (onRefresh) {
				onRefresh();
			}
		} catch (error: any) {
			alert(error.message || "Failed to delete log");
		} finally {
			setDeletingLogId(null);
		}
	};

	// Handle delete all logs
	const handleDeleteAll = async () => {
		if (!strategyId || !window.confirm("Are you sure you want to delete ALL logs? This action cannot be undone.")) {
			return;
		}

		try {
			setDeletingAll(true);
			await deleteAllStrategyLogs(strategyId);
			setLogs([]);
			if (onRefresh) {
				onRefresh();
			}
		} catch (error: any) {
			alert(error.message || "Failed to delete logs");
		} finally {
			setDeletingAll(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/40">
			<div className="w-full lg:w-3/4 h-3/4 bg-white rounded-t-2xl lg:rounded-2xl shadow-2xl overflow-hidden flex flex-col dark:bg-gray-900">
				<div className="flex flex-col border-b dark:border-gray-800">
					{/* Header */}
					<div className="flex items-center justify-between p-4">
						<div>
							<h3 className="font-bold text-lg dark:text-gray-100">
								Logs {strategyName ? `- ${strategyName}` : ""}
							</h3>
							<p className="text-xs text-gray-500 dark:text-gray-400">
								{filteredLogs.length} {filteredLogs.length === 1 ? "entry" : "entries"}
							</p>
						</div>
						<div className="flex items-center gap-2">
							{logs.length > 0 && (
								<button
									type="button"
									onClick={handleDeleteAll}
									disabled={deletingAll || logsLoading}
									className="px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 dark:text-red-200 text-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
									title="Delete all logs"
								>
									<Trash2 size={16} />
									<span className="hidden sm:inline">Delete All</span>
								</button>
							)}
							{onRefresh && (
								<button
									type="button"
									onClick={onRefresh}
									disabled={logsLoading}
									className="px-3 py-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 dark:text-blue-200 text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
									title="Refresh logs"
								>
									<RefreshCw
										size={16}
										className={logsLoading ? "animate-spin" : ""}
									/>
									<span className="hidden sm:inline">Refresh</span>
								</button>
							)}
							<button
								type="button"
								onClick={onClose}
								className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200"
							>
								Close
							</button>
						</div>
					</div>

					{/* Search and Filter Bar */}
					<div className="px-4 pb-4 flex flex-col sm:flex-row gap-3">
						{/* Search */}
						<div className="flex-1 relative">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
							<input
								type="text"
								placeholder="Search logs..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
							{searchTerm && (
								<button
									type="button"
									onClick={() => setSearchTerm("")}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
								>
									<X size={16} />
								</button>
							)}
						</div>

						{/* Log Level Filter */}
						<div className="flex items-center gap-2">
							<Filter size={16} className="text-gray-500 dark:text-gray-400" />
							<div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
								{(["all", "info", "warn", "error"] as const).map((level) => (
									<button
										key={level}
										type="button"
										onClick={() => setSelectedLevel(level)}
										className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
											selectedLevel === level
												? level === "error"
													? "bg-red-500 text-white"
													: level === "warn"
														? "bg-yellow-500 text-white"
														: level === "info"
															? "bg-blue-500 text-white"
															: "bg-gray-700 text-white dark:bg-gray-600"
												: "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
										}`}
									>
										{level.charAt(0).toUpperCase() + level.slice(1)}
									</button>
								))}
							</div>
						</div>
					</div>
				</div>
				<div className="flex-1 overflow-auto" ref={logsContainerRef}>
					{logsLoading && logs.length === 0 ? (
						<div className="p-6 text-center text-gray-500 dark:text-gray-400">
							Loading...
						</div>
					) : (
						<div className="p-4">
							<div className="space-y-2">
								{filteredLogs.map((log, i) => (
									<div
										key={i}
										className={`p-3 rounded-lg border-l-4 ${
											log.level === "error"
												? "bg-red-50 dark:bg-red-900/10 border-red-500"
												: log.level === "warn"
													? "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-500"
													: "bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700"
										}`}
									>
										<div className="flex items-start justify-between gap-4">
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2 mb-1">
													<span
														className={`px-2 py-0.5 rounded text-xs font-bold ${
															log.level === "error"
																? "bg-red-500 text-white"
																: log.level === "warn"
																	? "bg-yellow-500 text-white"
																	: "bg-blue-500 text-white"
														}`}
													>
														{log.level.toUpperCase()}
													</span>
													<span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
														{log.category}
													</span>
													<span className="text-xs text-gray-500 dark:text-gray-400">
														{new Date(log.createdAt).toLocaleString('en-IN', {
															day: '2-digit',
															month: '2-digit',
															year: 'numeric',
															hour: '2-digit',
															minute: '2-digit',
															second: '2-digit',
															hour12: false
														})}
													</span>
												</div>
												<p className="text-sm text-gray-900 dark:text-gray-100 break-words">
													{log.message}
												</p>
											</div>
											<button
												type="button"
												onClick={() => log._id && handleDeleteLog(log._id)}
												disabled={deletingLogId === log._id}
												className="ml-2 p-1.5 rounded-lg text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
												title="Delete log"
											>
												<Trash2 size={16} />
											</button>
										</div>
									</div>
								))}
								{filteredLogs.length === 0 && (
									<div className="p-8 text-center text-gray-500 dark:text-gray-400">
										<p className="font-medium">No logs found</p>
										<p className="text-xs mt-1">
											{searchTerm || selectedLevel !== "all"
												? "Try adjusting your filters"
												: "Logs will appear here when the strategy runs"}
										</p>
									</div>
								)}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

