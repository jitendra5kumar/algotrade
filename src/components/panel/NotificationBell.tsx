// @ts-nocheck
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  getUnreadBroadcasts,
  getUnreadCount,
  markBroadcastAsRead
} from '@/lib/broadcast-api';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const pollingInterval = useRef(null);

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const response = await getUnreadCount();
      if (response.success) {
        setUnreadCount(response.data.count || 0);
      }
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
      // Silently fail for connection errors - backend may be offline
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await getUnreadBroadcasts();
      if (response.success) {
        setNotifications(response.data || []);
      }
    } catch (error) {
      // Suppress connection errors to avoid console spam when backend is offline
      const isConnectionError = 
        error instanceof TypeError && 
        (error.message?.includes('Failed to fetch') || 
         error.message?.includes('ERR_CONNECTION_REFUSED') ||
         error.message?.includes('NetworkError'));
      
      if (!isConnectionError) {
        console.error('Error fetching notifications:', error);
      }
      // Silently fail for connection errors - backend may be offline
    } finally {
      setLoading(false);
    }
  };

  // Mark as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      const response = await markBroadcastAsRead(notificationId);
      if (response.success) {
        // Remove from list
        setNotifications(prev => prev.filter(n => n._id !== notificationId));
        setUnreadCount(prev => Math.max(0, prev - 1));
        toast.success('Marked as read');
      }
    } catch (error) {
      console.error('Error marking as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      const promises = notifications.map(n => markBroadcastAsRead(n._id));
      await Promise.all(promises);
      setNotifications([]);
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Polling for unread count
  useEffect(() => {
    fetchUnreadCount();
    
    // Poll every 60 seconds (reduced frequency to minimize logs)
    pollingInterval.current = setInterval(() => {
      fetchUnreadCount();
    }, 60000);

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, []);

  // Format date
  const formatDate = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now.getTime() - notifDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notifDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleDropdown}
        className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors dark:hover:bg-gray-800"
      >
        <Bell className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-12 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 max-h-[500px] flex flex-col dark:bg-gray-900 dark:border-gray-800"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-green-500 to-emerald-600 rounded-t-2xl dark:border-gray-800">
              <div>
                <h3 className="font-bold text-white text-lg">Notifications</h3>
                <p className="text-xs text-green-50">
                  {unreadCount} unread {unreadCount === 1 ? 'message' : 'messages'}
                </p>
              </div>
              {notifications.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-white bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1"
                >
                  <CheckCheck className="w-3 h-3" />
                  Mark all read
                </motion.button>
              )}
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <Bell className="w-12 h-12 text-gray-300 mb-3" />
                  <h4 className="font-semibold text-gray-900 mb-1 dark:text-gray-100">All caught up!</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">No new notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="p-4 hover:bg-gray-50 transition-colors relative group dark:hover:bg-gray-800"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <Bell className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900 text-sm leading-tight dark:text-gray-100">
                              {notification.title}
                            </h4>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleMarkAsRead(notification._id)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all dark:hover:bg-gray-700"
                              title="Mark as read"
                            >
                              <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            </motion.button>
                          </div>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2 dark:text-gray-300">
                            {notification.message}
                          </p>
                          <span className="text-xs text-gray-400 dark:text-gray-400">
                            {formatDate(notification.createdAt)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

