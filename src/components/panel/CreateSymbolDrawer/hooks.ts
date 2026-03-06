import { useEffect, useState } from "react";
import { getVisibleIndicators } from "@/lib/indicator-api";
import { getTemplateDetails, getVisibleTemplates } from "@/lib/template-api";
import { getExpiriesForSymbol } from "@/lib/instrument-api";
import { normalizeTemplateId, findMatchingTemplate, getDefaultProductType } from "./helpers";
import { DEFAULT_FORM_DATA } from "./constants";
import type { FormData, Indicator, Template } from "./types";

export function useIndicators(isOpen: boolean) {
	const [availableIndicators, setAvailableIndicators] = useState<Indicator[]>([]);

	useEffect(() => {
		const fetchIndicators = async () => {
			try {
				const response = await getVisibleIndicators();
				if (response.success) {
					setAvailableIndicators(response.data || []);
				}
			} catch (error) {
				console.error("Error fetching indicators:", error);
				setAvailableIndicators([]);
			}
		};

		if (isOpen) {
			fetchIndicators();
		}
	}, [isOpen]);

	return availableIndicators;
}

export function useTemplates(isOpen: boolean) {
	const [templates, setTemplates] = useState<Template[]>([]);

	useEffect(() => {
		const fetchTemplates = async () => {
			try {
				const response = await getVisibleTemplates();
				if (response.success) {
					setTemplates(response.data || []);
				}
			} catch (error) {
				console.error("Error fetching templates:", error);
			}
		};

		if (isOpen) {
			fetchTemplates();
		}
	}, [isOpen]);

	return templates;
}

export function useTemplateSelection(
	editData: any,
	isOpen: boolean,
	templates: Template[]
) {
	const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
	const [templateDetails, setTemplateDetails] = useState<any>(null);
	const [indicatorOverrides, setIndicatorOverrides] = useState<Record<string, any>>({});

	useEffect(() => {
		if (editData && isOpen && templates.length > 0) {
			const templateId = normalizeTemplateId(editData.templateId);
			if (templateId) {
				const matchingTemplate = findMatchingTemplate(templates, templateId);
				if (matchingTemplate) {
					const matchedId = matchingTemplate._id?.toString() || matchingTemplate._id || matchingTemplate.id;
					setSelectedTemplate(matchedId);
					getTemplateDetails(matchedId)
						.then((response) => {
							if (response.success) {
								setTemplateDetails(response.data);
								if (editData.indicatorOverrides) {
									setIndicatorOverrides(editData.indicatorOverrides);
								}
							}
						})
						.catch((error) => {
							console.error("Error fetching template details:", error);
						});
				}
			} else {
				setSelectedTemplate(null);
				setTemplateDetails(null);
			}
		}
	}, [editData, isOpen, templates]);

	return { selectedTemplate, setSelectedTemplate, templateDetails, setTemplateDetails, indicatorOverrides, setIndicatorOverrides };
}

export function useFormData(editData: any, isOpen: boolean) {
	const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);

	useEffect(() => {
		if (editData && isOpen) {
			let selectedInstrument: any = null;
			if (editData.symbol && editData.exchangeInstrumentID) {
				selectedInstrument = {
					name: editData.symbol,
					instrumentToken: editData.exchangeInstrumentID,
					exchangeInstrumentID: editData.exchangeInstrumentID,
					exchangeSegment: editData.exchangeSegment || "NSECM",
					description: `${editData.symbol} - ${editData.exchangeSegment || "NSECM"}`,
				};
			} else if (editData.selectedInstrument) {
				selectedInstrument = editData.selectedInstrument;
			}

			let signalsType = editData.signalsType || "";
			if (!signalsType && editData.config?.entryMode) {
				signalsType = editData.config.entryMode === "candleClose" ? "candleClose" : "highLowBreak";
			}
			if (!signalsType && editData.entryMode) {
				signalsType = editData.entryMode === "candleClose" ? "candleClose" : "highLowBreak";
			}

			setFormData({
				strategyType: editData.strategyType || editData.type?.toLowerCase() || "stocks",
				signalsType: signalsType || "highLow",
				symbol: editData.symbol || "",
				selectedInstrument: selectedInstrument,
				timeframe: editData.timeframe || editData.timeFrame || "15min",
				expiry: editData.expiry || editData.config?.expiry || "",
				tradeMode: editData.tradeMode || editData.config?.tradeMode || "atm",
				gap: editData.gap || editData.config?.gap?.toString() || "",
				stoploss: editData.stoploss || editData.config?.stopLossPoints?.toString() || "",
				target: editData.target || editData.config?.targetPoints?.toString() || "",
				stoplossEnabled: editData.stoplossEnabled !== undefined ? editData.stoplossEnabled : (editData.config?.stopLossPoints ? editData.config.stopLossPoints > 0 : false),
				targetEnabled: editData.targetEnabled !== undefined ? editData.targetEnabled : (editData.config?.targetPoints ? editData.config.targetPoints > 0 : false),
				stoplossType: editData.config?.stoplossType || editData.stoplossType || "points",
				targetType: editData.config?.targetType || editData.targetType || "points",
				productType: editData.productType || editData.config?.productType?.toLowerCase() || "",
				orderType: editData.orderType || editData.config?.orderType?.toLowerCase() || "",
				qty: editData.qty || editData.config?.quantity?.toString() || editData.config?.maxPositionSize?.toString() || "",
				intradayEnabled: editData.intradayEnabled || editData.config?.intradayEnabled || false,
				tradingWindowEnabled: editData.tradingWindowEnabled || editData.config?.tradingWindowEnabled || false,
				tradingStartTime: editData.tradingStartTime || editData.config?.tradingStartTime || "09:15",
				tradingEndTime: editData.tradingEndTime || editData.config?.tradingEndTime || "15:30",
				squareOffTime: editData.squareOffTime || editData.config?.squareOffTime || "",
				trailingStopLoss: editData.trailingStopLoss || editData.config?.trailingStopLoss || "",
				maxRiskPerTradePercent: editData.maxRiskPerTradePercent || editData.config?.maxRiskPerTradePercent || "",
				instantEntry: editData.config?.instantEntry || false,
				selectedIndicators: editData.selectedIndicators || [],
				indicatorConfig: editData.indicatorConfig || editData.config?.indicators || DEFAULT_FORM_DATA.indicatorConfig,
			});
		} else if (!isOpen || !editData) {
			setFormData(DEFAULT_FORM_DATA);
		}
	}, [editData, isOpen]);

	return { formData, setFormData };
}

export function useExpiries() {
	const [availableExpiries, setAvailableExpiries] = useState<string[]>([]);
	const [loadingExpiries, setLoadingExpiries] = useState(false);

	const fetchExpiries = async (symbolName: string) => {
		setLoadingExpiries(true);
		try {
			const response = await getExpiriesForSymbol(symbolName);
			if (response.success && response.data?.expiries) {
				setAvailableExpiries(response.data.expiries);
				return response.data.expiries;
			} else {
				setAvailableExpiries([]);
				return [];
			}
		} catch (error) {
			console.error("Error fetching expiries:", error);
			setAvailableExpiries([]);
			return [];
		} finally {
			setLoadingExpiries(false);
		}
	};

	return { availableExpiries, loadingExpiries, fetchExpiries, setAvailableExpiries };
}

