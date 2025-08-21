'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Send, MessageSquare, History, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface Notification {
  id: string;
  notificationType: string;
  recipientPhone?: string;
  message: string;
  status: string;
  sentAt?: string;
  errorMessage?: string;
  booking: {
    user?: {
      firstName: string;
      lastName: string;
    };
    guestFirstName?: string;
    guestLastName?: string;
    departure: {
      schedule: {
        route: {
          name: string;
          origin: string;
          destination: string;
        };
      };
    };
  };
}

interface Departure {
  id: string;
  date: string;
  schedule: {
    time: string;
    route: {
      id: string;
      name: string;
      origin: string;
      destination: string;
    };
  };
  bookings: any[];
}

const SMS_TEMPLATES = {
  BOARDING_STARTED: 'Boarding Started',
  DEPARTED: 'Departed',
  DELAYED: 'Delayed',
  ARRIVED: 'Arrived',
  PICKUP_REMINDER: 'Pickup Reminder'
};

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('send');
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDeparture, setSelectedDeparture] = useState('');
  const [messageType, setMessageType] = useState('template');
  const [templateType, setTemplateType] = useState('BOARDING_STARTED');
  const [customMessage, setCustomMessage] = useState('');
  const [phoneNumbers, setPhoneNumbers] = useState('');

  // Fetch upcoming departures
  useEffect(() => {
    fetchDepartures();
    if (activeTab === 'history') {
      fetchNotifications();
    }
  }, [activeTab]);

  const fetchDepartures = async () => {
    try {
      const response = await fetch('/api/admin/departures/today');
      if (response.ok) {
        const data = await response.json();
        setDepartures(data.departures || []);
      }
    } catch (error) {
      console.error('Error fetching departures:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/notifications/sms');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendNotification = async () => {
    if (!selectedDeparture && !phoneNumbers.trim()) {
      alert('Please select a departure or enter phone numbers');
      return;
    }

    if (messageType === 'custom' && !customMessage.trim()) {
      alert('Please enter a custom message');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {};

      if (selectedDeparture) {
        payload.departureId = selectedDeparture;
      }

      if (phoneNumbers.trim()) {
        payload.phoneNumbers = phoneNumbers
          .split(',')
          .map(phone => phone.trim())
          .filter(phone => phone.length > 0);
      }

      if (messageType === 'template') {
        payload.useTemplate = true;
        payload.templateType = templateType;
      } else {
        payload.message = customMessage;
      }

      const response = await fetch('/api/admin/notifications/sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        alert(`Successfully sent ${data.data.messagesSent} messages! (${data.data.messagesFailed} failed)`);
        // Reset form
        setSelectedDeparture('');
        setCustomMessage('');
        setPhoneNumbers('');
        // Refresh notifications if on history tab
        if (activeTab === 'history') {
          fetchNotifications();
        }
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SENT': return 'text-green-600 bg-green-50';
      case 'FAILED': return 'text-red-600 bg-red-50';
      case 'PENDING': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link
                href="/admin"
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="h-5 w-5 mr-1" />
                Back to Admin
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">SMS Notifications</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('send')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'send'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Send className="inline h-4 w-4 mr-2" />
              Send SMS
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <History className="inline h-4 w-4 mr-2" />
              History
            </button>
          </nav>
        </div>

        {/* Send SMS Tab */}
        {activeTab === 'send' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Send SMS Notification</h2>
            
            <div className="space-y-6">
              {/* Departure Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Departure (Optional)
                </label>
                <select
                  value={selectedDeparture}
                  onChange={(e) => setSelectedDeparture(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a departure...</option>
                  {departures.map((departure) => (
                    <option key={departure.id} value={departure.id}>
                      {departure.schedule.route.name} - {formatDate(departure.date)} at {departure.schedule.time} ({departure.bookings.length} passengers)
                    </option>
                  ))}
                </select>
              </div>

              {/* Manual Phone Numbers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manual Phone Numbers (Optional)
                </label>
                <textarea
                  value={phoneNumbers}
                  onChange={(e) => setPhoneNumbers(e.target.value)}
                  placeholder="Enter phone numbers separated by commas: +1234567890, +0987654321"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
                <p className="text-sm text-gray-500 mt-1">
                  If both departure and phone numbers are provided, messages will be sent to both groups.
                </p>
              </div>

              {/* Message Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message Type
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="template"
                      checked={messageType === 'template'}
                      onChange={(e) => setMessageType(e.target.value)}
                      className="mr-2"
                    />
                    Use Template
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="custom"
                      checked={messageType === 'custom'}
                      onChange={(e) => setMessageType(e.target.value)}
                      className="mr-2"
                    />
                    Custom Message
                  </label>
                </div>
              </div>

              {/* Template Selection */}
              {messageType === 'template' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template
                  </label>
                  <select
                    value={templateType}
                    onChange={(e) => setTemplateType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(SMS_TEMPLATES).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Custom Message */}
              {messageType === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Message
                  </label>
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Enter your custom message..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                  />
                </div>
              )}

              {/* Send Button */}
              <div className="flex justify-end">
                <button
                  onClick={sendNotification}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  {loading ? 'Sending...' : 'Send SMS'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notification History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white shadow rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">SMS History</h2>
                <button
                  onClick={fetchNotifications}
                  disabled={loading}
                  className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recipient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Route
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sent At
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {notifications.map((notification) => (
                    <tr key={notification.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {notification.booking.user 
                            ? `${notification.booking.user.firstName} ${notification.booking.user.lastName}`
                            : `${notification.booking.guestFirstName} ${notification.booking.guestLastName}`
                          }
                        </div>
                        <div className="text-sm text-gray-500">{notification.recipientPhone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {notification.booking.departure.schedule.route.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {notification.booking.departure.schedule.route.origin} → {notification.booking.departure.schedule.route.destination}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {notification.message}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(notification.status)}`}>
                          {notification.status}
                        </span>
                        {notification.errorMessage && (
                          <div className="text-xs text-red-600 mt-1">{notification.errorMessage}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {notification.sentAt ? formatDate(notification.sentAt) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {notifications.length === 0 && !loading && (
                <div className="text-center py-12">
                  <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No SMS notifications have been sent yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}