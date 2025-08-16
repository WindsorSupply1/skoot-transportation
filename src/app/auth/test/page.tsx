'use client';

import React, { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { User, Settings, LogOut, BookOpen, Shield } from 'lucide-react';
import SignInModal from '@/components/auth/SignInModal';
import SocialLoginButtons from '@/components/auth/SocialLoginButtons';
import GuestBookingForm from '@/components/auth/GuestBookingForm';
import ProfileForm from '@/components/auth/ProfileForm';
import EnhancedBookingForm from '@/components/booking/EnhancedBookingForm';

export default function AuthTestPage() {
  const { data: session, status } = useSession();
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [activeTest, setActiveTest] = useState<string>('overview');

  const isAuthenticated = status === 'authenticated' && session?.user;
  const user = session?.user as any;

  const testSections = [
    { id: 'overview', name: 'Authentication Overview', icon: User },
    { id: 'social-login', name: 'Social Login Buttons', icon: LogOut },
    { id: 'guest-booking', name: 'Guest Booking Form', icon: BookOpen },
    { id: 'profile', name: 'Profile Management', icon: Settings },
    { id: 'enhanced-booking', name: 'Enhanced Booking Form', icon: BookOpen },
  ];

  const handleGuestBookingSubmit = (data: any) => {
    console.log('Guest booking data:', data);
    alert('Guest booking form submitted! Check console for data.');
  };

  const renderTestSection = () => {
    switch (activeTest) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Authentication Status</h2>
              
              {isAuthenticated ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-medium text-green-900 mb-2">✅ Authenticated</h3>
                    <div className="text-sm text-green-800 space-y-1">
                      <p><strong>Name:</strong> {user.name}</p>
                      <p><strong>Email:</strong> {user.email}</p>
                      <p><strong>ID:</strong> {user.id}</p>
                      <p><strong>Admin:</strong> {user.isAdmin ? 'Yes' : 'No'}</p>
                      {user.image && <p><strong>Image:</strong> {user.image}</p>}
                    </div>
                  </div>
                  
                  {user.isAdmin && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-blue-600" />
                        <span className="font-medium text-blue-900">Administrator Privileges</span>
                      </div>
                      <p className="text-sm text-blue-800 mt-1">
                        This user has admin access to the system.
                      </p>
                    </div>
                  )}
                  
                  <button
                    onClick={() => signOut()}
                    className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-medium text-yellow-900 mb-2">❌ Not Authenticated</h3>
                    <p className="text-sm text-yellow-800">
                      User is not currently signed in.
                    </p>
                  </div>
                  
                  <button
                    onClick={() => setShowSignInModal(true)}
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Open Sign In Modal
                  </button>
                </div>
              )}
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Session Information</h2>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto">
                {JSON.stringify({ session, status }, null, 2)}
              </pre>
            </div>
          </div>
        );

      case 'social-login':
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Social Login Buttons Test</h2>
            <p className="text-gray-600 mb-6">
              Test the Google and Amazon OAuth login buttons. Make sure you have the environment 
              variables set up correctly.
            </p>
            
            <SocialLoginButtons
              onSuccess={() => {
                console.log('Social login successful');
                alert('Social login successful!');
              }}
              onError={(error) => {
                console.error('Social login error:', error);
                alert(`Social login error: ${error}`);
              }}
            />
          </div>
        );

      case 'guest-booking':
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Guest Booking Form Test</h2>
            <p className="text-gray-600 mb-6">
              Test the guest booking form with optional account creation.
            </p>
            
            <GuestBookingForm
              onSubmit={handleGuestBookingSubmit}
              onSignInInstead={() => setShowSignInModal(true)}
            />
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-6">
            {isAuthenticated ? (
              <ProfileForm
                onSuccess={() => {
                  console.log('Profile updated successfully');
                  alert('Profile updated successfully!');
                }}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Profile Management Test</h2>
                <p className="text-gray-600 mb-4">
                  You need to be authenticated to test the profile management form.
                </p>
                <button
                  onClick={() => setShowSignInModal(true)}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Sign In to Test Profile Form
                </button>
              </div>
            )}
          </div>
        );

      case 'enhanced-booking':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Enhanced Booking Form Test</h2>
              <p className="text-gray-600 mb-6">
                Test the complete booking flow with authentication integration. This includes:
              </p>
              <ul className="text-sm text-gray-600 space-y-1 mb-6 list-disc list-inside">
                <li>Authentication status detection</li>
                <li>Guest booking option</li>
                <li>Sign-in modal integration</li>
                <li>Account creation flow</li>
                <li>Account linking for guest bookings</li>
              </ul>
            </div>
            
            <EnhancedBookingForm />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-bold text-orange-600">SKOOT</h1>
              <p className="text-sm text-gray-600">Authentication System Test</p>
            </div>
            
            {isAuthenticated && (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-700">
                  Welcome, {user.name}
                </span>
                <button
                  onClick={() => signOut()}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="bg-white rounded-lg shadow-sm p-4 space-y-2">
              <h3 className="font-medium text-gray-900 mb-4">Test Sections</h3>
              {testSections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveTest(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                      activeTest === section.id
                        ? 'bg-orange-100 text-orange-900'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {section.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="mt-8 lg:mt-0 lg:col-span-3">
            {renderTestSection()}
          </div>
        </div>
      </div>

      {/* Sign In Modal */}
      <SignInModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        redirectTo="/auth/test"
      />
    </div>
  );
}