// @ts-nocheck
import api from './api';

/**
 * Get all indicators (Admin)
 */
export const getAllIndicators = async () => {
  try {
    const response = await api.get('/api/indicators/admin/all');
    return response;
  } catch (error) {
    console.error('Error fetching indicators:', error);
    throw error;
  }
};

/**
 * Get visible indicators (Users)
 */
export const getVisibleIndicators = async () => {
  try {
    const response = await api.get('/api/indicators/visible');
    return response;
  } catch (error) {
    console.error('Error fetching visible indicators:', error);
    throw error;
  }
};

/**
 * Toggle indicator visibility (Admin)
 */
export const toggleIndicatorVisibility = async (indicatorId, isVisible) => {
  try {
    const response = await api.put(`/api/indicators/admin/${indicatorId}/visibility`, { isVisible });
    return response;
  } catch (error) {
    console.error('Error toggling indicator visibility:', error);
    throw error;
  }
};

/**
 * Update indicator parameters (Admin)
 */
export const updateIndicatorParameters = async (indicatorId, parameters) => {
  try {
    const response = await api.put(`/api/indicators/admin/${indicatorId}/parameters`, { parameters });
    return response;
  } catch (error) {
    console.error('Error updating indicator parameters:', error);
    throw error;
  }
};

/**
 * Seed default indicators (Admin - run once)
 */
export const seedIndicators = async () => {
  try {
    const response = await api.post('/api/indicators/admin/seed');
    return response;
  } catch (error) {
    console.error('Error seeding indicators:', error);
    throw error;
  }
};

