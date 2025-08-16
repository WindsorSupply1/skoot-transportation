'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { X, Mail, Lock, Eye, EyeOff, Check } from 'lucide-react';
import SocialLoginButtons from './SocialLoginButtons';

interface AccountLinkingModalProps {
  isOpen: boolean;
  onClose: () => void;
  guestEmail: string;
  bookingId: string;
}

export default function AccountLinkingModal({ 
  isOpen, 
  onClose, 
  guestEmail, 
  bookingId 
}: AccountLinkingModalProps) {
  const [step, setStep] = useState<'choice' | 'create' | 'social' | 'success'>('choice');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      // Call API to create account and link guest booking
      const response = await fetch('/api/auth/create-account-from-guest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: guestEmail,
          password,
          bookingId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account');
      }

      // Automatically sign in the user
      const signInResult = await signIn('credentials', {
        email: guestEmail,
        password,
        redirect: false,
      });

      if (signInResult?.ok) {
        setStep('success');
      } else {
        throw new Error('Failed to sign in after account creation');
      }
    } catch (error: any) {
      console.error('Account creation error:', error);
      setError(error.message || 'An error occurred while creating your account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLink = async (provider: string) => {
    setIsLoading(true);
    setError('');

    try {
      // Store booking ID in session storage for later linking
      sessionStorage.setItem('guestBookingId', bookingId);
      sessionStorage.setItem('linkingGuestAccount', 'true');

      // Initiate social sign-in
      const result = await signIn(provider, {
        redirect: false,
        callbackUrl: `/booking/confirmation/${bookingId}?linked=true`,
      });

      if (result?.error) {
        setError(`Error linking with ${provider}. Please try again.`);
      } else if (result?.url) {
        router.push(result.url);
      }
    } catch (error) {
      console.error(`${provider} linking error:`, error);
      setError(`Error linking with ${provider}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    onClose();
    router.push(`/booking/confirmation/${bookingId}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {step === 'success' ? 'Account Created!' : 'Save Your Booking'}
            </h2>
            <p className="text-sm text-gray-600">
              {step === 'success' 
                ? 'Your account has been created and your booking is saved'
                : 'Create an account to manage your bookings and get faster checkout'
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {step === 'choice' && (
            <div className="space-y-4">
              {/* Benefits */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-orange-900 mb-2">
                  Benefits of creating an account:
                </h3>
                <ul className="text-xs text-orange-800 space-y-1">
                  <li>✓ Manage all your bookings in one place</li>
                  <li>✓ Faster checkout for future trips</li>
                  <li>✓ Receive booking reminders and updates</li>
                  <li>✓ Save your preferred locations</li>
                </ul>
              </div>

              {/* Account Creation Options */}
              <div className="space-y-3">
                <button
                  onClick={() => setStep('create')}
                  className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
                >
                  Create Account with Password
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">or</span>
                  </div>
                </div>

                <SocialLoginButtons
                  onSuccess={() => setStep('success')}
                  onError={setError}
                  className="space-y-2"
                />

                <button
                  onClick={handleSkip}
                  className="w-full text-gray-600 hover:text-gray-900 text-sm py-2"
                >
                  Skip for now (continue as guest)
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-red-800 text-sm">{error}</div>
                </div>
              )}
            </div>
          )}

          {step === 'create' && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600">
                  Creating account for: <strong>{guestEmail}</strong>
                </p>
              </div>

              <form onSubmit={handleCreateAccount} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="text-red-800 text-sm">{error}</div>
                  </div>
                )}

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Create Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full pl-9 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                      placeholder="Enter password (min 6 characters)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full pl-9 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep('choice')}
                    className="flex-1 bg-white text-gray-700 py-2 px-4 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </div>
                    ) : (
                      'Create Account'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Welcome to SKOOT!</h3>
                <p className="text-sm text-gray-600 mt-2">
                  Your account has been created and your booking is now saved to your account.
                  You can manage all your bookings from your dashboard.
                </p>
              </div>

              <button
                onClick={() => {
                  onClose();
                  router.push(`/booking/confirmation/${bookingId}`);
                }}
                className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
              >
                View Your Booking
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}