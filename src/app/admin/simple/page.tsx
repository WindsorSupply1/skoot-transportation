'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function SimpleAdminPage() {
  const { data: session } = useSession();

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
          <Link href="/auth/signin" className="text-blue-600 hover:underline">
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">SKOOT Admin - Simple Dashboard</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Welcome, {session.user?.email}</h2>
          <p className="text-gray-600">Admin Status: ✅ Active</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/admin/schedules" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold mb-2">📅 Schedules</h3>
            <p className="text-gray-600">Manage routes and departure times</p>
          </Link>

          <Link href="/admin/pickup-locations" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold mb-2">📍 Pickup Locations</h3>
            <p className="text-gray-600">Manage pickup and dropoff points</p>
          </Link>

          <Link href="/admin/bookings" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold mb-2">🎫 Bookings</h3>
            <p className="text-gray-600">View and manage customer bookings</p>
          </Link>

          <Link href="/admin/customers" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold mb-2">👥 Customers</h3>
            <p className="text-gray-600">Manage customer accounts</p>
          </Link>

          <Link href="/admin/reports" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold mb-2">📊 Reports</h3>
            <p className="text-gray-600">View analytics and reports</p>
          </Link>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">🚀 Quick Actions</h3>
            <div className="space-y-2">
              <a href="/booking" className="block text-blue-600 hover:underline">Test Booking Page</a>
              <a href="/" className="block text-blue-600 hover:underline">View Site</a>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">⚠️ To Fix Booking Page:</h3>
          <ol className="text-yellow-700 space-y-1">
            <li>1. Add pickup locations</li>
            <li>2. Create routes and schedules</li>
            <li>3. Test booking flow</li>
          </ol>
        </div>
      </div>
    </div>
  );
}