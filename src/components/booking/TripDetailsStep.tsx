'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, MapPin, AlertCircle, ArrowLeft } from 'lucide-react';

interface TripDetails {
  routeId: string;
  scheduleId: string;
  departureId: string;
  returnDepartureId?: string;
  date: string;
  returnDate?: string;
  passengers: number;
  ticketType: 'ADULT' | 'CHILD' | 'SENIOR';
  isRoundTrip: boolean;
  pickupLocationId: string;
  dropoffLocationId: string;
  pricing?: PricingResult;
}

interface PricingResult {
  subtotal: number;
  discounts: number;
  fees: number;
  taxes: number;
  total: number;
  breakdown: {
    basePrice: number;
    passengerCount: number;
    customerDiscount?: number;
    roundTripDiscount?: number;
    extraLuggageFee?: number;
    petFee?: number;
    promoDiscount?: number;
    processingFee?: number;
    taxAmount?: number;
  };
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

interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  fullAddress: string;
  isPickup: boolean;
  isDropoff: boolean;
  instructions?: string;
  types: string[];
}

interface TripDetailsStepProps {
  onComplete: (data: TripDetails) => void;
}

export default function TripDetailsStep({ onComplete }: TripDetailsStepProps) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [pickupLocations, setPickupLocations] = useState<Location[]>([]);
  const [dropoffLocations, setDropoffLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Progressive form state
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedReturnDate, setSelectedReturnDate] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [selectedDeparture, setSelectedDeparture] = useState<Departure | null>(null);
  const [selectedReturnSchedule, setSelectedReturnSchedule] = useState<Schedule | null>(null);
  const [selectedReturnDeparture, setSelectedReturnDeparture] = useState<Departure | null>(null);
  const [selectedPickupLocation, setSelectedPickupLocation] = useState<Location | null>(null);
  const [selectedDropoffLocation, setSelectedDropoffLocation] = useState<Location | null>(null);
  const [passengers, setPassengers] = useState(1);
  const [ticketType, setTicketType] = useState<'ADULT' | 'CHILD' | 'SENIOR'>('ADULT');
  const [pricing, setPricing] = useState<PricingResult | null>(null);
  const [loadingPricing, setLoadingPricing] = useState(false);

  // Form progression control
  const [currentStep, setCurrentStep] = useState<'trip-type' | 'route' | 'dates' | 'times' | 'locations' | 'passengers'>('trip-type');

  useEffect(() => {
    fetchRoutesAndSchedules();
  }, []);

  // Calculate pricing when relevant values change
  useEffect(() => {
    if (selectedRoute && passengers > 0) {
      calculatePricing();
    }
  }, [selectedRoute, passengers, ticketType, isRoundTrip]);

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

      // Fetch pickup locations
      const pickupResponse = await fetch('/api/locations?type=pickup');
      const pickupData = await pickupResponse.json();
      setPickupLocations(pickupData.locations || []);

      // Fetch dropoff locations
      const dropoffResponse = await fetch('/api/locations?type=dropoff');
      const dropoffData = await dropoffResponse.json();
      setDropoffLocations(dropoffData.locations || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDayOfWeek = (date: string) => {
    return new Date(date).getDay(); // 0 = Sunday, 1 = Monday, etc.
  };

  const getAvailableSchedules = (forReturnTrip = false) => {
    const dateToCheck = forReturnTrip ? selectedReturnDate : selectedDate;
    if (!dateToCheck || !selectedRoute) return [];
    
    const dayOfWeek = getDayOfWeek(dateToCheck);
    
    // For return trips, we need the opposite route
    const routeToMatch = forReturnTrip 
      ? schedules.find(s => s.route.origin === selectedRoute.destination && s.route.destination === selectedRoute.origin)?.route.id
      : selectedRoute.id;
    
    if (!routeToMatch) return [];
    
    return schedules.filter(schedule => {
      return schedule.dayOfWeek === dayOfWeek && schedule.route.id === routeToMatch;
    });
  };

  const getAvailableDepartures = (schedule: Schedule, forReturnTrip = false) => {
    const dateToCheck = forReturnTrip ? selectedReturnDate : selectedDate;
    if (!dateToCheck) return [];
    
    return schedule.upcomingDepartures.filter(departure => {
      const departureDate = new Date(departure.date);
      const selectedDateObj = new Date(dateToCheck);
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

  const calculatePricing = async () => {
    if (!selectedRoute || passengers === 0) {
      setPricing(null);
      return;
    }

    setLoadingPricing(true);
    try {
      const customerType = ticketType === 'ADULT' ? 'REGULAR' : 
                          ticketType === 'CHILD' ? 'REGULAR' : 
                          ticketType === 'SENIOR' ? 'REGULAR' : 'REGULAR';

      const response = await fetch('/api/pricing/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          routeId: selectedRoute.id,
          passengerCount: passengers,
          customerType,
          ticketType,
          isRoundTrip,
        }),
      });

      if (response.ok) {
        const pricingData = await response.json();
        setPricing(pricingData);
      } else {
        console.error('Failed to calculate pricing');
        setPricing(null);
      }
    } catch (error) {
      console.error('Error calculating pricing:', error);
      setPricing(null);
    } finally {
      setLoadingPricing(false);
    }
  };

  const canContinueToNext = () => {
    switch (currentStep) {
      case 'trip-type':
        return true; // Can always proceed from trip type selection
      case 'route':
        return selectedRoute !== null;
      case 'dates':
        return selectedDate && (!isRoundTrip || selectedReturnDate);
      case 'times':
        return selectedDeparture && (!isRoundTrip || (selectedReturnDeparture && selectedReturnDate));
      case 'locations':
        return selectedPickupLocation && selectedDropoffLocation;
      case 'passengers':
        return passengers > 0;
      default:
        return false;
    }
  };

  const handleNext = () => {
    switch (currentStep) {
      case 'trip-type':
        setCurrentStep('route');
        break;
      case 'route':
        setCurrentStep('dates');
        break;
      case 'dates':
        setCurrentStep('times');
        break;
      case 'times':
        setCurrentStep('locations');
        break;
      case 'locations':
        setCurrentStep('passengers');
        break;
      case 'passengers':
        handleComplete();
        break;
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'route':
        setCurrentStep('trip-type');
        break;
      case 'dates':
        setCurrentStep('route');
        break;
      case 'times':
        setCurrentStep('dates');
        break;
      case 'locations':
        setCurrentStep('times');
        break;
      case 'passengers':
        setCurrentStep('locations');
        break;
    }
  };

  const handleComplete = () => {
    if (!selectedSchedule || !selectedDeparture || !selectedPickupLocation || !selectedDropoffLocation) return;

    const tripDetails: TripDetails = {
      routeId: selectedSchedule.route.id,
      scheduleId: selectedSchedule.id,
      departureId: selectedDeparture.id,
      returnDepartureId: selectedReturnDeparture?.id,
      date: selectedDate,
      returnDate: selectedReturnDate,
      passengers,
      ticketType,
      isRoundTrip,
      pickupLocationId: selectedPickupLocation.id,
      dropoffLocationId: selectedDropoffLocation.id,
      pricing: pricing || undefined
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

  const renderStepIndicator = () => {
    const steps = [
      { key: 'trip-type', label: 'Trip Type', number: 1 },
      { key: 'route', label: 'Route', number: 2 },
      { key: 'dates', label: 'Dates', number: 3 },
      { key: 'times', label: 'Times', number: 4 },
      { key: 'locations', label: 'Locations', number: 5 },
      { key: 'passengers', label: 'Details', number: 6 }
    ];

    return (
      <div className="flex justify-center mb-8 overflow-x-auto">
        <div className="flex items-center space-x-2 sm:space-x-4 min-w-max px-4">
          {steps.map((step, index) => {
            const isActive = step.key === currentStep;
            const isCompleted = steps.findIndex(s => s.key === currentStep) > index;
            
            return (
              <div key={step.key} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold ${
                    isActive
                      ? 'bg-orange-500 text-white'
                      : isCompleted
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step.number}
                  </div>
                  <span className={`mt-1 text-xs sm:text-sm font-medium text-center whitespace-nowrap ${
                    isActive ? 'text-orange-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    <span className="hidden sm:inline">{step.label}</span>
                    <span className="sm:hidden">
                      {step.label === 'Trip Type' ? 'Type' :
                       step.label === 'Route' ? 'Route' :
                       step.label === 'Dates' ? 'Dates' :
                       step.label === 'Times' ? 'Times' :
                       step.label === 'Locations' ? 'Places' : 'Details'}
                    </span>
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-4 sm:w-8 h-px mx-2 sm:mx-4 ${
                    isCompleted ? 'bg-green-300' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTripTypeStep = () => (
    <div className="max-w-md mx-auto space-y-6 px-4">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">How are you traveling?</h2>
        <p className="text-gray-600 text-sm sm:text-base">Choose your trip type to get started</p>
      </div>
      
      <div className="space-y-4">
        <button
          onClick={() => setIsRoundTrip(false)}
          className={`w-full p-4 sm:p-6 rounded-xl border-2 transition-all duration-200 text-left ${
            !isRoundTrip
              ? 'border-orange-500 bg-orange-50 shadow-md'
              : 'border-gray-200 hover:border-orange-300 hover:bg-orange-25'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">One-way</h3>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Single trip to your destination</p>
            </div>
            <div className={`w-6 h-6 rounded-full border-2 ${
              !isRoundTrip ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
            }`}>
              {!isRoundTrip && <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1" />}
            </div>
          </div>
        </button>
        
        <button
          onClick={() => setIsRoundTrip(true)}
          className={`w-full p-4 sm:p-6 rounded-xl border-2 transition-all duration-200 text-left ${
            isRoundTrip
              ? 'border-orange-500 bg-orange-50 shadow-md'
              : 'border-gray-200 hover:border-orange-300 hover:bg-orange-25'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Round-trip</h3>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Return journey included</p>
            </div>
            <div className={`w-6 h-6 rounded-full border-2 ${
              isRoundTrip ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
            }`}>
              {isRoundTrip && <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1" />}
            </div>
          </div>
        </button>
      </div>
    </div>
  );

  const renderRouteStep = () => (
    <div className="max-w-lg mx-auto space-y-6 px-4">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          {isRoundTrip ? 'Round-trip' : 'One-way'} to where?
        </h2>
        <p className="text-gray-600 text-sm sm:text-base">Select your route</p>
      </div>
      
      <div className="space-y-4">
        {routes.map((route) => (
          <button
            key={route.id}
            onClick={() => setSelectedRoute(route)}
            className={`w-full p-4 sm:p-6 rounded-xl border-2 transition-all duration-200 text-left ${
              selectedRoute?.id === route.id
                ? 'border-orange-500 bg-orange-50 shadow-md'
                : 'border-gray-200 hover:border-orange-300 hover:bg-orange-25'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
                  <div className="text-center sm:text-left">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{route.origin}</h3>
                    <p className="text-sm text-gray-500">From</p>
                  </div>
                  <div className="text-orange-500 mx-auto sm:mx-0">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{route.destination}</h3>
                    <p className="text-sm text-gray-500">To</p>
                  </div>
                </div>
                <div className="mt-3 text-sm text-gray-600 text-center sm:text-left">
                  {route.duration} minute journey
                </div>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 ${
                selectedRoute?.id === route.id ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
              }`}>
                {selectedRoute?.id === route.id && <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1" />}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {renderStepIndicator()}

      {/* Step Content */}
      {currentStep === 'trip-type' && renderTripTypeStep()}
      {currentStep === 'route' && renderRouteStep()}
      
      {currentStep === 'dates' && (
        <div className="max-w-lg mx-auto space-y-6 px-4">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">When are you traveling?</h2>
            <p className="text-gray-600 text-sm sm:text-base">Select your travel {isRoundTrip ? 'dates' : 'date'}</p>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-base sm:text-lg font-medium text-gray-700 mb-3">
                {isRoundTrip ? 'Departure Date' : 'Travel Date'}
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSchedule(null);
                  setSelectedDeparture(null);
                }}
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none transition-colors text-base sm:text-lg"
              />
            </div>
            
            {isRoundTrip && (
              <div>
                <label className="block text-base sm:text-lg font-medium text-gray-700 mb-3">Return Date</label>
                <input
                  type="date"
                  value={selectedReturnDate}
                  onChange={(e) => setSelectedReturnDate(e.target.value)}
                  min={selectedDate || new Date().toISOString().split('T')[0]}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none transition-colors text-base sm:text-lg"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {currentStep === 'times' && selectedRoute && (
        <div className="max-w-4xl mx-auto space-y-6 px-4">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Choose your departure time</h2>
            <p className="text-gray-600 text-sm sm:text-base">
              {selectedRoute.origin} → {selectedRoute.destination} on {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {getAvailableSchedules().map((schedule) => {
              const departures = getAvailableDepartures(schedule);
              
              return departures.map((departure) => (
                <button
                  key={departure.id}
                  onClick={() => {
                    setSelectedSchedule(schedule);
                    setSelectedDeparture(departure);
                  }}
                  className={`p-4 sm:p-6 rounded-xl border-2 transition-all duration-200 text-center ${
                    selectedDeparture?.id === departure.id
                      ? 'border-orange-500 bg-orange-50 shadow-md'
                      : 'border-gray-200 hover:border-orange-300 hover:bg-orange-25'
                  }`}
                >
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    {formatTime(schedule.time)}
                  </div>
                  <div className={`text-base sm:text-lg font-semibold mb-2 ${getAvailabilityColor(departure.availableSeats, departure.capacity)}`}>
                    {departure.availableSeats} seats left
                  </div>
                  <div className="text-sm text-gray-500">
                    {departure.capacity} total seats
                  </div>
                  {departure.availableSeats <= 3 && departure.availableSeats > 0 && (
                    <div className="text-xs text-red-600 font-bold mt-2 bg-red-50 px-2 py-1 rounded-full inline-block">
                      Almost Full!
                    </div>
                  )}
                </button>
              ));
            })}
          </div>
          
          {isRoundTrip && selectedDeparture && (
            <div className="mt-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                Choose your return time
              </h3>
              <p className="text-gray-600 text-center mb-6">
                {selectedRoute.destination} → {selectedRoute.origin} on {selectedReturnDate ? new Date(selectedReturnDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Select return date'}
              </p>
              
              {selectedReturnDate && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getAvailableSchedules(true).map((schedule) => {
                    const departures = getAvailableDepartures(schedule, true);
                    
                    return departures.map((departure) => (
                      <button
                        key={`return-${departure.id}`}
                        onClick={() => {
                          setSelectedReturnSchedule(schedule);
                          setSelectedReturnDeparture(departure);
                        }}
                        className={`p-6 rounded-xl border-2 transition-all duration-200 text-center ${
                          selectedReturnDeparture?.id === departure.id
                            ? 'border-green-500 bg-green-50 shadow-md'
                            : 'border-gray-200 hover:border-green-300 hover:bg-green-25'
                        }`}
                      >
                        <div className="text-3xl font-bold text-gray-900 mb-2">
                          {formatTime(schedule.time)}
                        </div>
                        <div className={`text-lg font-semibold mb-2 ${getAvailabilityColor(departure.availableSeats, departure.capacity)}`}>
                          {departure.availableSeats} seats left
                        </div>
                        <div className="text-sm text-gray-500">
                          {departure.capacity} total seats
                        </div>
                        {departure.availableSeats <= 3 && departure.availableSeats > 0 && (
                          <div className="text-xs text-red-600 font-bold mt-2 bg-red-50 px-2 py-1 rounded-full inline-block">
                            Almost Full!
                          </div>
                        )}
                      </button>
                    ));
                  })}
                  {getAvailableSchedules(true).length === 0 && (
                    <div className="text-center text-gray-500 col-span-full">
                      No return trips available for {new Date(selectedReturnDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {currentStep === 'locations' && (
        <div className="max-w-lg mx-auto space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Where would you like to be picked up?</h2>
            <p className="text-gray-600">Select your pickup and dropoff locations</p>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-3">
                <MapPin className="w-5 h-5 text-orange-500 inline mr-2" />
                Pickup Location
              </label>
              <div className="space-y-3">
                {pickupLocations.map((location) => (
                  <button
                    key={location.id}
                    onClick={() => setSelectedPickupLocation(location)}
                    className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                      selectedPickupLocation?.id === location.id
                        ? 'border-orange-500 bg-orange-50 shadow-md'
                        : 'border-gray-200 hover:border-orange-300 hover:bg-orange-25'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{location.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{location.fullAddress}</p>
                        {location.instructions && (
                          <p className="text-xs text-gray-500 mt-2">{location.instructions}</p>
                        )}
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 ${
                        selectedPickupLocation?.id === location.id ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
                      }`}>
                        {selectedPickupLocation?.id === location.id && <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1" />}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-lg font-medium text-gray-700 mb-3">
                <MapPin className="w-5 h-5 text-green-500 inline mr-2" />
                Dropoff Location
              </label>
              <div className="space-y-3">
                {dropoffLocations.map((location) => (
                  <button
                    key={location.id}
                    onClick={() => setSelectedDropoffLocation(location)}
                    className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                      selectedDropoffLocation?.id === location.id
                        ? 'border-green-500 bg-green-50 shadow-md'
                        : 'border-gray-200 hover:border-green-300 hover:bg-green-25'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{location.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{location.fullAddress}</p>
                        {location.instructions && (
                          <p className="text-xs text-gray-500 mt-2">{location.instructions}</p>
                        )}
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 ${
                        selectedDropoffLocation?.id === location.id ? 'border-green-500 bg-green-500' : 'border-gray-300'
                      }`}>
                        {selectedDropoffLocation?.id === location.id && <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1" />}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === 'passengers' && (
        <div className="max-w-lg mx-auto space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Trip details</h2>
            <p className="text-gray-600">Tell us about your passengers</p>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-3">
                <Users className="w-5 h-5 text-orange-500 inline mr-2" />
                Number of Passengers
              </label>
              <select
                value={passengers}
                onChange={(e) => setPassengers(parseInt(e.target.value))}
                className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none transition-colors text-lg"
              >
                {selectedDeparture && Array.from({ length: Math.min(selectedDeparture.availableSeats, 8) }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'Passenger' : 'Passengers'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-lg font-medium text-gray-700 mb-3">
                <MapPin className="w-5 h-5 text-orange-500 inline mr-2" />
                Ticket Type
              </label>
              <select
                value={ticketType}
                onChange={(e) => setTicketType(e.target.value as 'ADULT' | 'CHILD' | 'SENIOR')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none transition-colors text-lg"
              >
                <option value="ADULT">Adult - Standard Rate</option>
                <option value="CHILD">Child (2-12) - Discounted</option>
                <option value="SENIOR">Senior (65+) - Discounted</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Trip Summary */}
      {currentStep === 'passengers' && selectedSchedule && selectedDeparture && (
        <div className="max-w-lg mx-auto">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
            <h3 className="font-semibold text-orange-900 mb-4">Trip Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-orange-700">Trip Type:</span>
                <span className="font-medium">{isRoundTrip ? 'Round-trip' : 'One-way'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-orange-700">Route:</span>
                <span className="font-medium">{selectedRoute?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-orange-700">Date:</span>
                <span className="font-medium">{new Date(selectedDate).toLocaleDateString()}</span>
              </div>
              {isRoundTrip && selectedReturnDate && (
                <div className="flex justify-between">
                  <span className="text-orange-700">Return Date:</span>
                  <span className="font-medium">{new Date(selectedReturnDate).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-orange-700">Departure:</span>
                <span className="font-medium">{formatTime(selectedSchedule.time)}</span>
              </div>
              {isRoundTrip && selectedReturnSchedule && (
                <div className="flex justify-between">
                  <span className="text-orange-700">Return Departure:</span>
                  <span className="font-medium">{formatTime(selectedReturnSchedule.time)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-orange-700">Pickup:</span>
                <span className="font-medium">{selectedPickupLocation?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-orange-700">Dropoff:</span>
                <span className="font-medium">{selectedDropoffLocation?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-orange-700">Passengers:</span>
                <span className="font-medium">{passengers} × {ticketType.toLowerCase()}</span>
              </div>
              
              {/* Pricing Information */}
              {pricing && (
                <>
                  <div className="border-t border-orange-200 my-3"></div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-orange-700">Subtotal:</span>
                      <span className="font-medium">${pricing.subtotal.toFixed(2)}</span>
                    </div>
                    {pricing.discounts > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discounts:</span>
                        <span>-${pricing.discounts.toFixed(2)}</span>
                      </div>
                    )}
                    {pricing.fees > 0 && (
                      <div className="flex justify-between">
                        <span className="text-orange-700">Fees:</span>
                        <span className="font-medium">${pricing.fees.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t border-orange-200 pt-2">
                      <div className="flex justify-between font-bold text-lg">
                        <span className="text-orange-900">Total:</span>
                        <span className="text-orange-900">${pricing.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              {loadingPricing && (
                <>
                  <div className="border-t border-orange-200 my-3"></div>
                  <div className="text-center text-orange-600">
                    <div className="animate-pulse">Calculating pricing...</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pricing Sidebar - Show after route selection */}
      {selectedRoute && currentStep !== 'trip-type' && (
        <div className="max-w-lg mx-auto mt-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">💰</span>
              Trip Pricing
            </h3>
            
            {pricing ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700">Base Price ({ticketType.toLowerCase()}):</span>
                  <span className="font-medium">${pricing.breakdown.basePrice.toFixed(2)} × {passengers}</span>
                </div>
                
                {isRoundTrip && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Round-trip Discount:</span>
                    <span>-${(pricing.breakdown.roundTripDiscount || 0).toFixed(2)}</span>
                  </div>
                )}
                
                {ticketType !== 'ADULT' && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>{ticketType === 'CHILD' ? 'Child' : 'Senior'} Discount:</span>
                    <span>Applied to base price</span>
                  </div>
                )}
                
                {pricing.breakdown.processingFee && (
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Processing Fee:</span>
                    <span className="font-medium">${pricing.breakdown.processingFee.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="border-t border-blue-200 pt-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span className="text-blue-900">Total:</span>
                    <span className="text-blue-900">${pricing.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ) : loadingPricing ? (
              <div className="text-center text-blue-600">
                <div className="animate-pulse">Calculating pricing...</div>
              </div>
            ) : (
              <div className="text-center text-blue-600">
                <p className="text-sm">Complete your selections to see pricing</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-8">
        <button
          onClick={handleBack}
          disabled={currentStep === 'trip-type'}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            currentStep === 'trip-type'
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Back
        </button>
        
        <button
          onClick={handleNext}
          disabled={!canContinueToNext()}
          className={`px-8 py-3 rounded-lg font-semibold transition-all ${
            canContinueToNext()
              ? 'bg-orange-600 text-white hover:bg-orange-700 shadow-lg hover:shadow-xl'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {currentStep === 'passengers' ? 'Continue to Customer Details' : 'Next'}
        </button>
      </div>
    </div>
  );
}