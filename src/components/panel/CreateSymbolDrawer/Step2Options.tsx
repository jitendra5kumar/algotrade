// @ts-nocheck
"use client";

import { motion } from "framer-motion";
import { PRODUCT_TYPES, ORDER_TYPES, TRADE_MODES } from "./constants";
import type { FormData } from "./types";

interface Step2OptionsProps {
	formData: FormData;
	loadingExpiries: boolean;
	availableExpiries: string[];
	onInputChange: (field: string, value: any) => void;
	onSymbolSelect: (instrument: any) => Promise<void>;
}

export default function Step2Options({
	formData,
	loadingExpiries,
	availableExpiries,
	onInputChange,
	onSymbolSelect,
}: Step2OptionsProps) {
	return (
		<>
			{/* Select Expiry */}
			<div>
				<label className="block text-gray-800 font-bold mb-3 text-sm dark:text-gray-200">
					Select Expiry {!formData.selectedInstrument && <span className="text-gray-400 text-xs">(Select symbol first)</span>}
				</label>
				{loadingExpiries ? (
					<div className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl bg-gray-50 dark:border-gray-700 dark:bg-gray-900 flex items-center justify-center">
						<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
						<span className="ml-2 text-gray-600 dark:text-gray-400">Loading expiries...</span>
					</div>
				) : availableExpiries.length > 0 ? (
					<select
						value={formData.expiry}
						onChange={(e) => onInputChange("expiry", e.target.value)}
						className="w-full px-4 py-3 border-2 border-gray-200 hover:border-green-400 focus:border-green-500 focus:outline-none rounded-xl transition-all bg-gray-50/50 hover:bg-white focus:bg-white font-medium text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 dark:focus:bg-gray-800 dark:text-gray-100"
					>
						<option value="">Select Expiry</option>
						{availableExpiries.map((expiry) => (
							<option key={expiry} value={expiry}>
								{new Date(expiry).toLocaleDateString('en-IN', { 
									year: 'numeric', 
									month: 'short', 
									day: 'numeric' 
								})}
							</option>
						))}
					</select>
				) : formData.selectedInstrument ? (
					<div className="w-full px-4 py-3 border-2 border-yellow-200 rounded-xl bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 text-sm">
						No expiries found for this symbol. Please select a different symbol.
					</div>
				) : (
					<input
						type="date"
						value={formData.expiry}
						onChange={(e) => onInputChange("expiry", e.target.value)}
						disabled
						className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl transition-all bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 cursor-not-allowed"
						placeholder="Select symbol first"
					/>
				)}
			</div>

			{/* Trade Mode */}
			<div>
				<label className="block text-gray-800 font-bold mb-3 text-sm dark:text-gray-200">
					Trade Mode
				</label>
				<div className="grid grid-cols-3 gap-2">
					{TRADE_MODES.map((mode) => (
						<motion.button
							key={mode.value}
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
							onClick={() => onInputChange("tradeMode", mode.value)}
							className={`p-3 rounded-xl border-2 transition-all duration-300 ${
								formData.tradeMode === mode.value
									? "border-green-400 bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-200 dark:border-green-600"
									: "border-gray-200 bg-white hover:border-gray-300 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300"
							}`}
						>
							<div className="font-bold text-sm">{mode.label}</div>
							<div className="text-xs text-gray-500 dark:text-gray-400">{mode.desc}</div>
						</motion.button>
					))}
				</div>
			</div>

			{/* Gap Input for ITM/OTM */}
			{(formData.tradeMode === "itm" || formData.tradeMode === "otm") && (
				<motion.div
					initial={{ opacity: 0, height: 0 }}
					animate={{ opacity: 1, height: "auto" }}
					className="space-y-2"
				>
					<label className="block text-gray-800 font-bold text-sm dark:text-gray-200">
						Gap
					</label>
					<input
						type="number"
						placeholder="Enter gap value"
						value={formData.gap}
						onChange={(e) => onInputChange("gap", e.target.value)}
						className="w-full px-4 py-4 border-2 border-gray-200 hover:border-green-400 focus:border-green-500 focus:outline-none rounded-xl transition-all bg-gray-50/50 hover:bg-white focus:bg-white font-medium text-gray-900 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 dark:focus:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
					/>
				</motion.div>
			)}

			{/* Stoploss - Same as stocks */}
			<div>
				<div className="flex items-center justify-between mb-3">
					<label className="block text-gray-800 font-bold text-sm dark:text-gray-200">
						Stoploss
					</label>
					<motion.button
						whileTap={{ scale: 0.95 }}
						onClick={() => onInputChange("stoplossEnabled", !formData.stoplossEnabled)}
						className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
							formData.stoplossEnabled ? "bg-green-500" : "bg-gray-300"
						}`}
					>
						<motion.span
							animate={{ x: formData.stoplossEnabled ? 22 : 2 }}
							transition={{ type: "spring", stiffness: 500, damping: 30 }}
							className="inline-block h-4 w-4 transform rounded-full bg-white shadow-lg"
						/>
					</motion.button>
				</div>
				{formData.stoplossEnabled && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
						className="space-y-3"
					>
							<div className="flex gap-4">
								<label className="flex items-center gap-2 cursor-pointer">
									<input
										type="radio"
										name="stoplossTypeOptions"
										value="points"
										checked={(formData.stoplossType || "points") === "points"}
										onChange={(e) => onInputChange("stoplossType", e.target.value)}
										className="w-4 h-4 text-green-600 focus:ring-green-500"
									/>
									<span className="text-sm font-medium text-gray-700 dark:text-gray-300">Points</span>
								</label>
								<label className="flex items-center gap-2 cursor-pointer">
									<input
										type="radio"
										name="stoplossTypeOptions"
										value="percentage"
										checked={(formData.stoplossType || "points") === "percentage"}
										onChange={(e) => onInputChange("stoplossType", e.target.value)}
										className="w-4 h-4 text-green-600 focus:ring-green-500"
									/>
									<span className="text-sm font-medium text-gray-700 dark:text-gray-300">Percentage</span>
								</label>
							</div>
							<input
								type="number"
								step={(formData.stoplossType || "points") === "percentage" ? "0.1" : "1"}
								placeholder={(formData.stoplossType || "points") === "points" ? "Enter stoploss in points" : "Enter stoploss in %"}
							value={formData.stoploss}
							onChange={(e) => onInputChange("stoploss", e.target.value)}
							className="w-full px-4 py-4 border-2 border-gray-200 hover:border-green-400 focus:border-green-500 focus:outline-none rounded-xl transition-all bg-gray-50/50 hover:bg-white focus:bg-white font-medium text-gray-900 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 dark:focus:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
						/>
					</motion.div>
				)}
			</div>

			{/* Target - Same as stocks */}
			<div>
				<div className="flex items-center justify-between mb-3">
					<label className="block text-gray-800 font-bold text-sm dark:text-gray-200">
						Target
					</label>
					<motion.button
						whileTap={{ scale: 0.95 }}
						onClick={() => onInputChange("targetEnabled", !formData.targetEnabled)}
						className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
							formData.targetEnabled ? "bg-green-500" : "bg-gray-300"
						}`}
					>
						<motion.span
							animate={{ x: formData.targetEnabled ? 22 : 2 }}
							transition={{ type: "spring", stiffness: 500, damping: 30 }}
							className="inline-block h-4 w-4 transform rounded-full bg-white shadow-lg"
						/>
					</motion.button>
				</div>
				{formData.targetEnabled && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
						className="space-y-3"
					>
							<div className="flex gap-4">
								<label className="flex items-center gap-2 cursor-pointer">
									<input
										type="radio"
										name="targetType"
										value="points"
										checked={(formData.targetType || "points") === "points"}
										onChange={(e) => onInputChange("targetType", e.target.value)}
										className="w-4 h-4 text-green-600 focus:ring-green-500"
									/>
									<span className="text-sm font-medium text-gray-700 dark:text-gray-300">Points</span>
								</label>
								<label className="flex items-center gap-2 cursor-pointer">
									<input
										type="radio"
										name="targetType"
										value="percentage"
										checked={(formData.targetType || "points") === "percentage"}
										onChange={(e) => onInputChange("targetType", e.target.value)}
										className="w-4 h-4 text-green-600 focus:ring-green-500"
									/>
									<span className="text-sm font-medium text-gray-700 dark:text-gray-300">Percentage</span>
								</label>
							</div>
							<input
								type="number"
								step={(formData.targetType || "points") === "percentage" ? "0.1" : "1"}
								placeholder={(formData.targetType || "points") === "points" ? "Enter target in points" : "Enter target in %"}
							value={formData.target}
							onChange={(e) => onInputChange("target", e.target.value)}
							className="w-full px-4 py-4 border-2 border-gray-200 hover:border-green-400 focus:border-green-500 focus:outline-none rounded-xl transition-all bg-gray-50/50 hover:bg-white focus:bg-white font-medium text-gray-900 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 dark:focus:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
						/>
					</motion.div>
				)}
			</div>

			{/* Product Type & Order Type */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<div>
					<label className="block text-gray-800 font-bold mb-3 text-sm dark:text-gray-200">
						Product Type
					</label>
					<select
						value={formData.productType}
						onChange={(e) => onInputChange("productType", e.target.value)}
						className="w-full px-4 py-4 border-2 border-gray-200 hover:border-green-400 focus:border-green-500 focus:outline-none rounded-xl transition-all bg-gray-50/50 hover:bg-white focus:bg-white font-medium text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 dark:focus:bg-gray-800 dark:text-gray-100"
					>
						<option value="">Select product type</option>
						{PRODUCT_TYPES.filter((pt) => {
							// For options: show only MIS and NRML
							return pt.value === "mis" || pt.value === "nrml";
						}).map((pt) => (
							<option key={pt.value} value={pt.value}>
								{pt.label}
							</option>
						))}
					</select>
				</div>
				<div>
					<label className="block text-gray-800 font-bold mb-3 text-sm dark:text-gray-200">
						Order Type
					</label>
					<select
						value={formData.orderType}
						onChange={(e) => onInputChange("orderType", e.target.value)}
						className="w-full px-4 py-4 border-2 border-gray-200 hover:border-green-400 focus:border-green-500 focus:outline-none rounded-xl transition-all bg-gray-50/50 hover:bg-white focus:bg-white font-medium text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 dark:focus:bg-gray-800 dark:text-gray-100"
					>
						<option value="">Select order type</option>
						{ORDER_TYPES.map((ot) => (
							<option key={ot.value} value={ot.value}>
								{ot.label}
							</option>
						))}
					</select>
				</div>
			</div>

			{/* Quantity */}
			<div>
				<label className="block text-gray-800 font-bold mb-3 text-sm dark:text-gray-200">
					Quantity
				</label>
				<input
					type="number"
					placeholder="Enter quantity"
					value={formData.qty}
					onChange={(e) => onInputChange("qty", e.target.value)}
					className="w-full px-4 py-4 border-2 border-gray-200 hover:border-green-400 focus:border-green-500 focus:outline-none rounded-xl transition-all bg-gray-50/50 hover:bg-white focus:bg-white font-medium text-gray-900 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 dark:focus:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
				/>
			</div>

			{/* Intraday Trading Settings - Same as stocks */}
			<div className="border-t border-gray-200 dark:border-gray-700 pt-6">
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
						Intraday Trading Settings
					</h3>
					<motion.button
						whileTap={{ scale: 0.95 }}
						onClick={() => onInputChange("intradayEnabled", !formData.intradayEnabled)}
						className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
							formData.intradayEnabled ? "bg-green-500" : "bg-gray-300"
						}`}
					>
						<motion.span
							animate={{ x: formData.intradayEnabled ? 22 : 2 }}
							transition={{ type: "spring", stiffness: 500, damping: 30 }}
							className="inline-block h-4 w-4 transform rounded-full bg-white shadow-lg"
						/>
					</motion.button>
				</div>

				{formData.intradayEnabled && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
						className="space-y-4"
					>
						{/* Trading Window */}
						<div>
							<div className="flex items-center justify-between mb-3">
								<label className="block text-gray-700 font-semibold text-sm dark:text-gray-200">
									Trading Window
								</label>
								<motion.button
									whileTap={{ scale: 0.95 }}
									onClick={() => onInputChange("tradingWindowEnabled", !formData.tradingWindowEnabled)}
									className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
										formData.tradingWindowEnabled ? "bg-blue-500" : "bg-gray-300"
									}`}
								>
									<motion.span
										animate={{ x: formData.tradingWindowEnabled ? 18 : 2 }}
										transition={{ type: "spring", stiffness: 500, damping: 30 }}
										className="inline-block h-3 w-3 transform rounded-full bg-white shadow-lg"
									/>
								</motion.button>
							</div>
							{formData.tradingWindowEnabled && (
								<motion.div
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: "auto" }}
									exit={{ opacity: 0, height: 0 }}
									className="grid grid-cols-2 gap-3"
								>
									<div>
										<label className="block text-gray-600 font-medium text-xs mb-2 dark:text-gray-300">
											Start Time
										</label>
										<input
											type="time"
											value={formData.tradingStartTime}
											onChange={(e) => onInputChange("tradingStartTime", e.target.value)}
											className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
										/>
									</div>
									<div>
										<label className="block text-gray-600 font-medium text-xs mb-2 dark:text-gray-300">
											End Time
										</label>
										<input
											type="time"
											value={formData.tradingEndTime}
											onChange={(e) => onInputChange("tradingEndTime", e.target.value)}
											className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
										/>
									</div>
								</motion.div>
							)}
						</div>

						{/* Square Off Time */}
						<div>
							<label className="block text-gray-700 font-semibold text-sm mb-2 dark:text-gray-200">
								Square Off Time (Optional)
							</label>
							<input
								type="time"
								value={formData.squareOffTime}
								onChange={(e) => onInputChange("squareOffTime", e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
								placeholder="e.g., 15:25"
							/>
							<p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
								Auto square-off at this time (leave empty to disable)
							</p>
						</div>

						{/* Risk Management */}
						<div className="grid grid-cols-2 gap-3">
							<div>
								<label className="block text-gray-700 font-semibold text-sm mb-2 dark:text-gray-200">
									Trailing Stop Loss %
								</label>
								<input
									type="number"
									step="0.1"
									value={formData.trailingStopLoss}
									onChange={(e) => onInputChange("trailingStopLoss", e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
									placeholder="e.g., 1.5"
								/>
							</div>
							<div>
								<label className="block text-gray-700 font-semibold text-sm mb-2 dark:text-gray-200">
									Max Risk Per Trade %
								</label>
								<input
									type="number"
									step="0.1"
									value={formData.maxRiskPerTradePercent}
									onChange={(e) => onInputChange("maxRiskPerTradePercent", e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
									placeholder="e.g., 2.0"
								/>
							</div>
						</div>
					</motion.div>
				)}
			</div>
		</>
	);
}

