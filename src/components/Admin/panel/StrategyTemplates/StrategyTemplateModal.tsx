"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronDown } from "lucide-react";
import { useState } from "react";
import { FormData, StrategyTemplate } from "./types";
import { getDefaultParams } from "./utils";

interface StrategyTemplateModalProps {
	isOpen: boolean;
	editingTemplate: StrategyTemplate | null;
	formData: FormData;
	onClose: () => void;
	onFormDataChange: (data: FormData) => void;
	onSubmit: () => void;
}

const INDICATOR_GROUPS = {
	"Trend Indicators": ["sma", "ema", "wma", "lsma", "psar"],
	"Momentum Indicators": ["rsi", "macd", "stochastic", "williamsR", "cci"],
	"Volatility Indicators": ["bollingerBands", "atr", "halftrend"],
	"Volume Indicators": ["obv", "mfi", "vwap"],
	"Advanced Indicators": ["adx", "supertrend", "orb"],
};

export default function StrategyTemplateModal({
	isOpen,
	editingTemplate,
	formData,
	onClose,
	onFormDataChange,
	onSubmit,
}: StrategyTemplateModalProps) {
	const [activeTab, setActiveTab] = useState<"basic" | "indicators">("basic");
	const [expandedIndicators, setExpandedIndicators] = useState<Set<string>>(
		new Set(formData.indicators.enabled)
	);

	const toggleIndicatorExpand = (indicator: string) => {
		const newExpanded = new Set(expandedIndicators);
		if (newExpanded.has(indicator)) {
			newExpanded.delete(indicator);
		} else {
			newExpanded.add(indicator);
		}
		setExpandedIndicators(newExpanded);
	};

	const toggleIndicator = (indicator: string, checked: boolean) => {
		if (checked) {
			onFormDataChange({
				...formData,
				indicators: {
					...formData.indicators,
					enabled: [...formData.indicators.enabled, indicator],
					configurations: {
						...formData.indicators.configurations,
						[indicator]: {
							parameters: getDefaultParams(indicator),
							isVisible: true,
							isEditable: true,
						},
					},
				},
			});
		} else {
			const newEnabled = formData.indicators.enabled.filter(
				(i) => i !== indicator
			);
			const newConfigs = { ...formData.indicators.configurations };
			delete newConfigs[indicator];
			onFormDataChange({
				...formData,
				indicators: {
					enabled: newEnabled,
					configurations: newConfigs,
				},
			});
		}
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
					onClick={onClose}
				>
					<motion.div
						initial={{ scale: 0.95, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0.95, opacity: 0 }}
						onClick={(e) => e.stopPropagation()}
						className="bg-white dark:bg-slate-900 rounded-xl p-0 w-full max-w-2xl border border-gray-200 dark:border-slate-700 shadow-2xl flex flex-col max-h-[90vh]"
					>
						{/* Header */}
						<div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-900 rounded-t-xl">
							<div>
								<h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
									{editingTemplate ? "Edit Template" : "Create New Template"}
								</h2>
								<p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
									{editingTemplate
										? "Modify your trading strategy template"
										: "Set up your custom trading strategy"}
								</p>
							</div>
							<button
								type="button"
								onClick={onClose}
								className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
							>
								<X className="w-6 h-6" />
							</button>
						</div>

						{/* Tabs */}
						<div className="flex border-b border-gray-200 dark:border-slate-700 px-6">
							<button
								onClick={() => setActiveTab("basic")}
								className={`px-4 py-3 font-medium text-sm transition-all ${
									activeTab === "basic"
										? "text-green-600 dark:text-emerald-400 border-b-2 border-green-600 dark:border-emerald-400"
										: "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
								}`}
							>
								Basic Info
							</button>
							<button
								onClick={() => setActiveTab("indicators")}
								className={`px-4 py-3 font-medium text-sm transition-all ${
									activeTab === "indicators"
										? "text-green-600 dark:text-emerald-400 border-b-2 border-green-600 dark:border-emerald-400"
										: "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
								}`}
							>
								Indicators
								{formData.indicators.enabled.length > 0 && (
									<span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs bg-green-100 dark:bg-emerald-900 text-green-700 dark:text-emerald-300 rounded-full">
										{formData.indicators.enabled.length}
									</span>
								)}
							</button>
						</div>

						{/* Content */}
						<div className="flex-1 overflow-y-auto">
							{/* Basic Info Tab */}
							{activeTab === "basic" && (
								<div className="p-6 space-y-6">
									<div>
										<label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
											Template Name
										</label>
										<input
											type="text"
											value={formData.name}
											onChange={(e) =>
												onFormDataChange({
													...formData,
													name: e.target.value,
												})
											}
											className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-emerald-400 transition-all"
											placeholder="e.g., EMA Crossover Strategy"
										/>
									</div>

									<div>
										<label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
											Description
										</label>
										<textarea
											value={formData.description}
											onChange={(e) =>
												onFormDataChange({
													...formData,
													description: e.target.value,
												})
											}
											className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-emerald-400 transition-all resize-none"
											rows={4}
											placeholder="Describe how this strategy works, entry/exit rules, risk management..."
										/>
										<p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
											{formData.description.length}/500 characters
										</p>
									</div>

									<div>
										<label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
											Strategy Type
										</label>
										<select
											value={formData.tags}
											onChange={(e) =>
												onFormDataChange({
													...formData,
													tags: e.target.value,
												})
											}
											className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-emerald-400 transition-all"
										>
											<option value="normal">Normal (Mid-term)</option>
											<option value="scalping">Scalping (Short-term)</option>
											<option value="trend following">
												Trend Following (Long-term)
											</option>
										</select>
									</div>
								</div>
							)}

							{/* Indicators Tab */}
							{activeTab === "indicators" && (
								<div className="p-6 space-y-6">
									{/* Indicator Selection */}
									<div>
										<h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
											Select Indicators
										</h3>
										<div className="space-y-3">
											{Object.entries(INDICATOR_GROUPS).map(
												([group, indicators]) => (
													<div
														key={group}
														className="bg-gray-50 dark:bg-slate-800 rounded-lg p-3"
													>
														<p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">
															{group}
														</p>
														<div className="grid grid-cols-3 gap-3">
															{indicators.map((indicator) => (
																<label
																	key={indicator}
																	className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-700 rounded-md border border-gray-200 dark:border-slate-600 cursor-pointer hover:bg-green-50 dark:hover:bg-slate-600 transition-colors"
																>
																	<input
																		type="checkbox"
																		checked={formData.indicators.enabled.includes(
																			indicator
																		)}
																		onChange={(e) =>
																			toggleIndicator(
																				indicator,
																				e.target.checked
																			)
																		}
																		className="rounded w-4 h-4 cursor-pointer accent-green-600"
																	/>
																	<span className="text-sm font-medium text-gray-700 dark:text-gray-300">
																		{indicator === "sma"
																			? "SMA"
																			: indicator === "ema"
																				? "EMA"
																				: indicator === "rsi"
																					? "RSI"
																					: indicator === "macd"
																						? "MACD"
																						: indicator === "bollingerBands"
																							? "BB"
																							: indicator === "atr"
																								? "ATR"
																								: indicator === "stochastic"
																									? "Stoch"
																									: indicator === "adx"
																										? "ADX"
																										: indicator === "williamsR"
																											? "Williams %R"
																											: indicator === "cci"
																												? "CCI"
																												: indicator === "psar"
																													? "SAR"
																													: indicator === "vwap"
																														? "VWAP"
																														: indicator === "wma"
																															? "WMA"
																															: indicator === "obv"
																																? "OBV"
																																: indicator === "mfi"
																																	? "MFI"
																																	: indicator === "supertrend"
																																		? "ST"
																																		: indicator === "lsma"
																																			? "LSMA"
																																			: indicator === "halftrend"
																																				? "HT"
																																				: indicator === "orb"
																																					? "ORB"
																																					: indicator.toUpperCase()}
																	</span>
																</label>
															))}
														</div>
													</div>
												)
											)}
										</div>
									</div>

									{/* Parameter Configuration */}
									{formData.indicators.enabled.length > 0 && (
										<div>
											<h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
												Configure Parameters
											</h3>
											<div className="space-y-3">
												{formData.indicators.enabled.map((indicator: string) => {
													const config: any =
														formData.indicators.configurations[indicator];
													const defaultParams = getDefaultParams(indicator);
													const isExpanded =
														expandedIndicators.has(indicator);

													return (
														<div
															key={indicator}
															className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden"
														>
															<button
																onClick={() =>
																	toggleIndicatorExpand(indicator)
																}
																className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
															>
																<div className="flex items-center gap-3">
																	<span className="font-semibold text-gray-900 dark:text-gray-100">
																		{indicator.toUpperCase()}
																	</span>
																	<span className="text-xs px-2 py-1 bg-green-100 dark:bg-emerald-900 text-green-700 dark:text-emerald-300 rounded-full">
																		{Object.keys(
																			defaultParams
																		).length}{" "}
																		params
																	</span>
																</div>
																<div className="flex items-center gap-3">
																	<label
																		onClick={(e) =>
																			e.stopPropagation()
																		}
																		className="flex items-center gap-2 text-xs"
																	>
																		<input
																			type="checkbox"
																			checked={
																				config?.isVisible ||
																				false
																			}
																			onChange={(e) => {
																				onFormDataChange({
																					...formData,
																					indicators: {
																						...formData.indicators,
																						configurations:
																							{
																								...formData
																									.indicators
																									.configurations,
																								[indicator]: {
																									...config,
																									isVisible:
																										e
																											.target
																											.checked,
																								},
																							},
																					},
																				});
																			}}
																			className="rounded w-4 h-4 accent-green-600"
																		/>
																		<span className="text-gray-600 dark:text-gray-400">
																			Visible
																		</span>
																	</label>
																	<label
																		onClick={(e) =>
																			e.stopPropagation()
																		}
																		className="flex items-center gap-2 text-xs"
																	>
																		<input
																			type="checkbox"
																			checked={
																				config?.isEditable ||
																				false
																			}
																			onChange={(e) => {
																				onFormDataChange({
																					...formData,
																					indicators: {
																						...formData.indicators,
																						configurations:
																							{
																								...formData
																									.indicators
																									.configurations,
																								[indicator]: {
																									...config,
																									isEditable:
																										e
																											.target
																											.checked,
																								},
																							},
																					},
																				});
																			}}
																			className="rounded w-4 h-4 accent-green-600"
																		/>
																		<span className="text-gray-600 dark:text-gray-400">
																			Editable
																		</span>
																	</label>
																	<ChevronDown
																		className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform ${
																			isExpanded
																				? "rotate-180"
																				: ""
																		}`}
																	/>
																</div>
															</button>

															{isExpanded && (
																<div className="p-4 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700">
																	<div className="grid grid-cols-2 gap-4">
																		{Object.entries(
																			defaultParams
																		).map(([param, value]) => (
																			<div
																				key={param}
																			>
																				<label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
																					{param}
																				</label>
																				<input
																					type="number"
																					value={
																						config?.parameters?.[
																							param
																						] ?? value
																					}
																					onChange={(e) => {
																						onFormDataChange({
																							...formData,
																							indicators:
																								{
																									...formData.indicators,
																									configurations:
																										{
																											...formData
																												.indicators
																												.configurations,
																											[indicator]:
																												{
																													...config,
																													parameters:
																														{
																															...config?.parameters,
																															[param]:
																																parseFloat(
																																	e
																																		.target
																																		.value
																																) ||
																																value,
																														},
																													},
																										},
																								},
																						});
																					}}
																					className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-emerald-400 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 transition-all"
																					step="any"
																				/>
																			</div>
																		))}
																	</div>
																</div>
															)}
														</div>
													);
												})}
											</div>
										</div>
									)}

									{formData.indicators.enabled.length === 0 && (
										<div className="text-center py-12">
											<p className="text-gray-500 dark:text-gray-400">
												Select indicators from above to configure parameters
											</p>
										</div>
									)}
								</div>
							)}
						</div>

						{/* Footer */}
						<div className="flex gap-3 p-6 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
							<button
								type="button"
								onClick={onClose}
								className="flex-1 px-4 py-3 bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={onSubmit}
								className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 dark:from-emerald-600 dark:to-emerald-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity shadow-lg hover:shadow-xl"
							>
								{editingTemplate ? "Update Template" : "Create Template"}
							</button>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}