'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminNavigation from '@/components/AdminNavigation';
import {
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  BarChart3,
  AlertCircle,
  Filter,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Download,
  RefreshCw
} from 'lucide-react';

interface RevenueData {
  totalRevenue: number;
  totalBookings: number;
  averageBookingValue: number;
  uniqueCustomers: number;
  occupancyRate: number;
  periodComparison: {
    revenue: number;
    bookings: number;
    customers: number;
  };
  dailyRevenue: Array<{
    date: string;
    revenue: number;
    bookings: number;
  }>;
  routePerformance: Array<{
    routeId: string;
    routeName: string;
    revenue: number;
    bookings: number;
    occupancyRate: number;
  }>;
  customerSegments: Array<{
    segment: string;
    count: number;
    revenue: number;
    percentage: number;
  }>;
  hourlyDistribution: Array<{
    hour: number;
    bookings: number;
    revenue: number;
  }>;
}

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    to: new Date().toISOString().split('T')[0]
  });
  const [reportType, setReportType] = useState<'overview' | 'routes' | 'customers' | 'trends'>('overview');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user) {
      router.push('/auth/signin');
      return;
    }

    fetchReports();
  }, [session, status, router, dateRange]);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        from: dateRange.from,
        to: dateRange.to
      });

      const response = await fetch(`/api/admin/reports/revenue?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch reports: ${response.status}`);
      }
      const reportData = await response.json();
      setData(reportData);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      setError(error instanceof Error ? error.message : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: 'csv' | 'pdf') => {
    try {
      const params = new URLSearchParams({
        from: dateRange.from,
        to: dateRange.to,
        format,
        type: reportType
      });

      const response = await fetch(`/api/admin/reports/export?${params}`);
      if (!response.ok) {
        throw new Error('Failed to export report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `skoot-report-${dateRange.from}-to-${dateRange.to}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export report:', error);
      alert('Failed to export report');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md">
          <div className="text-red-600 mb-4">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <h2 className="text-lg font-semibold text-center">Error Loading Reports</h2>
          </div>
          <p className="text-gray-600 text-center mb-4">{error}</p>
          <button 
            onClick={fetchReports}
            className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/admin')}
                className="flex items-center text-gray-500 hover:text-gray-700 mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </button>
              <div className="text-2xl font-bold text-orange-600">SKOOT</div>
              <div className="ml-4 text-gray-500">Revenue Reports & Analytics</div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => exportReport('csv')}
                className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <Download className="h-4 w-4 mr-1" />
                Export CSV
              </button>
              <button
                onClick={fetchReports}
                className="flex items-center px-3 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Date Range Filter */}
        <div className="bg-white rounded-lg shadow-sm mb-8 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Report Filters</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center text-gray-500 hover:text-gray-700"
            >
              <Filter className="h-4 w-4 mr-1" />
              Filters
              {showFilters ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
            </button>
          </div>
          
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="overview">Overview</option>
                  <option value="routes">Route Performance</option>
                  <option value="customers">Customer Analysis</option>
                  <option value="trends">Trends & Patterns</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => setDateRange({
                    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    to: new Date().toISOString().split('T')[0]
                  })}
                  className="w-full px-3 py-2 text-sm text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Reset to Last 30 Days
                </button>
              </div>
            </div>
          )}
        </div>

        {data && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.totalRevenue)}</p>
                    <p className={`text-xs ${getPercentageChange(data.totalRevenue, data.periodComparison.revenue) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {getPercentageChange(data.totalRevenue, data.periodComparison.revenue) >= 0 ? '+' : ''}
                      {formatPercentage(getPercentageChange(data.totalRevenue, data.periodComparison.revenue))} vs previous period
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Bookings</p>
                    <p className="text-2xl font-bold text-gray-900">{data.totalBookings}</p>
                    <p className={`text-xs ${getPercentageChange(data.totalBookings, data.periodComparison.bookings) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {getPercentageChange(data.totalBookings, data.periodComparison.bookings) >= 0 ? '+' : ''}
                      {formatPercentage(getPercentageChange(data.totalBookings, data.periodComparison.bookings))} vs previous period
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Avg Booking Value</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.averageBookingValue)}</p>
                    <p className="text-xs text-gray-600">Per booking</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-indigo-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Unique Customers</p>
                    <p className="text-2xl font-bold text-gray-900">{data.uniqueCustomers}</p>
                    <p className={`text-xs ${getPercentageChange(data.uniqueCustomers, data.periodComparison.customers) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {getPercentageChange(data.uniqueCustomers, data.periodComparison.customers) >= 0 ? '+' : ''}
                      {formatPercentage(getPercentageChange(data.uniqueCustomers, data.periodComparison.customers))} vs previous period
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <BarChart3 className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Occupancy Rate</p>
                    <p className="text-2xl font-bold text-gray-900">{formatPercentage(data.occupancyRate)}</p>
                    <p className="text-xs text-gray-600">Average capacity utilization</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid lg:grid-cols-2 gap-8 mb-8">
              {/* Daily Revenue Trend */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Revenue Trend</h3>
                <div className="space-y-3">
                  {data.dailyRevenue.slice(-14).map((day, index) => {
                    const maxRevenue = Math.max(...data.dailyRevenue.map(d => d.revenue));
                    const width = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
                    
                    return (
                      <div key={day.date} className="flex items-center">
                        <div className="w-16 text-sm text-gray-600">{formatDate(day.date)}</div>
                        <div className="flex-1 mx-4">
                          <div className="bg-gray-200 rounded-full h-4 relative">
                            <div 
                              className="bg-orange-500 h-4 rounded-full transition-all duration-300"
                              style={{ width: `${width}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="w-20 text-sm font-medium text-right">
                          {formatCurrency(day.revenue)}
                        </div>
                        <div className="w-16 text-sm text-gray-500 text-right">
                          {day.bookings} bookings
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Route Performance */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Route Performance</h3>
                <div className="space-y-4">
                  {data.routePerformance.map((route) => (
                    <div key={route.routeId} className="border-b border-gray-200 pb-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">{route.routeName}</h4>
                          <p className="text-sm text-gray-600">{route.bookings} bookings</p>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-900">{formatCurrency(route.revenue)}</div>
                          <div className="text-sm text-gray-600">{formatPercentage(route.occupancyRate)} occupied</div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${route.occupancyRate}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Customer Segments & Hourly Distribution */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Customer Segments */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Segments</h3>
                <div className="space-y-4">
                  {data.customerSegments.map((segment) => (
                    <div key={segment.segment} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${
                          segment.segment === 'VIP' ? 'bg-purple-500' :
                          segment.segment === 'Frequent' ? 'bg-blue-500' :
                          segment.segment === 'Regular' ? 'bg-green-500' :
                          'bg-gray-500'
                        }`}></div>
                        <div>
                          <div className="font-medium text-gray-900">{segment.segment}</div>
                          <div className="text-sm text-gray-600">{segment.count} customers</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">{formatCurrency(segment.revenue)}</div>
                        <div className="text-sm text-gray-600">{formatPercentage(segment.percentage)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hourly Distribution */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Distribution by Hour</h3>
                <div className="space-y-3">
                  {data.hourlyDistribution.map((hour) => {
                    const maxBookings = Math.max(...data.hourlyDistribution.map(h => h.bookings));
                    const width = maxBookings > 0 ? (hour.bookings / maxBookings) * 100 : 0;
                    
                    return (
                      <div key={hour.hour} className="flex items-center">
                        <div className="w-12 text-sm text-gray-600">
                          {hour.hour.toString().padStart(2, '0')}:00
                        </div>
                        <div className="flex-1 mx-4">
                          <div className="bg-gray-200 rounded-full h-3 relative">
                            <div 
                              className="bg-green-500 h-3 rounded-full transition-all duration-300"
                              style={{ width: `${width}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="w-16 text-sm font-medium text-right">
                          {hour.bookings}
                        </div>
                        <div className="w-20 text-sm text-gray-500 text-right">
                          {formatCurrency(hour.revenue)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}