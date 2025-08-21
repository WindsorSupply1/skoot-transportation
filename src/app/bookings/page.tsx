'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useAuth } from '../../components/auth/AuthProvider';
import Link from 'next/link';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  CreditCard, 
  MoreVertical,
  Download,
  Edit,
  X,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Phone,
  Mail,
  Plus
} from 'lucide-react';

interface Booking {
  id: string;
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
  passengers: number;
  totalAmount: number;
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
      };
    };
  };
  pickupLocation: {
    id: string;
    name: string;
    address: string;
  };
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
}

export default function BookingsPage() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'cancelled'>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBookings();
    }
  }, [isAuthenticated]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/bookings?user=true');
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
      } else {
        throw new Error('Failed to fetch bookings');
      }
    } catch (err) {
      setError('Unable to load your bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <CheckCircle className="w-4 h-4" />;
      case 'PENDING':
        return <Clock className="w-4 h-4" />;
      case 'CANCELLED':
        return <X className="w-4 h-4" />;
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const filterBookings = (bookings: Booking[]) => {
    const now = new Date();
    
    switch (filter) {
      case 'upcoming':
        return bookings.filter(booking => 
          new Date(booking.departure.date) >= now && 
          booking.status !== 'CANCELLED'
        );
      case 'past':
        return bookings.filter(booking => 
          new Date(booking.departure.date) < now || 
          booking.status === 'COMPLETED'
        );
      case 'cancelled':
        return bookings.filter(booking => booking.status === 'CANCELLED');
      default:
        return bookings;
    }
  };

  const canCancelBooking = (booking: Booking) => {
    const departureTime = new Date(booking.departure.date);
    const now = new Date();
    const hoursUntilDeparture = (departureTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    return hoursUntilDeparture > 2 && booking.status === 'CONFIRMED';
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });

      if (response.ok) {
        await fetchBookings(); // Refresh the list
        setSelectedBooking(null);
      } else {
        throw new Error('Failed to cancel booking');
      }
    } catch (err) {
      alert('Failed to cancel booking. Please contact support.');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link 
                href="/"
                className="flex items-center text-gray-600 hover:text-orange-600 transition-colors font-medium"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Home
              </Link>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900">SKOOT</h1>
              </div>
              <a
                href="tel:+1-803-SKOOT-SC"
                className="flex items-center text-gray-600 hover:text-orange-600 transition-colors"
              >
                <Phone className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline text-sm">Support</span>
              </a>
            </div>
          </div>
        </div>

        {/* Not Authenticated Content */}
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CreditCard className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Sign In to View Your Bookings
          </h1>
          <p className="text-gray-600 mb-8">
            Access your booking history, manage upcoming trips, and download receipts.
          </p>
          <div className="space-y-4">
            <Link
              href="/auth/signin"
              className="inline-block bg-orange-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-orange-700 transition-colors"
            >
              Sign In to Your Account
            </Link>
            <div className="text-sm text-gray-500">
              Don't have an account?{' '}
              <Link href="/auth/signup" className="text-orange-600 hover:text-orange-700">
                Create one here
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredBookings = filterBookings(bookings);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/"
              className="flex items-center text-gray-600 hover:text-orange-600 transition-colors font-medium"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Home
            </Link>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">SKOOT</h1>
            </div>
            <a
              href="tel:+1-803-SKOOT-SC"
              className="flex items-center text-gray-600 hover:text-orange-600 transition-colors"
            >
              <Phone className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline text-sm">Support</span>
            </a>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
              <p className="text-gray-600">Manage your SKOOT shuttle reservations</p>
            </div>
            <Link
              href="/booking"
              className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Booking</span>
            </Link>
          </div>

          {/* User Info */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 font-semibold">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div>
                <div className="font-medium text-gray-900">{user?.name}</div>
                <div className="text-sm text-gray-500">{user?.email}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 mb-6">
          {[
            { key: 'all', label: 'All Bookings' },
            { key: 'upcoming', label: 'Upcoming' },
            { key: 'past', label: 'Past' },
            { key: 'cancelled', label: 'Cancelled' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-orange-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your bookings...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Bookings</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchBookings}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredBookings.length === 0 && (
          <div className="text-center py-12">
            <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filter === 'all' ? 'No bookings yet' : `No ${filter} bookings`}
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? "You haven't made any bookings yet. Ready for your first trip?"
                : `You don't have any ${filter} bookings.`
              }
            </p>
            <Link
              href="/booking"
              className="inline-flex items-center space-x-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Book Your First Trip</span>
            </Link>
          </div>
        )}

        {/* Bookings List */}
        {!loading && !error && filteredBookings.length > 0 && (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        <span>{booking.status}</span>
                      </span>
                      <span className="text-sm text-gray-500">
                        Booking #{booking.id.slice(-6)}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-500">Date</div>
                          <div className="font-medium">
                            {formatDate(booking.departure.date)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-500">Departure</div>
                          <div className="font-medium">
                            {formatTime(booking.departure.schedule.time)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-500">Passengers</div>
                          <div className="font-medium">{booking.passengers}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-gray-600">
                            {booking.pickupLocation.name}
                          </span>
                        </div>
                        <span className="text-gray-400">→</span>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-gray-600">CLT Airport</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          ${(booking.totalAmount / 100).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500">Total</div>
                      </div>
                    </div>
                  </div>

                  <div className="ml-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedBooking(booking)}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Booking Details
                </h2>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Status and ID */}
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedBooking.status)}`}>
                    {getStatusIcon(selectedBooking.status)}
                    <span>{selectedBooking.status}</span>
                  </span>
                  <span className="text-sm text-gray-500">
                    Booking #{selectedBooking.id}
                  </span>
                </div>

                {/* Trip Details */}
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Trip Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Date</div>
                      <div className="font-medium">
                        {formatDate(selectedBooking.departure.date)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Departure Time</div>
                      <div className="font-medium">
                        {formatTime(selectedBooking.departure.schedule.time)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Passengers</div>
                      <div className="font-medium">{selectedBooking.passengers}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Total Amount</div>
                      <div className="font-medium">
                        ${(selectedBooking.totalAmount / 100).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Locations */}
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Locations</h3>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <div className="font-medium">{selectedBooking.pickupLocation.name}</div>
                        <div className="text-sm text-gray-500">
                          {selectedBooking.pickupLocation.address}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <div className="font-medium">Charlotte Douglas International Airport</div>
                        <div className="text-sm text-gray-500">All terminals</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Customer Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500 w-16">Name:</span>
                      <span className="font-medium">
                        {selectedBooking.customer.firstName} {selectedBooking.customer.lastName}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500 w-16">Email:</span>
                      <span className="font-medium">{selectedBooking.customer.email}</span>
                    </div>
                    {selectedBooking.customer.phone && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500 w-16">Phone:</span>
                        <span className="font-medium">{selectedBooking.customer.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t pt-6">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => window.print()}
                      className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Receipt</span>
                    </button>

                    {canCancelBooking(selectedBooking) && (
                      <button
                        onClick={() => handleCancelBooking(selectedBooking.id)}
                        className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        <span>Cancel Booking</span>
                      </button>
                    )}

                    <Link
                      href="/contact"
                      className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Contact Support</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}