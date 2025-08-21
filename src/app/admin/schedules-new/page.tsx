'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminNavigation from '@/components/AdminNavigation';
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
  time: string;
  routes: {
    route: string;
    origin: string;
    destination: string;
    departures: {
      id: string;
      date: string;
      capacity: number;
      bookedSeats: number;
      availableSeats: number;
      vehicle: {
        id: string;
        name: string;
        capacity: number;
      } | null;
    }[];
  }[];
}

export default function ScheduleManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
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
    if (viewMode === 'month') {
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      });
    } else if (viewMode === 'week') {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else { // month
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
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
      {/* Admin Navigation */}
      <AdminNavigation />
      
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
                  className={`px-3 py-2 rounded text-sm ${
                    viewMode === 'day' 
                      ? 'bg-white text-orange-600 shadow-sm' 
                      : 'text-gray-600'
                  }`}
                >
                  Day
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-3 py-2 rounded text-sm ${
                    viewMode === 'week' 
                      ? 'bg-white text-orange-600 shadow-sm' 
                      : 'text-gray-600'
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setViewMode('month')}
                  className={`px-3 py-2 rounded text-sm ${
                    viewMode === 'month' 
                      ? 'bg-white text-orange-600 shadow-sm' 
                      : 'text-gray-600'
                  }`}
                >
                  Month
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
                : viewMode === 'week'
                ? `Week of ${formatDate(selectedDate)}`
                : formatDate(selectedDate)
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
        {viewMode === 'month' ? (
          /* Monthly Calendar View */
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="grid grid-cols-7 gap-4 mb-6">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-4">
                {(() => {
                  const year = selectedDate.getFullYear();
                  const month = selectedDate.getMonth();
                  const firstDay = new Date(year, month, 1);
                  const lastDay = new Date(year, month + 1, 0);
                  const startDate = new Date(firstDay);
                  startDate.setDate(startDate.getDate() - firstDay.getDay());
                  
                  const days = [];
                  for (let i = 0; i < 42; i++) {
                    const currentDate = new Date(startDate);
                    currentDate.setDate(startDate.getDate() + i);
                    const isCurrentMonth = currentDate.getMonth() === month;
                    const isToday = currentDate.toDateString() === new Date().toDateString();
                    
                    days.push(
                      <div
                        key={i}
                        className={`min-h-[120px] p-2 border rounded-lg ${
                          isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                        } ${isToday ? 'ring-2 ring-orange-500' : ''}`}
                      >
                        <div className={`text-sm font-medium mb-2 ${
                          isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                        }`}>
                          {currentDate.getDate()}
                        </div>
                        {isCurrentMonth && (
                          <div className="space-y-1">
                            <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              🚐 VAN-C1: 8/12
                            </div>
                            <div className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                              🚐 VAN-C2: 11/12
                            </div>
                            <div className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                              🚐 VAN-C3: 12/12
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return days;
                })()}
              </div>
            </div>
          </div>
        ) : (
          /* Day/Week View */
          <div className="space-y-6">
            {departures.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <p className="text-gray-500">No departures scheduled for this {viewMode === 'day' ? 'date' : 'week'}.</p>
              </div>
            ) : (
              departures.map((timeSlot, idx) => (
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

                    {/* Departures/Vehicles */}
                    <div className="space-y-3">
                      {route.departures.map((departure, depIdx) => (
                        <div key={depIdx} className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">
                                🚐 {departure.vehicle?.name || 'Unassigned Vehicle'}
                              </span>
                              <span className="text-sm text-gray-600">
                                {departure.bookedSeats}/{departure.capacity} seats
                                {departure.bookedSeats >= departure.capacity && (
                                  <span className="ml-2 text-red-600 font-medium">FULL</span>
                                )}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-4 relative">
                              <div 
                                className={`h-4 rounded-full ${getCapacityColor(departure.bookedSeats, departure.capacity)}`}
                                style={{ width: getCapacityWidth(departure.bookedSeats, departure.capacity) }}
                              />
                            </div>
                          </div>
                          {departure.bookedSeats >= departure.capacity * 0.8 && (
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                          )}
                        </div>
                      ))}

                      {/* Add Van Button */}
                      <button
                        onClick={() => {
                          setSelectedDeparture(route.departures[0]?.id || `${idx}-${routeIdx}`);
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
            ))
            )}
          </div>
        )}
      </div>

      {/* Add Van Modal */}
      {showAddVanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Add Additional Vehicle</h3>
            <div className="space-y-3">
              {availableVans.map((van) => (
                <div key={van.id} className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{van.name}</p>
                      <p className="text-sm text-gray-600">
                        {van.capacity} seats - {van.priceMultiplier === 1.0 ? 'Standard' : 
                          van.priceMultiplier > 1.0 ? `+${Math.round((van.priceMultiplier - 1) * 100)}% Premium` :
                          `-${Math.round((1 - van.priceMultiplier) * 100)}% Discount`} pricing
                      </p>
                    </div>
                    <button 
                      onClick={() => selectedDeparture && handleAddVan(selectedDeparture, van.id)}
                      className="text-orange-600 hover:bg-orange-50 px-3 py-1 rounded"
                    >
                      Select
                    </button>
                  </div>
                </div>
              ))}
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