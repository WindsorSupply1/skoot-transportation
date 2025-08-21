'use client';

import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  X, 
  Bell, 
  TrendingUp,
  Users,
  Clock,
  ChevronRight
} from 'lucide-react';

interface Alert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  title: string;
  message: string;
  route: string;
  time: string;
  date: string;
  capacity: number;
  booked: number;
  timestamp: Date;
  dismissed: boolean;
}

interface Departure {
  id: string;
  date: string;
  capacity: number;
  bookedSeats: number;
  schedule: {
    time: string;
    route: {
      origin: string;
      destination: string;
    };
  };
  vehicle?: {
    name: string;
  };
}

export default function CapacityAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showAlerts, setShowAlerts] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  // Check for capacity issues every 30 seconds
  useEffect(() => {
    checkCapacity();
    const interval = setInterval(checkCapacity, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkCapacity = async () => {
    try {
      // Fetch today's departures
      const response = await fetch('/api/admin/departures/today', {
        credentials: 'include'
      });
      
      if (!response.ok) return;
      
      const data = await response.json();
      const departures: Departure[] = data.departures || [];
      
      // Generate alerts for high capacity
      const newAlerts: Alert[] = [];
      const now = new Date();
      
      departures.forEach(dep => {
        const percentFull = (dep.bookedSeats / dep.capacity) * 100;
        const departureTime = new Date(`${dep.date} ${dep.schedule.time}`);
        const hoursUntilDeparture = (departureTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        // Only alert for upcoming departures (not past ones)
        if (hoursUntilDeparture > 0) {
          if (percentFull >= 100) {
            // Van is full
            newAlerts.push({
              id: `full-${dep.id}`,
              type: 'critical',
              title: 'Van Full!',
              message: `${dep.vehicle?.name || 'Vehicle'} is completely booked`,
              route: `${dep.schedule.route.origin} → ${dep.schedule.route.destination}`,
              time: formatTime(dep.schedule.time),
              date: formatDate(dep.date),
              capacity: dep.capacity,
              booked: dep.bookedSeats,
              timestamp: new Date(),
              dismissed: false
            });
          } else if (percentFull >= 90) {
            // Nearly full
            newAlerts.push({
              id: `nearly-${dep.id}`,
              type: 'warning',
              title: 'Nearly Full',
              message: `Only ${dep.capacity - dep.bookedSeats} seats remaining`,
              route: `${dep.schedule.route.origin} → ${dep.schedule.route.destination}`,
              time: formatTime(dep.schedule.time),
              date: formatDate(dep.date),
              capacity: dep.capacity,
              booked: dep.bookedSeats,
              timestamp: new Date(),
              dismissed: false
            });
          } else if (percentFull >= 80 && hoursUntilDeparture <= 2) {
            // High demand close to departure
            newAlerts.push({
              id: `urgent-${dep.id}`,
              type: 'warning',
              title: 'High Demand',
              message: `${Math.round(percentFull)}% full, departing soon`,
              route: `${dep.schedule.route.origin} → ${dep.schedule.route.destination}`,
              time: formatTime(dep.schedule.time),
              date: formatDate(dep.date),
              capacity: dep.capacity,
              booked: dep.bookedSeats,
              timestamp: new Date(),
              dismissed: false
            });
          }
        }
      });
      
      // Merge with existing alerts (avoid duplicates)
      setAlerts(prev => {
        const existingIds = prev.map(a => a.id);
        const uniqueNewAlerts = newAlerts.filter(a => !existingIds.includes(a.id));
        const updatedAlerts = [...uniqueNewAlerts, ...prev]
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, 20); // Keep only last 20 alerts
        
        // Update unread count
        const unread = updatedAlerts.filter(a => !a.dismissed).length;
        setUnreadCount(unread);
        
        // Play sound for new critical alerts
        if (uniqueNewAlerts.some(a => a.type === 'critical')) {
          playAlertSound();
        }
        
        return updatedAlerts;
      });
      
    } catch (error) {
      // Error checking capacity
    }
  };

  const playAlertSound = () => {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => 
      prev.map(a => a.id === alertId ? { ...a, dismissed: true } : a)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const dismissAll = () => {
    setAlerts(prev => prev.map(a => ({ ...a, dismissed: true })));
    setUnreadCount(0);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <TrendingUp className="h-5 w-5 text-yellow-600" />;
      default:
        return <Bell className="h-5 w-5 text-blue-600" />;
    }
  };

  const getAlertStyles = (type: string) => {
    switch (type) {
      case 'critical':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const activeAlerts = alerts.filter(a => !a.dismissed);

  if (!showAlerts || activeAlerts.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      {/* Alert Container */}
      <div className={`bg-white rounded-lg shadow-lg border-2 ${
        activeAlerts.some(a => a.type === 'critical') ? 'border-red-400' : 'border-orange-400'
      } overflow-hidden transition-all duration-300 ${
        isExpanded ? 'max-h-[600px]' : 'max-h-[400px]'
      }`}>
        {/* Header */}
        <div className="bg-orange-600 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <span className="font-semibold">Capacity Alerts</span>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-white hover:text-orange-200"
            >
              <ChevronRight className={`h-4 w-4 transition-transform ${
                isExpanded ? 'rotate-90' : ''
              }`} />
            </button>
            <button
              onClick={() => setShowAlerts(false)}
              className="text-white hover:text-orange-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Alerts List */}
        <div className="max-h-[500px] overflow-y-auto">
          {activeAlerts.length > 0 ? (
            <>
              {activeAlerts.slice(0, isExpanded ? 10 : 3).map(alert => (
                <div
                  key={alert.id}
                  className={`p-4 border-b ${getAlertStyles(alert.type)} hover:bg-opacity-70 transition-colors`}
                >
                  <div className="flex items-start gap-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900">{alert.title}</h4>
                        <button
                          onClick={() => dismissAlert(alert.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {alert.date} at {alert.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {alert.booked}/{alert.capacity}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-gray-700 mt-1">
                        {alert.route}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {activeAlerts.length > 3 && !isExpanded && (
                <div className="p-3 bg-gray-50 text-center">
                  <button
                    onClick={() => setIsExpanded(true)}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                  >
                    View {activeAlerts.length - 3} more alerts
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>No capacity alerts</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {activeAlerts.length > 0 && (
          <div className="bg-gray-50 px-4 py-3 border-t flex justify-between">
            <button
              onClick={dismissAll}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Dismiss All
            </button>
            <button
              onClick={() => window.location.href = '/admin/schedules-new'}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              View Schedules →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}