// @ts-nocheck
import { authAPI, clearAuthData } from './auth-api';
import toast from 'react-hot-toast';

/**
 * Logout user and redirect to login page
 */
export const handleLogout = async (router) => {
  const loadingToast = toast.loading('Logging out...');

  try {
    // Call backend logout API
    await authAPI.logout();
  } catch (error) {
    // Even if API fails, clear local data
    console.error('Logout API error:', error);
  } finally {
    // Clear local storage
    clearAuthData();
    
    toast.success('Logged out successfully!', {
      id: loadingToast,
    });

    // Redirect to login page
    if (router) {
      router.push('/login');
    } else if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
};

/**
 * Check if user is authenticated
 */
export const checkAuth = () => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    return !!token;
  }
  return false;
};

