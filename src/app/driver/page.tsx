'use client';

import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Users, 
  Clock, 
  Navigation,
  AlertTriangle,
  CheckCircle,
  MessageCircle,
  Phone,
  RefreshCw
} from 'lucide-react';

interface DriverDeparture {
  id: string;
  date: string;
  schedule: {
    time: string;
    route: {
      name: string;
      origin: string;
      destination: string;
    };
  };
  capacity: number;
  bookedSeats: number;
  vehicle?: {
    name: string;
  };
  vehicleTracking?: {
    id: string;
    status: string;
    currentLatitude?: number;
    currentLongitude?: number;
    passengerCount: number;
  };
  bookings: Array<{
    id: string;
    bookingNumber: string;
    passengerCount: number;
    user?: {
      firstName: string;
      lastName: string;
    };
    guestFirstName?: string;
    guestLastName?: string;
  }>;
}

interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export default function DriverDashboard() {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [departures, setDepartures] = useState<DriverDeparture[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [loginError, setLoginError] = useState('');
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);

  // Check authentication on load
  useEffect(() => {
    const savedDriver = localStorage.getItem('driver_session');
    if (savedDriver) {
      const driverData = JSON.parse(savedDriver);
      setDriver(driverData);
      setIsAuthenticated(true);
      loadTodaysDepartures(driverData.id);
    }
    setLoading(false);
  }, []);

  // Start location tracking when authenticated
  useEffect(() => {
    if (isAuthenticated && driver) {
      requestLocationPermission();
      startLocationTracking();
    }
  }, [isAuthenticated, driver]);

  const handlePinLogin = async () => {
    if (pin.length !== 4) {
      setLoginError('PIN must be 4 digits');
      return;
    }

    try {
      const response = await fetch('/api/driver/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinCode: pin })
      });

      const data = await response.json();
      
      if (response.ok && data.driver) {
        setDriver(data.driver);
        setIsAuthenticated(true);
        localStorage.setItem('driver_session', JSON.stringify(data.driver));
        loadTodaysDepartures(data.driver.id);
        setLoginError('');
      } else {
        setLoginError(data.error || 'Invalid PIN');
      }
    } catch (error) {
      setLoginError('Login failed. Try again.');
    }
  };

  const loadTodaysDepartures = async (driverId: string) => {
    try {
      const response = await fetch(`/api/driver/departures?driverId=${driverId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setDepartures(data.departures || []);
      }
    } catch (error) {
      console.error('Failed to load departures:', error);
    }
  };

  const requestLocationPermission = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationEnabled(true);
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Location permission denied:', error);
          setLocationEnabled(false);
        }
      );
    }
  };

  const startLocationTracking = () => {
    if (!locationEnabled || !driver) return;

    const trackingInterval = setInterval(() => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude, speed, heading } = position.coords;
            
            setCurrentLocation({ lat: latitude, lng: longitude });
            
            // Find active vehicle tracking
            const activeDeparture = departures.find(d => 
              d.vehicleTracking && 
              ['BOARDING', 'EN_ROUTE'].includes(d.vehicleTracking.status)
            );
            
            if (activeDeparture?.vehicleTracking) {
              // Send GPS update to server
              await fetch('/api/live/tracking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  vehicleTrackingId: activeDeparture.vehicleTracking.id,
                  latitude,
                  longitude,
                  speed: speed ? speed * 2.237 : null, // Convert m/s to mph
                  heading: heading || null,
                  accuracy: position.coords.accuracy
                })
              });
            }
          },
          (error) => console.error('Location tracking error:', error),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
        );
      }
    }, 15000); // Update every 15 seconds

    return () => clearInterval(trackingInterval);
  };

  const updateTripStatus = async (departureId: string, status: string, passengerCount?: number) => {
    try {
      const response = await fetch('/api/driver/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departureId,
          status,
          passengerCount,
          driverId: driver?.id,
          location: currentLocation
        })
      });

      if (response.ok) {
        // Refresh departures
        loadTodaysDepartures(driver!.id);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('driver_session');
    setDriver(null);
    setIsAuthenticated(false);
    setDepartures([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-4xl font-bold text-orange-600 mb-2">SKOOT</div>
            <div className="text-xl text-gray-700">Driver Dashboard</div>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="text-lg font-medium text-gray-700 block mb-3">
                Enter Your 4-Digit PIN
              </label>
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className="w-full text-3xl text-center py-4 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                placeholder="••••"
                autoFocus
                inputMode="numeric"
              />
            </div>
            
            {loginError && (
              <div className="text-red-600 text-center bg-red-50 p-3 rounded-lg">
                {loginError}
              </div>
            )}
            
            <button
              onClick={handlePinLogin}
              disabled={pin.length !== 4}
              className="w-full bg-orange-600 text-white text-xl py-4 rounded-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-orange-700 transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Driver Dashboard
  return (
    <div className="min-h-screen bg-orange-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b-2 border-orange-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-3xl font-bold text-orange-600">SKOOT</div>
              <div className="text-lg text-gray-600">Driver Dashboard</div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="font-semibold text-gray-900">
                  {driver?.firstName} {driver?.lastName}
                </div>
                <div className="text-sm text-gray-600">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
              {locationEnabled ? (
                <div className="text-green-600" title="GPS Enabled">
                  <Navigation className="h-6 w-6" />
                </div>
              ) : (
                <div className="text-red-600" title="GPS Disabled">
                  <AlertTriangle className="h-6 w-6" />
                </div>
              )}
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Trips */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Today's Trips</h2>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>📱 GPS: {locationEnabled ? 'Active' : 'Disabled'}</span>
            <span>🚐 {departures.length} trips scheduled</span>
          </div>
        </div>

        <div className="space-y-4">
          {departures.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="text-xl text-gray-600">No trips scheduled for today</div>
            </div>
          ) : (
            departures.map((departure) => (
              <TripCard
                key={departure.id}
                departure={departure}
                onUpdateStatus={updateTripStatus}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Individual Trip Card Component
function TripCard({ 
  departure, 
  onUpdateStatus 
}: { 
  departure: DriverDeparture;
  onUpdateStatus: (departureId: string, status: string, passengerCount?: number) => void;
}) {
  const [passengerCount, setPassengerCount] = useState(departure.vehicleTracking?.passengerCount || departure.bookedSeats);
  
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'BOARDING': return 'bg-yellow-100 border-yellow-400 text-yellow-800';
      case 'EN_ROUTE': return 'bg-blue-100 border-blue-400 text-blue-800';
      case 'ARRIVED': return 'bg-green-100 border-green-400 text-green-800';
      case 'COMPLETED': return 'bg-gray-100 border-gray-400 text-gray-800';
      default: return 'bg-white border-gray-300 text-gray-700';
    }
  };

  const currentStatus = departure.vehicleTracking?.status || 'SCHEDULED';
  const isActive = ['BOARDING', 'EN_ROUTE'].includes(currentStatus);
  
  return (
    <div className={`rounded-xl border-2 p-6 ${getStatusColor(currentStatus)} ${isActive ? 'ring-2 ring-orange-400' : ''}`}>
      {/* Trip Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="text-2xl font-bold">
            {departure.schedule.time}
          </div>
          <div>
            <div className="font-semibold text-lg">{departure.schedule.route.origin} → {departure.schedule.route.destination}</div>
            <div className="text-sm opacity-75">{departure.vehicle?.name || 'Van'}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold">{passengerCount}/{departure.capacity}</div>
          <div className="text-sm opacity-75">passengers</div>
        </div>
      </div>

      {/* Passenger Count Adjuster */}
      {isActive && (
        <div className="mb-4 flex items-center space-x-4">
          <span className="font-medium">Passenger Count:</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPassengerCount(Math.max(0, passengerCount - 1))}
              className="w-8 h-8 bg-white border border-gray-300 rounded text-lg font-bold hover:bg-gray-50"
            >
              −
            </button>
            <span className="w-12 text-center font-semibold text-lg">{passengerCount}</span>
            <button
              onClick={() => setPassengerCount(Math.min(departure.capacity, passengerCount + 1))}
              className="w-8 h-8 bg-white border border-gray-300 rounded text-lg font-bold hover:bg-gray-50"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        {currentStatus === 'SCHEDULED' && (
          <>
            <button
              onClick={() => onUpdateStatus(departure.id, 'BOARDING', passengerCount)}
              className="bg-yellow-600 text-white py-4 rounded-lg text-lg font-semibold hover:bg-yellow-700 transition-colors"
            >
              🚌 Start Boarding
            </button>
            <button
              className="bg-gray-300 text-gray-600 py-4 rounded-lg text-lg font-semibold cursor-not-allowed"
              disabled
            >
              ⏰ Scheduled
            </button>
          </>
        )}

        {currentStatus === 'BOARDING' && (
          <>
            <button
              onClick={() => onUpdateStatus(departure.id, 'EN_ROUTE', passengerCount)}
              className="bg-blue-600 text-white py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              🛣️ Depart Now
            </button>
            <button
              onClick={() => onUpdateStatus(departure.id, 'DELAYED')}
              className="bg-orange-600 text-white py-4 rounded-lg text-lg font-semibold hover:bg-orange-700 transition-colors"
            >
              ⚠️ Report Delay
            </button>
          </>
        )}

        {currentStatus === 'EN_ROUTE' && (
          <>
            <button
              onClick={() => onUpdateStatus(departure.id, 'ARRIVED', passengerCount)}
              className="bg-green-600 text-white py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors"
            >
              ✅ Arrived
            </button>
            <button
              onClick={() => onUpdateStatus(departure.id, 'DELAYED')}
              className="bg-orange-600 text-white py-4 rounded-lg text-lg font-semibold hover:bg-orange-700 transition-colors"
            >
              ⚠️ Report Delay
            </button>
          </>
        )}

        {currentStatus === 'ARRIVED' && (
          <>
            <button
              onClick={() => onUpdateStatus(departure.id, 'COMPLETED', passengerCount)}
              className="bg-green-600 text-white py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors"
            >
              ✅ Trip Complete
            </button>
            <button
              className="bg-gray-300 text-gray-600 py-4 rounded-lg text-lg font-semibold cursor-not-allowed"
              disabled
            >
              🏁 Arrived
            </button>
          </>
        )}

        {currentStatus === 'COMPLETED' && (
          <>
            <button
              className="bg-gray-300 text-gray-600 py-4 rounded-lg text-lg font-semibold cursor-not-allowed"
              disabled
            >
              ✅ Completed
            </button>
            <button
              className="bg-gray-300 text-gray-600 py-4 rounded-lg text-lg font-semibold cursor-not-allowed"
              disabled
            >
              🏁 Done
            </button>
          </>
        )}
      </div>

      {/* Passenger List (Collapsed by default) */}
      {departure.bookings.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
            📋 View {departure.bookings.length} Bookings
          </summary>
          <div className="mt-2 space-y-1">
            {departure.bookings.map((booking) => (
              <div key={booking.id} className="text-sm bg-white bg-opacity-50 p-2 rounded">
                <span className="font-medium">
                  {booking.user 
                    ? `${booking.user.firstName} ${booking.user.lastName}`
                    : `${booking.guestFirstName} ${booking.guestLastName}`}
                </span>
                <span className="text-gray-600 ml-2">
                  ({booking.passengerCount} passenger{booking.passengerCount > 1 ? 's' : ''})
                </span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}