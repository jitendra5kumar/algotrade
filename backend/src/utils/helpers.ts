import { Response } from 'express';

/**
 * Standard API response format
 */
export interface ApiResponse<T = unknown> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
    timestamp: string;
}

/**
 * Send success response
 */
export const sendSuccess = <T>(
    res: Response,
    data: T,
    message: string = 'Success',
    statusCode: number = 200
): Response => {
    const response: ApiResponse<T> = {
        success: true,
        message,
        data,
        timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(response);
};

/**
 * Send error response
 */
export const sendError = (
    res: Response,
    error: string,
    statusCode: number = 400
): Response => {
    const response: ApiResponse = {
        success: false,
        error,
        timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(response);
};

/**
 * Generate random string
 */
export const generateRandomString = (length: number = 32): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

/**
 * Sleep/delay function
 */
export const sleep = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Calculate percentage change
 */
export const calculatePercentageChange = (oldValue: number, newValue: number): number => {
    if (oldValue === 0) return 0;
    return ((newValue - oldValue) / oldValue) * 100;
};

/**
 * Round to decimal places
 */
export const roundToDecimal = (value: number, decimals: number = 2): number => {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

/**
 * Check if market is open (Indian market timing)
 * @param exchangeSegment - Optional exchange segment (NSECM, NSEFO, MCXFO)
 */
export const isMarketOpen = (exchangeSegment?: string) => {
    const now = new Date();

    // Convert to IST by formatting into IST timezone
    const istString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    const istDate = new Date(istString);
    
    // Extract values
    const day = istDate.getDay();      // 0 = Sunday, 1 = Monday, ... 6 = Saturday
    const hours = istDate.getHours();  // 0–23
    const minutes = istDate.getMinutes();
    
    // Market closed on weekends
    if (day === 0 || day === 6) return false;
    
    const timeInMinutes = hours * 60 + minutes;
    
    // MCXFO timing: 9:00 AM to 11:55 PM IST
    if (exchangeSegment === 'MCXFO') {
        const mcxOpen = 9 * 60; // 9:00 AM
        const mcxClose = 23 * 60 + 55; // 11:55 PM
        return timeInMinutes >= mcxOpen && timeInMinutes <= mcxClose;
    }
    
    // NSE timing: 9:15 AM to 3:30 PM IST (default for NSECM, NSEFO)
    const marketOpen = 9 * 60 + 15; // 9:15 AM
    const marketClose = 15 * 60 + 30; // 3:30 PM

    return timeInMinutes >= marketOpen && timeInMinutes <= marketClose;
};

/**
 * Check if market closes within 5 minutes (3:25 PM check)
 * @param exchangeSegment - Optional exchange segment (NSECM, NSEFO, MCXFO)
 * @returns true if market closes within 5 minutes (after 3:25 PM for NSE)
 */
export const isMarketClosingSoon = (exchangeSegment?: string): boolean => {
    const now = new Date();

    // Convert to IST
    const istString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    const istDate = new Date(istString);
    
    // Extract values
    const day = istDate.getDay();
    const hours = istDate.getHours();
    const minutes = istDate.getMinutes();
    
    // Market closed on weekends
    if (day === 0 || day === 6) return false;
    
    const timeInMinutes = hours * 60 + minutes;
    
    // MCXFO timing: 9:00 AM to 11:55 PM IST (no early close check needed)
    if (exchangeSegment === 'MCXFO') {
        return false;
    }
    
    // NSE timing: Market closes at 3:30 PM, so after 3:25 PM (205 minutes) is closing soon
    const marketCloseTime = 15 * 60 + 30; // 3:30 PM
    const closingSoonTime = 15 * 60 + 25; // 3:25 PM
    
    return timeInMinutes >= closingSoonTime && timeInMinutes < marketCloseTime;
};

/**
 * Check if trade should be placed (before market close)
 * @param exchangeSegment - Optional exchange segment (NSECM, NSEFO, MCXFO)
 * @returns true if trade can be placed, false if market is closed (after 3:30 PM)
 */
export const shouldPlaceTrade = (exchangeSegment?: string): boolean => {
	const now = new Date();
	const istString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
	const istDate = new Date(istString);
	
	const hours = istDate.getHours();
	const minutes = istDate.getMinutes();
	const seconds = istDate.getSeconds();
	const timeInSeconds = hours * 3600 + minutes * 60 + seconds;
	
	// Market close time: 15:30:00 = 55800 seconds
	const MARKET_CLOSE_TIME = 15 * 3600 + 30 * 60; // 15:30:00 in seconds = 55800
	
	// MCXFO timing: 9:00 AM to 11:55 PM IST
	if (exchangeSegment === 'MCXFO') {
		const mcxClose = 23 * 3600 + 55 * 60; // 11:55 PM in seconds = 86100
		return timeInSeconds < mcxClose;
	}
	
	// NSE timing: 9:15 AM to 3:30 PM IST (default for NSECM, NSEFO)
	return timeInSeconds < MARKET_CLOSE_TIME;
};

/**
 * Get next market open time (9:15 AM IST)
 * @returns Date object for next market open
 */
export const getNextMarketOpenTime = (): Date => {
	const now = new Date();
	const istString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
	const istDate = new Date(istString);
	
	// Set to next day 9:15 AM IST
	const nextOpen = new Date(istDate);
	nextOpen.setDate(nextOpen.getDate() + 1);
	nextOpen.setHours(9, 15, 0, 0);
	
	return nextOpen;
};

/**
 * Get market close time in milliseconds from now
 * @param exchangeSegment - Exchange segment (NSECM, NSEFO, MCXFO)
 * @returns milliseconds until market close, or null if market is closed
 */
export const getMillisecondsUntilMarketClose = (exchangeSegment?: string): number | null => {
    const now = new Date();
    
    // Convert to IST
    const istString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    const istDate = new Date(istString);
    
    const day = istDate.getDay();
    const hours = istDate.getHours();
    const minutes = istDate.getMinutes();
    const seconds = istDate.getSeconds();
    
    // Market closed on weekends
    if (day === 0 || day === 6) return null;
    
    const timeInMinutes = hours * 60 + minutes;
    const timeInSeconds = timeInMinutes * 60 + seconds;
    
    let marketCloseTime: number;
    
    // MCXFO timing: 9:00 AM to 11:55 PM IST
    if (exchangeSegment === 'MCXFO') {
        marketCloseTime = 23 * 60 + 55; // 11:55 PM in minutes
    } else {
        // NSE timing: 9:15 AM to 3:30 PM IST (default for NSECM, NSEFO)
        marketCloseTime = 15 * 60 + 30; // 3:30 PM in minutes
    }
    
    const marketCloseTimeInSeconds = marketCloseTime * 60;
    
    // If market is already closed, return null
    if (timeInSeconds >= marketCloseTimeInSeconds) {
        return null;
    }
    
    // Calculate milliseconds until market close
    const millisecondsUntilClose = (marketCloseTimeInSeconds - timeInSeconds) * 1000;
    
    // Add minimum 1 minute buffer, maximum 6 hours (for safety)
    return Math.min(Math.max(millisecondsUntilClose, 60 * 1000), 6 * 60 * 60 * 1000);
};

/**
 * Format Indian currency
 */
export const formatIndianCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
    }).format(amount);
};

/**
 * Validate email
 */
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate phone number (Indian format)
 */
export const isValidIndianPhone = (phone: string): boolean => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/[\s-]/g, ''));
};

/**
 * Sanitize object (remove undefined/null values)
 */
export const sanitizeObject = (obj: Record<string, unknown>): Record<string, unknown> => {
    return Object.keys(obj).reduce((acc: Record<string, unknown>, key) => {
        if (obj[key] !== null && obj[key] !== undefined) {
            acc[key] = obj[key];
        }
        return acc;
    }, {});
};

/**
 * Chunk array into smaller arrays
 */
export const chunkArray = <T>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
};

/**
 * Calculate Stop Loss price
 */
export const calculateStopLoss = (
    entryPrice: number,
    stopLossPercent: number,
    tradeType: 'BUY' | 'SELL'
): number => {
    if(stopLossPercent===0) return 0;
    if (tradeType === 'BUY') {
        return roundToDecimal(entryPrice * (1 - stopLossPercent / 100));
    } else {
        return roundToDecimal(entryPrice * (1 + stopLossPercent / 100));
    }
};

/**
 * Calculate Take Profit price
 */
export const calculateTakeProfit = (
    entryPrice: number,
    takeProfitPercent: number,
    tradeType: 'BUY' | 'SELL'
): number => {
    if(takeProfitPercent===0) return 0;
    if (tradeType === 'BUY') {
        return roundToDecimal(entryPrice * (1 + takeProfitPercent / 100));
    } else {
        return roundToDecimal(entryPrice * (1 - takeProfitPercent / 100));
    }
};

export default {
    sendSuccess,
    sendError,
    generateRandomString,
    sleep,
    calculatePercentageChange,
    roundToDecimal,
    isMarketOpen,
    formatIndianCurrency,
    isValidEmail,
    isValidIndianPhone,
    sanitizeObject,
    chunkArray,
    calculateStopLoss,
    calculateTakeProfit,
};

