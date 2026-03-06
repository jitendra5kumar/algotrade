import type { CandleData } from "../../indicators/types";
import type { IStrategy } from "../../models/Strategy.model";
import type { TrendState } from "../../types";

export interface HighLowReference {
	high: number;
	low: number;
	timestamp: number;
}

export interface HighLowWatcherState {
	subscriptionId: string | null;
	action: "BUY" | "SELL" | null;
	referenceTimestamp: number | null;
	high: number | null;
	low: number | null;
	isProcessingBreak?: boolean; // Flag to prevent duplicate signal emissions
}

/**
 * MonitorState - Tracks all state for a single strategy being monitored
 * Note: Only LIVE trading is supported (paper trading removed)
 */
export interface MonitorState {
	strategy: IStrategy;
	historicalData: CandleData[];
	trendState: TrendState;
	lastCheckTime: number;
	interval: NodeJS.Timeout | null;
	highLowReference?: HighLowReference;
	highLowWatcher?: HighLowWatcherState;
	brokerClientId?: string;
}

