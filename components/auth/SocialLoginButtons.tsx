'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface SocialLoginButtonsProps {
  redirectTo?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

export default function SocialLoginButtons({ 
  redirectTo, 
  onSuccess, 
  onError,
  className = ''
}: SocialLoginButtonsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const handleSocialSignIn = async (provider: string) => {
    setLoading(provider);
    
    try {
      const result = await signIn(provider, {
        redirect: false,
        callbackUrl: redirectTo || '/'
      });
      
      if (result?.error) {
        onError?.(`Error signing in with ${provider}. Please try again.`);
      } else if (result?.ok) {
        onSuccess?.();
        if (result.url) {
          router.push(result.url);
        }
      }
    } catch (error) {
      console.error(`${provider} sign in error:`, error);
      onError?.(`Error signing in with ${provider}. Please try again.`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Google Sign-In */}
      <button
        onClick={() => handleSocialSignIn('google')}
        disabled={!!loading}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading === 'google' ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-600"></div>
        ) : (
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        )}
        {loading === 'google' ? 'Signing in...' : 'Continue with Google'}
      </button>

      {/* Amazon Sign-In */}
      <button
        onClick={() => handleSocialSignIn('amazon')}
        disabled={!!loading}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading === 'amazon' ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-600"></div>
        ) : (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#FF9900">
            <path d="M.045 18.02c.072-.116.187-.173.34-.173.116 0 .208.042.275.127.067.085.101.2.101.344 0 .135-.034.247-.101.336-.067.089-.159.133-.275.133-.153 0-.268-.057-.34-.173-.072-.116-.108-.243-.108-.38 0-.137.036-.264.108-.214zm23.042.827c-.067.187-.17.347-.307.48-.137.133-.297.229-.48.288-.183.059-.38.089-.593.089-.324 0-.608-.073-.853-.22-.245-.147-.437-.347-.576-.6l1.312-.576c.061.147.153.263.275.348.122.085.263.127.424.127.116 0 .213-.025.291-.076.078-.051.139-.118.183-.2.044-.082.066-.171.066-.266v-.115c-.122.094-.263.169-.424.224-.161.055-.336.082-.527.082-.25 0-.471-.04-.662-.121-.191-.081-.344-.193-.457-.336-.113-.143-.169-.306-.169-.49 0-.203.064-.379.193-.527.129-.148.306-.264.531-.348.225-.084.479-.126.762-.126.3 0 .555.043.762.13.207.087.371.211.49.371.119.16.178.348.178.563v1.447c0 .171.014.31.042.416.028.106.075.186.141.24v.032zm-1.093-1.814c-.067-.116-.159-.205-.275-.266-.116-.061-.249-.092-.398-.092-.183 0-.336.048-.457.144-.121.096-.182.219-.182.367 0 .135.055.242.166.322.111.08.254.12.429.12.122 0 .234-.017.336-.05.102-.033.19-.08.263-.141.073-.061.127-.135.158-.22v-.184zm-3.111-.092c0-.25-.067-.449-.2-.596-.133-.147-.317-.22-.551-.22-.234 0-.418.073-.551.22-.133.147-.2.346-.2.596 0 .25.067.449.2.596.133.147.317.22.551.22.234 0 .418-.073.551-.22.133-.147.2-.346.2-.596zm1.312 0c0 .414-.1.771-.301 1.071-.201.3-.473.535-.817.704-.344.169-.731.253-1.161.253-.43 0-.817-.084-1.161-.253-.344-.169-.616-.404-.817-.704-.201-.3-.301-.657-.301-1.071 0-.414.1-.771.301-1.071.201-.3.473-.535.817-.704.344-.169.731-.253 1.161-.253.43 0 .817.084 1.161.253.344.169.616.404.817.704.201.3.301.657.301 1.071z"/>
          </svg>
        )}
        {loading === 'amazon' ? 'Signing in...' : 'Continue with Amazon'}
      </button>
    </div>
  );
}