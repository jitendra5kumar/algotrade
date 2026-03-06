// @ts-nocheck
import api from './api';

/**
 * Search instruments by symbol/name
 * @param {string} query - Search query (min 2 characters)
 * @param {number} limit - Number of results (default: 20, max: 50)
 * @param {number|null} exchangeSegment - Filter by exchange segment (1: NSE F&O, 2: NSE Cash, 3: MCX F&O)
 * @param {string|null} strategyType - Strategy type filter (stocks, futures, options)
 */
export const searchInstruments = async (query: string, limit: number = 20, exchangeSegment: number | null = null, strategyType: string | null = null) => {
    try {
        const params = new URLSearchParams({
            q: query,
            limit: limit.toString()
        });

        if (exchangeSegment) {
            params.append('exchangeSegment', exchangeSegment.toString());
        }

        if (strategyType) {
            params.append('strategyType', strategyType);
        }

        const response = await api.get(`/api/instruments/search?${params}`);
        return response;
    } catch (error) {
        console.error('Error searching instruments:', error);
        throw error;
    }
};

/**
 * Get popular instruments
 * @param {number} limit - Number of results (default: 20, max: 50)
 */
export const getPopularInstruments = async (limit = 20) => {
    try {
        const response = await api.get(`/api/instruments/popular?limit=${limit}`);
        return response;
    } catch (error) {
        console.error('Error fetching popular instruments:', error);
        throw error;
    }
};

/**
 * Get instrument by token
 * @param {number} token - Instrument token number
 */
export const getInstrumentByToken = async (token) => {
    try {
        const response = await api.get(`/api/instruments/token/${token}`);
        return response;
    } catch (error) {
        console.error('Error fetching instrument by token:', error);
        throw error;
    }
};

/**
 * Get instruments by exchange segment
 * @param {number} segment - Exchange segment (1: NSE F&O, 2: NSE Cash, 3: MCX F&O)
 * @param {number} limit - Number of results (default: 50, max: 100)
 */
export const getInstrumentsByExchange = async (segment, limit = 50) => {
    try {
        const response = await api.get(`/api/instruments/exchange/${segment}?limit=${limit}`);
        return response;
    } catch (error) {
        console.error('Error fetching instruments by exchange:', error);
        throw error;
    }
};

/**
 * Search index instruments
 * @param {string} query - Search query (min 2 characters)
 * @param {number} limit - Number of results (default: 20, max: 50)
 */
export const searchIndexInstruments = async (query, limit = 20) => {
    try {
        const params = new URLSearchParams({
            q: query,
            limit: limit.toString()
        });

        const response = await api.get(`/api/instruments/search-index?${params}`);
        return response;
    } catch (error) {
        console.error('Error searching index instruments:', error);
        throw error;
    }
};

/**
 * Get available expiries for a symbol
 * @param {string} symbol - Symbol name (e.g., "NIFTY 50")
 */
export const getExpiriesForSymbol = async (symbol) => {
    try {
        const params = new URLSearchParams({
            symbol: symbol
        });

        const response = await api.get(`/api/instruments/expiries?${params}`);
        return response;
    } catch (error) {
        console.error('Error fetching expiries:', error);
        throw error;
    }
};

/**
 * Debounced search function for real-time search
 * @param {string} query - Search query
 * @param {number} delay - Delay in milliseconds (default: 300)
 * @param {number} limit - Number of results
 * @param {number|null} exchangeSegment - Filter by exchange segment
 * @param {string|null} strategyType - Strategy type filter (stocks, futures, options)
 */
export const debouncedSearch = (() => {
    let timeoutId: NodeJS.Timeout | undefined;
    
    return (query: string, delay: number = 300, limit: number = 20, exchangeSegment: number | null = null, strategyType: string | null = null) => {
        return new Promise((resolve, reject) => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            
            timeoutId = setTimeout(async () => {
                try {
                    const result = await searchInstruments(query, limit, exchangeSegment, strategyType);
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            }, delay);
        });
    };
})();
