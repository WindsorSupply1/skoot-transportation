'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSession } from 'next-auth/react';
import { z } from 'zod';
import { User, LogIn } from 'lucide-react';
import SignInModal from '../auth/SignInModal';
import GuestBookingForm from '../auth/GuestBookingForm';
import AccountLinkingModal from '../auth/AccountLinkingModal';

const bookingSchema = z.object({
  pickupLocationId: z.string().min(1, 'Pickup location is required'),
  dropoffLocationId: z.string().min(1, 'Dropoff location is required'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  passengers: z.number().min(1, 'At least 1 passenger required').max(8, 'Maximum 8 passengers'),
  // These fields are optional for authenticated users as they're pre-filled
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface GuestInfoData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  createAccount?: boolean;
}

interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  fullAddress: string;
  instructions?: string;
  isCurrentlyAvailable: boolean;
  types: string[];
}

export default function EnhancedBookingForm() {
  const { data: session, status } = useSession();
  const [step, setStep] = useState<'booking' | 'auth-choice' | 'guest-info'>('booking');
  const [bookingData, setBookingData] = useState<BookingFormData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showAccountLinking, setShowAccountLinking] = useState(false);
  const [completedBookingId, setCompletedBookingId] = useState<string | null>(null);
  const [guestEmail, setGuestEmail] = useState('');
  const [pickupLocations, setPickupLocations] = useState<Location[]>([]);
  const [dropoffLocations, setDropoffLocations] = useState<Location[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
  });

  const selectedPickupLocationId = watch('pickupLocationId');
  const selectedDropoffLocationId = watch('dropoffLocationId');

  const isAuthenticated = status === 'authenticated' && session?.user;

  // Load pickup and dropoff locations
  useEffect(() => {
    const fetchLocations = async () => {
      setLocationsLoading(true);
      try {
        const [pickupResponse, dropoffResponse] = await Promise.all([
          fetch('/api/locations?type=pickup'),
          fetch('/api/locations?type=dropoff')
        ]);

        if (pickupResponse.ok) {
          const pickupData = await pickupResponse.json();
          setPickupLocations(pickupData.locations || []);
        }

        if (dropoffResponse.ok) {
          const dropoffData = await dropoffResponse.json();
          setDropoffLocations(dropoffData.locations || []);
        }
      } catch (error) {
        console.error('Failed to fetch locations:', error);
      } finally {
        setLocationsLoading(false);
      }
    };

    fetchLocations();
  }, []);

  const getSelectedLocation = (locationId: string, type: 'pickup' | 'dropoff') => {
    const locations = type === 'pickup' ? pickupLocations : dropoffLocations;
    return locations.find(loc => loc.id === locationId);
  };

  const onBookingSubmit = async (data: BookingFormData) => {
    if (isAuthenticated) {
      // User is authenticated, submit directly
      await submitBooking({
        ...data,
        guestInfo: null,
        userId: session.user.id,
      });
    } else {
      // User is not authenticated, go to auth choice
      setBookingData(data);
      setStep('auth-choice');
    }
  };

  const handleAuthChoice = (choice: 'signin' | 'guest') => {
    if (choice === 'signin') {
      setShowSignInModal(true);
    } else {
      setStep('guest-info');
    }
  };

  const handleGuestInfoSubmit = async (guestInfo: GuestInfoData) => {
    if (!bookingData) return;

    setGuestEmail(guestInfo.email);
    
    await submitBooking({
      ...bookingData,
      guestInfo,
      userId: null,
    });
  };

  const submitBooking = async (data: {
    pickupLocationId: string;
    dropoffLocationId: string;
    date: string;
    time: string;
    passengers: number;
    guestInfo?: GuestInfoData | null;
    userId?: string | null;
  }) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create booking');
      }

      // Booking successful
      const bookingId = result.bookingId;
      setCompletedBookingId(bookingId);

      // If guest booking and they wanted to create an account, show account linking
      if (!isAuthenticated && data.guestInfo?.createAccount) {
        setShowAccountLinking(true);
      } else {
        // Redirect to confirmation
        window.location.href = `/booking/confirmation/${bookingId}`;
      }

      reset();
      setBookingData(null);
    } catch (error) {
      console.error('Booking error:', error);
      alert('Error submitting booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignInSuccess = () => {
    setShowSignInModal(false);
    // After successful sign-in, submit the booking
    if (bookingData) {
      submitBooking({
        ...bookingData,
        guestInfo: null,
        userId: session?.user?.id || null,
      });
    }
  };

  if (step === 'booking') {
    return (
      <div className="space-y-6">
        {/* User Status Banner */}
        {isAuthenticated ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">
                  Signed in as {session.user.name}
                </p>
                <p className="text-xs text-green-700">
                  Your booking will be saved to your account automatically
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <LogIn className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Sign in for faster booking
                </p>
                <p className="text-xs text-blue-700">
                  Or continue as guest - you can create an account later
                </p>
              </div>
              <button
                onClick={() => setShowSignInModal(true)}
                className="ml-auto text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Sign In
              </button>
            </div>
          </div>
        )}

        {/* Booking Form */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Book Your Transportation</h2>
          
          <form onSubmit={handleSubmit(onBookingSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pickup Location *
                </label>
                {locationsLoading ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                    Loading locations...
                  </div>
                ) : (
                  <select
                    {...register('pickupLocationId')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">Select pickup location</option>
                    {pickupLocations.map((location) => (
                      <option key={location.id} value={location.id} disabled={!location.isCurrentlyAvailable}>
                        {location.name} - {location.fullAddress}
                        {!location.isCurrentlyAvailable ? ' (Currently Closed)' : ''}
                      </option>
                    ))}
                  </select>
                )}
                {errors.pickupLocationId && (
                  <p className="mt-1 text-sm text-red-600">{errors.pickupLocationId.message}</p>
                )}
                {selectedPickupLocationId && getSelectedLocation(selectedPickupLocationId, 'pickup')?.instructions && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                    <strong>Pickup Instructions:</strong> {getSelectedLocation(selectedPickupLocationId, 'pickup')?.instructions}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dropoff Location *
                </label>
                {locationsLoading ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                    Loading locations...
                  </div>
                ) : (
                  <select
                    {...register('dropoffLocationId')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">Select dropoff location</option>
                    {dropoffLocations.map((location) => (
                      <option key={location.id} value={location.id} disabled={!location.isCurrentlyAvailable}>
                        {location.name} - {location.fullAddress}
                        {!location.isCurrentlyAvailable ? ' (Currently Closed)' : ''}
                      </option>
                    ))}
                  </select>
                )}
                {errors.dropoffLocationId && (
                  <p className="mt-1 text-sm text-red-600">{errors.dropoffLocationId.message}</p>
                )}
                {selectedDropoffLocationId && getSelectedLocation(selectedDropoffLocationId, 'dropoff')?.instructions && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                    <strong>Dropoff Instructions:</strong> {getSelectedLocation(selectedDropoffLocationId, 'dropoff')?.instructions}
                  </div>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  {...register('date')}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                {errors.date && (
                  <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time
                </label>
                <input
                  type="time"
                  {...register('time')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                {errors.time && (
                  <p className="mt-1 text-sm text-red-600">{errors.time.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Passengers
                </label>
                <select
                  {...register('passengers', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                    <option key={num} value={num}>{num} passenger{num > 1 ? 's' : ''}</option>
                  ))}
                </select>
                {errors.passengers && (
                  <p className="mt-1 text-sm text-red-600">{errors.passengers.message}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Processing...' : 'Continue to Booking Details'}
            </button>
          </form>
        </div>

        {/* Sign In Modal */}
        <SignInModal
          isOpen={showSignInModal}
          onClose={() => setShowSignInModal(false)}
          redirectTo="/booking"
        />
      </div>
    );
  }

  if (step === 'auth-choice') {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">How would you like to continue?</h2>
          
          <div className="space-y-4">
            <button
              onClick={() => handleAuthChoice('signin')}
              className="w-full flex items-center justify-center gap-3 p-4 border-2 border-orange-600 rounded-lg text-orange-600 font-medium hover:bg-orange-50 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
            >
              <LogIn className="h-5 w-5" />
              Sign In to Your Account
              <span className="text-sm text-gray-600 ml-2">(Faster checkout, saved preferences)</span>
            </button>
            
            <button
              onClick={() => handleAuthChoice('guest')}
              className="w-full flex items-center justify-center gap-3 p-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
            >
              <User className="h-5 w-5" />
              Continue as Guest
              <span className="text-sm text-gray-600 ml-2">(Option to create account later)</span>
            </button>
          </div>

          <button
            onClick={() => setStep('booking')}
            className="mt-4 text-gray-600 hover:text-gray-900 text-sm"
          >
            ← Back to booking form
          </button>
        </div>
      </div>
    );
  }

  if (step === 'guest-info') {
    return (
      <div className="space-y-6">
        <GuestBookingForm
          onSubmit={handleGuestInfoSubmit}
          onSignInInstead={() => {
            setStep('auth-choice');
            setShowSignInModal(true);
          }}
          isLoading={isSubmitting}
        />

        <button
          onClick={() => setStep('auth-choice')}
          className="text-gray-600 hover:text-gray-900 text-sm"
        >
          ← Back to options
        </button>

        {/* Account Linking Modal */}
        {showAccountLinking && completedBookingId && (
          <AccountLinkingModal
            isOpen={showAccountLinking}
            onClose={() => setShowAccountLinking(false)}
            guestEmail={guestEmail}
            bookingId={completedBookingId}
          />
        )}
      </div>
    );
  }

  return null;
}