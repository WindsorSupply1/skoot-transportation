'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function SetupAdminPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const setupAdmin = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/setup-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (response.ok) {
        setSuccess(true);
        setMessage(`Success! ${result.message}`);
        setTimeout(() => {
          router.push('/admin');
        }, 2000);
      } else {
        setMessage(`Error: ${result.error}`);
      }
    } catch (error) {
      setMessage('Failed to setup admin account');
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4">Please Sign In First</h1>
          <p>You need to be signed in to set up admin access.</p>
          <a href="/auth/signin" className="text-blue-600 hover:underline">
            Go to Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Setup Admin Account</h1>
        
        <div className="mb-4">
          <p className="text-gray-600">Signed in as:</p>
          <p className="font-medium">{session.user?.email}</p>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded ${
            success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}

        <button
          onClick={setupAdmin}
          disabled={loading || success}
          className={`w-full py-2 px-4 rounded font-medium ${
            loading || success
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-orange-600 hover:bg-orange-700 text-white'
          }`}
        >
          {loading ? 'Setting Up...' : success ? 'Setup Complete!' : 'Make Me Admin'}
        </button>

        {success && (
          <p className="text-sm text-gray-600 mt-3 text-center">
            Redirecting to admin dashboard...
          </p>
        )}
      </div>
    </div>
  );
}