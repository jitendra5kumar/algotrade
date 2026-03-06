export interface Strategy {
	_id?: string;
	id?: string;
	name?: string;
	symbol?: string;
	exchangeSegment?: string;
	exchangeInstrumentID?: number;
	selectedIndicators?: string[];
	stoploss?: number;
	stoplossEnabled?: boolean;
	target?: number;
	targetEnabled?: boolean;
	productType?: string;
	orderType?: string;
	qty?: number;
	isActive?: boolean;
	status?: "ACTIVE" | "PAUSED" | "INACTIVE";
	createdAt?: string;
	selectedInstrument?: {
		instrumentToken?: number;
	};
	currentPosition?: {
		side?: "BUY" | "SELL";
		entryTime?: string | Date;
		entryPrice?: number;
	};
}

export interface LiveData {
	[symbol: string]: {
		lastPrice: number;
		change: number;
		changePercent: number;
		volume: number;
		timestamp: Date;
		isMockData?: boolean;
		fullSymbolName?: string;
	};
}

export interface StrategyLog {
	_id?: string;
	userId?: string;
	strategyId?: string;
	createdAt: string | Date;
	level: 'info' | 'warn' | 'error';
	category: string;
	message: string;
	meta?: Record<string, unknown>;
}

