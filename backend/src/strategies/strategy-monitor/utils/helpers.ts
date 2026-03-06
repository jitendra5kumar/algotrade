import type { CandleData } from "../../../indicators/types";
import logger from "../../../utils/logger";

/**
 * Get candle timestamp as number
 */
export function getCandleTimestamp(candle: CandleData | null | undefined): number {
	if (!candle || !candle.timestamp) {
		return 0;
	}

	if (candle.timestamp instanceof Date) {
		return candle.timestamp.getTime();
	}

	const parsed = new Date(candle.timestamp).getTime();
	return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Convert exchange segment string to number
 * Correct mapping: NSECM:1, NSEFO:2, NSECD:3, BSECM:11, BSEFO:12, MCXFO:51
 */
export function getExchangeSegmentNumber(segment: string): number {
	const map: Record<string, number> = {
		'NSECM': 1,   // NSE Cash Market
		'NSEFO': 2,   // NSE Futures & Options
		'NSECD': 3,   // NSE Currency Derivatives
		'BSECM': 11,  // BSE Cash Market
		'BSEFO': 12,  // BSE Futures & Options
		'MCXFO': 51,  // MCX Futures & Options
	};
	return map[segment] || 1; // Default to 1 (NSECM)
}

/**
 * Extract LTP from websocket quote message
 */
export function extractLtpFromQuote(message: Record<string, unknown>): number | null {
	if (!message) return null;
	
	const data = (message.data as Record<string, unknown>) ??
		(message as Record<string, unknown>);
	
	// Parse JSON only if it's a string, otherwise use as-is
	let dataObject: Record<string, unknown>;
	if (typeof data === 'string') {
		try {
			dataObject = JSON.parse(data);
		} catch (parseError) {
			logger.warn("Failed to parse quote data as JSON in extractLtpFromQuote", {
				error: parseError instanceof Error ? parseError.message : String(parseError),
			});
			return null;
		}
	} else if (data && typeof data === 'object') {
		dataObject = data as Record<string, unknown>;
	} else {
		return null;
	}

	if (!dataObject) return null;

	const candidates = [
		"ltp",
		"LTP",
		"LastTradedPrice",
		"price",
		"lastPrice",
		"close",
		"Close",
	];

	for (const key of candidates) {
		const raw = dataObject[key];
		if (raw === undefined || raw === null) {
			continue;
		}
		const value = Number(raw);
		if (Number.isFinite(value) && value > 0) {
			return value;
		}
	}

	return null;
}

