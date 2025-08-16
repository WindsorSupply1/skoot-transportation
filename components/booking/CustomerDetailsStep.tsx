'use client';

import React, { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import SignInModal from '../auth/SignInModal';
import GuestBookingForm from '../auth/GuestBookingForm';
import { User, CreditCard } from 'lucide-react';

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
  createAccount?: boolean;
}

interface CustomerDetailsStepProps {
  tripDetails: TripDetails;
  onComplete: (data: CustomerDetails) => void;
}

export default function CustomerDetailsStep({ 
  tripDetails, 
  onComplete 
}: CustomerDetailsStepProps) {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [bookingMethod, setBookingMethod] = useState<'signin' | 'guest' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // If user is authenticated, pre-fill their information
  const handleAuthenticatedSubmit = (data: CustomerDetails) => {
    onComplete({
      ...data,
      firstName: user?.name?.split(' ')[0] || data.firstName,
      lastName: user?.name?.split(' ').slice(1).join(' ') || data.lastName,
      email: user?.email || data.email,
    });
  };

  // Handle guest booking submission
  const handleGuestSubmit = (data: any) => {
    setIsLoading(true);
    
    // Convert guest form data to CustomerDetails format
    const customerDetails: CustomerDetails = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      pickupLocationId: '', // Will be selected in the form
      createAccount: data.createAccount,
    };
    
    setTimeout(() => {
      onComplete(customerDetails);
      setIsLoading(false);
    }, 500);
  };

  // Show sign-in modal
  const handleSignInInstead = () => {
    setShowSignInModal(true);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Your Information</h2>
        <p className="text-gray-600 mt-2">
          Complete your booking with your contact details
        </p>
      </div>

      {/* Trip Summary */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <h3 className="font-medium text-orange-900 mb-2">Trip Summary</h3>
        <div className="text-sm text-orange-700 space-y-1">
          <div>Date: {new Date(tripDetails.date).toLocaleDateString()}</div>
          <div>Passengers: {tripDetails.passengers}</div>
          <div>Ticket Type: {tripDetails.ticketType}</div>
        </div>
      </div>

      {isAuthenticated && user ? (
        /* Authenticated User Flow */
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-green-900">
                Welcome back, {user.name}!
              </h3>
              <p className="text-sm text-green-700">
                We'll use your saved information for faster checkout
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 mb-4">
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="text-gray-600">Name:</label>
                <div className="font-medium">{user.name}</div>
              </div>
              <div>
                <label className="text-gray-600">Email:</label>
                <div className="font-medium">{user.email}</div>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleAuthenticatedSubmit({
              firstName: user.name?.split(' ')[0] || '',
              lastName: user.name?.split(' ').slice(1).join(' ') || '',
              email: user.email || '',
              phone: '', // User will need to provide this
              pickupLocationId: '', // User will select this
            })}
            className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors flex items-center justify-center"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Continue to Payment
          </button>
        </div>
      ) : (
        /* Unauthenticated User Flow */
        <div className="space-y-4">
          {!bookingMethod && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Choose how to continue
              </h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <button
                  onClick={() => setBookingMethod('signin')}
                  className="border-2 border-orange-200 rounded-lg p-4 hover:border-orange-300 hover:bg-orange-50 transition-colors text-left"
                >
                  <div className="flex items-center mb-2">
                    <User className="w-5 h-5 text-orange-600 mr-2" />
                    <h4 className="font-medium text-gray-900">Sign In</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Access your account for faster checkout and booking history
                  </p>
                  <ul className="text-xs text-gray-500 mt-2 space-y-1">
                    <li>• Saved payment methods</li>
                    <li>• Booking history</li>
                    <li>• Faster future bookings</li>
                  </ul>
                </button>

                <button
                  onClick={() => setBookingMethod('guest')}
                  className="border-2 border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center mb-2">
                    <CreditCard className="w-5 h-5 text-gray-600 mr-2" />
                    <h4 className="font-medium text-gray-900">Continue as Guest</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Book quickly without creating an account
                  </p>
                  <ul className="text-xs text-gray-500 mt-2 space-y-1">
                    <li>• No account required</li>
                    <li>• Quick checkout</li>
                    <li>• Optional account creation later</li>
                  </ul>
                </button>
              </div>
            </div>
          )}

          {bookingMethod === 'signin' && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Sign in to your account
                </h3>
                <p className="text-gray-600 mb-6">
                  Access your saved information and booking history
                </p>
                
                <button
                  onClick={() => setShowSignInModal(true)}
                  className="bg-orange-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
                >
                  Sign In
                </button>
                
                <button
                  onClick={() => setBookingMethod(null)}
                  className="ml-4 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {bookingMethod === 'guest' && (
            <div>
              <GuestBookingForm
                onSubmit={handleGuestSubmit}
                onSignInInstead={handleSignInInstead}
                isLoading={isLoading}
              />
              
              <button
                onClick={() => setBookingMethod(null)}
                className="mt-4 text-center w-full text-gray-600 hover:text-gray-800 transition-colors text-sm"
              >
                ← Back to options
              </button>
            </div>
          )}
        </div>
      )}

      {/* Sign In Modal */}
      <SignInModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        redirectTo="/booking"
      />
    </div>
  );
}