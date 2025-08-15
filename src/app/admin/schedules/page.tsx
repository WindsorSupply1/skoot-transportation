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
  Filter
} from 'lucide-react';

interface Schedule {
  id: string;
  time: string;
  isActive: boolean;
  capacity: number;
  createdAt: string;
  updatedAt: string;
  route: {
    id: string;
    name: string;
    origin: string;
    destination: string;
    price: number;
    isActive: boolean;
    duration: number;
  };
  departures: Array<{
    id: string;
    date: string;
    capacity: number;
    bookedSeats: number;
    availableSeats: number;
  }>;
}

interface Route {
  id: string;
  name: string;
  origin: string;
  destination: string;
  price: number;
  duration: number;
  isActive: boolean;
  createdAt: string;
}

interface NewSchedule {
  routeId: string;
  time: string;
  capacity: number;
  isActive: boolean;
}

interface NewRoute {
  name: string;
  origin: string;
  destination: string;
  price: number;
  duration: number;
  isActive: boolean;
}

export default function SchedulesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [activeTab, setActiveTab] = useState<'schedules' | 'routes'>('schedules');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    routeId: 'all',
    status: 'all',
    timeFrom: '',
    timeTo: ''
  });

  const [newSchedule, setNewSchedule] = useState<NewSchedule>({
    routeId: '',
    time: '',
    capacity: 14,
    isActive: true
  });

  const [newRoute, setNewRoute] = useState<NewRoute>({
    name: '',
    origin: '',
    destination: '',
    price: 31,
    duration: 90,
    isActive: true
  });

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user) {
      router.push('/auth/signin');
      return;
    }

    fetchData();
  }, [session, status, router]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [schedulesRes, routesRes] = await Promise.all([
        fetch('/api/admin/schedules'),
        fetch('/api/admin/routes')
      ]);

      if (!schedulesRes.ok || !routesRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [schedulesData, routesData] = await Promise.all([
        schedulesRes.json(),
        routesRes.json()
      ]);

      setSchedules(schedulesData.schedules || []);
      setRoutes(routesData.routes || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const createSchedule = async () => {
    try {
      const response = await fetch('/api/admin/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSchedule)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create schedule');
      }

      await fetchData();
      setShowScheduleModal(false);
      setNewSchedule({ routeId: '', time: '', capacity: 14, isActive: true });
    } catch (error) {
      console.error('Failed to create schedule:', error);
      alert(error instanceof Error ? error.message : 'Failed to create schedule');
    }
  };

  const updateSchedule = async (scheduleId: string, updates: any) => {
    try {
      const response = await fetch(`/api/admin/schedules/${scheduleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update schedule');
      }

      await fetchData();
      setEditingSchedule(null);
    } catch (error) {
      console.error('Failed to update schedule:', error);
      alert('Failed to update schedule');
    }
  };

  const deleteSchedule = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this schedule? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/schedules/${scheduleId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete schedule');
      }

      await fetchData();
    } catch (error) {
      console.error('Failed to delete schedule:', error);
      alert('Failed to delete schedule');
    }
  };

  const createRoute = async () => {
    try {
      const response = await fetch('/api/admin/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRoute)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create route');
      }

      await fetchData();
      setShowRouteModal(false);
      setNewRoute({ name: '', origin: '', destination: '', price: 31, duration: 90, isActive: true });
    } catch (error) {
      console.error('Failed to create route:', error);
      alert(error instanceof Error ? error.message : 'Failed to create route');
    }
  };

  const updateRoute = async (routeId: string, updates: any) => {
    try {
      const response = await fetch(`/api/admin/routes/${routeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update route');
      }

      await fetchData();
      setEditingRoute(null);
    } catch (error) {
      console.error('Failed to update route:', error);
      alert('Failed to update route');
    }
  };

  const deleteRoute = async (routeId: string) => {
    if (!confirm('Are you sure you want to delete this route? This will also delete all associated schedules and cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/routes/${routeId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete route');
      }

      await fetchData();
    } catch (error) {
      console.error('Failed to delete route:', error);
      alert('Failed to delete route');
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const filteredSchedules = schedules.filter(schedule => {
    if (filters.routeId !== 'all' && schedule.route.id !== filters.routeId) return false;
    if (filters.status !== 'all') {
      if (filters.status === 'active' && !schedule.isActive) return false;
      if (filters.status === 'inactive' && schedule.isActive) return false;
    }
    if (filters.timeFrom && schedule.time < filters.timeFrom) return false;
    if (filters.timeTo && schedule.time > filters.timeTo) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md">
          <div className="text-red-600 mb-4">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <h2 className="text-lg font-semibold text-center">Error Loading Data</h2>
          </div>
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
            <div className="flex items-center gap-4">
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
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('schedules')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
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
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
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

        {activeTab === 'schedules' && (
          <>
            {/* Schedules Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Departure Schedules</h1>
                <p className="text-gray-600">Manage recurring departure times and capacity</p>
              </div>
              <button
                onClick={() => setShowScheduleModal(true)}
                className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Schedule
              </button>
            </div>

            {/* Schedules Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Schedules</p>
                    <p className="text-2xl font-bold text-gray-900">{schedules.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <Settings className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Active Schedules</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {schedules.filter(s => s.isActive).length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Capacity</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {schedules.filter(s => s.isActive).reduce((sum, s) => sum + s.capacity, 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <Route className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Routes Covered</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {new Set(schedules.map(s => s.route.id)).size}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Schedules Filters */}
            <div className="bg-white rounded-lg shadow-sm mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Schedules</h2>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center text-gray-500 hover:text-gray-700"
                  >
                    <Filter className="h-4 w-4 mr-1" />
                    Filters
                    {showFilters ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
                  </button>
                </div>
              </div>

              {showFilters && (
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
                      <select
                        value={filters.routeId}
                        onChange={(e) => setFilters({ ...filters, routeId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                      >
                        <option value="all">All Routes</option>
                        {routes.map(route => (
                          <option key={route.id} value={route.id}>{route.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                      >
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Time From</label>
                      <input
                        type="time"
                        value={filters.timeFrom}
                        onChange={(e) => setFilters({ ...filters, timeFrom: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Time To</label>
                      <input
                        type="time"
                        value={filters.timeTo}
                        onChange={(e) => setFilters({ ...filters, timeTo: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Schedules List */}
              <div className="divide-y divide-gray-200">
                {filteredSchedules.length > 0 ? (
                  filteredSchedules.map((schedule) => (
                    <div key={schedule.id} className="p-6">
                      {editingSchedule?.id === schedule.id ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                              <input
                                type="time"
                                defaultValue={schedule.time}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                                onChange={(e) => setEditingSchedule({ ...editingSchedule, time: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                              <input
                                type="number"
                                defaultValue={schedule.capacity}
                                min="1"
                                max="20"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                                onChange={(e) => setEditingSchedule({ ...editingSchedule, capacity: parseInt(e.target.value) })}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                              <select
                                defaultValue={schedule.isActive ? 'active' : 'inactive'}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                                onChange={(e) => setEditingSchedule({ ...editingSchedule, isActive: e.target.value === 'active' })}
                              >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateSchedule(schedule.id, {
                                time: editingSchedule.time,
                                capacity: editingSchedule.capacity,
                                isActive: editingSchedule.isActive
                              })}
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
                                {formatTime(schedule.time)}
                              </span>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                schedule.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {schedule.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            
                            <div className="grid md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <div className="text-gray-500">Route</div>
                                <div className="font-medium flex items-center">
                                  <MapPin className="h-4 w-4 mr-1" />
                                  {schedule.route.name}
                                </div>
                                <div className="text-gray-600">
                                  {schedule.route.origin} → {schedule.route.destination}
                                </div>
                              </div>
                              
                              <div>
                                <div className="text-gray-500">Capacity & Pricing</div>
                                <div className="font-medium">
                                  {schedule.capacity} seats • {formatCurrency(schedule.route.price)}
                                </div>
                                <div className="text-gray-600">
                                  {formatDuration(schedule.route.duration)} journey
                                </div>
                              </div>
                              
                              <div>
                                <div className="text-gray-500">Recent Demand</div>
                                <div className="font-medium">
                                  {schedule.departures.length > 0 ? (
                                    `${Math.round(schedule.departures.reduce((sum, d) => sum + (d.bookedSeats / d.capacity), 0) / schedule.departures.length * 100)}% avg occupancy`
                                  ) : (
                                    'No recent data'
                                  )}
                                </div>
                                <div className="text-gray-600">
                                  Last 30 days
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-6">
                            <button
                              onClick={() => setEditingSchedule(schedule)}
                              className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg"
                              title="Edit Schedule"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            
                            <button
                              onClick={() => deleteSchedule(schedule.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              title="Delete Schedule"
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
          </>
        )}

        {activeTab === 'routes' && (
          <>
            {/* Routes Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Routes</h1>
                <p className="text-gray-600">Manage transportation routes and pricing</p>
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
                    <div key={route.id} className="p-6">
                      {editingRoute?.id === route.id ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Route Name</label>
                              <input
                                type="text"
                                defaultValue={route.name}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                                onChange={(e) => setEditingRoute({ ...editingRoute, name: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                              <input
                                type="number"
                                defaultValue={route.price}
                                min="1"
                                step="0.01"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                                onChange={(e) => setEditingRoute({ ...editingRoute, price: parseFloat(e.target.value) })}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Origin</label>
                              <input
                                type="text"
                                defaultValue={route.origin}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                                onChange={(e) => setEditingRoute({ ...editingRoute, origin: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                              <input
                                type="text"
                                defaultValue={route.destination}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                                onChange={(e) => setEditingRoute({ ...editingRoute, destination: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                              <input
                                type="number"
                                defaultValue={route.duration}
                                min="1"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                                onChange={(e) => setEditingRoute({ ...editingRoute, duration: parseInt(e.target.value) })}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                              <select
                                defaultValue={route.isActive ? 'active' : 'inactive'}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                                onChange={(e) => setEditingRoute({ ...editingRoute, isActive: e.target.value === 'active' })}
                              >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateRoute(route.id, {
                                name: editingRoute.name,
                                origin: editingRoute.origin,
                                destination: editingRoute.destination,
                                price: editingRoute.price,
                                duration: editingRoute.duration,
                                isActive: editingRoute.isActive
                              })}
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
                            
                            <div className="grid md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <div className="text-gray-500">Route</div>
                                <div className="font-medium flex items-center">
                                  <MapPin className="h-4 w-4 mr-1" />
                                  {route.origin} → {route.destination}
                                </div>
                                <div className="text-gray-600">
                                  {formatDuration(route.duration)} journey
                                </div>
                              </div>
                              
                              <div>
                                <div className="text-gray-500">Pricing</div>
                                <div className="font-medium">
                                  {formatCurrency(route.price)} per passenger
                                </div>
                                <div className="text-gray-600">
                                  {(route.price / route.duration * 60).toFixed(2)} $/hour
                                </div>
                              </div>
                              
                              <div>
                                <div className="text-gray-500">Schedules</div>
                                <div className="font-medium">
                                  {schedules.filter(s => s.route.id === route.id).length} departure times
                                </div>
                                <div className="text-gray-600">
                                  {schedules.filter(s => s.route.id === route.id && s.isActive).length} active
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-6">
                            <button
                              onClick={() => setEditingRoute(route)}
                              className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg"
                              title="Edit Route"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            
                            <button
                              onClick={() => deleteRoute(route.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              title="Delete Route"
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
          </>
        )}
      </div>

      {/* New Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowScheduleModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Add New Schedule</h3>
              </div>
              
              <div className="bg-white px-6 py-4 space-y-4">
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
                        {route.name} ({route.origin} → {route.destination})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Departure Time</label>
                  <input
                    type="time"
                    value={newSchedule.time}
                    onChange={(e) => setNewSchedule({ ...newSchedule, time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                  <input
                    type="number"
                    value={newSchedule.capacity}
                    onChange={(e) => setNewSchedule({ ...newSchedule, capacity: parseInt(e.target.value) })}
                    min="1"
                    max="20"
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
                  disabled={!newSchedule.routeId || !newSchedule.time}
                  className="px-4 py-2 text-sm text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Route Modal */}
      {showRouteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowRouteModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Add New Route</h3>
              </div>
              
              <div className="bg-white px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Route Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Columbia to Charlotte Airport"
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
                      placeholder="Charlotte Airport"
                      value={newRoute.destination}
                      onChange={(e) => setNewRoute({ ...newRoute, destination: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                    <input
                      type="number"
                      value={newRoute.price}
                      onChange={(e) => setNewRoute({ ...newRoute, price: parseFloat(e.target.value) })}
                      min="1"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                    />
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