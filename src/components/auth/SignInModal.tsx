'use client';

import React, { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { X, Mail, Lock, Eye, EyeOff } from 'lucide-react';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectTo?: string;
}

export default function SignInModal({ isOpen, onClose, redirectTo }: SignInModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email: formData.email.toLowerCase(),
        password: formData.password,
        redirect: false
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else if (result?.ok) {
        const session = await getSession();
        onClose();
        
        if (redirectTo) {
          router.push(redirectTo);
        } else if (session?.user?.isAdmin) {
          router.push('/admin');
        } else {
          router.push('/');
        }
      }
    } catch (error) {
      console.error('Sign in error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: string) => {
    setSocialLoading(provider);
    setError('');
    
    try {
      const result = await signIn(provider, {
        redirect: false,
        callbackUrl: redirectTo || '/'
      });
      
      if (result?.error) {
        setError(`Error signing in with ${provider}. Please try again.`);
      } else if (result?.ok) {
        onClose();
        if (result.url) {
          router.push(result.url);
        }
      }
    } catch (error) {
      console.error(`${provider} sign in error:`, error);
      setError(`Error signing in with ${provider}. Please try again.`);
    } finally {
      setSocialLoading(null);
    }
  };

  const handleGuestContinue = () => {
    onClose();
    // Continue as guest - redirect to booking flow
    if (redirectTo) {
      router.push(redirectTo);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Sign in to SKOOT</h2>
            <p className="text-sm text-gray-600">Access your bookings and save preferences</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Social Sign-In Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => handleSocialSignIn('google')}
              disabled={!!socialLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {socialLoading === 'google' ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-600"></div>
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              {socialLoading === 'google' ? 'Signing in...' : 'Continue with Google'}
            </button>

            <button
              onClick={() => handleSocialSignIn('amazon')}
              disabled={!!socialLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {socialLoading === 'amazon' ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-600"></div>
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#FF9900">
                  <path d="M.045 18.02c.072-.116.187-.173.34-.173.116 0 .208.042.275.127.067.085.101.2.101.344 0 .135-.034.247-.101.336-.067.089-.159.133-.275.133-.153 0-.268-.057-.34-.173-.072-.116-.108-.243-.108-.38 0-.137.036-.264.108-.214zm23.042.827c-.067.187-.17.347-.307.48-.137.133-.297.229-.48.288-.183.059-.38.089-.593.089-.324 0-.608-.073-.853-.22-.245-.147-.437-.347-.576-.6l1.312-.576c.061.147.153.263.275.348.122.085.263.127.424.127.116 0 .213-.025.291-.076.078-.051.139-.118.183-.2.044-.082.066-.171.066-.266v-.115c-.122.094-.263.169-.424.224-.161.055-.336.082-.527.082-.25 0-.471-.04-.662-.121-.191-.081-.344-.193-.457-.336-.113-.143-.169-.306-.169-.49 0-.203.064-.379.193-.527.129-.148.306-.264.531-.348.225-.084.479-.126.762-.126.3 0 .555.043.762.13.207.087.371.211.49.371.119.16.178.348.178.563v1.447c0 .171.014.31.042.416.028.106.075.186.141.24v.032zm-1.093-1.814c-.067-.116-.159-.205-.275-.266-.116-.061-.249-.092-.398-.092-.183 0-.336.048-.457.144-.121.096-.182.219-.182.367 0 .135.055.242.166.322.111.08.254.12.429.12.122 0 .234-.017.336-.05.102-.033.19-.08.263-.141.073-.061.127-.135.158-.22v-.184zm-3.111-.092c0-.25-.067-.449-.2-.596-.133-.147-.317-.22-.551-.22-.234 0-.418.073-.551.22-.133.147-.2.346-.2.596 0 .25.067.449.2.596.133.147.317.22.551.22.234 0 .418-.073.551-.22.133-.147.2-.346.2-.596zm1.312 0c0 .414-.1.771-.301 1.071-.201.3-.473.535-.817.704-.344.169-.731.253-1.161.253-.43 0-.817-.084-1.161-.253-.344-.169-.616-.404-.817-.704-.201-.3-.301-.657-.301-1.071 0-.414.1-.771.301-1.071.201-.3.473-.535.817-.704.344-.169.731-.253 1.161-.253.43 0 .817.084 1.161.253.344.169.616.404.817.704.201.3.301.657.301 1.071z"/>
                </svg>
              )}
              {socialLoading === 'amazon' ? 'Signing in...' : 'Continue with Amazon'}
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with email</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleCredentialsSignIn} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="text-red-800 text-sm">{error}</div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-9 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                  placeholder="Enter your password"
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

            <button
              type="submit"
              disabled={isLoading || !!socialLoading}
              className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Guest Continue Option */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={handleGuestContinue}
              className="w-full text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
            >
              Continue as Guest
            </button>
            <p className="text-xs text-gray-500 text-center mt-1">
              You can create an account later to save your booking details
            </p>
          </div>

          {/* Sign Up Link */}
          <div className="mt-4 text-center text-sm">
            <span className="text-gray-600">Don't have an account? </span>
            <button
              onClick={() => {
                onClose();
                router.push('/auth/signup');
              }}
              className="text-orange-600 hover:text-orange-700 font-medium"
            >
              Sign up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}