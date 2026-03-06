// @ts-nocheck
"use client";

import { motion } from "framer-motion";
import { ArrowUpDown, BarChart3, TrendingUp, Zap, Sparkles, Layers, ChevronDown, AlertCircle, Clock } from "lucide-react";
import SymbolSearch from "../SymbolSearch";
import { TIMEFRAMES } from "./constants";
import IndicatorConfig from "./IndicatorConfig";
import type { FormData, Indicator, Template } from "./types";

interface Step1Props {
	formData: FormData;
	templates: Template[];
	selectedTemplate: string | null;
	templateDetails: any;
	indicatorOverrides: Record<string, any>;
	availableIndicators: Indicator[];
	onInputChange: (field: string, value: any) => void;
	onTemplateSelect: (templateId: string) => Promise<void>;
	onSymbolSelect: (instrument: any) => Promise<void>;
	onIndicatorRemove: (indicatorName: string) => void;
	onIndicatorConfigChange: (indicatorName: string, paramName: string, value: number) => void;
	onIndicatorOverrideChange: (indicator: string, param: string, value: number) => void;
	containerVariants: any;
}

export default function Step1({
	formData,
	templates,
	selectedTemplate,
	templateDetails,
	indicatorOverrides,
	availableIndicators,
	onInputChange,
	onTemplateSelect,
	onSymbolSelect,
	onIndicatorRemove,
	onIndicatorConfigChange,
	onIndicatorOverrideChange,
	containerVariants,
}: Step1Props) {
	return (
		<motion.div
			key="step1"
			variants={containerVariants}
			initial="hidden"
			animate="visible"
			exit="exit"
			className="space-y-8"
		>
			{/* Template Selection */}
			<div className="space-y-4">
				<div className="flex items-center gap-3">
					<div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-blue-500 rounded-full"></div>
					<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
						Strategy Template
					</h3>
					<span className="text-red-500 text-sm font-medium">*</span>
				</div>
				<div className="relative">
					<select
						value={selectedTemplate || ""}
						onChange={(e) => onTemplateSelect(e.target.value)}
						required
						className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border rounded-lg text-gray-900 dark:text-gray-50 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-gray-300 dark:hover:border-gray-600 ${
							!selectedTemplate ? "border-red-300 dark:border-red-700" : "border-gray-200 dark:border-gray-700"
						}`}
					>
						<option value="">Select a template...</option>
						{templates.map((template) => (
							<option key={template._id} value={template._id}>
								{template.name} ({template.type}) • Used {template.usageCount || 0}x
							</option>
						))}
					</select>
					<ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
				</div>
				{!selectedTemplate && (
					<p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
						<AlertCircle className="w-3 h-3" />
						Template selection is required
					</p>
				)}

				{/* Template Details Card */}
				{templateDetails && (
					<motion.div
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						className="mt-6 p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow"
					>
						<div className="flex items-start gap-4 mb-6">
							<div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
								<Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
							</div>
							<div className="flex-1 min-w-0">
								<h4 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-1">
									{templateDetails?.name ?? ""}
								</h4>
								<p className="text-sm text-gray-600 dark:text-gray-400">
									{templateDetails?.description ?? ""}
								</p>
							</div>
						</div>

						{/* Indicators Grid */}
						{templateDetails?.indicators?.configurations && (
							<div>
								<h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
									Included Indicators
								</h5>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									{Object.entries(templateDetails.indicators.configurations)
										.filter(([, config]: [string, any]) => config?.isVisible !== false)
										.map(([indicator, config]: [string, any]) => (
											<motion.div
												key={indicator}
												whileHover={{ y: -2 }}
												className="p-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg transition-all hover:border-gray-300 dark:hover:border-gray-500"
											>
												<div className="font-semibold text-sm text-blue-700 dark:text-blue-400 mb-3">
													{indicator.toUpperCase()}
												</div>
												<div className="space-y-2">
													{Object.entries(config.parameters).map(([param, value]: [string, any]) => (
														<div key={param} className="flex items-center justify-between">
															<span className="text-xs font-medium text-gray-600 dark:text-gray-400">
																{param}
															</span>
															{config.isEditable ? (
																<input
																	type="number"
																	value={indicatorOverrides[indicator]?.[param] ?? value}
																	onChange={(e) =>
																		onIndicatorOverrideChange(
																			indicator,
																			param,
																			parseFloat(e.target.value) || 0
																		)
																	}
																	min={config.validationRules?.[param]?.min}
																	max={config.validationRules?.[param]?.max}
																	className="w-16 px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
																/>
															) : (
																<span className="text-xs font-semibold text-gray-900 dark:text-gray-200">
																	{value}
																</span>
															)}
														</div>
													))}
												</div>
											</motion.div>
										))}
								</div>
							</div>
						)}
					</motion.div>
				)}
			</div>

			{/* Trading Symbol & Timeframe */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Symbol Selection */}
				<div className="space-y-4">
					<div className="flex items-center gap-3">
						<div className="w-1 h-6 bg-gradient-to-b from-indigo-600 to-indigo-500 rounded-full"></div>
						<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
							Trading Symbol
						</h3>
						<span className="text-red-500 text-sm font-medium">*</span>
					</div>

					<SymbolSearch
						onSymbolSelect={onSymbolSelect}
						placeholder={
							formData.strategyType === "options"
								? "Search for index symbols... (e.g., NIFTY 50, NIFTY BANK)"
								: "Search for symbols... (e.g., RELIANCE, TCS, INFY)"
						}
						exchangeSegment={null}
						strategyType={formData.strategyType}
						className="w-full"
					/>

					{formData.selectedInstrument && (
						<motion.div
							initial={{ opacity: 0, y: -8 }}
							animate={{ opacity: 1, y: 0 }}
							className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg"
						>
							<div className="flex items-start gap-3">
								<div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-1.5 flex-shrink-0"></div>
								<div className="flex-1 min-w-0">
									<div className="font-semibold text-sm text-indigo-900 dark:text-indigo-100">
										{formData.selectedInstrument.name}
									</div>
									<div className="text-xs text-indigo-700 dark:text-indigo-300 mt-0.5">
										{formData.selectedInstrument.description} • ID: {formData.selectedInstrument.exchangeInstrumentID || formData.selectedInstrument.instrumentToken}
									</div>
								</div>
							</div>
						</motion.div>
					)}
					{!formData.selectedInstrument && (
						<p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
							<AlertCircle className="w-3 h-3" />
							Symbol selection is required
						</p>
					)}
				</div>

				{/* Timeframe */}
				<div className="space-y-4">
					<div className="flex items-center gap-3">
						<div className="w-1 h-6 bg-gradient-to-b from-purple-600 to-purple-500 rounded-full"></div>
						<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
							Timeframe
						</h3>
						<span className="text-red-500 text-sm font-medium">*</span>
					</div>

					<div className="relative">
						<select
							value={formData.timeframe}
							onChange={(e) => onInputChange("timeframe", e.target.value)}
							required
							className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-50 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-gray-300 dark:hover:border-gray-600"
						>
							{TIMEFRAMES.map((tf) => (
								<option key={tf.value} value={tf.value}>
									{tf.label}
								</option>
							))}
						</select>
						<ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
					</div>

					<div className="flex items-start gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
						<Clock className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
						<p className="text-xs text-purple-700 dark:text-purple-300">
							Select the timeframe for your strategy to analyze market data
						</p>
					</div>
				</div>
			</div>

			{/* Strategy & Signals Configuration */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
				{/* Strategy Type */}
				<div className="space-y-4">
					<div className="flex items-center gap-3">
						<div className="w-1 h-6 bg-gradient-to-b from-emerald-600 to-emerald-500 rounded-full"></div>
						<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
							Strategy Type
						</h3>
					</div>
					<div className="grid grid-cols-3 gap-3">
						{[
							{ value: "stocks", label: "Stocks", icon: TrendingUp, color: "emerald" },
							{ value: "futures", label: "Futures", icon: BarChart3, color: "blue" },
							{ value: "options", label: "Options", icon: BarChart3, color: "purple" },
						].map(({ value, label, icon: Icon, color }) => {
							const isSelected = formData.strategyType === value || (value === "stocks" && formData.strategyType === "normal");
							const colorMap = {
								emerald: { bg: "bg-emerald-50", border: "border-emerald-300", icon: "text-emerald-600", darkBg: "dark:bg-emerald-900/10", darkBorder: "dark:border-emerald-800", darkIcon: "dark:text-emerald-400" },
								blue: { bg: "bg-blue-50", border: "border-blue-300", icon: "text-blue-600", darkBg: "dark:bg-blue-900/10", darkBorder: "dark:border-blue-800", darkIcon: "dark:text-blue-400" },
								purple: { bg: "bg-purple-50", border: "border-purple-300", icon: "text-purple-600", darkBg: "dark:bg-purple-900/10", darkBorder: "dark:border-purple-800", darkIcon: "dark:text-purple-400" },
							};
							const colors = colorMap[color as keyof typeof colorMap];

							return (
								<motion.button
									key={value}
									whileHover={{ y: -4 }}
									whileTap={{ scale: 0.98 }}
									onClick={() => onInputChange("strategyType", value)}
									className={`relative p-4 rounded-lg border-2 font-medium transition-all ${
										isSelected
											? `${colors.border} ${colors.bg} ${colors.darkBg} ${colors.darkBorder} text-gray-900 dark:text-gray-50 shadow-md`
											: "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
									}`}
								>
									<div className="flex flex-col items-center gap-2.5">
										<Icon
											size={22}
											className={isSelected ? colors.icon + " " + colors.darkIcon : "text-gray-400 dark:text-gray-600"}
										/>
										<span className="text-sm">{label}</span>
									</div>
									{isSelected && (
										<motion.div
											layoutId="strategyIndicator"
											className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gray-900 to-transparent dark:via-gray-50"
											initial={{ scaleX: 0 }}
											animate={{ scaleX: 1 }}
										/>
									)}
								</motion.button>
							);
						})}
					</div>
				</div>

				{/* Signals Type */}
				<div className="space-y-4">
					<div className="flex items-center gap-3">
						<div className="w-1 h-6 bg-gradient-to-b from-orange-600 to-orange-500 rounded-full"></div>
						<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
							Signal Type
						</h3>
					</div>
					<div className="grid grid-cols-2 gap-3">
						{[
							{ value: "candleClose", label: "Candle Close", icon: Zap, color: "orange" },
							{ value: "highLow", label: "High Low", icon: ArrowUpDown, color: "indigo" },
						].map(({ value, label, icon: Icon, color }) => {
							const isSelected = formData.signalsType === value || (value === "highLow" && formData.signalsType === "highLowBreak");
							const colorMap = {
								orange: { bg: "bg-orange-50", border: "border-orange-300", icon: "text-orange-600", darkBg: "dark:bg-orange-900/10", darkBorder: "dark:border-orange-800", darkIcon: "dark:text-orange-400" },
								indigo: { bg: "bg-indigo-50", border: "border-indigo-300", icon: "text-indigo-600", darkBg: "dark:bg-indigo-900/10", darkBorder: "dark:border-indigo-800", darkIcon: "dark:text-indigo-400" },
							};
							const colors = colorMap[color as keyof typeof colorMap];

							return (
								<motion.button
									key={value}
									whileHover={{ y: -4 }}
									whileTap={{ scale: 0.98 }}
									onClick={() => onInputChange("signalsType", value)}
									className={`relative p-4 rounded-lg border-2 font-medium transition-all ${
										isSelected
											? `${colors.border} ${colors.bg} ${colors.darkBg} ${colors.darkBorder} text-gray-900 dark:text-gray-50 shadow-md`
											: "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
									}`}
								>
									<div className="flex flex-col items-center gap-2.5">
										<Icon
											size={22}
											className={isSelected ? colors.icon + " " + colors.darkIcon : "text-gray-400 dark:text-gray-600"}
										/>
										<span className="text-sm">{label}</span>
									</div>
									{isSelected && (
										<motion.div
											layoutId="signalIndicator"
											className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gray-900 to-transparent dark:via-gray-50"
											initial={{ scaleX: 0 }}
											animate={{ scaleX: 1 }}
										/>
									)}
								</motion.button>
							);
						})}
					</div>
				</div>
			</div>

			{/* Indicator Configuration Section */}
			{formData.selectedIndicators.length > 0 && (
				<motion.div
					initial={{ opacity: 0, height: 0 }}
					animate={{ opacity: 1, height: "auto" }}
					className="space-y-4"
				>
					<div className="flex items-center gap-3">
						<div className="w-1 h-6 bg-gradient-to-b from-indigo-600 to-indigo-500 rounded-full"></div>
						<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
							Indicator Settings
						</h3>
					</div>

					{availableIndicators.length > 0 ? (
						<div className="space-y-3">
							{formData.selectedIndicators.map((indicatorName) => {
								const indicator = availableIndicators.find((ind) => ind.name === indicatorName);
								if (!indicator) return null;
								return (
									<IndicatorConfig
										key={indicatorName}
										indicator={indicator}
										formData={formData}
										onRemove={onIndicatorRemove}
										onConfigChange={onIndicatorConfigChange}
									/>
								);
							})}
						</div>
					) : (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
						>
							<div className="flex items-start gap-3">
								<span className="text-lg">⚠️</span>
								<div>
									<p className="font-semibold text-sm text-amber-900 dark:text-amber-100">
										No indicators available
									</p>
									<p className="text-xs text-amber-700 dark:text-amber-200 mt-1">
										Please contact administrator to initialize indicators
									</p>
								</div>
							</div>
						</motion.div>
					)}
				</motion.div>
			)}
		</motion.div>
	);
}