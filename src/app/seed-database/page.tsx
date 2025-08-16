'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SeedDatabasePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const seedDatabase = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/seed-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to seed database');
      }
    } catch (err) {
      setError('Error seeding database');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold mb-6">Seed Database with Sample Data</h1>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-blue-900 mb-2">This will add:</h2>
            <ul className="list-disc list-inside text-blue-800 space-y-1">
              <li>4 Pickup/Dropoff Locations (Columbia & Charleston)</li>
              <li>2 Routes (Columbia ↔ Charleston)</li>
              <li>12 Daily Schedule Times (6 per route)</li>
              <li>360 Departures (next 30 days)</li>
              <li>4 Pricing Tiers (Regular, Student, Senior, Military)</li>
            </ul>
          </div>

          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-green-900 mb-2">✅ Success!</h3>
              <ul className="text-green-800 space-y-1">
                <li>Locations created: {result.data?.locations}</li>
                <li>Routes created: {result.data?.routes}</li>
                <li>Schedules created: {result.data?.schedules}</li>
                <li>Departures created: {result.data?.departures}</li>
                <li>Pricing tiers created: {result.data?.pricingTiers}</li>
              </ul>
              <button
                onClick={() => router.push('/booking')}
                className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Test Booking Page →
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-red-900 mb-1">Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={seedDatabase}
              disabled={loading}
              className={`px-6 py-3 rounded font-medium ${
                loading
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-orange-600 hover:bg-orange-700 text-white'
              }`}
            >
              {loading ? 'Seeding Database...' : 'Seed Database'}
            </button>

            <button
              onClick={() => router.push('/admin')}
              className="px-6 py-3 rounded font-medium bg-gray-200 hover:bg-gray-300"
            >
              Back to Admin
            </button>
          </div>

          <div className="mt-6 text-sm text-gray-600">
            <p className="font-semibold">Note:</p>
            <p>This creates sample data for testing. The data can be modified through the admin panel later.</p>
          </div>
        </div>
      </div>
    </div>
  );
}