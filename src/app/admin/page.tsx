'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  MapPin,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface DashboardStats {
  todayBookings: number;
  todayRevenue: number;
  totalCustomers: number;
  upcomingDepartures: number;
  occupancyRate: number;
  pendingPayments: number;
}

interface RecentBooking {
  id: string;
  confirmationCode: string;
  contactEmail: string;
  passengerCount: number;
  totalAmount: number;
  bookingStatus: string;
  paymentStatus: string;
  createdAt: string;
  departure: {
    date: string;
    schedule: {
      departureTime: string;
      route: {
        name: string;
      };
    };
  };
}

interface TodayDeparture {
  id: string;
  date: string;
  capacity: number;
  bookedSeats: number;
  availableSeats: number;
  schedule: {
    departureTime: string;
    route: {
      name: string;
      startLocation: { name: string };
      endLocation: { name: string };
    };
  };
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [todayDepartures, setTodayDepartures] = useState<TodayDeparture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || !session.user?.isAdmin) {
      router.push('/auth/signin');
      return;
    }

    fetchDashboardData();
  }, [session, status, router]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, bookingsRes, departuresRes] = await Promise.all([
        fetch('/api/admin/dashboard/stats'),
        fetch('/api/admin/bookings?limit=10'),
        fetch('/api/admin/departures/today')
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }

      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        setRecentBookings(bookingsData.bookings);
      }

      if (departuresRes.ok) {
        const departuresData = await departuresRes.json();
        setTodayDepartures(departuresData.departures);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'paid':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'cancelled':
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
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
              <div className="text-2xl font-bold text-orange-600">SKOOT</div>
              <div className="ml-4 text-gray-500">Admin Dashboard</div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">Welcome, {session?.user?.name}</span>
              <button
                onClick={() => router.push('/auth/signout')}
                className="text-gray-500 hover:text-gray-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Today's Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.todayBookings}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Today's Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.todayRevenue)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Customers</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Upcoming Departures</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.upcomingDepartures}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-indigo-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Occupancy Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.occupancyRate}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Pending Payments</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingPayments}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Today's Departures */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Today's Departures</h2>
            </div>
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {todayDepartures.length > 0 ? (
                todayDepartures.map((departure) => (
                  <div key={departure.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div className="text-lg font-bold text-gray-900">
                            {formatTime(departure.schedule.departureTime)}
                          </div>
                          <div className="text-sm text-gray-600">
                            <MapPin className="inline h-4 w-4 mr-1" />
                            {departure.schedule.route.startLocation.name} → {departure.schedule.route.endLocation.name}
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-gray-500">
                          {departure.schedule.route.name}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          departure.availableSeats === 0 
                            ? 'bg-red-100 text-red-800' 
                            : departure.availableSeats < 5
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {departure.bookedSeats}/{departure.capacity} booked
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {departure.availableSeats} seats left
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  No departures scheduled for today
                </div>
              )}
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Bookings</h2>
            </div>
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {recentBookings.length > 0 ? (
                recentBookings.map((booking) => (
                  <div key={booking.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {booking.confirmationCode}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.bookingStatus)}`}>
                            {booking.bookingStatus}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-600">
                          {booking.contactEmail} • {booking.passengerCount} passenger{booking.passengerCount > 1 ? 's' : ''}
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          {booking.departure.schedule.route.name} • {formatDate(booking.departure.date)} at {formatTime(booking.departure.schedule.departureTime)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">
                          {formatCurrency(booking.totalAmount)}
                        </div>
                        <div className={`text-xs ${getStatusColor(booking.paymentStatus)}`}>
                          {booking.paymentStatus === 'PAID' && <CheckCircle className="inline h-3 w-3 mr-1" />}
                          {booking.paymentStatus === 'FAILED' && <XCircle className="inline h-3 w-3 mr-1" />}
                          {booking.paymentStatus === 'PENDING' && <Clock className="inline h-3 w-3 mr-1" />}
                          {booking.paymentStatus}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  No recent bookings
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <button
            onClick={() => router.push('/admin/bookings')}
            className="bg-white rounded-lg shadow-sm p-6 text-left hover:shadow-md transition-shadow"
          >
            <Calendar className="h-8 w-8 text-blue-600 mb-3" />
            <h3 className="font-semibold text-gray-900">Manage Bookings</h3>
            <p className="text-sm text-gray-500">View and edit customer bookings</p>
          </button>

          <button
            onClick={() => router.push('/admin/schedules')}
            className="bg-white rounded-lg shadow-sm p-6 text-left hover:shadow-md transition-shadow"
          >
            <Clock className="h-8 w-8 text-orange-600 mb-3" />
            <h3 className="font-semibold text-gray-900">Schedules</h3>
            <p className="text-sm text-gray-500">Manage departure schedules</p>
          </button>

          <button
            onClick={() => router.push('/admin/customers')}
            className="bg-white rounded-lg shadow-sm p-6 text-left hover:shadow-md transition-shadow"
          >
            <Users className="h-8 w-8 text-purple-600 mb-3" />
            <h3 className="font-semibold text-gray-900">Customers</h3>
            <p className="text-sm text-gray-500">Customer database and history</p>
          </button>

          <button
            onClick={() => router.push('/admin/reports')}
            className="bg-white rounded-lg shadow-sm p-6 text-left hover:shadow-md transition-shadow"
          >
            <TrendingUp className="h-8 w-8 text-green-600 mb-3" />
            <h3 className="font-semibold text-gray-900">Reports</h3>
            <p className="text-sm text-gray-500">Revenue and analytics</p>
          </button>
        </div>
      </div>
    </div>
  );
}