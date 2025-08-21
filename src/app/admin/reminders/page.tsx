'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Send, Clock, RefreshCw, AlertTriangle, CheckCircle, Play } from 'lucide-react';
import Link from 'next/link';

interface ReminderStatus {
  currentTime: string;
  reminderWindow: {
    start: string;
    end: string;
  };
  upcomingDepartures: number;
  eligibleBookings: number;
  departures: {
    id: string;
    route: string;
    time: string;
    date: string;
    bookings: number;
    reminderSent: boolean;
    reminderSentAt?: string;
  }[];
}

interface ReminderResult {
  processedAt: string;
  departuresProcessed: number;
  totalRemindersSent: number;
  totalRemindersFailed: number;
  results: {
    departureId: string;
    route: string;
    time: string;
    totalBookings: number;
    remindersSent: number;
    remindersFailed: number;
    success: boolean;
    error?: string;
  }[];
}

export default function RemindersPage() {
  const [status, setStatus] = useState<ReminderStatus | null>(null);
  const [lastResult, setLastResult] = useState<ReminderResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReminderStatus();
    
    // Auto-refresh every minute
    const interval = setInterval(fetchReminderStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchReminderStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cron/pickup-reminders');
      if (response.ok) {
        const data = await response.json();
        setStatus(data.data);
        setError(null);
      } else {
        setError('Failed to fetch reminder status');
      }
    } catch (err) {
      setError('Error loading reminder status');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const triggerReminders = async () => {
    try {
      setTriggering(true);
      setError(null);
      
      const response = await fetch('/api/cron/pickup-reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || 'dev-token'}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLastResult(data.data);
        // Refresh status after triggering
        setTimeout(fetchReminderStatus, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to trigger reminders');
      }
    } catch (err) {
      setError('Error triggering reminders');
      console.error('Error:', err);
    } finally {
      setTriggering(false);
    }
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
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
              <h1 className="text-xl font-semibold text-gray-900">Pickup Reminders</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchReminderStatus}
                disabled={loading}
                className="flex items-center text-gray-500 hover:text-gray-700"
              >
                <RefreshCw className={`h-5 w-5 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={triggerReminders}
                disabled={triggering || loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {triggering ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                {triggering ? 'Sending...' : 'Send Reminders Now'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
              <div className="text-red-700">{error}</div>
            </div>
          </div>
        )}

        {/* Current Status */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Current Status</h2>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Loading status...</span>
            </div>
          ) : status ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{status.upcomingDepartures}</div>
                <div className="text-sm text-gray-500">Upcoming Departures</div>
                <div className="text-xs text-gray-400">Next 30-40 min</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{status.eligibleBookings}</div>
                <div className="text-sm text-gray-500">Eligible Bookings</div>
                <div className="text-xs text-gray-400">With phone numbers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {status.departures.filter(d => d.reminderSent).length}
                </div>
                <div className="text-sm text-gray-500">Reminders Sent</div>
                <div className="text-xs text-gray-400">Already notified</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {status.departures.filter(d => !d.reminderSent).length}
                </div>
                <div className="text-sm text-gray-500">Pending Reminders</div>
                <div className="text-xs text-gray-400">Not yet sent</div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Upcoming Departures */}
        {status && status.departures.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Upcoming Departures (Next 30-40 Minutes)
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Route
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Departure Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bookings
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reminder Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {status.departures.map((departure) => (
                    <tr key={departure.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {departure.route}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDateTime(departure.date)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatTime(departure.time)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {departure.bookings} passengers
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {departure.reminderSent ? (
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-green-700">Sent</div>
                              {departure.reminderSentAt && (
                                <div className="text-xs text-gray-500">
                                  {formatDateTime(departure.reminderSentAt)}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 text-orange-500 mr-2" />
                            <span className="text-sm font-medium text-orange-700">Pending</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Last Result */}
        {lastResult && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Last Reminder Batch</h2>
            
            <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">
                  {lastResult.totalRemindersSent}
                </div>
                <div className="text-sm text-green-700">Reminders Sent</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-600">
                  {lastResult.totalRemindersFailed}
                </div>
                <div className="text-sm text-red-700">Failed</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {lastResult.departuresProcessed}
                </div>
                <div className="text-sm text-blue-700">Departures Processed</div>
              </div>
            </div>

            <div className="text-sm text-gray-500 mb-4">
              Processed at: {formatDateTime(lastResult.processedAt)}
            </div>

            {lastResult.results.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Route
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Results
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {lastResult.results.map((result) => (
                      <tr key={result.departureId}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {result.route}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatTime(result.time)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {result.remindersSent} sent, {result.remindersFailed} failed
                          <div className="text-xs text-gray-500">
                            {result.totalBookings} total bookings
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {result.success ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Success
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Failed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Automated Reminder System
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Pickup reminders are automatically sent 30 minutes before departure time. 
                  This system runs every 5 minutes via GitHub Actions to check for upcoming departures.
                  You can manually trigger reminders using the button above for testing or immediate needs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}