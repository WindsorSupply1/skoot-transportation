'use client';

import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Clock, 
  Users, 
  Phone, 
  Navigation,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Star
} from 'lucide-react';

interface LiveTrackingData {
  departure: {
    id: string;
    date: string;
    capacity: number;
    bookedSeats: number;
    schedule: {
      time: string;
      route: {
        name: string;
        origin: string;
        destination: string;
      };
    };
    vehicle?: {
      name: string;
      capacity: number;
    };
  };
  vehicleTracking?: {
    id: string;
    status: string;
    currentLatitude?: number;
    currentLongitude?: number;
    lastLocationUpdate?: string;
    passengerCount: number;
    tripStartedAt?: string;
    estimatedArrival?: string;
  };
  driver?: {
    name: string;
    phone: string;
    rating: number;
  };
  liveStatus: {
    currentStatus: string;
    statusMessage?: string;
    estimatedDeparture?: string;
    actualDeparture?: string;
    estimatedArrival?: string;
    currentLocationName?: string;
    progressPercentage: number;
    delayMinutes: number;
    lastUpdateByDriver?: string;
    lastAutomaticUpdate?: string;
    isLiveTracked: boolean;
  };
  lastGPS?: {
    latitude: number;
    longitude: number;
    speed?: number;
    timestamp: string;
  };
}

interface ETAData {
  estimatedArrival: string;
  arrivalTime: string;
  timeRemaining: string;
  totalMinutes: number;
  confidence: number;
  lastUpdated: string;
}

export default function LiveTrackingPage({ params }: { params: { departureId: string } }) {
  const [trackingData, setTrackingData] = useState<LiveTrackingData | null>(null);
  const [etaData, setETAData] = useState<ETAData | null>(null);
  const [loading, setLoading] = useState(true);
  const [etaLoading, setETALoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    loadTrackingData();
    loadETAData();
    
    // Auto-refresh tracking data every 30 seconds
    const trackingInterval = setInterval(() => {
      loadTrackingData();
    }, 30000);

    // Auto-refresh ETA data every 2 minutes
    const etaInterval = setInterval(() => {
      loadETAData();
    }, 120000);

    return () => {
      clearInterval(trackingInterval);
      clearInterval(etaInterval);
    };
  }, [params.departureId]);

  const loadTrackingData = async () => {
    try {
      const response = await fetch(`/api/live/tracking?departureId=${params.departureId}`);
      
      if (response.ok) {
        const data = await response.json();
        setTrackingData(data.data.vehicleTracking);
        setError(null);
      } else {
        setError('Trip not found or not available for tracking');
      }
    } catch (err) {
      setError('Failed to load tracking information');
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  };

  const loadETAData = async () => {
    try {
      setETALoading(true);
      const response = await fetch(`/api/live/eta?departureId=${params.departureId}`);
      
      if (response.ok) {
        const data = await response.json();
        setETAData(data.data.eta);
      } else {
        console.warn('Could not load ETA data');
      }
    } catch (err) {
      console.warn('Failed to load ETA data:', err);
    } finally {
      setETALoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-gray-100 text-gray-800';
      case 'BOARDING': return 'bg-yellow-100 text-yellow-800';
      case 'DEPARTED': 
      case 'EN_ROUTE': return 'bg-blue-100 text-blue-800';
      case 'DELAYED': return 'bg-red-100 text-red-800';
      case 'ARRIVED': return 'bg-green-100 text-green-800';
      case 'COMPLETED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return <Clock className="h-5 w-5" />;
      case 'BOARDING': return <Users className="h-5 w-5" />;
      case 'DEPARTED':
      case 'EN_ROUTE': return <Navigation className="h-5 w-5" />;
      case 'DELAYED': return <AlertTriangle className="h-5 w-5" />;
      case 'ARRIVED':
      case 'COMPLETED': return <CheckCircle className="h-5 w-5" />;
      default: return <Clock className="h-5 w-5" />;
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const calculateETA = () => {
    // Use real-time ETA if available
    if (etaData) {
      return etaData.arrivalTime;
    }
    
    if (!trackingData) return null;
    
    const { liveStatus, vehicleTracking } = trackingData;
    
    // Fallback to stored ETA data
    if (liveStatus.estimatedArrival) {
      return formatDateTime(liveStatus.estimatedArrival);
    }
    
    if (vehicleTracking?.estimatedArrival) {
      return formatDateTime(vehicleTracking.estimatedArrival);
    }
    
    // Calculate rough ETA based on schedule and delays
    const scheduledTime = trackingData.departure.schedule.time;
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    const scheduledDeparture = new Date(trackingData.departure.date);
    scheduledDeparture.setHours(hours, minutes);
    
    const estimatedArrival = new Date(scheduledDeparture.getTime() + (120 * 60 * 1000)); // 2 hour trip
    estimatedArrival.setMinutes(estimatedArrival.getMinutes() + liveStatus.delayMinutes);
    
    return estimatedArrival.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getETAConfidence = () => {
    return etaData?.confidence || null;
  };

  const getTimeRemaining = () => {
    return etaData?.timeRemaining || null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading trip information...</div>
        </div>
      </div>
    );
  }

  if (error || !trackingData) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Trip Not Available</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { departure, vehicleTracking, driver, liveStatus, lastGPS } = trackingData;

  return (
    <div className="min-h-screen bg-orange-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b-2 border-orange-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-2xl font-bold text-orange-600">SKOOT</div>
              <div className="text-lg text-gray-600">Live Tracking</div>
            </div>
            <button
              onClick={() => {
                loadTrackingData();
                loadETAData();
              }}
              className="flex items-center text-gray-500 hover:text-gray-700"
              disabled={loading || etaLoading}
            >
              <RefreshCw className={`h-5 w-5 mr-1 ${(loading || etaLoading) ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Trip Header */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {departure.schedule.route.origin} → {departure.schedule.route.destination}
              </h1>
              <p className="text-gray-600">
                {new Date(departure.date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })} at {formatTime(departure.schedule.time)}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Vehicle</div>
              <div className="font-semibold">{departure.vehicle?.name || 'Van'}</div>
            </div>
          </div>

          {/* Current Status */}
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(liveStatus.currentStatus)}`}>
            {getStatusIcon(liveStatus.currentStatus)}
            <span className="ml-2">{liveStatus.currentStatus.replace('_', ' ')}</span>
          </div>

          {liveStatus.statusMessage && (
            <div className="mt-3 text-gray-700">
              {liveStatus.statusMessage}
            </div>
          )}
        </div>

        {/* Live Status Card */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Status</h2>
          
          <div className="space-y-4">
            {/* Progress Bar */}
            {liveStatus.isLiveTracked && (
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Trip Progress</span>
                  <span>{liveStatus.progressPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-orange-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${liveStatus.progressPercentage}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* ETA */}
            <div className="py-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className={`h-5 w-5 text-gray-400 mr-2 ${etaLoading ? 'animate-pulse' : ''}`} />
                  <span className="text-gray-700">Estimated Arrival</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-lg">
                    {calculateETA() || 'Calculating...'}
                    {liveStatus.delayMinutes > 0 && (
                      <span className="text-red-600 text-sm ml-2">
                        (+{liveStatus.delayMinutes} min)
                      </span>
                    )}
                  </div>
                  {getTimeRemaining() && (
                    <div className="text-sm text-gray-500">
                      {getTimeRemaining()} remaining
                    </div>
                  )}
                </div>
              </div>
              
              {/* ETA Confidence Indicator */}
              {getETAConfidence() && (
                <div className="mt-2 flex items-center text-xs text-gray-500">
                  <div className="flex items-center">
                    <div className="mr-2">Accuracy:</div>
                    <div className="w-16 bg-gray-200 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full ${
                          getETAConfidence()! >= 80 ? 'bg-green-500' : 
                          getETAConfidence()! >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${getETAConfidence()}%` }}
                      ></div>
                    </div>
                    <span className="ml-2">{getETAConfidence()}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Passenger Count */}
            <div className="flex items-center justify-between py-3 border-t border-gray-100">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-gray-700">Passengers Aboard</span>
              </div>
              <span className="font-semibold">
                {vehicleTracking?.passengerCount || departure.bookedSeats}/{departure.capacity}
              </span>
            </div>

            {/* Current Location */}
            {liveStatus.currentLocationName && (
              <div className="flex items-center justify-between py-3 border-t border-gray-100">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-gray-700">Current Location</span>
                </div>
                <span className="font-semibold">{liveStatus.currentLocationName}</span>
              </div>
            )}

            {/* Last Update */}
            {(liveStatus.lastUpdateByDriver || liveStatus.lastAutomaticUpdate) && (
              <div className="flex items-center justify-between py-3 border-t border-gray-100">
                <div className="flex items-center">
                  <RefreshCw className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-gray-700">Last Update</span>
                </div>
                <span className="text-sm text-gray-600">
                  {formatDateTime(liveStatus.lastUpdateByDriver || liveStatus.lastAutomaticUpdate!)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Driver Info */}
        {driver && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Driver</h2>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-lg">{driver.name}</div>
                <div className="flex items-center text-gray-600">
                  <Star className="h-4 w-4 text-yellow-400 mr-1" />
                  <span>{driver.rating.toFixed(1)} rating</span>
                </div>
              </div>
              <a
                href={`tel:${driver.phone}`}
                className="flex items-center bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
              >
                <Phone className="h-4 w-4 mr-2" />
                Call Driver
              </a>
            </div>
          </div>
        )}

        {/* GPS Details (for debugging/admin) */}
        {lastGPS && process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-100 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">GPS Data (Dev)</h3>
            <div className="text-xs space-y-1 text-gray-600">
              <div>Lat: {lastGPS.latitude.toFixed(6)}, Lng: {lastGPS.longitude.toFixed(6)}</div>
              {lastGPS.speed && <div>Speed: {Math.round(lastGPS.speed)} mph</div>}
              <div>Updated: {formatDateTime(lastGPS.timestamp)}</div>
            </div>
          </div>
        )}

        {/* Auto-refresh indicator */}
        <div className="text-center text-sm text-gray-500">
          <RefreshCw className="h-4 w-4 inline mr-1" />
          Auto-refreshing every 30 seconds
          <br />
          Last updated: {lastRefresh.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}