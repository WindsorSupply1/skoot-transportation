'use client';

import { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Mail, 
  Phone, 
  Download, 
  CreditCard, 
  Home,
  CalendarDays,
  Receipt
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../auth/AuthProvider';

interface TripDetails {
  routeId: string;
  scheduleId: string;
  departureId: string;
  date: string;
  passengers: number;
  ticketType: 'ADULT' | 'CHILD' | 'SENIOR';
}

interface CustomerDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  pickupLocationId: string;
}

interface BookingConfirmationProps {
  bookingId: string;
  tripDetails: TripDetails | null;
  customerDetails: CustomerDetails | null;
  onNewBooking: () => void;
}

export default function BookingConfirmation({ 
  bookingId, 
  tripDetails, 
  customerDetails, 
  onNewBooking 
}: BookingConfirmationProps) {
  const { user } = useAuth();
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`);
      if (response.ok) {
        const data = await response.json();
        setBookingDetails(data.booking);
      } else {
        throw new Error('Failed to fetch booking details');
      }
    } catch (err) {
      setError('Unable to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
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

  const downloadReceipt = () => {
    // Implement receipt download functionality
    window.print();
  };

  const addToCalendar = () => {
    if (!bookingDetails || !tripDetails) return;
    
    const startDate = new Date(tripDetails.date);
    const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000); // 3 hours later
    
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=SKOOT Shuttle to Charlotte Airport&dates=${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=Booking ID: ${bookingId}%0APassengers: ${tripDetails.passengers}%0ACustomer: ${customerDetails?.firstName} ${customerDetails?.lastName}&location=Columbia, SC to Charlotte Douglas Airport`;
    
    window.open(calendarUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading booking details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <div className="w-8 h-8 bg-red-500 rounded-full"></div>
        </div>
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Details</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={onNewBooking}
          className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
        >
          Start New Booking
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Success Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-green-800 mb-2">
          Booking Confirmed!
        </h1>
        <p className="text-gray-600 text-lg">
          Your shuttle reservation is confirmed and ready
        </p>
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg inline-block">
          <p className="text-sm text-green-800">
            <strong>Booking ID:</strong> {bookingId}
          </p>
        </div>
      </div>

      {/* Trip Details */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Receipt className="w-5 h-5 mr-2 text-orange-600" />
          Trip Details
        </h2>
        
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-4">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-orange-600 mr-3" />
              <div>
                <div className="text-sm text-gray-500">Travel Date</div>
                <div className="font-medium text-gray-900">
                  {tripDetails && formatDate(tripDetails.date)}
                </div>
              </div>
            </div>
            
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-orange-600 mr-3" />
              <div>
                <div className="text-sm text-gray-500">Departure Time</div>
                <div className="font-medium text-gray-900">
                  {bookingDetails?.schedule?.time && formatTime(bookingDetails.schedule.time)}
                </div>
              </div>
            </div>
            
            <div className="flex items-center">
              <Users className="h-5 w-5 text-orange-600 mr-3" />
              <div>
                <div className="text-sm text-gray-500">Passengers</div>
                <div className="font-medium text-gray-900">
                  {tripDetails?.passengers} × {tripDetails?.ticketType.toLowerCase()}
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <MapPin className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
              <div>
                <div className="text-sm text-gray-500">Pickup Location</div>
                <div className="font-medium text-gray-900">
                  {bookingDetails?.pickupLocation?.name || 'Columbia, SC'}
                </div>
                <div className="text-xs text-gray-400">
                  {bookingDetails?.pickupLocation?.address}
                </div>
              </div>
            </div>
            
            <div className="flex items-start">
              <MapPin className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
              <div>
                <div className="text-sm text-gray-500">Destination</div>
                <div className="font-medium text-gray-900">
                  Charlotte Douglas Airport
                </div>
                <div className="text-xs text-gray-400">
                  All terminals
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-900">Total Paid:</span>
                <span className="text-lg font-bold text-green-600">
                  ${(bookingDetails?.totalAmount / 100)?.toFixed(2) || '--'}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Payment confirmed via Stripe
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Customer Information */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-orange-600 font-semibold text-sm">
                {customerDetails?.firstName.charAt(0)}
              </span>
            </div>
            <div>
              <div className="text-sm text-gray-500">Customer</div>
              <div className="font-medium">
                {customerDetails?.firstName} {customerDetails?.lastName}
              </div>
            </div>
          </div>
          
          <div className="flex items-center">
            <Mail className="h-4 w-4 text-gray-400 mr-3" />
            <div>
              <div className="text-sm text-gray-500">Email</div>
              <div className="font-medium text-sm">{customerDetails?.email}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          What Happens Next?
        </h3>
        <div className="space-y-3">
          <div className="flex items-start">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</div>
            <div>
              <div className="font-medium text-blue-900">Confirmation Email</div>
              <div className="text-sm text-blue-700">Check your email for detailed pickup instructions and driver contact info</div>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</div>
            <div>
              <div className="font-medium text-blue-900">Driver Contact</div>
              <div className="text-sm text-blue-700">Your driver will call/text 30 minutes before pickup with final details</div>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</div>
            <div>
              <div className="font-medium text-blue-900">Be Ready</div>
              <div className="text-sm text-blue-700">Arrive at pickup location 5 minutes early with your luggage ready</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Important Reminders */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
        <h3 className="font-semibold text-orange-900 mb-3">Important Reminders</h3>
        <ul className="text-sm text-orange-800 space-y-2">
          <li className="flex items-start">
            <span className="text-orange-600 mr-2">•</span>
            <span>Arrive at the airport <strong>2+ hours before your flight</strong> (travel time is 100-130 minutes)</span>
          </li>
          <li className="flex items-start">
            <span className="text-orange-600 mr-2">•</span>
            <span>We include a 10-minute stop in Rock Hill during the journey</span>
          </li>
          <li className="flex items-start">
            <span className="text-orange-600 mr-2">•</span>
            <span>Maximum 2 bags per passenger (additional bags $5 each)</span>
          </li>
          <li className="flex items-start">
            <span className="text-orange-600 mr-2">•</span>
            <span>Cancellations allowed up to 2 hours before departure</span>
          </li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          onClick={addToCalendar}
          className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 bg-blue-600 text-white px-3 py-3 rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          <CalendarDays className="w-4 h-4" />
          <span className="text-xs sm:text-sm">Add to Calendar</span>
        </button>
        
        <button
          onClick={downloadReceipt}
          className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 bg-gray-600 text-white px-3 py-3 rounded-lg hover:bg-gray-700 transition-colors text-sm"
        >
          <Download className="w-4 h-4" />
          <span className="text-xs sm:text-sm">Receipt</span>
        </button>
        
        <button
          onClick={onNewBooking}
          className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 bg-orange-600 text-white px-3 py-3 rounded-lg hover:bg-orange-700 transition-colors text-sm"
        >
          <Home className="w-4 h-4" />
          <span className="text-xs sm:text-sm">Book Again</span>
        </button>
        
        <Link
          href="/contact"
          className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 bg-gray-100 text-gray-700 px-3 py-3 rounded-lg hover:bg-gray-200 transition-colors text-center text-sm"
        >
          <Phone className="w-4 h-4" />
          <span className="text-xs sm:text-sm">Support</span>
        </Link>
      </div>
      
      {/* Account Creation Suggestion for Guests */}
      {!user && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="font-semibold text-green-900 mb-2">Create an Account</h3>
          <p className="text-sm text-green-700 mb-4">
            Save your information for faster future bookings and access to your booking history.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <CreditCard className="w-4 h-4" />
            <span>Create Free Account</span>
          </Link>
        </div>
      )}
    </div>
  );
}