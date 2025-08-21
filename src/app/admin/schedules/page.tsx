'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Users,
  Route,
  Settings,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface Schedule {
  id: string;
  time: string;
  dayOfWeek: number;
  isActive: boolean;
  capacity: number;
  createdAt: string;
  updatedAt: string;
  route: {
    id: string;
    name: string;
    origin: string;
    destination: string;
    duration: number;
  };
  departures?: Array<{
    id: string;
    date: string;
    bookedSeats: number;
  }>;
}

interface RouteData {
  id: string;
  name: string;
  origin: string;
  destination: string;
  duration: number;
  isActive: boolean;
}

export default function AdminSchedulesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'schedules' | 'routes'>('schedules');
  
  // Data states
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [editingRoute, setEditingRoute] = useState<RouteData | null>(null);
  
  // Modal states
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);
  
  // Form states
  const [newSchedule, setNewSchedule] = useState({
    routeId: '',
    time: '06:00',
    dayOfWeek: 1,
    capacity: 15,
    isActive: true
  });
  
  const [newRoute, setNewRoute] = useState({
    name: '',
    origin: '',
    destination: '',
    duration: 120,
    isActive: true
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/admin-login');
      return;
    }
    fetchData();
  }, [session, status, router]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Fetch schedules
      const schedulesRes = await fetch('/api/admin/schedules');
      if (schedulesRes.ok) {
        const schedulesData = await schedulesRes.json();
        setSchedules(schedulesData.schedules || []);
      }
      
      // Fetch routes
      const routesRes = await fetch('/api/admin/routes');
      if (routesRes.ok) {
        const routesData = await routesRes.json();
        setRoutes(routesData.routes || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const createSchedule = async () => {
    try {
      const res = await fetch('/api/admin/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSchedule)
      });

      if (res.ok) {
        await fetchData();
        setShowScheduleModal(false);
        setNewSchedule({
          routeId: '',
          time: '06:00',
          dayOfWeek: 1,
          capacity: 15,
          isActive: true
        });
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create schedule');
      }
    } catch (err) {
      console.error('Error creating schedule:', err);
      alert('Failed to create schedule');
    }
  };

  const updateSchedule = async (id: string, updates: Partial<Schedule>) => {
    try {
      const res = await fetch(`/api/admin/schedules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (res.ok) {
        await fetchData();
        setEditingSchedule(null);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update schedule');
      }
    } catch (err) {
      console.error('Error updating schedule:', err);
      alert('Failed to update schedule');
    }
  };

  const deleteSchedule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    
    try {
      const res = await fetch(`/api/admin/schedules/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        await fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete schedule');
      }
    } catch (err) {
      console.error('Error deleting schedule:', err);
      alert('Failed to delete schedule');
    }
  };

  const createRoute = async () => {
    try {
      const res = await fetch('/api/admin/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRoute)
      });

      if (res.ok) {
        await fetchData();
        setShowRouteModal(false);
        setNewRoute({
          name: '',
          origin: '',
          destination: '',
          duration: 120,
          isActive: true
        });
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create route');
      }
    } catch (err) {
      console.error('Error creating route:', err);
      alert('Failed to create route');
    }
  };

  const updateRoute = async (id: string, updates: Partial<RouteData>) => {
    try {
      const res = await fetch(`/api/admin/routes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (res.ok) {
        await fetchData();
        setEditingRoute(null);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update route');
      }
    } catch (err) {
      console.error('Error updating route:', err);
      alert('Failed to update route');
    }
  };

  const deleteRoute = async (id: string) => {
    if (!confirm('Are you sure you want to delete this route?')) return;
    
    try {
      const res = await fetch(`/api/admin/routes/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        await fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete route');
      }
    } catch (err) {
      console.error('Error deleting route:', err);
      alert('Failed to delete route');
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  };

  const getDayName = (dayOfWeek: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-center mb-2">Error Loading Data</h2>
          <p className="text-gray-600 text-center mb-4">{error}</p>
          <button 
            onClick={fetchData}
            className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700"
          >
            Try Again
          </button>
        </div>
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
              <button
                onClick={() => router.push('/admin')}
                className="flex items-center text-gray-500 hover:text-gray-700 mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </button>
              <div className="text-2xl font-bold text-orange-600">SKOOT</div>
              <div className="ml-4 text-gray-500">Schedule Management</div>
            </div>
            <button
              onClick={fetchData}
              className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('schedules')}
                className={`py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'schedules'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Clock className="h-4 w-4 inline mr-2" />
                Schedules
              </button>
              <button
                onClick={() => setActiveTab('routes')}
                className={`py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'routes'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Route className="h-4 w-4 inline mr-2" />
                Routes
              </button>
            </nav>
          </div>
        </div>

        {/* Schedules Tab */}
        {activeTab === 'schedules' && (
          <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Departure Schedules</h1>
                <p className="text-gray-600">Manage recurring departure times</p>
              </div>
              <button
                onClick={() => setShowScheduleModal(true)}
                className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Schedule
              </button>
            </div>

            {/* Schedules List */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">All Schedules</h2>
              </div>
              
              <div className="divide-y divide-gray-200">
                {schedules.length > 0 ? (
                  schedules.map((schedule) => (
                    <div key={schedule.id} className="p-6 hover:bg-gray-50">
                      {editingSchedule?.id === schedule.id ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                              <input
                                type="time"
                                defaultValue={schedule.time}
                                onChange={(e) => setEditingSchedule({ ...editingSchedule, time: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                              <select
                                defaultValue={schedule.dayOfWeek}
                                onChange={(e) => setEditingSchedule({ ...editingSchedule, dayOfWeek: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                              >
                                {[0, 1, 2, 3, 4, 5, 6].map(day => (
                                  <option key={day} value={day}>{getDayName(day)}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                              <input
                                type="number"
                                defaultValue={schedule.capacity}
                                min="1"
                                max="50"
                                onChange={(e) => setEditingSchedule({ ...editingSchedule, capacity: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateSchedule(schedule.id, editingSchedule)}
                              className="flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                              <Save className="h-4 w-4 mr-1" />
                              Save
                            </button>
                            <button
                              onClick={() => setEditingSchedule(null)}
                              className="flex items-center px-3 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                              <span className="font-bold text-lg text-gray-900">
                                {getDayName(schedule.dayOfWeek)} - {formatTime(schedule.time)}
                              </span>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                schedule.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {schedule.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-6 text-sm text-gray-600">
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1" />
                                {schedule.route.name}
                              </div>
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-1" />
                                {schedule.capacity} seats
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {schedule.route.duration} min journey
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setEditingSchedule(schedule)}
                              className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteSchedule(schedule.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No schedules found</h3>
                    <p>Create your first departure schedule to get started.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Routes Tab */}
        {activeTab === 'routes' && (
          <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Routes</h1>
                <p className="text-gray-600">Manage transportation routes</p>
              </div>
              <button
                onClick={() => setShowRouteModal(true)}
                className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Route
              </button>
            </div>

            {/* Routes List */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Available Routes</h2>
              </div>
              
              <div className="divide-y divide-gray-200">
                {routes.length > 0 ? (
                  routes.map((route) => (
                    <div key={route.id} className="p-6 hover:bg-gray-50">
                      {editingRoute?.id === route.id ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Route Name</label>
                              <input
                                type="text"
                                defaultValue={route.name}
                                onChange={(e) => setEditingRoute({ ...editingRoute, name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                              <input
                                type="number"
                                defaultValue={route.duration}
                                min="1"
                                onChange={(e) => setEditingRoute({ ...editingRoute, duration: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Origin</label>
                              <input
                                type="text"
                                defaultValue={route.origin}
                                onChange={(e) => setEditingRoute({ ...editingRoute, origin: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                              <input
                                type="text"
                                defaultValue={route.destination}
                                onChange={(e) => setEditingRoute({ ...editingRoute, destination: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateRoute(route.id, editingRoute)}
                              className="flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                              <Save className="h-4 w-4 mr-1" />
                              Save
                            </button>
                            <button
                              onClick={() => setEditingRoute(null)}
                              className="flex items-center px-3 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                              <span className="font-bold text-lg text-gray-900">
                                {route.name}
                              </span>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                route.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {route.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-6 text-sm text-gray-600">
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1" />
                                {route.origin} → {route.destination}
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {route.duration} minutes
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setEditingRoute(route)}
                              className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteRoute(route.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center text-gray-500">
                    <Route className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No routes found</h3>
                    <p>Create your first route to get started.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowScheduleModal(false)}></div>
            
            <div className="relative bg-white rounded-lg max-w-lg w-full">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Add New Schedule</h3>
              </div>
              
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
                  <select
                    value={newSchedule.routeId}
                    onChange={(e) => setNewSchedule({ ...newSchedule, routeId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">Select a route</option>
                    {routes.filter(r => r.isActive).map(route => (
                      <option key={route.id} value={route.id}>
                        {route.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                    <input
                      type="time"
                      value={newSchedule.time}
                      onChange={(e) => setNewSchedule({ ...newSchedule, time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                    <select
                      value={newSchedule.dayOfWeek}
                      onChange={(e) => setNewSchedule({ ...newSchedule, dayOfWeek: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                    >
                      {[0, 1, 2, 3, 4, 5, 6].map(day => (
                        <option key={day} value={day}>{getDayName(day)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                  <input
                    type="number"
                    value={newSchedule.capacity}
                    onChange={(e) => setNewSchedule({ ...newSchedule, capacity: parseInt(e.target.value) })}
                    min="1"
                    max="50"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newSchedule.isActive}
                      onChange={(e) => setNewSchedule({ ...newSchedule, isActive: e.target.checked })}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Schedule is active</span>
                  </label>
                </div>
              </div>
              
              <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={createSchedule}
                  disabled={!newSchedule.routeId}
                  className="px-4 py-2 text-sm text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Route Modal */}
      {showRouteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowRouteModal(false)}></div>
            
            <div className="relative bg-white rounded-lg max-w-lg w-full">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Add New Route</h3>
              </div>
              
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Route Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Columbia to Charlotte Douglas International Airport"
                    value={newRoute.name}
                    onChange={(e) => setNewRoute({ ...newRoute, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Origin</label>
                    <input
                      type="text"
                      placeholder="Columbia, SC"
                      value={newRoute.origin}
                      onChange={(e) => setNewRoute({ ...newRoute, origin: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                    <input
                      type="text"
                      placeholder="Charlotte Douglas International Airport"
                      value={newRoute.destination}
                      onChange={(e) => setNewRoute({ ...newRoute, destination: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    value={newRoute.duration}
                    onChange={(e) => setNewRoute({ ...newRoute, duration: parseInt(e.target.value) })}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newRoute.isActive}
                      onChange={(e) => setNewRoute({ ...newRoute, isActive: e.target.checked })}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Route is active</span>
                  </label>
                </div>
              </div>
              
              <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowRouteModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={createRoute}
                  disabled={!newRoute.name || !newRoute.origin || !newRoute.destination}
                  className="px-4 py-2 text-sm text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Route
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}