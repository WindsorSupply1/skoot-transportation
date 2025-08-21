'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  Clock, 
  Filter, 
  Search, 
  X,
  ChevronDown,
  ChevronUp 
} from 'lucide-react';

interface NotificationRecord {
  id: string;
  type: 'capacity_warning' | 'capacity_critical' | 'system_alert';
  title: string;
  message: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'critical';
  read: boolean;
  data?: {
    departureId?: string;
    routeName?: string;
    capacity?: number;
    bookedSeats?: number;
    occupancyRate?: number;
  };
}

interface NotificationHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationHistory({ isOpen, onClose }: NotificationHistoryProps) {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<NotificationRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<'all' | 'info' | 'warning' | 'critical'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadNotificationHistory();
    }
  }, [isOpen]);

  useEffect(() => {
    applyFilters();
  }, [notifications, searchTerm, filterLevel]);

  const loadNotificationHistory = () => {
    // For now, load from localStorage - in production this would come from an API
    const stored = localStorage.getItem('skoot_notifications');
    if (stored) {
      try {
        const parsed = JSON.parse(stored).map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        setNotifications(parsed.sort((a: NotificationRecord, b: NotificationRecord) => 
          b.timestamp.getTime() - a.timestamp.getTime()
        ));
      } catch (error) {
        console.error('Failed to parse notification history:', error);
        setNotifications([]);
      }
    } else {
      setNotifications([]);
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = notifications;

    if (searchTerm) {
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.data?.routeName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterLevel !== 'all') {
      filtered = filtered.filter(n => n.level === filterLevel);
    }

    setFilteredNotifications(filtered);
  };

  const markAsRead = (id: string) => {
    const updated = notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    
    // Update localStorage
    localStorage.setItem('skoot_notifications', JSON.stringify(updated));
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem('skoot_notifications', JSON.stringify(updated));
  };

  const clearHistory = () => {
    setNotifications([]);
    localStorage.removeItem('skoot_notifications');
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      return timestamp.toLocaleDateString();
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'info':
        return <Bell className="h-4 w-4 text-blue-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Bell className="h-6 w-6 text-orange-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Notification History</h2>
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                {notifications.filter(n => !n.read).length} unread
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Filter className="h-4 w-4 mr-1" />
                Filters
                {showFilters ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={markAllAsRead}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
                disabled={notifications.filter(n => !n.read).length === 0}
              >
                Mark all read
              </button>
              <button
                onClick={clearHistory}
                className="px-3 py-2 text-sm text-red-600 hover:text-red-800"
              >
                Clear history
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-gray-600">Level:</span>
              {(['all', 'info', 'warning', 'critical'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setFilterLevel(level)}
                  className={`px-3 py-1 text-sm rounded-full ${
                    filterLevel === level
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notification List */}
        <div className="overflow-y-auto max-h-96">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {notifications.length === 0 ? (
                <>
                  <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No notifications yet</p>
                </>
              ) : (
                <p>No notifications match your filters</p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        {getLevelIcon(notification.level)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${
                            !notification.read ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </p>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                              getLevelColor(notification.level)
                            }`}>
                              {notification.level}
                            </span>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            )}
                          </div>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                          {notification.message}
                        </p>
                        {notification.data && (
                          <div className="mt-2 text-xs text-gray-500">
                            {notification.data.routeName && (
                              <span className="mr-4">Route: {notification.data.routeName}</span>
                            )}
                            {notification.data.occupancyRate && (
                              <span>Occupancy: {notification.data.occupancyRate}%</span>
                            )}
                          </div>
                        )}
                        <div className="mt-2 flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTimestamp(notification.timestamp)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}