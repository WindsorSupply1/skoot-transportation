'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, MapPin, AlertCircle } from 'lucide-react';

interface TripDetails {
  routeId: string;
  scheduleId: string;
  departureId: string;
  date: string;
  passengers: number;
  ticketType: 'ADULT' | 'CHILD' | 'SENIOR';
}

interface Route {
  id: string;
  name: string;
  origin: string;
  destination: string;
  duration: number;
}

interface Schedule {
  id: string;
  time: string;
  dayOfWeek: number;
  route: Route;
  upcomingDepartures: Departure[];
}

interface Departure {
  id: string;
  date: string;
  capacity: number;
  bookedSeats: number;
  availableSeats: number;
}

interface TripDetailsStepProps {
  onComplete: (data: TripDetails) => void;
}

export default function TripDetailsStep({ onComplete }: TripDetailsStepProps) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [selectedDeparture, setSelectedDeparture] = useState<Departure | null>(null);
  const [passengers, setPassengers] = useState(1);
  const [ticketType, setTicketType] = useState<'ADULT' | 'CHILD' | 'SENIOR'>('ADULT');

  useEffect(() => {
    fetchRoutesAndSchedules();
  }, []);

  const fetchRoutesAndSchedules = async () => {
    try {
      setLoading(true);
      
      // Fetch routes first
      const routesResponse = await fetch('/api/admin/routes');
      const routesData = await routesResponse.json();
      setRoutes(routesData.routes || []);

      // Fetch schedules with upcoming departures
      const schedulesResponse = await fetch('/api/admin/schedules');
      const schedulesData = await schedulesResponse.json();
      setSchedules(schedulesData.schedules || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDayOfWeek = (date: string) => {
    return new Date(date).getDay(); // 0 = Sunday, 1 = Monday, etc.
  };

  const getAvailableSchedules = () => {
    if (!selectedDate) return [];
    
    const dayOfWeek = getDayOfWeek(selectedDate);
    return schedules.filter(schedule => {
      // Convert our dayOfWeek (0-6, Sunday=0) to database format (1-7, Monday=1)
      const dbDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek; // Sunday becomes 7
      return schedule.dayOfWeek === dbDayOfWeek;
    });
  };

  const getAvailableDepartures = (schedule: Schedule) => {
    if (!selectedDate) return [];
    
    return schedule.upcomingDepartures.filter(departure => {
      const departureDate = new Date(departure.date);
      const selectedDateObj = new Date(selectedDate);
      return departureDate.toDateString() === selectedDateObj.toDateString();
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getAvailabilityColor = (availableSeats: number, capacity: number) => {
    const ratio = availableSeats / capacity;
    if (ratio > 0.5) return 'text-green-600';
    if (ratio > 0.2) return 'text-yellow-600';
    return 'text-red-600';
  };

  const canContinue = () => {
    return selectedDate && selectedSchedule && selectedDeparture && passengers > 0;
  };

  const handleContinue = () => {
    if (!canContinue() || !selectedSchedule || !selectedDeparture) return;

    const tripDetails: TripDetails = {
      routeId: selectedSchedule.route.id,
      scheduleId: selectedSchedule.id,
      departureId: selectedDeparture.id,
      date: selectedDate,
      passengers,
      ticketType
    };

    onComplete(tripDetails);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  const availableSchedules = getAvailableSchedules();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Select Your Trip Details</h2>
        <p className="text-gray-600">Choose your departure date, time, and number of passengers.</p>
      </div>

      {/* Date Selection */}
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <Calendar className="w-5 h-5 text-blue-500" />
          <label className="text-lg font-medium text-gray-700">Travel Date</label>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => {
            setSelectedDate(e.target.value);
            setSelectedSchedule(null);
            setSelectedDeparture(null);
          }}
          min={new Date().toISOString().split('T')[0]}
          className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
        />
      </div>

      {/* Schedule Selection */}
      {selectedDate && (
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-blue-500" />
            <label className="text-lg font-medium text-gray-700">Available Departures</label>
          </div>
          
          {availableSchedules.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <p className="text-yellow-800">No departures available for the selected date.</p>
              </div>
              <p className="text-yellow-700 text-sm mt-1">Please try a different date or check our schedule.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {availableSchedules.map((schedule) => {
                const departures = getAvailableDepartures(schedule);
                
                return (
                  <div key={schedule.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{schedule.route.name}</h3>
                        <p className="text-sm text-gray-600">
                          {schedule.route.origin} → {schedule.route.destination}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatTime(schedule.time)}</p>
                        <p className="text-sm text-gray-500">{schedule.route.duration} min trip</p>
                      </div>
                    </div>
                    
                    {departures.length === 0 ? (
                      <div className="bg-gray-50 rounded p-3">
                        <p className="text-gray-600 text-sm">No departures available for this date</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {departures.map((departure) => (
                          <button
                            key={departure.id}
                            onClick={() => {
                              setSelectedSchedule(schedule);
                              setSelectedDeparture(departure);
                            }}
                            className={`w-full p-3 rounded-lg border-2 transition-all ${
                              selectedDeparture?.id === departure.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="text-left">
                                <p className="font-medium">{new Date(departure.date).toLocaleDateString()}</p>
                                <p className="text-sm text-gray-600">{formatTime(schedule.time)} departure</p>
                              </div>
                              <div className="text-right">
                                <p className={`font-medium ${getAvailabilityColor(departure.availableSeats, departure.capacity)}`}>
                                  {departure.availableSeats} seats available
                                </p>
                                <p className="text-sm text-gray-500">of {departure.capacity} total</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Passenger and Ticket Type Selection */}
      {selectedDeparture && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5 text-blue-500" />
              <label className="text-lg font-medium text-gray-700">Number of Passengers</label>
            </div>
            <select
              value={passengers}
              onChange={(e) => setPassengers(parseInt(e.target.value))}
              className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
            >
              {Array.from({ length: Math.min(selectedDeparture.availableSeats, 8) }, (_, i) => i + 1).map((num) => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'Passenger' : 'Passengers'}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-blue-500" />
              <label className="text-lg font-medium text-gray-700">Ticket Type</label>
            </div>
            <select
              value={ticketType}
              onChange={(e) => setTicketType(e.target.value as 'ADULT' | 'CHILD' | 'SENIOR')}
              className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
            >
              <option value="ADULT">Adult - Standard Rate</option>
              <option value="CHILD">Child (2-12) - Discounted</option>
              <option value="SENIOR">Senior (65+) - Discounted</option>
            </select>
          </div>
        </div>
      )}

      {/* Trip Summary */}
      {selectedSchedule && selectedDeparture && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-4">Trip Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700">Route:</span>
              <span className="font-medium">{selectedSchedule.route.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Date:</span>
              <span className="font-medium">{new Date(selectedDate).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Departure:</span>
              <span className="font-medium">{formatTime(selectedSchedule.time)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Passengers:</span>
              <span className="font-medium">{passengers} × {ticketType.toLowerCase()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Continue Button */}
      <div className="flex justify-end pt-6">
        <button
          onClick={handleContinue}
          disabled={!canContinue()}
          className={`px-8 py-3 rounded-lg font-semibold transition-all ${
            canContinue()
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Continue to Customer Details
        </button>
      </div>
    </div>
  );
}