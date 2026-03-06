// @ts-nocheck
import api from './api';

export const getActivityLogs = async (limit = 50) => {
  try {
    const response = await api.get(`/api/activity-logs?limit=${limit}`);
    return response;
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    throw error;
  }
};

export const createActivityLog = async (logData) => {
  try {
    const response = await api.post('/api/activity-logs', logData);
    return response;
  } catch (error) {
    console.error('Error creating activity log:', error);
    throw error;
  }
};

