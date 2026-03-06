// @ts-nocheck
"use client";

import { X } from "lucide-react";
import { getCategoryColor } from "./helpers";
import type { Indicator, FormData } from "./types";

interface IndicatorConfigProps {
	indicator: Indicator;
	formData: FormData;
	onRemove: (indicatorName: string) => void;
	onConfigChange: (indicatorName: string, paramName: string, value: number) => void;
}

export default function IndicatorConfig({
	indicator,
	formData,
	onRemove,
	onConfigChange,
}: IndicatorConfigProps) {
	if (!indicator?.parameters || indicator.parameters.length === 0) {
		return null;
	}

	const visibleParams = indicator.parameters.filter((p) => p.isVisible !== false);
	if (visibleParams.length === 0) return null;

	const colorClass = getCategoryColor(indicator.category);

	return (
		<div
			className={`bg-white p-4 rounded-xl border border-${colorClass}-200 shadow-sm dark:bg-gray-900 dark:border-gray-700`}
		>
			<div className="flex items-center justify-between mb-3">
				<div className="flex items-center gap-2">
					<div
						className={`w-6 h-6 bg-${colorClass}-100 rounded-full flex items-center justify-center`}
					>
						<span className={`text-${colorClass}-600 text-xs font-bold`}>
							{indicator.displayName.split(" ")[0]}
						</span>
					</div>
					<label
						htmlFor={indicator.displayName}
						className="text-gray-700 font-semibold text-sm dark:text-gray-200"
					>
						{indicator.displayName}
					</label>
				</div>
				<button
					type="button"
					aria-label={`Remove ${indicator.displayName}`}
					onClick={() => onRemove(indicator.name)}
					className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full p-1 transition-colors"
				>
					<X size={14} />
				</button>
			</div>
			<div
				className={`grid grid-cols-${Math.min(visibleParams.length, 3)} gap-3`}
			>
				{visibleParams.map((param, idx) => (
					<div key={idx}>
						<label
							htmlFor={param.label}
							className="block text-gray-600 font-medium text-xs mb-2 dark:text-gray-300"
						>
							{param.label}
							{param.isEditable === false && (
								<span
									className="ml-1 text-orange-500"
									title="Locked by admin"
								>
									🔒
								</span>
							)}
						</label>
						<input
							type="number"
							value={
								formData.indicatorConfig[indicator.name]?.[param.name] ||
								param.defaultValue
							}
							onChange={(e) => {
								if (param.isEditable === false) return;
								onConfigChange(
									indicator.name,
									param.name,
									parseFloat(e.target.value) || param.defaultValue
								);
							}}
							min={param.min}
							max={param.max}
							disabled={param.isEditable === false}
							className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-${colorClass}-400 focus:ring-1 focus:ring-${colorClass}-400 ${
								param.isEditable === false
									? "bg-gray-100 cursor-not-allowed"
									: ""
							}`}
							placeholder={param.defaultValue?.toString()}
						/>
					</div>
				))}
			</div>
		</div>
	);
}

