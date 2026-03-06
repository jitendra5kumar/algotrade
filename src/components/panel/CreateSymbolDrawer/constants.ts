export const DEFAULT_FORM_DATA = {
	strategyType: "stocks",
	signalsType: "highLow",
	symbol: "",
	selectedInstrument: null,
	timeframe: "15min",
	expiry: "",
	tradeMode: "atm",
	gap: "",
	stoploss: "",
	target: "",
	stoplossEnabled: false,
	targetEnabled: false,
	stoplossType: "points" as const,
	targetType: "points" as const,
	productType: "",
	orderType: "market",
	qty: "",
	intradayEnabled: false,
	tradingWindowEnabled: false,
	tradingStartTime: "09:15",
	tradingEndTime: "15:30",
	squareOffTime: "",
	trailingStopLoss: "",
	maxRiskPerTradePercent: "",
	instantEntry: false,
	selectedIndicators: [],
	indicatorConfig: {
		sma: { period: 20 },
		ema: { period: 20 },
		rsi: { period: 14, overbought: 70, oversold: 30 },
		macd: { fast: 12, slow: 26, signal: 9 },
		bollingerBands: { period: 20, stdDev: 2 },
		atr: { period: 14 },
		adx: { period: 14 },
		stochastic: { period: 14, signalPeriod: 3 },
		cci: { period: 20 },
		williamsR: { period: 14 },
	},
};

export const INDICATOR_ICONS: Record<string, string> = {
	sma: "📈",
	ema: "📊",
	rsi: "⚡",
	macd: "🔄",
	bollingerBands: "📏",
	atr: "📐",
	adx: "🎯",
	stochastic: "🎲",
	cci: "📦",
	williamsR: "📉",
	vwap: "💰",
	psar: "🎪",
	obv: "📊",
	mfi: "💸",
};

export const CATEGORY_COLORS: Record<string, string> = {
	trend: "blue",
	momentum: "purple",
	volatility: "orange",
	volume: "green",
};

export const TIMEFRAMES = [
	{ value: "1min", label: "1 Minute" },
	{ value: "2min", label: "2 Minutes" },
	{ value: "3min", label: "3 Minutes" },
	{ value: "5min", label: "5 Minutes" },
	{ value: "10min", label: "10 Minutes" },
	{ value: "15min", label: "15 Minutes" },
	{ value: "30min", label: "30 Minutes" },
	{ value: "60min", label: "1 Hour" },
	{ value: "1day", label: "1 Day" },
];

export const PRODUCT_TYPES = [
	{ value: "mis", label: "MIS (Intraday)" },
	{ value: "nrml", label: "NRML (Normal)" },
	{ value: "cnc", label: "CNC (Delivery)" },
];

export const ORDER_TYPES = [
	{ value: "market", label: "MARKET (Market Order)" },
	{ value: "limit", label: "LIMIT (Limit Order)" },
];

export const TRADE_MODES = [
	{ value: "atm", label: "ATM", desc: "At The Money" },
	{ value: "itm", label: "ITM", desc: "In The Money" },
	{ value: "otm", label: "OTM", desc: "Out Of Money" },
];

