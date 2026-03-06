// @ts-nocheck
import api from './api';

/**
 * Get user's chat
 */
export const getUserChat = async () => {
  try {
    const response = await api.get('/api/chat/user');
    return response;
  } catch (error) {
    console.error('Error fetching user chat:', error);
    throw error;
  }
};

/**
 * Send message from user
 */
export const sendUserMessage = async (message) => {
  try {
    const response = await api.post('/api/chat/user/send', { message });
    return response;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Mark user messages as read
 */
export const markUserMessagesRead = async () => {
  try {
    const response = await api.put('/api/chat/user/read');
    return response;
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
};

/**
 * Get unread count for user
 */
export const getUserUnreadCount = async () => {
  try {
    const response = await api.get('/api/chat/user/unread-count');
    return response;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    throw error;
  }
};

/**
 * Get all chats for admin
 */
export const getAllChats = async (status = 'all') => {
  try {
    const url = status === 'all' ? '/api/chat/admin/all' : `/api/chat/admin/all?status=${status}`;
    const response = await api.get(url);
    return response;
  } catch (error) {
    console.error('Error fetching chats:', error);
    throw error;
  }
};

/**
 * Get specific chat for admin
 */
export const getAdminChat = async (chatId) => {
  try {
    const response = await api.get(`/api/chat/admin/${chatId}`);
    return response;
  } catch (error) {
    console.error('Error fetching admin chat:', error);
    throw error;
  }
};

/**
 * Send message from admin
 */
export const sendAdminMessage = async (chatId, message) => {
  try {
    const response = await api.post(`/api/chat/admin/${chatId}/send`, { message });
    return response;
  } catch (error) {
    console.error('Error sending admin message:', error);
    throw error;
  }
};

/**
 * Mark admin messages as read
 */
export const markAdminMessagesRead = async (chatId) => {
  try {
    const response = await api.put(`/api/chat/admin/${chatId}/read`);
    return response;
  } catch (error) {
    console.error('Error marking admin messages as read:', error);
    throw error;
  }
};

/**
 * Update chat status
 */
export const updateChatStatus = async (chatId, status) => {
  try {
    const response = await api.put(`/api/chat/admin/${chatId}/status`, { status });
    return response;
  } catch (error) {
    console.error('Error updating chat status:', error);
    throw error;
  }
};

