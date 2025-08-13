'use client';

import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Users, AlertCircle } from 'lucide-react';

interface Departure {
  id: string;
  date: string;
  departureTime: string;
  estimatedArrival: string;
  capacity: number;
  bookedSeats: number;
  availableSeats: number;
  availabilityStatus: 'HIGH' | 'MEDIUM' | 'LOW' | 'FULL';
  route: {
    name: string;
    startLocation: string;
    endLocation: string;
    duration: number;
  };
  isActive: boolean;
}

export default function SchedulePage() {
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDepartures();
  }, [selectedDate]);

  const fetchDepartures = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/departures?date=${selectedDate}`);
      const data = await response.json();
      setDepartures(data.departures);
    } catch (error) {
      console.error('Failed to fetch departures:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'HIGH': return 'text-green-600 bg-green-50';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50';
      case 'LOW': return 'text-orange-600 bg-orange-50';
      case 'FULL': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getAvailabilityText = (status: string) => {
    switch (status) {
      case 'HIGH': return 'Many seats available';
      case 'MEDIUM': return 'Some seats available';
      case 'LOW': return 'Few seats left';
      case 'FULL': return 'Fully booked';
      default: return 'Unknown';
    }
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 60);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Schedule & Availability
            </h1>
            <p className="text-lg text-gray-600">
              Columbia to Charlotte Airport • Every even hour • Real-time availability
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Date Selection */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <h2 className="text-xl font-semibold text-gray-900">Select Date</h2>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={today.toISOString().split('T')[0]}
                max={maxDate.toISOString().split('T')[0]}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <button
                onClick={() => setSelectedDate(today.toISOString().split('T')[0])}
                className="px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
              >
                Today
              </button>
            </div>
          </div>
        </div>

        {/* Schedule Information */}
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {formatDate(selectedDate)}
                </h3>
                <p className="text-gray-600">
                  Departures every even hour • 15-passenger Mercedes Sprinter vans
                </p>
              </div>

              {/* Departures List */}
              <div className="divide-y divide-gray-200">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading schedule...</p>
                  </div>
                ) : departures.length > 0 ? (
                  departures.map((departure) => (
                    <div key={departure.id} className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <div className="text-2xl font-bold text-gray-900">
                              {formatTime(departure.departureTime)}
                            </div>
                            <div className="text-sm text-gray-500">
                              Arrives: {departure.estimatedArrival}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4" />
                            <span>{departure.route.startLocation} → {departure.route.endLocation}</span>
                            <span>•</span>
                            <span>{Math.floor(departure.route.duration / 60)}h {departure.route.duration % 60}m</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getAvailabilityColor(departure.availabilityStatus)}`}>
                            <Users className="h-4 w-4" />
                            <span>{departure.availableSeats}/{departure.capacity}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {getAvailabilityText(departure.availabilityStatus)}
                          </div>
                        </div>
                      </div>

                      {departure.availabilityStatus !== 'FULL' && (
                        <div className="mt-4">
                          <button className="w-full sm:w-auto bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors">
                            Book This Departure
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No departures available</h3>
                    <p className="text-gray-500">
                      No scheduled departures for this date. Please select a different date.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Schedule Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Schedule</h3>
              <div className="space-y-3">
                {[
                  '6:00 AM', '8:00 AM', '10:00 AM', '12:00 PM',
                  '2:00 PM', '4:00 PM', '6:00 PM', '8:00 PM'
                ].map((time, index) => (
                  <div key={time} className="flex items-center justify-between py-2">
                    <span className="font-medium text-gray-900">{time}</span>
                    <span className="text-sm text-gray-500">
                      Arrives {index === 0 ? '7:45-8:20 AM' :
                                index === 1 ? '9:45-10:20 AM' :
                                index === 2 ? '11:45 AM-12:20 PM' :
                                index === 3 ? '1:45-2:20 PM' :
                                index === 4 ? '3:45-4:20 PM' :
                                index === 5 ? '5:45-6:20 PM' :
                                index === 6 ? '7:45-8:20 PM' : '9:45-10:20 PM'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-orange-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-orange-900 mb-2">Important Notes</h3>
              <ul className="text-sm text-orange-800 space-y-2">
                <li>• Arrive 10 minutes before departure</li>
                <li>• Times are estimates - allow 2+ hours before flights</li>
                <li>• 10-minute stop in Rock Hill included</li>
                <li>• Direct drop-off at CLT terminals</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Legend</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
                  <span>Many seats available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></div>
                  <span>Some seats available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-100 border border-orange-200 rounded"></div>
                  <span>Few seats left</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
                  <span>Fully booked</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}