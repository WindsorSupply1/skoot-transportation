'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Filter,
  Edit3,
  Trash2,
  Download,
  Eye,
  Calendar,
  Users,
  DollarSign,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface Booking {
  id: string;
  bookingNumber: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  passengerCount: number;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'PAID' | 'CANCELLED' | 'FAILED';
  createdAt: string;
  updatedAt: string;
  departure: {
    id: string;
    date: string;
    schedule: {
      id: string;
      time: string;
      route: {
        id: string;
        name: string;
        origin: string;
        destination: string;
        price: number;
      };
    };
  };
  pickupLocation?: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
  };
  dropoffLocation?: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
  };
  passengers: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  }>;
  paymentId?: string;
  notes?: string;
}

interface BookingFilters {
  status: string;
  dateFrom: string;
  dateTo: string;
  route: string;
  pickupLocation: string;
  dropoffLocation: string;
  search: string;
}

export default function BookingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<BookingFilters>({
    status: 'all',
    dateFrom: '',
    dateTo: '',
    route: 'all',
    pickupLocation: 'all',
    dropoffLocation: 'all',
    search: ''
  });
  const [locations, setLocations] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user) {
      router.push('/auth/signin');
      return;
    }

    fetchBookings();
    fetchLocations();
  }, [session, status, router]);

  useEffect(() => {
    applyFilters();
  }, [bookings, filters]);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/bookings');
      if (!response.ok) {
        throw new Error(`Failed to fetch bookings: ${response.status}`);
      }
      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      setError(error instanceof Error ? error.message : 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/locations?type=all&includeInactive=true');
      if (response.ok) {
        const data = await response.json();
        setLocations(data.locations || []);
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...bookings];

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(booking => booking.status.toLowerCase() === filters.status.toLowerCase());
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(booking => new Date(booking.departure.date) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      filtered = filtered.filter(booking => new Date(booking.departure.date) <= new Date(filters.dateTo));
    }

    // Route filter
    if (filters.route !== 'all') {
      filtered = filtered.filter(booking => booking.departure.schedule.route.id === filters.route);
    }

    // Pickup location filter
    if (filters.pickupLocation !== 'all') {
      filtered = filtered.filter(booking => booking.pickupLocation?.id === filters.pickupLocation);
    }

    // Dropoff location filter
    if (filters.dropoffLocation !== 'all') {
      filtered = filtered.filter(booking => booking.dropoffLocation?.id === filters.dropoffLocation);
    }

    // Search filter
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(booking => 
        booking.bookingNumber.toLowerCase().includes(search) ||
        booking.user.email.toLowerCase().includes(search) ||
        booking.user.firstName.toLowerCase().includes(search) ||
        booking.user.lastName.toLowerCase().includes(search) ||
        booking.departure.schedule.route.name.toLowerCase().includes(search)
      );
    }

    setFilteredBookings(filtered);
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update booking status');
      }

      // Refresh bookings
      fetchBookings();
      setShowModal(false);
    } catch (error) {
      console.error('Failed to update booking:', error);
      alert('Failed to update booking status');
    }
  };

  const deleteBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete booking');
      }

      fetchBookings();
      setShowModal(false);
    } catch (error) {
      console.error('Failed to delete booking:', error);
      alert('Failed to delete booking');
    }
  };

  const exportBookings = () => {
    const csvContent = [
      ['Booking Number', 'Customer', 'Email', 'Route', 'Date', 'Time', 'Passengers', 'Amount', 'Status'],
      ...filteredBookings.map(booking => [
        booking.bookingNumber,
        `${booking.user.firstName} ${booking.user.lastName}`,
        booking.user.email,
        booking.departure.schedule.route.name,
        new Date(booking.departure.date).toLocaleDateString(),
        booking.departure.schedule.time,
        booking.passengerCount.toString(),
        booking.totalAmount.toString(),
        booking.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      year: 'numeric'
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md">
          <div className="text-red-600 mb-4">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <h2 className="text-lg font-semibold text-center">Error Loading Bookings</h2>
          </div>
          <p className="text-gray-600 text-center mb-4">{error}</p>
          <button 
            onClick={fetchBookings}
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
              <div className="ml-4 text-gray-500">Booking Management</div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={exportBookings}
                className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <Download className="h-4 w-4 mr-1" />
                Export CSV
              </button>
              <button
                onClick={fetchBookings}
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
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Confirmed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {bookings.filter(b => ['CONFIRMED', 'PAID'].includes(b.status)).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {bookings.filter(b => b.status === 'PENDING').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(bookings.reduce((sum, b) => sum + b.totalAmount, 0))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Bookings</h2>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center text-gray-500 hover:text-gray-700"
              >
                <Filter className="h-4 w-4 mr-1" />
                Filters
                {showFilters ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Booking number, email..."
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="paid">Paid</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Location</label>
                  <select
                    value={filters.pickupLocation}
                    onChange={(e) => setFilters({ ...filters, pickupLocation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="all">All Pickup Locations</option>
                    {locations.filter(loc => loc.isPickup).map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dropoff Location</label>
                  <select
                    value={filters.dropoffLocation}
                    onChange={(e) => setFilters({ ...filters, dropoffLocation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="all">All Dropoff Locations</option>
                    {locations.filter(loc => loc.isDropoff).map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => setFilters({
                      status: 'all',
                      dateFrom: '',
                      dateTo: '',
                      route: 'all',
                      pickupLocation: 'all',
                      dropoffLocation: 'all',
                      search: ''
                    })}
                    className="w-full px-3 py-2 text-sm text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bookings List */}
          <div className="divide-y divide-gray-200">
            {filteredBookings.length > 0 ? (
              filteredBookings.map((booking) => (
                <div key={booking.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <span className="font-bold text-lg text-gray-900">
                          {booking.bookingNumber}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>
                      
                      <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-gray-500">Customer</div>
                          <div className="font-medium">{booking.user.firstName} {booking.user.lastName}</div>
                          <div className="text-gray-600">{booking.user.email}</div>
                        </div>
                        
                        <div>
                          <div className="text-gray-500">Trip Details</div>
                          <div className="font-medium flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {booking.departure.schedule.route.name}
                          </div>
                          <div className="text-gray-600">
                            {formatDate(booking.departure.date)} at {formatTime(booking.departure.schedule.time)}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-gray-500">Booking Info</div>
                          <div className="font-medium">
                            {booking.passengerCount} passenger{booking.passengerCount > 1 ? 's' : ''} • {formatCurrency(booking.totalAmount)}
                          </div>
                          <div className="text-gray-600">
                            Booked on {formatDate(booking.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-6">
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowModal(true);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowModal(true);
                        }}
                        className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg"
                        title="Edit Booking"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => deleteBooking(booking.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete Booking"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
                <p>No bookings match your current filters.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Detail Modal */}
      {showModal && selectedBooking && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Booking Details - {selectedBooking.bookingNumber}
                </h3>
              </div>
              
              <div className="bg-white px-6 py-4 space-y-6">
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={selectedBooking.status}
                    onChange={(e) => updateBookingStatus(selectedBooking.id, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="PAID">Paid</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="FAILED">Failed</option>
                  </select>
                </div>

                {/* Customer Info */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Customer Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Name:</span>
                      <div className="font-medium">{selectedBooking.user.firstName} {selectedBooking.user.lastName}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <div className="font-medium">{selectedBooking.user.email}</div>
                    </div>
                    {selectedBooking.user.phone && (
                      <div>
                        <span className="text-gray-500">Phone:</span>
                        <div className="font-medium">{selectedBooking.user.phone}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Trip Details */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Trip Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Route:</span>
                      <div className="font-medium">{selectedBooking.departure.schedule.route.name}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Date & Time:</span>
                      <div className="font-medium">
                        {formatDate(selectedBooking.departure.date)} at {formatTime(selectedBooking.departure.schedule.time)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Passengers:</span>
                      <div className="font-medium">{selectedBooking.passengerCount}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Total Amount:</span>
                      <div className="font-medium">{formatCurrency(selectedBooking.totalAmount)}</div>
                    </div>
                  </div>
                </div>

                {/* Passengers */}
                {selectedBooking.passengers && selectedBooking.passengers.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Passengers</h4>
                    <div className="space-y-2">
                      {selectedBooking.passengers.map((passenger, index) => (
                        <div key={passenger.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between">
                            <span className="font-medium">{passenger.firstName} {passenger.lastName}</span>
                            <span className="text-sm text-gray-500">Passenger {index + 1}</span>
                          </div>
                          <div className="text-sm text-gray-600">{passenger.email}</div>
                          {passenger.phone && (
                            <div className="text-sm text-gray-600">{passenger.phone}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => deleteBooking(selectedBooking.id)}
                  className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  Delete Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}