// @ts-nocheck
import api from './api';

/**
 * Create broadcast (Admin)
 */
export const createBroadcast = async (title, message) => {
  try {
    const response = await api.post('/api/broadcast/create', { title, message });
    return response;
  } catch (error) {
    console.error('Error creating broadcast:', error);
    throw error;
  }
};

/**
 * Get all broadcasts (Admin)
 */
export const getAllBroadcasts = async () => {
  try {
    const response = await api.get('/api/broadcast/admin/all');
    return response;
  } catch (error) {
    console.error('Error fetching broadcasts:', error);
    throw error;
  }
};

/**
 * Delete broadcast (Admin)
 */
export const deleteBroadcast = async (broadcastId) => {
  try {
    const response = await api.delete(`/api/broadcast/admin/${broadcastId}`);
    return response;
  } catch (error) {
    console.error('Error deleting broadcast:', error);
    throw error;
  }
};

/**
 * Toggle broadcast status (Admin)
 */
export const toggleBroadcast = async (broadcastId) => {
  try {
    const response = await api.put(`/api/broadcast/admin/${broadcastId}/toggle`);
    return response;
  } catch (error) {
    console.error('Error toggling broadcast:', error);
    throw error;
  }
};

/**
 * Get unread broadcasts (User)
 */
export const getUnreadBroadcasts = async () => {
  try {
    const response = await api.get('/api/broadcast/user/unread');
    return response;
  } catch (error) {
    console.error('Error fetching unread broadcasts:', error);
    throw error;
  }
};

/**
 * Get unread count (User)
 */
export const getUnreadCount = async () => {
  try {
    const response = await api.get('/api/broadcast/user/unread-count');
    return response;
  } catch (error) {
    // Suppress connection errors to avoid console spam when backend is offline
    const isConnectionError = 
      error instanceof TypeError && 
      (error.message?.includes('Failed to fetch') || 
       error.message?.includes('ERR_CONNECTION_REFUSED') ||
       error.message?.includes('NetworkError'));
    
    if (!isConnectionError) {
      console.error('Error fetching unread count:', error);
    }
    throw error;
  }
};

/**
 * Mark broadcast as read (User)
 */
export const markBroadcastAsRead = async (broadcastId) => {
  try {
    const response = await api.put(`/api/broadcast/user/${broadcastId}/read`);
    return response;
  } catch (error) {
    console.error('Error marking broadcast as read:', error);
    throw error;
  }
};

