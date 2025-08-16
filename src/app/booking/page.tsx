'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Calendar, Users, CreditCard, Check, Home, Phone, AlertCircle } from 'lucide-react';
import TripDetailsStep from '@/components/booking/TripDetailsStep';
import CustomerDetailsStep from '@/components/booking/CustomerDetailsStep';
import PaymentStep from '@/components/booking/PaymentStep';
import BookingConfirmation from '@/components/booking/BookingConfirmation';
import { LoadingModal } from '@/components/booking/BookingLoadingStates';

// Types for booking data
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

interface PaymentDetails {
  stripePaymentMethodId: string;
}

type BookingStep = 'trip' | 'customer' | 'payment' | 'confirmation';

export default function BookingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<BookingStep>('trip');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<'processing' | 'payment' | 'confirmation' | 'booking'>('processing');
  const [error, setError] = useState<string | null>(null);
  
  // Booking state
  const [tripDetails, setTripDetails] = useState<TripDetails | null>(null);
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const steps = [
    { id: 'trip', title: 'Trip Details', icon: MapPin },
    { id: 'customer', title: 'Your Information', icon: Users },
    { id: 'payment', title: 'Payment', icon: CreditCard },
    { id: 'confirmation', title: 'Confirmation', icon: Check }
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  const processBooking = async (payment: PaymentDetails) => {
    if (!tripDetails || !customerDetails) {
      setError('Missing booking information. Please start over.');
      return;
    }
    
    setIsLoading(true);
    setLoadingStage('booking');
    setError(null);
    
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...tripDetails,
          ...customerDetails,
          ...payment,
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        setLoadingStage('confirmation');
        // Small delay to show confirmation stage
        setTimeout(() => {
          setBookingId(result.booking.id);
          setCurrentStep('confirmation');
        }, 500);
      } else {
        throw new Error(result.error || 'Booking creation failed');
      }
    } catch (error) {
      console.error('Booking error:', error);
      setError(
        error instanceof Error 
          ? error.message 
          : 'An unexpected error occurred. Please try again.'
      );
      
      // If payment was successful but booking failed, we need to handle this carefully
      if (error instanceof Error && error.message.includes('payment')) {
        setError('Payment was processed but booking creation failed. Please contact support immediately.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleStepComplete = useCallback((step: BookingStep, data: any) => {
    switch (step) {
      case 'trip':
        setTripDetails(data);
        setCurrentStep('customer');
        break;
      case 'customer':
        setCustomerDetails(data);
        setCurrentStep('payment');
        break;
      case 'payment':
        setPaymentDetails(data);
        processBooking(data);
        break;
    }
  }, []);

  const handleBack = () => {
    const stepOrder: BookingStep[] = ['trip', 'customer', 'payment', 'confirmation'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    } else {
      router.push('/');
    }
  };

  return (
    <div>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={handleBack}
                className="flex items-center text-gray-600 hover:text-orange-600 transition-colors font-medium"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                {currentStep === 'trip' ? 'Home' : 'Back'}
              </button>
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

        {/* Progress Bar */}
        <div className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                {currentStep === 'trip' && 'Select Your Trip'}
                {currentStep === 'customer' && 'Your Information'}
                {currentStep === 'payment' && 'Secure Payment'}
                {currentStep === 'confirmation' && 'Booking Confirmed'}
              </h2>
              <p className="text-sm text-gray-600">
                {currentStep === 'trip' && 'Choose your departure date, time, and passengers'}
                {currentStep === 'customer' && 'Complete your contact details'}
                {currentStep === 'payment' && 'Secure payment processing'}
                {currentStep === 'confirmation' && 'Your trip is confirmed and ready'}
              </p>
            </div>
            <div className="flex items-center justify-between overflow-x-auto pb-2">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStepIndex;
                const isCompleted = index < currentStepIndex;
                
                return (
                  <div key={step.id} className="flex items-center min-w-0">
                    <div className="flex flex-col items-center">
                      <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 ${
                        isCompleted 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : isActive 
                            ? 'bg-orange-500 border-orange-500 text-white' 
                            : 'bg-gray-200 border-gray-300 text-gray-500'
                      }`}>
                        {isCompleted ? (
                          <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                        ) : (
                          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                        )}
                      </div>
                      <span className={`mt-2 text-xs sm:text-sm font-medium text-center whitespace-nowrap ${
                        isActive ? 'text-orange-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        <span className="hidden sm:inline">{step.title}</span>
                        <span className="sm:hidden">
                          {step.title === 'Trip Details' ? 'Trip' :
                           step.title === 'Your Information' ? 'Info' :
                           step.title === 'Payment' ? 'Pay' : 'Done'}
                        </span>
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`mx-2 sm:mx-4 md:mx-8 w-4 sm:w-8 md:w-16 h-0.5 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 py-4 sm:py-8">
          <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
            <LoadingModal 
              isVisible={isLoading}
              stage={loadingStage}
              message={
                loadingStage === 'booking' ? 'Creating your booking...' :
                loadingStage === 'confirmation' ? 'Finalizing details...' :
                'Processing your request...'
              }
            />

            {currentStep === 'trip' && (
              <TripDetailsStep onComplete={(data) => handleStepComplete('trip', data)} />
            )}
            
            {currentStep === 'customer' && tripDetails && (
              <CustomerDetailsStep 
                tripDetails={tripDetails}
                onComplete={(data) => handleStepComplete('customer', data)} 
              />
            )}
            
            {currentStep === 'payment' && tripDetails && customerDetails && (
              <PaymentStep 
                tripDetails={tripDetails}
                customerDetails={customerDetails}
                onComplete={(data) => handleStepComplete('payment', data)} 
              />
            )}
            
            {currentStep === 'confirmation' && bookingId && (
              <BookingConfirmation 
                bookingId={bookingId}
                tripDetails={tripDetails}
                customerDetails={customerDetails}
                onNewBooking={() => {
                  // Reset the booking state for a new booking
                  setCurrentStep('trip');
                  setTripDetails(null);
                  setCustomerDetails(null);
                  setPaymentDetails(null);
                  setBookingId(null);
                }}
              />
            )}

            {/* Global Error Display */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-400 mr-3 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-red-800 mb-1">
                      Booking Error
                    </h3>
                    <p className="text-sm text-red-700">{error}</p>
                    {error.includes('contact support') && (
                      <div className="mt-3 flex space-x-3">
                        <a
                          href="tel:+1-803-SKOOT-SC"
                          className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
                        >
                          Call Support
                        </a>
                        <a
                          href="mailto:hello@skoot.bike"
                          className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200 transition-colors"
                        >
                          Email Us
                        </a>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setError(null)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}