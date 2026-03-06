export interface FormData {
	strategyType: string;
	signalsType: string;
	symbol: string;
	selectedInstrument: any;
	timeframe: string;
	expiry: string;
	tradeMode: string;
	gap: string;
	stoploss: string;
	target: string;
	stoplossEnabled: boolean;
	targetEnabled: boolean;
	stoplossType: "points" | "percentage";
	targetType: "points" | "percentage";
	productType: string;
	orderType: string;
	qty: string;
	intradayEnabled: boolean;
	tradingWindowEnabled: boolean;
	tradingStartTime: string;
	tradingEndTime: string;
	squareOffTime: string;
	trailingStopLoss: string;
	maxRiskPerTradePercent: string;
	instantEntry: boolean;
	selectedIndicators: string[];
	indicatorConfig: Record<string, any>;
}

export interface CreateSymbolDrawerProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (data: any) => Promise<void>;
	editData?: any;
}

export interface Indicator {
	name: string;
	displayName: string;
	category: string;
	parameters: Array<{
		name: string;
		label: string;
		defaultValue: number;
		min?: number;
		max?: number;
		isVisible?: boolean;
		isEditable?: boolean;
		validationRules?: Record<string, any>;
	}>;
}

export interface Template {
	_id: string;
	name: string;
	type: string;
	usageCount?: number;
	description?: string;
	indicators?: {
		configurations: Record<string, any>;
	};
}

