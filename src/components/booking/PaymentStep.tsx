'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Elements, 
  CardNumberElement, 
  CardExpiryElement, 
  CardCvcElement, 
  useStripe, 
  useElements 
} from '@stripe/react-stripe-js';
import { getStripe, handleStripeError, formatAmountFromStripe } from '@/lib/stripe';
import { PaymentValidator, PaymentError, RateLimiter, SecurityUtils } from '@/lib/payment-validation';
import { 
  CreditCard, 
  Lock, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  ShieldCheck,
  DollarSign
} from 'lucide-react';

// Types
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
  paymentIntentId: string;
}

interface PaymentStepProps {
  tripDetails: TripDetails;
  customerDetails: CustomerDetails;
  onComplete: (data: PaymentDetails) => void;
}

// Stripe Elements styling
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#424770',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
      iconColor: '#9e2146',
    },
  },
  hidePostalCode: true,
};

// Payment form component (wrapped with Elements)
function PaymentForm({ 
  tripDetails, 
  customerDetails, 
  onComplete,
  bookingData 
}: PaymentStepProps & { 
  bookingData: any 
}) {
  const stripe = useStripe();
  const elements = useElements();
  
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [cardErrors, setCardErrors] = useState<{ [key: string]: string }>({});
  const [cardComplete, setCardComplete] = useState<{ [key: string]: boolean }>({
    cardNumber: false,
    expiry: false,
    cvc: false,
  });

  const isCardValid = Object.values(cardComplete).every(Boolean) && 
                     Object.keys(cardErrors).length === 0;

  // Create payment intent when component mounts
  useEffect(() => {
    if (bookingData?.id) {
      createPaymentIntent();
    }
  }, [bookingData?.id]);

  const createPaymentIntent = async () => {
    try {
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: bookingData.id,
          amount: bookingData.totalAmount,
          currency: 'usd',
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        setClientSecret(result.clientSecret);
        setPaymentIntentId(result.paymentIntentId);
      } else {
        setError(result.error || 'Failed to create payment intent');
      }
    } catch (err) {
      setError('Failed to initialize payment. Please try again.');
    }
  };

  const handleCardElementChange = useCallback((elementType: string) => 
    (event: any) => {
      setCardErrors(prev => {
        const newErrors = { ...prev };
        if (event.error) {
          newErrors[elementType] = event.error.message;
        } else {
          delete newErrors[elementType];
        }
        return newErrors;
      });

      setCardComplete(prev => ({
        ...prev,
        [elementType]: event.complete,
      }));
    }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    // Rate limiting check
    const userIdentifier = `payment_${customerDetails.email}`;
    if (RateLimiter.isRateLimited(userIdentifier, 3, 5 * 60 * 1000)) {
      const remainingTime = Math.ceil(RateLimiter.getRemainingTime(userIdentifier) / 1000 / 60);
      setError(`Too many payment attempts. Please try again in ${remainingTime} minutes.`);
      return;
    }

    setProcessing(true);
    setError(null);

    const cardNumberElement = elements.getElement(CardNumberElement);
    
    if (!cardNumberElement) {
      setError('Card information is incomplete');
      setProcessing(false);
      return;
    }

    // Validate customer details
    if (!PaymentValidator.validateEmail(customerDetails.email)) {
      setError('Please provide a valid email address');
      setProcessing(false);
      return;
    }

    try {
      // Confirm payment with Stripe
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardNumberElement,
            billing_details: {
              name: SecurityUtils.sanitizeInput(`${customerDetails.firstName} ${customerDetails.lastName}`),
              email: customerDetails.email,
              phone: customerDetails.phone,
            },
          },
        }
      );

      if (confirmError) {
        const stripeError = handleStripeError(confirmError);
        setError(stripeError.message);
        setProcessing(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Reset rate limit on successful payment
        RateLimiter.reset(userIdentifier);
        
        setSuccess(true);
        onComplete({
          stripePaymentMethodId: paymentIntent.payment_method as string,
          paymentIntentId: bookingData.id, // Use the actual booking ID
        });
      } else if (paymentIntent && paymentIntent.status === 'requires_action') {
        // 3D Secure authentication required - Stripe Elements will handle this automatically
        setError('Authentication required. Please follow the prompts from your bank.');
        setProcessing(false);
      } else {
        setError('Payment was not successful. Please try again.');
        setProcessing(false);
      }
    } catch (err) {
      console.error('Payment error:', err);
      
      // Handle specific error types
      if (err instanceof Error) {
        if (err.message.includes('network')) {
          setError('Network error. Please check your connection and try again.');
        } else if (err.message.includes('timeout')) {
          setError('Payment timed out. Please try again.');
        } else {
          setError('An unexpected error occurred. Please try again.');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      
      setProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-green-800 mb-2">
          Payment Successful!
        </h3>
        <p className="text-gray-600">
          Processing your booking confirmation...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Secure Payment
        </h2>
        <p className="text-gray-600">
          Complete your booking with our secure payment system
        </p>
      </div>

      {/* Booking Summary */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <h3 className="font-semibold text-gray-900">Booking Summary</h3>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Passengers:</span>
          <span className="font-medium">{bookingData?.passengerCount || tripDetails.passengers}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Route:</span>
          <span className="font-medium">{bookingData?.route || 'Route info'}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Date:</span>
          <span className="font-medium">{new Date(tripDetails.date).toLocaleDateString()}</span>
        </div>
        <hr className="border-gray-300" />
        <div className="flex justify-between text-lg font-bold">
          <span>Total:</span>
          <span className="text-blue-600">
            {bookingData?.totalAmount ? 
              formatAmountFromStripe(bookingData.totalAmount * 100) : 
              '$--.--.--'
            }
          </span>
        </div>
      </div>

      {/* Security Badge */}
      <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
        <ShieldCheck className="w-4 h-4 text-green-500" />
        <span>Secured by Stripe • PCI DSS Compliant</span>
        <Lock className="w-4 h-4 text-green-500" />
      </div>

      {/* Payment Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Card Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <CreditCard className="w-4 h-4 inline mr-2" />
            Card Number
          </label>
          <div className="border border-gray-300 rounded-lg p-3 bg-white">
            <CardNumberElement
              options={CARD_ELEMENT_OPTIONS}
              onChange={handleCardElementChange('cardNumber')}
            />
          </div>
          {cardErrors.cardNumber && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {cardErrors.cardNumber}
            </p>
          )}
        </div>

        {/* Expiry and CVC */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expiry Date
            </label>
            <div className="border border-gray-300 rounded-lg p-3 bg-white">
              <CardExpiryElement
                options={CARD_ELEMENT_OPTIONS}
                onChange={handleCardElementChange('expiry')}
              />
            </div>
            {cardErrors.expiry && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {cardErrors.expiry}
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CVC
            </label>
            <div className="border border-gray-300 rounded-lg p-3 bg-white">
              <CardCvcElement
                options={CARD_ELEMENT_OPTIONS}
                onChange={handleCardElementChange('cvc')}
              />
            </div>
            {cardErrors.cvc && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {cardErrors.cvc}
              </p>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Payment Button */}
        <button
          type="submit"
          disabled={!stripe || !isCardValid || processing || !clientSecret}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            (!stripe || !isCardValid || processing || !clientSecret)
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {processing ? (
            <div className="flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Processing Payment...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Pay {bookingData?.totalAmount ? 
                formatAmountFromStripe(bookingData.totalAmount * 100) : 
                'Amount'
              }
            </div>
          )}
        </button>

        {/* Terms */}
        <p className="text-xs text-center text-gray-500">
          By completing your purchase, you agree to our terms of service and privacy policy.
        </p>
      </form>
    </div>
  );
}

// Main PaymentStep component
export default function PaymentStep(props: PaymentStepProps) {
  const [stripePromise] = useState(() => getStripe());
  const [bookingData, setBookingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Create booking first, then show payment form
  useEffect(() => {
    createBooking();
  }, []);

  const createBooking = async () => {
    try {
      setLoading(true);
      
      // Map ticket types to customer types
      const customerTypeMap = {
        'ADULT': 'REGULAR',
        'CHILD': 'REGULAR', 
        'SENIOR': 'REGULAR'
      };

      // Ensure we have valid values
      const passengerCount = Number(props.tripDetails?.passengers) || 1;
      const departureId = String(props.tripDetails?.departureId || '');
      const pickupLocationId = String(props.customerDetails?.pickupLocationId || '');
      
      // Format the data according to the API schema
      const bookingData = {
        departureId,
        pickupLocationId,
        passengerCount,
        customerType: customerTypeMap[props.tripDetails.ticketType] as 'REGULAR' | 'STUDENT' | 'MILITARY' | 'LEGACY',
        guestInfo: {
          firstName: String(props.customerDetails.firstName || '').trim(),
          lastName: String(props.customerDetails.lastName || '').trim(),
          email: String(props.customerDetails.email || '').toLowerCase().trim(),
          phone: String(props.customerDetails.phone || '').replace(/\D/g, ''), // Remove non-digits
          createAccount: false,
        },
        passengers: Array.from({ length: passengerCount }, (_, i) => ({
          firstName: String(props.customerDetails.firstName || '').trim(),
          lastName: String(props.customerDetails.lastName || '').trim(),
          age: props.tripDetails.ticketType === 'CHILD' ? 8 : props.tripDetails.ticketType === 'SENIOR' ? 70 : 30,
        })),
        extraLuggage: 0,
        pets: 0,
      };

      console.log('PaymentStep - Sending booking data:', JSON.stringify(bookingData, null, 2));
      
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });

      const result = await response.json();
      
      if (response.ok) {
        setBookingData(result.booking);
      } else {
        console.error('Booking API error:', result);
        console.error('Full API response:', {
          status: response.status,
          statusText: response.statusText,
          result
        });
        
        // Show detailed validation errors
        if (result.details && Array.isArray(result.details)) {
          const validationErrors = result.details.map((err: any) => 
            `${err.path?.join('.')}: ${err.message}`
          ).join(', ');
          throw new Error(`Validation errors: ${validationErrors}`);
        }
        
        throw new Error(result.error || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Booking creation error:', error);
      // Handle booking creation error
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
        <p className="text-gray-600">Preparing your booking...</p>
      </div>
    );
  }

  if (!bookingData) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          Booking Creation Failed
        </h3>
        <p className="text-gray-600">
          There was an error creating your booking. Please try again.
        </p>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} bookingData={bookingData} />
    </Elements>
  );
}