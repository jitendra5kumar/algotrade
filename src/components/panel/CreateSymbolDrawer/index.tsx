// @ts-nocheck
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle, Plus, X } from "lucide-react";
import React, { useState } from "react";
import { getTemplateDetails } from "@/lib/template-api";
import { DEFAULT_FORM_DATA } from "./constants";
import { getDefaultProductType } from "./helpers";
import { useIndicators, useTemplates, useTemplateSelection, useFormData, useExpiries } from "./hooks";
import Step1 from "./Step1";
import Step2Stocks from "./Step2Stocks";
import Step2Options from "./Step2Options";
import type { CreateSymbolDrawerProps, FormData } from "./types";

export default function CreateSymbolDrawer({
	isOpen,
	onClose,
	onSubmit,
	editData,
}: CreateSymbolDrawerProps) {
	const [currentStep, setCurrentStep] = useState(1);
	
	// Custom hooks
	const availableIndicators = useIndicators(isOpen);
	const templates = useTemplates(isOpen);
	const { selectedTemplate, setSelectedTemplate, templateDetails, setTemplateDetails, indicatorOverrides, setIndicatorOverrides } = useTemplateSelection(editData, isOpen, templates);
	const { formData, setFormData } = useFormData(editData, isOpen);
	const { availableExpiries, loadingExpiries, fetchExpiries, setAvailableExpiries } = useExpiries();

	const handleInputChange = (field: string, value: any) => {
		setFormData((prev: FormData) => ({
			...prev,
			[field]: value,
		}));
	};

	const handleSymbolSelect = async (instrument: any) => {
		const isOptionsStrategy = formData.strategyType === "options";
		
		// Auto-correct exchangeSegment for all index instruments - should be NSECM (1) with series INDEX
		// Index instruments come from index_instruments collection and have isIndex: true flag
		let exchangeSegment = instrument.exchangeSegment || "NSECM";
		if (instrument.isIndex === true || instrument.exchangeName === 'NSE INDEX') {
			exchangeSegment = "NSECM"; // Force NSECM for all index instruments
			// Update instrument object to ensure correct segment
			instrument.exchangeSegment = "NSECM";
		}
		
		const defaultProductType = getDefaultProductType(exchangeSegment);
		const defaultOrderType = "market";

		let defaultQuantity = "";
		if (exchangeSegment === "NSECM" || exchangeSegment === "BSECM") {
			if (instrument.lotSize || instrument.LotSize) {
				defaultQuantity = (instrument.lotSize || instrument.LotSize).toString();
			} else if (instrument.exchangeInstrumentID) {
				try {
					const { getInstrumentByToken } = await import("@/lib/instrument-api");
					const response = await getInstrumentByToken(instrument.exchangeInstrumentID);
					if (response.success && response.data?.lotSize) {
						defaultQuantity = response.data.lotSize.toString();
					}
				} catch (error) {
					console.error("Error fetching lotSize:", error);
				}
			}
		}

		setFormData((prev: FormData) => ({
			...prev,
			symbol: instrument.name,
			selectedInstrument: instrument,
			productType: prev.productType || defaultProductType,
			orderType: prev.orderType || defaultOrderType,
			qty: prev.qty || defaultQuantity,
		}));

		if (isOptionsStrategy && instrument.name) {
			const expiries = await fetchExpiries(instrument.name);
			if (expiries.length > 0) {
				setFormData((prev: FormData) => ({
					...prev,
					expiry: expiries[0],
				}));
			}
		} else {
			setAvailableExpiries([]);
		}
	};

	const validateStep = () => {
		if (currentStep === 1) {
			return selectedTemplate && formData.strategyType && formData.signalsType && formData.symbol && formData.timeframe;
		}
		if (currentStep === 2) {
			return formData.productType && formData.orderType && formData.qty;
		}
		return false;
	};

	const handleNext = () => {
		if (validateStep()) {
			if (currentStep < 2) {
				setCurrentStep(currentStep + 1);
			} else {
				handleSubmit();
			}
		}
	};

	const handlePrev = () => {
		if (currentStep > 1) {
			setCurrentStep(currentStep - 1);
		}
	};

	const handleTemplateSelect = async (templateId: string) => {
		if (!templateId) {
			setSelectedTemplate(null);
			setTemplateDetails(null);
			setIndicatorOverrides({});
			setFormData((prev: FormData) => ({
				...prev,
				selectedIndicators: [],
				indicatorConfig: DEFAULT_FORM_DATA.indicatorConfig,
			}));
			return;
		}

		try {
			const response = await getTemplateDetails(templateId);
			if (response.success) {
				setSelectedTemplate(templateId);
				setTemplateDetails(response.data);
				const preFilledConfig: Record<string, any> = {};
				const visibleIndicators: string[] = [];

				for (const [key, config] of Object.entries(response.data.indicators.configurations)) {
					if ((config as any).isVisible !== false) {
						preFilledConfig[key] = (config as any).parameters;
						visibleIndicators.push(key);
					}
				}

				setFormData((prev: FormData) => ({
					...prev,
					selectedIndicators: visibleIndicators,
					indicatorConfig: preFilledConfig,
				}));
			}
		} catch (error) {
			console.error("Error fetching template details:", error);
		}
	};

	const handleSubmit = async () => {
		try {
			const submitData = {
				...formData,
				stoplossType: formData.stoplossType || "points",
				targetType: formData.targetType || "points",
				templateId: selectedTemplate || undefined,
				indicatorOverrides: Object.keys(indicatorOverrides).length > 0 ? indicatorOverrides : undefined,
			};

			await onSubmit(submitData);

			onClose();
			setCurrentStep(1);
			setFormData(DEFAULT_FORM_DATA);
		} catch (error) {
			console.error("Error in handleSubmit:", error);
		}
	};

	const handleIndicatorRemove = (indicatorName: string) => {
		const newSelection = formData.selectedIndicators.filter((item) => item !== indicatorName);
		handleInputChange("selectedIndicators", newSelection);
	};

	const handleIndicatorConfigChange = (indicatorName: string, paramName: string, value: number) => {
		handleInputChange("indicatorConfig", {
			...formData.indicatorConfig,
			[indicatorName]: {
				...formData.indicatorConfig[indicatorName],
				[paramName]: value,
			},
		});
	};

	const handleIndicatorOverrideChange = (indicator: string, param: string, value: number) => {
		setIndicatorOverrides({
			...indicatorOverrides,
			[indicator]: {
				...indicatorOverrides[indicator],
				[param]: value,
			},
		});
	};

	const containerVariants = {
		hidden: { opacity: 0, y: 20 },
		visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
		exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
	};

	const renderStep = () => {
		switch (currentStep) {
			case 1:
				return (
					<Step1
						formData={formData}
						templates={templates}
						selectedTemplate={selectedTemplate}
						templateDetails={templateDetails}
						indicatorOverrides={indicatorOverrides}
						availableIndicators={availableIndicators}
						onInputChange={handleInputChange}
						onTemplateSelect={handleTemplateSelect}
						onSymbolSelect={handleSymbolSelect}
						onIndicatorRemove={handleIndicatorRemove}
						onIndicatorConfigChange={handleIndicatorConfigChange}
						onIndicatorOverrideChange={handleIndicatorOverrideChange}
						containerVariants={containerVariants}
					/>
				);

			case 2:
				return (
					<motion.div
						key="step2"
						variants={containerVariants}
						initial="hidden"
						animate="visible"
						exit="exit"
						className="space-y-5"
					>
						{(formData.strategyType === "normal" || formData.strategyType === "stocks" || formData.strategyType === "futures") && (
							<Step2Stocks
								formData={formData}
								onInputChange={handleInputChange}
								onSymbolSelect={handleSymbolSelect}
							/>
						)}

						{formData.strategyType === "options" && (
							<Step2Options
								formData={formData}
								loadingExpiries={loadingExpiries}
								availableExpiries={availableExpiries}
								onInputChange={handleInputChange}
								onSymbolSelect={handleSymbolSelect}
							/>
						)}
					</motion.div>
				);

			default:
				return null;
		}
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={onClose}
						className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
					/>

					{/* Drawer */}
					<motion.div
						initial={{ x: "100%" }}
						animate={{ x: 0 }}
						exit={{ x: "100%" }}
						transition={{ type: "spring", damping: 30, stiffness: 300 }}
						className="fixed right-0 top-0 h-full w-full sm:max-w-md lg:max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto dark:bg-gray-900"
					>
						<div className="p-4 sm:p-6">
							{/* Header */}
							<div className="flex items-center justify-between mb-4 sm:mb-6">
								<div className="flex items-center gap-2 sm:gap-3">
									<div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
										<Plus size={20} className="text-white sm:w-6 sm:h-6" />
									</div>
									<div>
										<h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100">
											{editData ? "Edit Symbol" : "Create Symbol"}
										</h2>
										<p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
											{editData ? "Update your trading strategy" : "Set up your trading strategy"}
										</p>
									</div>
								</div>
								<motion.button
									whileHover={{ scale: 1.1 }}
									whileTap={{ scale: 0.9 }}
									onClick={onClose}
									className="p-2 hover:bg-gray-100 rounded-lg transition-colors dark:hover:bg-gray-800"
								>
									<X size={24} className="text-gray-600 dark:text-gray-300" />
								</motion.button>
							</div>

							{/* Progress Bar */}
							<div className="flex gap-1 mb-6">
								{[1, 2].map((step) => (
									<motion.div
										key={step}
										animate={{
											backgroundColor: step <= currentStep ? "#10b981" : "#e5e7eb",
										}}
										className="h-1 flex-1 rounded-full transition-all"
									/>
								))}
							</div>

							{/* Step Content */}
							<div className="mb-6">
								<div className="mb-4">
									<h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-gray-100">
										{currentStep === 1 && "Select Strategy"}
										{currentStep === 2 && "Configure Trading"}
									</h3>
									<p className="text-xs text-gray-600 font-medium dark:text-gray-400">
										Step {currentStep} of 2
									</p>
								</div>

								{/* Form Content */}
								<div className="min-h-[300px]">
									<AnimatePresence mode="wait">{renderStep()}</AnimatePresence>
								</div>
							</div>

							{/* Buttons */}
							<div className="flex gap-4 sticky bottom-0 bg-white pt-4 border-t border-gray-200 dark:bg-gray-900 dark:border-gray-800">
								<motion.button
									whileHover={{ scale: 1.02, y: -2 }}
									whileTap={{ scale: 0.98 }}
									onClick={handlePrev}
									disabled={currentStep === 1}
									className="flex-1 py-3.5 border-2 border-gray-300 hover:border-gray-400 disabled:opacity-40 text-gray-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2 dark:border-gray-700 dark:hover:border-gray-600 dark:text-gray-300"
								>
									<ArrowLeft size={18} />
									Back
								</motion.button>

								<motion.button
									whileHover={{ scale: 1.02, y: -2 }}
									whileTap={{ scale: 0.98 }}
									onClick={handleNext}
									disabled={!validateStep()}
									className="flex-1 py-3.5 bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-lg hover:shadow-2xl transition-all disabled:opacity-70 relative overflow-hidden group"
								>
									<motion.div
										className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
										animate={{ x: ["-200%", "200%"] }}
										transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
									/>
									{currentStep === 2 ? (
										<>
											<CheckCircle size={20} className="relative z-10" />
											<span className="relative z-10">{editData ? "Update" : "Create"}</span>
										</>
									) : (
										<>
											<span className="relative z-10">Next</span>
											<ArrowRight size={20} className="relative z-10" />
										</>
									)}
								</motion.button>
							</div>
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}

