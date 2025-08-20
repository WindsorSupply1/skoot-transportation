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
      
      // Fetch routes first (using public endpoint)
      const routesResponse = await fetch('/api/routes');
      const routesData = await routesResponse.json();
      setRoutes(routesData.routes || []);

      // Fetch schedules with upcoming departures (using public endpoint)
      const schedulesResponse = await fetch('/api/schedules');
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
      // Check if schedule matches the selected day
      // Database has Sunday as 0, Monday as 1, etc.
      return schedule.dayOfWeek === dayOfWeek;
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
          <Calendar className="w-5 h-5 text-orange-500" />
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
          className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none transition-colors"
        />
      </div>

      {/* Schedule Selection */}
      {selectedDate && (
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-orange-500" />
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {availableSchedules.map((schedule) => {
                const departures = getAvailableDepartures(schedule);
                
                return (
                  <div key={schedule.id} className="bg-white border-2 border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-orange-300 transition-all duration-200">
                    {/* Route Header Card */}
                    <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-5 border-b border-orange-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-1">{schedule.route.name}</h3>
                          <div className="flex items-center text-gray-700">
                            <MapPin className="w-4 h-4 mr-2 text-orange-600" />
                            <span className="text-sm font-medium">
                              {schedule.route.origin} → {schedule.route.destination}
                            </span>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-3xl font-bold text-orange-600">{formatTime(schedule.time)}</div>
                          <div className="text-sm text-gray-600 flex items-center justify-end">
                            <Clock className="w-4 h-4 mr-1" />
                            {schedule.route.duration} min trip
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Departure Options */}
                    <div className="p-5">
                      {departures.length === 0 ? (
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                          <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-600">No departures available for this date</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {departures.map((departure) => (
                            <button
                              key={departure.id}
                              onClick={() => {
                                setSelectedSchedule(schedule);
                                setSelectedDeparture(departure);
                              }}
                              className={`w-full p-4 rounded-xl border-2 transition-all duration-200 group ${
                                selectedDeparture?.id === departure.id
                                  ? 'border-orange-500 bg-orange-50 shadow-md ring-2 ring-orange-200'
                                  : 'border-gray-200 hover:border-orange-300 hover:bg-orange-25 hover:shadow-sm'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="text-left flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className={`p-2 rounded-full ${
                                      selectedDeparture?.id === departure.id ? 'bg-orange-200' : 'bg-gray-100 group-hover:bg-orange-100'
                                    }`}>
                                      <Calendar className={`w-4 h-4 ${
                                        selectedDeparture?.id === departure.id ? 'text-orange-600' : 'text-gray-600 group-hover:text-orange-600'
                                      }`} />
                                    </div>
                                    <div>
                                      <div className="font-bold text-gray-900 text-lg">
                                        {new Date(departure.date).toLocaleDateString('en-US', { 
                                          weekday: 'short', 
                                          month: 'short', 
                                          day: 'numeric' 
                                        })}
                                      </div>
                                      <div className="text-sm text-gray-600">
                                        Departs at {formatTime(schedule.time)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="text-right">
                                  <div className={`text-2xl font-bold mb-1 ${getAvailabilityColor(departure.availableSeats, departure.capacity)}`}>
                                    {departure.availableSeats}
                                  </div>
                                  <div className="text-sm text-gray-500 font-medium">
                                    of {departure.capacity} seats
                                  </div>
                                  {departure.availableSeats <= 3 && departure.availableSeats > 0 && (
                                    <div className="text-xs text-red-600 font-bold mt-1 bg-red-50 px-2 py-1 rounded-full">
                                      Almost Full!
                                    </div>
                                  )}
                                  {departure.availableSeats === departure.capacity && (
                                    <div className="text-xs text-green-600 font-bold mt-1 bg-green-50 px-2 py-1 rounded-full">
                                      Plenty Available
                                    </div>
                                  )}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
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
              <Users className="w-5 h-5 text-orange-500" />
              <label className="text-lg font-medium text-gray-700">Number of Passengers</label>
            </div>
            <select
              value={passengers}
              onChange={(e) => setPassengers(parseInt(e.target.value))}
              className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none transition-colors"
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
              <MapPin className="w-5 h-5 text-orange-500" />
              <label className="text-lg font-medium text-gray-700">Ticket Type</label>
            </div>
            <select
              value={ticketType}
              onChange={(e) => setTicketType(e.target.value as 'ADULT' | 'CHILD' | 'SENIOR')}
              className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none transition-colors"
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
        <div className="bg-orange-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-orange-900 mb-4">Trip Summary</h3>
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