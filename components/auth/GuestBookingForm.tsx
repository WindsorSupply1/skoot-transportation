'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Phone } from 'lucide-react';

const guestInfoSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Phone number is required'),
  createAccount: z.boolean().optional(),
});

type GuestInfoData = z.infer<typeof guestInfoSchema>;

interface GuestBookingFormProps {
  onSubmit: (data: GuestInfoData) => void;
  onSignInInstead: () => void;
  isLoading?: boolean;
}

export default function GuestBookingForm({ 
  onSubmit, 
  onSignInInstead, 
  isLoading = false 
}: GuestBookingFormProps) {
  const [wantsAccount, setWantsAccount] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<GuestInfoData>({
    resolver: zodResolver(guestInfoSchema),
    defaultValues: {
      createAccount: false,
    }
  });

  const handleFormSubmit = (data: GuestInfoData) => {
    onSubmit({
      ...data,
      createAccount: wantsAccount,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Continue as Guest
        </h3>
        <p className="text-sm text-gray-600">
          Fill in your information to complete your booking. No account required.
        </p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="firstName"
                {...register('firstName')}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                placeholder="Enter your first name"
              />
            </div>
            {errors.firstName && (
              <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="lastName"
                {...register('lastName')}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                placeholder="Enter your last name"
              />
            </div>
            {errors.lastName && (
              <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              id="email"
              type="email"
              {...register('email')}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
              placeholder="Enter your email address"
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            We'll send your booking confirmation to this email
          </p>
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number *
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              id="phone"
              type="tel"
              {...register('phone')}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
              placeholder="(555) 123-4567"
            />
          </div>
          {errors.phone && (
            <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>
          )}
        </div>

        {/* Optional Account Creation */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="createAccount"
                type="checkbox"
                checked={wantsAccount}
                onChange={(e) => setWantsAccount(e.target.checked)}
                className="h-4 w-4 text-orange-600 border-orange-300 rounded focus:ring-orange-500"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="createAccount" className="text-sm font-medium text-orange-900">
                Create an account for faster future bookings
              </label>
              <p className="text-xs text-orange-700 mt-1">
                Save your preferences, view booking history, and get faster checkout next time.
                You can set up your password after completing this booking.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-orange-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : (
              'Continue to Payment'
            )}
          </button>
          
          <button
            type="button"
            onClick={onSignInInstead}
            className="flex-1 bg-white text-gray-700 py-3 px-4 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
          >
            Sign In Instead
          </button>
        </div>
      </form>

      {/* Benefits of Creating Account */}
      {!wantsAccount && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Benefits of creating an account:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• View and manage all your bookings in one place</li>
            <li>• Faster checkout for future trips</li>
            <li>• Receive booking reminders and updates</li>
            <li>• Save your preferred pickup locations</li>
          </ul>
        </div>
      )}
    </div>
  );
}