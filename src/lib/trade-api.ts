// @ts-nocheck
import api from './api';

/**
 * Trade API functions for fetching and managing trades
 */

/**
 * Get all trades for the logged-in user
 * @param {Object} params - Query parameters (status, symbol, strategyId, page, limit, sortBy, order)
 */
export const getTrades = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.status) queryParams.append('status', params.status);
    if (params.symbol) queryParams.append('symbol', params.symbol);
    if (params.strategyId) queryParams.append('strategyId', params.strategyId);
    if (params.page) queryParams.append('page', String(params.page));
    if (params.limit) queryParams.append('limit', String(params.limit));
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.order) queryParams.append('order', params.order);

    const queryString = queryParams.toString();
    const endpoint = `/api/trades${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(endpoint);
    return response; // Returns { success, data: { trades, pagination }, message }
  } catch (error) {
    console.error('Error fetching trades:', error);
    throw new Error(error.message || 'Failed to fetch trades');
  }
};

/**
 * Get trade by ID
 */
export const getTradeById = async (id) => {
  try {
    const response = await api.get(`/api/trades/${id}`);
    return response;
  } catch (error) {
    console.error('Error fetching trade:', error);
    throw new Error(error.message || 'Failed to fetch trade');
  }
};

/**
 * Get trade statistics
 */
export const getTradeStatistics = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.strategyId) queryParams.append('strategyId', params.strategyId);

    const queryString = queryParams.toString();
    const endpoint = `/api/trades/stats${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(endpoint);
    return response;
  } catch (error) {
    console.error('Error fetching trade statistics:', error);
    throw new Error(error.message || 'Failed to fetch trade statistics');
  }
};

/**
 * Get recent trades
 */
export const getRecentTrades = async (limit = 10) => {
  try {
    const response = await api.get(`/api/trades/recent?limit=${limit}`);
    return response;
  } catch (error) {
    console.error('Error fetching recent trades:', error);
    throw new Error(error.message || 'Failed to fetch recent trades');
  }
};

/**
 * Get open trades
 */
export const getOpenTrades = async () => {
  try {
    const response = await api.get('/api/trades/open');
    return response;
  } catch (error) {
    console.error('Error fetching open trades:', error);
    throw new Error(error.message || 'Failed to fetch open trades');
  }
};

