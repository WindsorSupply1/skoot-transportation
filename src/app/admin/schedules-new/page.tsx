'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  AlertTriangle,
  Clock,
  Users,
  Bus
} from 'lucide-react';

interface Van {
  id: string;
  name: string;
  capacity: number;
  priceMultiplier: number;
}

interface DepartureData {
  id: string;
  time: string;
  route: string;
  origin: string;
  destination: string;
  vans: {
    vanId: string;
    vanName: string;
    bookedSeats: number;
    capacity: number;
  }[];
}

export default function ScheduleManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [departures, setDepartures] = useState<DepartureData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddVanModal, setShowAddVanModal] = useState(false);
  const [selectedDeparture, setSelectedDeparture] = useState<string | null>(null);
  const [availableVans, setAvailableVans] = useState<Van[]>([]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user) {
      router.push('/auth/signin');
      return;
    }
    fetchScheduleData();
    fetchAvailableVans();
  }, [session, status, selectedDate, viewMode]);

  const fetchScheduleData = async () => {
    setLoading(true);
    try {
      // Fetch schedule data based on selected date and view mode
      const response = await fetch(
        `/api/admin/schedules/capacity?date=${selectedDate.toISOString()}&view=${viewMode}`,
        { credentials: 'include' }
      );
      if (response.ok) {
        const data = await response.json();
        setDepartures(data.departures || []);
      }
    } catch (error) {
      console.error('Error fetching schedule data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableVans = async () => {
    try {
      const response = await fetch('/api/admin/vehicles', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setAvailableVans(data.vehicles || []);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const handleAddVan = async (departureId: string, vanId: string) => {
    try {
      const response = await fetch('/api/admin/schedules/add-vehicle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ departureId, vanId })
      });
      
      if (response.ok) {
        fetchScheduleData(); // Refresh data
        setShowAddVanModal(false);
        setSelectedDeparture(null);
      }
    } catch (error) {
      console.error('Error adding van:', error);
    }
  };

  const getCapacityColor = (booked: number, capacity: number) => {
    const percentage = (booked / capacity) * 100;
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getCapacityWidth = (booked: number, capacity: number) => {
    return `${Math.min((booked / capacity) * 100, 100)}%`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    }
    setSelectedDate(newDate);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Calendar className="h-6 w-6 text-orange-600 mr-2" />
              <h1 className="text-xl font-semibold">Schedule Management</h1>
            </div>
            <div className="flex items-center gap-4">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('day')}
                  className={`px-4 py-2 rounded ${
                    viewMode === 'day' 
                      ? 'bg-white text-orange-600 shadow-sm' 
                      : 'text-gray-600'
                  }`}
                >
                  Day View
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-4 py-2 rounded ${
                    viewMode === 'week' 
                      ? 'bg-white text-orange-600 shadow-sm' 
                      : 'text-gray-600'
                  }`}
                >
                  Week View
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigateDate('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-medium">
              {viewMode === 'day' 
                ? formatDate(selectedDate)
                : `Week of ${formatDate(selectedDate)}`
              }
            </h2>
            <button
              onClick={() => navigateDate('next')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Schedule Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Mock data for demonstration */}
          {[
            { time: '6:00 AM', routes: [
              { route: 'Columbia → Charleston', vans: [
                { id: '1', name: 'Van A', booked: 12, capacity: 15 }
              ]},
              { route: 'Charleston → Columbia', vans: [
                { id: '2', name: 'Van B', booked: 8, capacity: 15 }
              ]}
            ]},
            { time: '9:00 AM', routes: [
              { route: 'Columbia → Charleston', vans: [
                { id: '3', name: 'Van A', booked: 15, capacity: 15 },
                { id: '4', name: 'Van C', booked: 5, capacity: 15 }
              ]}
            ]}
          ].map((timeSlot, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Time Header */}
              <div className="bg-gray-50 px-6 py-3 border-b">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-600 mr-2" />
                  <h3 className="text-lg font-medium">{timeSlot.time}</h3>
                </div>
              </div>

              {/* Routes */}
              <div className="divide-y">
                {timeSlot.routes.map((route, routeIdx) => (
                  <div key={routeIdx} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-md font-medium text-gray-900">
                        <Bus className="inline h-4 w-4 mr-2 text-orange-600" />
                        {route.route}
                      </h4>
                    </div>

                    {/* Vans */}
                    <div className="space-y-3">
                      {route.vans.map((van, vanIdx) => (
                        <div key={vanIdx} className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">
                                🚐 {van.name}
                              </span>
                              <span className="text-sm text-gray-600">
                                {van.booked}/{van.capacity} seats
                                {van.booked >= van.capacity && (
                                  <span className="ml-2 text-red-600 font-medium">FULL</span>
                                )}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-4 relative">
                              <div 
                                className={`h-4 rounded-full ${getCapacityColor(van.booked, van.capacity)}`}
                                style={{ width: getCapacityWidth(van.booked, van.capacity) }}
                              />
                            </div>
                          </div>
                          {van.booked >= van.capacity * 0.8 && (
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                          )}
                        </div>
                      ))}

                      {/* Add Van Button */}
                      <button
                        onClick={() => {
                          setSelectedDeparture(`${idx}-${routeIdx}`);
                          setShowAddVanModal(true);
                        }}
                        className="mt-2 flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Add Van
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Van Modal */}
      {showAddVanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Add Additional Vehicle</h3>
            <div className="space-y-3">
              <div className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Van D</p>
                    <p className="text-sm text-gray-600">15 seats - Standard pricing</p>
                  </div>
                  <button className="text-orange-600 hover:bg-orange-50 px-3 py-1 rounded">
                    Select
                  </button>
                </div>
              </div>
              <div className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Premium Bus</p>
                    <p className="text-sm text-gray-600">25 seats - +20% pricing</p>
                  </div>
                  <button className="text-orange-600 hover:bg-orange-50 px-3 py-1 rounded">
                    Select
                  </button>
                </div>
              </div>
              <div className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Economy Van</p>
                    <p className="text-sm text-gray-600">12 seats - -10% pricing</p>
                  </div>
                  <button className="text-orange-600 hover:bg-orange-50 px-3 py-1 rounded">
                    Select
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowAddVanModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}