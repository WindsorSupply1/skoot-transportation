'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Plus,
  Search,
  Edit3,
  Trash2,
  Eye,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronUp,
  Settings,
  Navigation,
  Building,
  Save,
  X
} from 'lucide-react';

interface OperatingHours {
  [key: string]: {
    enabled: boolean;
    open?: string;
    close?: string;
  };
}

interface PickupLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
  isPickup: boolean;
  isDropoff: boolean;
  isActive: boolean;
  sortOrder: number;
  instructions?: string;
  maxCapacity?: number;
  operatingHours?: OperatingHours;
  createdAt: string;
  updatedAt: string;
  bookingCount: number;
  pickupBookingCount: number;
  dropoffBookingCount: number;
  pickupBookings?: any[];
}

const DEFAULT_OPERATING_HOURS: OperatingHours = {
  monday: { enabled: true, open: '06:00', close: '22:00' },
  tuesday: { enabled: true, open: '06:00', close: '22:00' },
  wednesday: { enabled: true, open: '06:00', close: '22:00' },
  thursday: { enabled: true, open: '06:00', close: '22:00' },
  friday: { enabled: true, open: '06:00', close: '22:00' },
  saturday: { enabled: true, open: '08:00', close: '20:00' },
  sunday: { enabled: true, open: '08:00', close: '20:00' },
};

export default function PickupLocationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [locations, setLocations] = useState<PickupLocation[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<PickupLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedLocation, setSelectedLocation] = useState<PickupLocation | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all', // all, active, inactive
    type: 'pickup' // pickup, dropoff, all
  });
  const [formData, setFormData] = useState<Partial<PickupLocation>>({
    operatingHours: DEFAULT_OPERATING_HOURS
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user) {
      router.push('/auth/signin');
      return;
    }

    fetchLocations();
  }, [session, status, router]);

  useEffect(() => {
    applyFilters();
  }, [locations, filters]);

  const fetchLocations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/pickup-locations?includeInactive=true&pickupOnly=false');
      if (!response.ok) {
        throw new Error(`Failed to fetch locations: ${response.status}`);
      }
      const data = await response.json();
      setLocations(data.locations || []);
    } catch (error) {
      console.error('Failed to fetch locations:', error);
      setError(error instanceof Error ? error.message : 'Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...locations];

    // Search filter
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(location => 
        location.name.toLowerCase().includes(search) ||
        location.address.toLowerCase().includes(search) ||
        location.city.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(location => 
        filters.status === 'active' ? location.isActive : !location.isActive
      );
    }

    // Type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(location => {
        if (filters.type === 'pickup') return location.isPickup;
        if (filters.type === 'dropoff') return location.isDropoff;
        return true;
      });
    }

    setFilteredLocations(filtered);
  };

  const handleCreateLocation = () => {
    setFormData({ 
      name: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      isPickup: true,
      isDropoff: false,
      isActive: true,
      sortOrder: 0,
      operatingHours: DEFAULT_OPERATING_HOURS
    });
    setModalMode('create');
    setSelectedLocation(null);
    setShowModal(true);
  };

  const handleEditLocation = (location: PickupLocation) => {
    setFormData({ 
      ...location,
      operatingHours: location.operatingHours || DEFAULT_OPERATING_HOURS
    });
    setModalMode('edit');
    setSelectedLocation(location);
    setShowModal(true);
  };

  const handleViewLocation = async (location: PickupLocation) => {
    setSelectedLocation(location);
    setModalMode('view');
    
    // Fetch detailed location data
    try {
      const response = await fetch(`/api/admin/pickup-locations/${location.id}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedLocation(data.location);
      }
    } catch (error) {
      console.error('Failed to fetch location details:', error);
    }
    
    setShowModal(true);
  };

  const handleSubmitLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.address) return;

    setSubmitting(true);
    try {
      const url = modalMode === 'create' 
        ? '/api/admin/pickup-locations'
        : `/api/admin/pickup-locations/${selectedLocation?.id}`;
      
      const method = modalMode === 'create' ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save location');
      }

      await fetchLocations();
      setShowModal(false);
      setFormData({ operatingHours: DEFAULT_OPERATING_HOURS });
    } catch (error) {
      console.error('Failed to save location:', error);
      alert(error instanceof Error ? error.message : 'Failed to save location');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLocation = async (locationId: string) => {
    if (!confirm('Are you sure you want to delete this location? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/pickup-locations/${locationId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete location');
      }

      fetchLocations();
      setShowModal(false);
    } catch (error) {
      console.error('Failed to delete location:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete location');
    }
  };

  const formatOperatingHours = (hours?: OperatingHours) => {
    if (!hours) return 'Not set';
    
    const enabledDays = Object.entries(hours)
      .filter(([_, schedule]) => schedule.enabled)
      .map(([day]) => day.charAt(0).toUpperCase() + day.slice(1, 3));
    
    if (enabledDays.length === 0) return 'Closed';
    if (enabledDays.length === 7) return 'Daily';
    
    return enabledDays.join(', ');
  };

  const getLocationTypeIcon = (location: PickupLocation) => {
    if (location.isPickup && location.isDropoff) return '⇅';
    if (location.isPickup) return '↑';
    if (location.isDropoff) return '↓';
    return '○';
  };

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
            <h2 className="text-lg font-semibold text-center">Error Loading Locations</h2>
          </div>
          <p className="text-gray-600 text-center mb-4">{error}</p>
          <button 
            onClick={fetchLocations}
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
              <div className="ml-4 text-gray-500">Pickup Location Management</div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleCreateLocation}
                className="flex items-center px-3 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Location
              </button>
              <button
                onClick={fetchLocations}
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
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Locations</p>
                <p className="text-2xl font-bold text-gray-900">{locations.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active</p>
                <p className="text-2xl font-bold text-gray-900">
                  {locations.filter(l => l.isActive).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Navigation className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pickup Points</p>
                <p className="text-2xl font-bold text-gray-900">
                  {locations.filter(l => l.isPickup).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">
                  {locations.reduce((sum, l) => sum + l.bookingCount, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Locations List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Pickup Locations</h2>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Name, address, city..."
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="all">All Types</option>
                    <option value="pickup">Pickup Only</option>
                    <option value="dropoff">Dropoff Only</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => setFilters({ search: '', status: 'all', type: 'pickup' })}
                    className="w-full px-3 py-2 text-sm text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="divide-y divide-gray-200">
            {filteredLocations.length > 0 ? (
              filteredLocations.map((location) => (
                <div key={location.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <span className="text-lg font-medium text-gray-900">
                          {getLocationTypeIcon(location)} {location.name}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          location.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {location.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {location.maxCapacity && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Max: {location.maxCapacity}
                          </span>
                        )}
                      </div>
                      
                      <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-gray-500">Address</div>
                          <div className="font-medium">{location.address}</div>
                          <div className="text-gray-600">{location.city}, {location.state} {location.zipCode}</div>
                        </div>
                        
                        <div>
                          <div className="text-gray-500">Type & Schedule</div>
                          <div className="font-medium">
                            {location.isPickup && location.isDropoff ? 'Pickup & Dropoff' : 
                             location.isPickup ? 'Pickup Only' : 'Dropoff Only'}
                          </div>
                          <div className="text-gray-600">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {formatOperatingHours(location.operatingHours)}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-gray-500">Usage Stats</div>
                          <div className="font-medium">
                            {location.bookingCount} total bookings
                          </div>
                          <div className="text-gray-600">
                            {location.pickupBookingCount} pickup • {location.dropoffBookingCount} dropoff
                          </div>
                        </div>
                      </div>
                      
                      {location.instructions && (
                        <div className="mt-2 text-sm text-gray-600">
                          <strong>Instructions:</strong> {location.instructions}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-6">
                      <button
                        onClick={() => handleViewLocation(location)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleEditLocation(location)}
                        className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg"
                        title="Edit Location"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteLocation(location.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete Location"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-gray-500">
                <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No locations found</h3>
                <p>No locations match your current filters.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Location Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {modalMode === 'create' ? 'Add New Location' : 
                     modalMode === 'edit' ? 'Edit Location' : 'Location Details'}
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              {modalMode === 'view' && selectedLocation ? (
                <div className="bg-white px-6 py-4 space-y-6">
                  {/* View Mode Content */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">Location Information</h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="text-gray-500">Name:</span> <span className="font-medium">{selectedLocation.name}</span></div>
                        <div><span className="text-gray-500">Address:</span> <span className="font-medium">{selectedLocation.address}</span></div>
                        <div><span className="text-gray-500">City:</span> <span className="font-medium">{selectedLocation.city}</span></div>
                        <div><span className="text-gray-500">State:</span> <span className="font-medium">{selectedLocation.state}</span></div>
                        <div><span className="text-gray-500">Zip Code:</span> <span className="font-medium">{selectedLocation.zipCode}</span></div>
                        {selectedLocation.latitude && selectedLocation.longitude && (
                          <div><span className="text-gray-500">Coordinates:</span> <span className="font-medium">{selectedLocation.latitude}, {selectedLocation.longitude}</span></div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">Settings</h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="text-gray-500">Type:</span> <span className="font-medium">
                          {selectedLocation.isPickup && selectedLocation.isDropoff ? 'Pickup & Dropoff' : 
                           selectedLocation.isPickup ? 'Pickup Only' : 'Dropoff Only'}
                        </span></div>
                        <div><span className="text-gray-500">Status:</span> 
                          <span className={`ml-1 font-medium ${selectedLocation.isActive ? 'text-green-600' : 'text-red-600'}`}>
                            {selectedLocation.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        {selectedLocation.maxCapacity && (
                          <div><span className="text-gray-500">Max Capacity:</span> <span className="font-medium">{selectedLocation.maxCapacity}</span></div>
                        )}
                        <div><span className="text-gray-500">Sort Order:</span> <span className="font-medium">{selectedLocation.sortOrder}</span></div>
                      </div>
                    </div>
                  </div>
                  
                  {selectedLocation.instructions && (
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">Pickup Instructions</h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedLocation.instructions}</p>
                    </div>
                  )}
                  
                  {selectedLocation.operatingHours && (
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">Operating Hours</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(selectedLocation.operatingHours).map(([day, schedule]) => (
                          <div key={day} className="text-sm">
                            <span className="font-medium capitalize">{day}:</span>
                            {schedule.enabled ? (
                              <span className="ml-2 text-gray-600">{schedule.open} - {schedule.close}</span>
                            ) : (
                              <span className="ml-2 text-red-600">Closed</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Usage Statistics</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="bg-blue-50 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-blue-600">{selectedLocation.bookingCount}</div>
                        <div className="text-blue-600">Total Bookings</div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-600">{selectedLocation.pickupBookingCount}</div>
                        <div className="text-green-600">Pickups</div>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-purple-600">{selectedLocation.dropoffBookingCount}</div>
                        <div className="text-purple-600">Dropoffs</div>
                      </div>
                    </div>
                  </div>
                  
                  {selectedLocation.pickupBookings && selectedLocation.pickupBookings.length > 0 && (
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">Recent Bookings</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {selectedLocation.pickupBookings.map((booking) => (
                          <div key={booking.id} className="text-sm bg-gray-50 p-2 rounded">
                            <div className="flex justify-between">
                              <span className="font-medium">{booking.bookingNumber}</span>
                              <span className="text-gray-500">{new Date(booking.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="text-gray-600">
                              {booking.user.firstName} {booking.user.lastName} • {booking.departure.schedule.route.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmitLocation} className="bg-white px-6 py-4 space-y-6">
                  {/* Form Content */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Location Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                        placeholder="e.g., USC Campus Center"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
                      <input
                        type="text"
                        required
                        value={formData.address || ''}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                        placeholder="e.g., 1400 Wheat Street"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                      <input
                        type="text"
                        required
                        value={formData.city || ''}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Columbia"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                      <input
                        type="text"
                        required
                        value={formData.state || ''}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                        placeholder="SC"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Zip Code *</label>
                      <input
                        type="text"
                        required
                        value={formData.zipCode || ''}
                        onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                        placeholder="29208"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
                      <input
                        type="number"
                        step="any"
                        value={formData.latitude || ''}
                        onChange={(e) => setFormData({ ...formData, latitude: e.target.value ? parseFloat(e.target.value) : undefined })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                        placeholder="34.0224"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
                      <input
                        type="number"
                        step="any"
                        value={formData.longitude || ''}
                        onChange={(e) => setFormData({ ...formData, longitude: e.target.value ? parseFloat(e.target.value) : undefined })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                        placeholder="-81.0352"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Instructions</label>
                    <textarea
                      value={formData.instructions || ''}
                      onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Detailed pickup instructions, landmarks, parking information..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Max Capacity (optional)</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.maxCapacity || ''}
                        onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value ? parseInt(e.target.value) : undefined })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                        placeholder="15"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sort Order</label>
                      <input
                        type="number"
                        value={formData.sortOrder || 0}
                        onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-6">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.isPickup || false}
                          onChange={(e) => setFormData({ ...formData, isPickup: e.target.checked })}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Pickup Location</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.isDropoff || false}
                          onChange={(e) => setFormData({ ...formData, isDropoff: e.target.checked })}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Dropoff Location</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.isActive !== false}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Active</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Operating Hours */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Operating Hours</h4>
                    <div className="space-y-3">
                      {Object.entries(formData.operatingHours || {}).map(([day, schedule]) => (
                        <div key={day} className="flex items-center space-x-4">
                          <div className="w-24">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={schedule.enabled}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  operatingHours: {
                                    ...formData.operatingHours,
                                    [day]: { ...schedule, enabled: e.target.checked }
                                  }
                                })}
                                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                              />
                              <span className="ml-2 text-sm text-gray-700 capitalize">{day}</span>
                            </label>
                          </div>
                          
                          {schedule.enabled && (
                            <>
                              <div>
                                <input
                                  type="time"
                                  value={schedule.open || '06:00'}
                                  onChange={(e) => setFormData({
                                    ...formData,
                                    operatingHours: {
                                      ...formData.operatingHours,
                                      [day]: { ...schedule, open: e.target.value }
                                    }
                                  })}
                                  className="px-2 py-1 border border-gray-300 rounded focus:ring-orange-500 focus:border-orange-500 text-sm"
                                />
                              </div>
                              <span className="text-gray-500">to</span>
                              <div>
                                <input
                                  type="time"
                                  value={schedule.close || '22:00'}
                                  onChange={(e) => setFormData({
                                    ...formData,
                                    operatingHours: {
                                      ...formData.operatingHours,
                                      [day]: { ...schedule, close: e.target.value }
                                    }
                                  })}
                                  className="px-2 py-1 border border-gray-300 rounded focus:ring-orange-500 focus:border-orange-500 text-sm"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-6 border-t">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 text-sm text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {submitting && <RefreshCw className="h-4 w-4 mr-1 animate-spin" />}
                      <Save className="h-4 w-4 mr-1" />
                      {modalMode === 'create' ? 'Create Location' : 'Update Location'}
                    </button>
                  </div>
                </form>
              )}
              
              {modalMode === 'view' && (
                <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      handleEditLocation(selectedLocation!);
                    }}
                    className="px-4 py-2 text-sm text-white bg-orange-600 rounded-lg hover:bg-orange-700"
                  >
                    Edit Location
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}