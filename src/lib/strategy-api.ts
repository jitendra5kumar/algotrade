// @ts-nocheck
import api from './api';

/**
 * Strategy API functions for creating and managing trading strategies
 */

/**
 * Create a new strategy
 * @param {Object} strategyData - Strategy data including templateId, indicatorOverrides, and all other fields
 */
export const createStrategy = async (strategyData) => {
  try {
    console.log('strategy-api: Creating strategy with data:', strategyData);
    // Include templateId and indicatorOverrides if present in strategyData
    const response = await api.post('/api/strategies/simple', {
      ...strategyData,
      templateId: strategyData.templateId,
      indicatorOverrides: strategyData.indicatorOverrides
    });
    console.log('strategy-api: Raw response from api.post:', response);
    return response; // Return full response (contains success, data, message)
  } catch (error) {
    console.error('strategy-api: Error creating strategy:', error);
    throw new Error(error.message || 'Failed to create strategy');
  }
};

/**
 * Get all strategies for the user
 */
export const getStrategies = async () => {
  try {
    console.log('strategy-api: Fetching strategies...');
    const response = await api.get('/api/strategies/simple');
    console.log('strategy-api: Raw response from api.get:', response);
    return response; // Return full response (contains success, data, message)
  } catch (error) {
    console.error('strategy-api: Error fetching strategies:', error);
    throw new Error(error.message || 'Failed to get strategies');
  }
};

/**
 * Get a single strategy by ID
 */
export const getStrategyById = async (id) => {
  try {
    const response = await api.get(`/api/strategies/${id}`);
    return response;
  } catch (error) {
    throw new Error(error.message || 'Failed to get strategy');
  }
};

/**
 * Update an existing strategy
 */
export const updateStrategy = async (id, strategyData) => {
  try {
    console.log('strategy-api: Updating strategy:', id, strategyData);
    const response = await api.put(`/api/strategies/simple/${id}`, strategyData);
    console.log('strategy-api: Update response:', response);
    return response;
  } catch (error) {
    console.error('strategy-api: Error updating strategy:', error);
    throw new Error(error.message || 'Failed to update strategy');
  }
};

/**
 * Delete a strategy
 */
export const deleteStrategy = async (id) => {
  try {
    console.log('strategy-api: Deleting strategy:', id);
    const response = await api.delete(`/api/strategies/${id}`);
    console.log('strategy-api: Delete response:', response);
    return response;
  } catch (error) {
    console.error('strategy-api: Error deleting strategy:', error);
    throw new Error(error.message || 'Failed to delete strategy');
  }
};

/**
 * Start strategy monitoring (LIVE trading only)
 */
export const startStrategy = async (id: string) => {
  try {
    const response = await api.post(`/api/strategies/${id}/start`, {});
    return response;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to start strategy');
  }
};

/**
 * Stop strategy monitoring
 */
export const stopStrategy = async (id) => {
  try {
    const response = await api.post(`/api/strategies/${id}/stop`);
    return response;
  } catch (error) {
    throw new Error(error.message || 'Failed to stop strategy');
  }
};

/**
 * Pause strategy monitoring
 */
export const pauseStrategy = async (id) => {
  try {
    const response = await api.post(`/api/strategies/${id}/pause`);
    return response;
  } catch (error) {
    throw new Error(error.message || 'Failed to pause strategy');
  }
};

/**
 * Resume paused strategy
 */
export const resumeStrategy = async (id) => {
  try {
    const response = await api.post(`/api/strategies/${id}/resume`);
    return response;
  } catch (error) {
    throw new Error(error.message || 'Failed to resume strategy');
  }
};

/**
 * Get strategy performance metrics
 */
export const getStrategyPerformance = async (id) => {
  try {
    const response = await api.get(`/api/strategies/${id}/performance`);
    return response;
  } catch (error) {
    throw new Error(error.message || 'Failed to get strategy performance');
  }
};

/**
 * Fetch strategy logs
 */
export const getStrategyLogs = async (id, { level, category, page = 1, limit = 50 } = {}) => {
  try {
    const params = new URLSearchParams();
    if (level) params.append('level', level);
    if (category) params.append('category', category);
    params.append('page', String(page));
    params.append('limit', String(limit));
    const response = await api.get(`/api/strategies/${id}/logs?${params.toString()}`);
    return response;
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch strategy logs');
  }
};

/**
 * Delete a specific strategy log
 */
export const deleteStrategyLog = async (strategyId, logId) => {
  try {
    const response = await api.delete(`/api/strategies/${strategyId}/logs/${logId}`);
    return response;
  } catch (error) {
    throw new Error(error.message || 'Failed to delete log');
  }
};

/**
 * Delete all strategy logs
 */
export const deleteAllStrategyLogs = async (strategyId) => {
  try {
    const response = await api.delete(`/api/strategies/${strategyId}/logs`);
    return response;
  } catch (error) {
    throw new Error(error.message || 'Failed to delete logs');
  }
};

