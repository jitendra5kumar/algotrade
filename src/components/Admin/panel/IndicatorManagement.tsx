"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	Activity,
	BarChart3,
	CheckCircle,
	Circle,
	Eye,
	EyeOff,
	Lock,
	RefreshCw,
	Save,
	Search,
	Settings,
	TrendingUp,
	Unlock,
	Volume2,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
	getAllIndicators,
	seedIndicators,
	toggleIndicatorVisibility,
	updateIndicatorParameters,
} from "@/lib/indicator-api";

export default function IndicatorManagement() {
	const [indicators, setIndicators] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [seeding, setSeeding] = useState(false);
	const [editingIndicator, setEditingIndicator] = useState<any>(null);
	const [editParams, setEditParams] = useState<any[]>([]);

	useEffect(() => {
		fetchIndicators();
	}, []);

	const fetchIndicators = async () => {
		try {
			const response = await getAllIndicators();
			if (response.success) {
				setIndicators(response.data || []);
			}
		} catch (error) {
			console.error("Error fetching indicators:", error);
			toast.error("Failed to load indicators");
		} finally {
			setLoading(false);
		}
	};

	const handleToggleVisibility = async (indicatorId, currentVisibility) => {
		const newVisibility = !currentVisibility;
		const loadingToast = toast.loading("Updating visibility...");

		try {
			const response = await toggleIndicatorVisibility(
				indicatorId,
				newVisibility,
			);
			if (response.success) {
				setIndicators((prev: any) =>
					prev.map((indicator) =>
						indicator._id === indicatorId
							? { ...indicator, isVisibleToUsers: newVisibility }
							: indicator,
					),
				);
				toast.success(`${newVisibility ? "Visible" : "Hidden"} to users`, {
					id: loadingToast,
				});
			} else {
				toast.error(response.message || "Failed to update", {
					id: loadingToast,
				});
			}
		} catch (error) {
			toast.error(error.message || "Failed to update", { id: loadingToast });
		}
	};

	const handleSeedIndicators = async () => {
		setSeeding(true);
		const loadingToast = toast.loading("Seeding default indicators...");

		try {
			const response = await seedIndicators();
			if (response.success) {
				toast.success("Indicators seeded successfully!", { id: loadingToast });
				fetchIndicators();
			} else {
				toast.error(response.message || "Failed to seed", { id: loadingToast });
			}
		} catch (error) {
			toast.error(error.message || "Failed to seed", { id: loadingToast });
		} finally {
			setSeeding(false);
		}
	};

	const handleEditIndicator = (indicator) => {
		setEditingIndicator(indicator);
		setEditParams(JSON.parse(JSON.stringify(indicator.parameters || [])));
	};

	const handleParamChange = (paramIndex, field, value) => {
		setEditParams((prev: any[]) => {
			const updated = [...prev];
			updated[paramIndex] = { ...(updated[paramIndex] as any), [field]: value };
			return updated;
		});
	};

	const handleSaveParameters = async () => {
		if (!editingIndicator) return;

		const loadingToast = toast.loading("Saving parameters...");
		try {
			const response = await updateIndicatorParameters(
				editingIndicator?._id,
				editParams,
			);
			if (response.success) {
				toast.success("Parameters updated successfully!", { id: loadingToast });
				fetchIndicators();
				setEditingIndicator(null);
				setEditParams([]);
			} else {
				toast.error(response.message || "Failed to update", {
					id: loadingToast,
				});
			}
		} catch (error) {
			toast.error(error.message || "Failed to update", { id: loadingToast });
		}
	};

	const getCategoryIcon = (category) => {
		switch (category) {
			case "trend":
				return <TrendingUp className="w-5 h-5" />;
			case "momentum":
				return <Activity className="w-5 h-5" />;
			case "volatility":
				return <BarChart3 className="w-5 h-5" />;
			case "volume":
				return <Volume2 className="w-5 h-5" />;
			default:
				return <Activity className="w-5 h-5" />;
		}
	};

	const getCategoryColor = (category) => {
		switch (category) {
			case "trend":
				return "from-blue-500 to-blue-600";
			case "momentum":
				return "from-purple-500 to-purple-600";
			case "volatility":
				return "from-orange-500 to-orange-600";
			case "volume":
				return "from-green-500 to-green-600";
			default:
				return "from-gray-500 to-gray-600";
		}
	};

	const filteredIndicators = indicators.filter(
		(indicator) =>
			indicator.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			indicator.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
			indicator.category.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	const groupedByCategory = filteredIndicators.reduce((groups, indicator) => {
		const category = indicator.category;
		if (!groups[category]) {
			groups[category] = [];
		}
		groups[category].push(indicator);
		return groups;
	}, {});

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
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
						Indicator Management
					</h1>
					<p className="text-gray-600 dark:text-gray-400 mt-1">
						Control which indicators are available to users
					</p>
				</div>
				<motion.button
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					onClick={handleSeedIndicators}
					disabled={seeding}
					className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg transition-all disabled:opacity-50"
				>
					{seeding ? (
						<>
							<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
							Seeding...
						</>
					) : (
						<>
							<RefreshCw className="w-5 h-5" />
							Seed Indicators
						</>
					)}
				</motion.button>
			</div>

			{/* Search and Stats */}
			<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
				{/* Search */}
				<div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-800">
					<div className="relative">
						<Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
						<input
							type="text"
							placeholder="Search indicators..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-green-500 focus:outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
						/>
					</div>
				</div>

				{/* Stats */}
				<div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-800">
					<div className="flex items-center gap-3">
						<div className="p-3 bg-green-100 rounded-xl">
							<Eye className="w-6 h-6 text-green-600" />
						</div>
						<div>
							<p className="text-sm text-gray-600 dark:text-gray-300">Visible</p>
							<p className="text-2xl font-bold text-green-600">
								{indicators.filter((i) => i.isVisibleToUsers).length}
							</p>
						</div>
					</div>
				</div>

				<div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-800">
					<div className="flex items-center gap-3">
						<div className="p-3 bg-red-100 rounded-xl">
							<EyeOff className="w-6 h-6 text-red-600" />
						</div>
						<div>
							<p className="text-sm text-gray-600 dark:text-gray-300">Hidden</p>
							<p className="text-2xl font-bold text-red-600">
								{indicators.filter((i) => !i.isVisibleToUsers).length}
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Indicators by Category */}
			{Object.keys(groupedByCategory).length === 0 ? (
				<div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800">
					<Activity className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
					<p className="text-gray-600 dark:text-gray-400 mb-4">No indicators found</p>
					<button
						type="button"
						onClick={handleSeedIndicators}
						className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl"
					>
						Seed Default Indicators
					</button>
				</div>
			) : (
				Object.entries(groupedByCategory).map(
					([category, categoryIndicators]) => (
						<div key={category}>
							{/* Category Header */}
							<div className="flex items-center gap-3 mb-4">
								<div
									className={`p-2 bg-gradient-to-br ${getCategoryColor(category)} rounded-lg`}
								>
									{getCategoryIcon(category)}
								</div>
								<h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 capitalize">
									{category} Indicators
								</h2>
								<span className="text-sm text-gray-500 dark:text-gray-400">
									({(categoryIndicators as any[]).length})
								</span>
							</div>

							{/* Indicators Grid */}
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
								{(categoryIndicators as any[]).map((indicator: any) => (
									<motion.div
										key={indicator._id}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										whileHover={{ y: -5 }}
										className={`bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border-2 transition-all ${
											indicator.isVisibleToUsers
												? "border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-700"
												: "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 opacity-75"
										}`}
									>
										{/* Header */}
										<div className="flex items-start justify-between mb-3">
											<div
												className={`p-3 bg-gradient-to-br ${getCategoryColor(indicator.category)} rounded-xl`}
											>
												{getCategoryIcon(indicator.category)}
											</div>
											<div className="flex items-center gap-2">
												<motion.button
													whileHover={{ scale: 1.1 }}
													whileTap={{ scale: 0.9 }}
													onClick={() => handleEditIndicator(indicator)}
													className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-lg transition-all"
													title="Configure parameters"
												>
													<Settings className="w-5 h-5" />
												</motion.button>
												<motion.button
													whileHover={{ scale: 1.1 }}
													whileTap={{ scale: 0.9 }}
													onClick={() =>
														handleToggleVisibility(
															indicator._id,
															indicator.isVisibleToUsers,
														)
													}
													className={`p-2 rounded-lg transition-all ${
														indicator.isVisibleToUsers
															? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
															: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
													}`}
													title={
														indicator.isVisibleToUsers
															? "Hide from users"
															: "Show to users"
													}
												>
													{indicator.isVisibleToUsers ? (
														<Eye className="w-5 h-5" />
													) : (
														<EyeOff className="w-5 h-5" />
													)}
												</motion.button>
											</div>
										</div>

										{/* Content */}
										<h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">
											{indicator.displayName}
										</h3>
										<p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
											{indicator.description}
										</p>

										{/* Parameters */}
										{indicator.parameters &&
											indicator.parameters.length > 0 && (
												<div className="mb-4">
													<p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
														Parameters:
													</p>
													<div className="space-y-1">
														{indicator.parameters.map((param: any) => (
															<div
																key={param?._id}
																className="text-xs text-gray-600 dark:text-gray-300"
															>
																• {param.label}: {param.defaultValue}
																{param.min !== undefined &&
																	` (${param.min}-${param.max})`}
															</div>
														))}
													</div>
												</div>
											)}

										{/* Status Badge */}
										<div
											className={`flex items-center gap-2 p-3 rounded-xl ${
												indicator.isVisibleToUsers
													? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
													: "bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
											}`}
										>
											{indicator.isVisibleToUsers ? (
												<>
													<CheckCircle className="w-4 h-4 text-green-600" />
													<span className="text-xs font-medium text-green-700 dark:text-green-300">
														Visible to users
													</span>
												</>
											) : (
												<>
													<Circle className="w-4 h-4 text-gray-600 dark:text-gray-400" />
													<span className="text-xs font-medium text-gray-700 dark:text-gray-300">
														Hidden from users
													</span>
												</>
											)}
										</div>
									</motion.div>
								))}
							</div>
						</div>
					),
				)
			)}

			{/* Parameter Edit Modal */}
			<AnimatePresence>
				{editingIndicator && (
					<>
						{/* Backdrop */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							onClick={() => setEditingIndicator(null)}
							className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
						/>

						{/* Modal */}
						<motion.div
							initial={{ opacity: 0, scale: 0.95, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, y: 20 }}
							className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl z-50 max-h-[90vh] overflow-hidden flex flex-col"
						>
							{/* Modal Header */}
							<div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500 to-indigo-600">
								<div className="flex items-center justify-between">
									<div>
										<h2 className="text-2xl font-bold text-white">
											{editingIndicator.displayName}
										</h2>
										<p className="text-sm text-blue-100 mt-1">
											Configure parameters and visibility
										</p>
									</div>
									<motion.button
										whileHover={{ scale: 1.1 }}
										whileTap={{ scale: 0.9 }}
										onClick={() => setEditingIndicator(null)}
										className="p-2 hover:bg-white/20 rounded-xl transition-colors"
									>
										<X className="w-6 h-6 text-white" />
									</motion.button>
								</div>
							</div>

							{/* Modal Body */}
							<div className="flex-1 overflow-y-auto p-6 space-y-6">
								{editParams.length === 0 ? (
									<div className="text-center py-8 text-gray-500 dark:text-gray-400">
										<p>No parameters to configure</p>
									</div>
								) : (
									editParams.map((param: any, idx: number) => (
										<div
											key={param?._id}
											className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 border-2 border-gray-200 dark:border-gray-700"
										>
											<div className="flex items-center justify-between mb-4">
												<h3 className="font-bold text-gray-900 dark:text-gray-100">
													{param.label}
												</h3>
												<div className="flex items-center gap-2">
													{/* Visibility Toggle */}
													<button
														type="button"
														onClick={() =>
															handleParamChange(
																idx,
																"isVisible",
																!(param.isVisible ?? true),
															)
														}
														className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
															param.isVisible !== false
																? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50"
																: "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
														}`}
													>
														{param.isVisible !== false ? (
															<>
																<Eye className="w-3 h-3" />
																Visible
															</>
														) : (
															<>
																<EyeOff className="w-3 h-3" />
																Hidden
															</>
														)}
													</button>

													{/* Editable Toggle */}
													<button
														type="button"
														onClick={() =>
															handleParamChange(
																idx,
																"isEditable",
																!(param.isEditable ?? true),
															)
														}
														className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
															param.isEditable !== false
																? "bg-blue-100 text-blue-700 hover:bg-blue-200"
																: "bg-orange-100 text-orange-700 hover:bg-orange-200"
														}`}
													>
														{param.isEditable !== false ? (
															<>
																<Unlock className="w-3 h-3" />
																Editable
															</>
														) : (
															<>
																<Lock className="w-3 h-3" />
																Locked
															</>
														)}
													</button>
												</div>
											</div>

											{/* Default Value */}
											<div className="space-y-2">
												<label
													htmlFor="defaultValue"
													className="block text-sm font-medium text-gray-700 dark:text-gray-300"
												>
													Default Value
													{param.isEditable === false && (
														<span className="text-orange-600 ml-2">
															(User can&apos;t change this)
														</span>
													)}
												</label>
												<input
													type="number"
													value={param.defaultValue}
													onChange={(e) =>
														handleParamChange(
															idx,
															"defaultValue",
															parseFloat(e.target.value) || 0,
														)
													}
													min={param.min}
													max={param.max}
													className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-700 rounded-xl focus:border-blue-500 focus:outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
												/>
												{param.min !== undefined && (
													<p className="text-xs text-gray-500 dark:text-gray-400">
														Range: {param.min} - {param.max}
													</p>
												)}
											</div>

											{/* Status Info */}
											<div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
												<div className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300">
													<div className="w-1 h-1 bg-gray-400 rounded-full mt-1.5"></div>
													<div>
														{param.isVisible === false ? (
															<p className="text-red-600 font-medium">
																⚠️ This parameter is hidden - users won&apos;t
																see it
															</p>
														) : param.isEditable === false ? (
															<p className="text-orange-600 font-medium">
																🔒 This parameter is locked - users can&apos;t
																change the value
															</p>
														) : (
															<p className="text-green-600 font-medium">
																✅ Users can see and modify this parameter
															</p>
														)}
													</div>
												</div>
											</div>
										</div>
									))
								)}
							</div>

							{/* Modal Footer */}
							<div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
								<div className="flex items-center gap-3">
									<motion.button
										whileHover={{ scale: 1.02 }}
										whileTap={{ scale: 0.98 }}
										onClick={() => setEditingIndicator(null)}
										className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-xl transition-all"
									>
										Cancel
									</motion.button>
									<motion.button
										whileHover={{ scale: 1.02 }}
										whileTap={{ scale: 0.98 }}
										onClick={handleSaveParameters}
										className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
									>
										<Save className="w-5 h-5" />
										Save Changes
									</motion.button>
								</div>
							</div>
						</motion.div>
					</>
				)}
			</AnimatePresence>
		</div>
	);
}
