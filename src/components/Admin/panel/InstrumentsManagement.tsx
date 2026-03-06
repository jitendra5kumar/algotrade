"use client";

import { motion } from "framer-motion";
import {
	BarChart3,
	Database,
	Info,
	RefreshCw,
	Search,
	TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
	getAllInstruments,
	getInstrumentStats,
	searchInstruments,
	updateAllInstruments,
} from "@/lib/admin-api";

export default function InstrumentsManagement() {
	const [instruments, setInstruments] = useState<any[]>([]);
	const [stats, setStats] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [updating, setUpdating] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [exchange, setExchange] = useState("");
	const [instrumentType, setInstrumentType] = useState("");

	const formatExchangeSegment = (segment: number | string | undefined) => {
		if (segment === undefined || segment === null || segment === "") {
			return "N/A";
		}

		const value = Number(segment);
		switch (value) {
			case 1:
				return "NSECM"; // NSE Cash Market
			case 2:
				return "NSEFO"; // NSE Futures & Options
			case 3:
				return "NSECD"; // NSE Currency Derivatives
			case 11:
				return "BSECM"; // BSE Cash Market
			case 12:
				return "BSEFO"; // BSE Futures & Options
			case 51:
				return "MCXFO"; // MCX Futures & Options
			default:
				return String(segment);
		}
	};

	const formatExpiry = (expiry: any) => {
		if (!expiry && expiry !== 0) return "N/A";

		if (expiry instanceof Date) {
			return expiry.toLocaleDateString();
		}

		const asNumber = Number(expiry);
		if (!Number.isNaN(asNumber) && asNumber > 10_000_000_000) {
			return new Date(asNumber).toLocaleDateString();
		}

		const parsedDate = new Date(expiry);
		if (!Number.isNaN(parsedDate.getTime())) {
			return parsedDate.toLocaleDateString();
		}

		return String(expiry);
	};

	useEffect(() => {
		fetchData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [page, exchange, instrumentType]);

	useEffect(() => {
		fetchStats();
	}, []);

	const fetchData = async () => {
		try {
			setLoading(true);
			const response = await getAllInstruments(
				page,
				50,
				exchange,
				searchQuery,
				instrumentType,
			);
			if (response.success) {
				setInstruments(response.data.instruments || []);
				setTotalPages(response.data.pagination?.totalPages || 1);
			}
		} catch (error) {
			console.error("Error fetching instruments:", error);
			toast.error("Failed to load instruments");
		} finally {
			setLoading(false);
		}
	};

	const fetchStats = async () => {
		try {
			const response = await getInstrumentStats();
			if (response.success) {
				setStats(response.data);
			}
		} catch (error) {
			console.error("Error fetching stats:", error);
		}
	};

	const handleUpdateAll = async () => {
		setUpdating(true);
		const loadingToast = toast.loading("Updating instruments from XTS...");

		try {
			const response = await updateAllInstruments();
			if (response.success) {
				toast.success(
					`Updated successfully! Inserted: ${response.data.totalInserted}`,
					{ id: loadingToast },
				);
				fetchData();
				fetchStats();
			} else {
				toast.error(response.message || "Failed to update", {
					id: loadingToast,
				});
			}
		} catch (error) {
			toast.error("Failed to update instruments", { id: loadingToast });
		} finally {
			setUpdating(false);
		}
	};

	const handleSearch = async () => {
		if (searchQuery.length < 2) {
			fetchData();
			return;
		}

		try {
			const response = await searchInstruments(searchQuery, exchange, instrumentType);
			if (response.success) {
				setInstruments(response.data || []);
				setTotalPages(1);
			}
		} catch (error) {
			console.error("Error searching instruments:", error);
			toast.error("Search failed");
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-gray-900">
						Instruments Management
					</h1>
					<p className="text-gray-600 mt-1">Manage XTS market instruments</p>
				</div>
				<button
					type="button"
					onClick={handleUpdateAll}
					disabled={updating}
					className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
				>
					<RefreshCw className={`w-5 h-5 ${updating ? "animate-spin" : ""}`} />
					{updating ? "Updating..." : "Update All Instruments"}
				</button>
			</div>

			{/* Statistics Cards */}
			{stats && (
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					<div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
						<div className="flex items-center justify-between mb-2">
							<span className="text-gray-600 dark:text-gray-400 text-sm">Total Instruments</span>
							<Database className="w-5 h-5 text-blue-600" />
						</div>
						<p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
							{stats?.totalInstruments?.toLocaleString() || 0}
						</p>
					</div>
					<div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
						<div className="flex items-center justify-between mb-2">
							<span className="text-gray-600 text-sm">By Exchange</span>
							<BarChart3 className="w-5 h-5 text-green-600" />
						</div>
						<p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
							{stats.byExchange?.length || 0}
						</p>
					</div>
					<div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
						<div className="flex items-center justify-between mb-2">
							<span className="text-gray-600 text-sm">By Type</span>
							<TrendingUp className="w-5 h-5 text-purple-600" />
						</div>
						<p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
							{stats.byType?.length || 0}
						</p>
					</div>
					<div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
						<div className="flex items-center justify-between mb-2">
							<span className="text-gray-600 text-sm">Last Updated</span>
							<Info className="w-5 h-5 text-yellow-600" />
						</div>
						<p className="text-sm font-semibold text-gray-900">
							{stats.lastUpdated
								? new Date(stats.lastUpdated).toLocaleDateString()
								: "Never"}
						</p>
					</div>
				</div>
			)}

			{/* Filters & Search */}
			<div className="flex gap-4 items-center">
				<div className="flex-1 relative">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
					<input
						type="text"
						placeholder="Search instruments..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						onKeyPress={(e) => e.key === "Enter" && handleSearch()}
						className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
					/>
				</div>
				<select
					value={exchange}
					onChange={(e) => setExchange(e.target.value)}
					className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
				>
					<option value="">All Exchanges</option>
					<option value="1">NSECM</option>
					<option value="2">NSEFO</option>
					<option value="3">NSECD</option>
					<option value="11">BSECM</option>
					<option value="12">BSEFO</option>
					<option value="51">MCXFO</option>
				</select>
				<select
					value={instrumentType}
					onChange={(e) => setInstrumentType(e.target.value)}
					className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
				>
					<option value="">All Types</option>
					<option value="EQ">Equity</option>
					<option value="FO">Futures</option>
					<option value="OPT">Options</option>
				</select>
			</div>

			{/* Instruments Table */}
			{loading ? (
				<div className="text-center py-12 text-gray-400 dark:text-gray-500">
					Loading instruments...
				</div>
			) : instruments.length === 0 ? (
				<div className="text-center py-12 text-gray-400 dark:text-gray-500">
					No instruments found. Try updating instruments from XTS.
				</div>
			) : (
				<>
					<div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
									<tr>
										<th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
											Exchange Segment
										</th>
										<th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
											Instrument ID
										</th>
										<th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
											Name
										</th>
										<th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
											Description
										</th>
										<th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
											Lot Size
										</th>
										<th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
											Expiry
										</th>
										<th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
											Contract Exp.
										</th>
										<th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
											Option Type
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
									{instruments.map((instrument, index) => (
										<motion.tr
											key={instrument?._id || index}
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											transition={{ delay: index * 0.02 }}
											className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors bg-white dark:bg-gray-900"
										>
											<td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
												{formatExchangeSegment(
													instrument.exchangeSegment ?? instrument.ExchangeSegment,
												)}
											</td>
											<td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
												{instrument.exchangeInstrumentID ??
												instrument.ExchangeInstrumentID ??
												"—"}
											</td>
											<td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
												{instrument.name || instrument.Name || "N/A"}
											</td>
											<td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
												{instrument.description || instrument.Description || "N/A"}
											</td>
											<td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
												{instrument.lotSize ??
												instrument.LotSize ??
												(instrument.contractMultiplier ??
													instrument.ContractMultiplier) ??
												"—"}
											</td>
											<td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
												{formatExpiry(instrument.expiry ?? instrument.Expiry)}
											</td>
											<td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
												{formatExpiry(
													instrument.contractExpiration ??
														instrument.ContractExpiration,
												)}
											</td>
											<td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
												{instrument.optionType ??
												instrument.OptionType ??
												"—"}
											</td>
										</motion.tr>
									))}
								</tbody>
							</table>
						</div>
					</div>

					{/* Pagination */}
					{totalPages > 1 && (
						<div className="flex items-center justify-center gap-2">
							<button
								type="button"
								onClick={() => setPage((p) => Math.max(1, p - 1))}
								disabled={page === 1}
								className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
							>
								Previous
							</button>
							<span className="px-4 py-2 text-gray-600 dark:text-gray-300">
								Page {page} of {totalPages}
							</span>
							<button
								type="button"
								onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
								disabled={page === totalPages}
								className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
							>
								Next
							</button>
						</div>
					)}
				</>
			)}
		</div>
	);
}
