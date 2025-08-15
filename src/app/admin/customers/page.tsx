'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Filter,
  Edit3,
  Trash2,
  Download,
  Eye,
  Users,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  Clock,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  UserPlus,
  History
} from 'lucide-react';

interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  totalBookings: number;
  totalSpent: number;
  lastBookingDate?: string;
  bookings: Array<{
    id: string;
    bookingNumber: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    departure: {
      date: string;
      schedule: {
        time: string;
        route: {
          name: string;
          origin: string;
          destination: string;
        };
      };
    };
  }>;
}

interface CustomerFilters {
  search: string;
  status: string;
  registeredFrom: string;
  registeredTo: string;
  minBookings: string;
  minSpent: string;
}

export default function CustomersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<CustomerFilters>({
    search: '',
    status: 'all',
    registeredFrom: '',
    registeredTo: '',
    minBookings: '',
    minSpent: ''
  });

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user) {
      router.push('/auth/signin');
      return;
    }

    fetchCustomers();
  }, [session, status, router]);

  useEffect(() => {
    applyFilters();
  }, [customers, filters]);

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/customers');
      if (!response.ok) {
        throw new Error(`Failed to fetch customers: ${response.status}`);
      }
      const data = await response.json();
      setCustomers(data.customers || []);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      setError(error instanceof Error ? error.message : 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...customers];

    // Search filter
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(customer => 
        customer.email.toLowerCase().includes(search) ||
        customer.firstName.toLowerCase().includes(search) ||
        customer.lastName.toLowerCase().includes(search) ||
        (customer.phone && customer.phone.includes(search))
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(customer => {
        if (filters.status === 'active') return customer.isActive;
        if (filters.status === 'inactive') return !customer.isActive;
        if (filters.status === 'new') {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return new Date(customer.createdAt) > weekAgo;
        }
        if (filters.status === 'frequent') return customer.totalBookings >= 3;
        return true;
      });
    }

    // Date range filter
    if (filters.registeredFrom) {
      filtered = filtered.filter(customer => new Date(customer.createdAt) >= new Date(filters.registeredFrom));
    }
    if (filters.registeredTo) {
      filtered = filtered.filter(customer => new Date(customer.createdAt) <= new Date(filters.registeredTo));
    }

    // Minimum bookings filter
    if (filters.minBookings) {
      filtered = filtered.filter(customer => customer.totalBookings >= parseInt(filters.minBookings));
    }

    // Minimum spent filter
    if (filters.minSpent) {
      filtered = filtered.filter(customer => customer.totalSpent >= parseFloat(filters.minSpent));
    }

    setFilteredCustomers(filtered);
  };

  const updateCustomer = async (customerId: string, updates: any) => {
    try {
      const response = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update customer');
      }

      fetchCustomers();
      setShowModal(false);
    } catch (error) {
      console.error('Failed to update customer:', error);
      alert('Failed to update customer');
    }
  };

  const deleteCustomer = async (customerId: string) => {
    if (!confirm('Are you sure you want to delete this customer? This will also delete all their bookings and cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete customer');
      }

      fetchCustomers();
      setShowModal(false);
    } catch (error) {
      console.error('Failed to delete customer:', error);
      alert('Failed to delete customer');
    }
  };

  const exportCustomers = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Total Bookings', 'Total Spent', 'Last Booking', 'Registered', 'Status'],
      ...filteredCustomers.map(customer => [
        `${customer.firstName} ${customer.lastName}`,
        customer.email,
        customer.phone || '',
        customer.totalBookings.toString(),
        customer.totalSpent.toString(),
        customer.lastBookingDate ? new Date(customer.lastBookingDate).toLocaleDateString() : 'Never',
        new Date(customer.createdAt).toLocaleDateString(),
        customer.isActive ? 'Active' : 'Inactive'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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

  const getCustomerType = (customer: Customer) => {
    if (customer.totalBookings >= 10) return { label: 'VIP', color: 'bg-purple-100 text-purple-800' };
    if (customer.totalBookings >= 5) return { label: 'Frequent', color: 'bg-blue-100 text-blue-800' };
    if (customer.totalBookings >= 2) return { label: 'Regular', color: 'bg-green-100 text-green-800' };
    return { label: 'New', color: 'bg-gray-100 text-gray-800' };
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
            <h2 className="text-lg font-semibold text-center">Error Loading Customers</h2>
          </div>
          <p className="text-gray-600 text-center mb-4">{error}</p>
          <button 
            onClick={fetchCustomers}
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
              <div className="ml-4 text-gray-500">Customer Management</div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={exportCustomers}
                className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <Download className="h-4 w-4 mr-1" />
                Export CSV
              </button>
              <button
                onClick={fetchCustomers}
                className="flex items-center px-3 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700"
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
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <UserPlus className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">New This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {customers.filter(c => {
                    const monthAgo = new Date();
                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                    return new Date(c.createdAt) > monthAgo;
                  }).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Frequent Customers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {customers.filter(c => c.totalBookings >= 3).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg. Customer Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(customers.length > 0 ? customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length : 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Customers</h2>
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
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Name, email, phone..."
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
                    <option value="all">All Customers</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="new">New (Last 7 days)</option>
                    <option value="frequent">Frequent (3+ bookings)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registered From</label>
                  <input
                    type="date"
                    value={filters.registeredFrom}
                    onChange={(e) => setFilters({ ...filters, registeredFrom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registered To</label>
                  <input
                    type="date"
                    value={filters.registeredTo}
                    onChange={(e) => setFilters({ ...filters, registeredTo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Bookings</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={filters.minBookings}
                    onChange={(e) => setFilters({ ...filters, minBookings: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Spent ($)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={filters.minSpent}
                    onChange={(e) => setFilters({ ...filters, minSpent: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => setFilters({
                    search: '',
                    status: 'all',
                    registeredFrom: '',
                    registeredTo: '',
                    minBookings: '',
                    minSpent: ''
                  })}
                  className="px-4 py-2 text-sm text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}

          {/* Customer List */}
          <div className="divide-y divide-gray-200">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => {
                const customerType = getCustomerType(customer);
                return (
                  <div key={customer.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <span className="font-bold text-lg text-gray-900">
                            {customer.firstName} {customer.lastName}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${customerType.color}`}>
                            {customerType.label}
                          </span>
                          {!customer.isActive && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Inactive
                            </span>
                          )}
                        </div>
                        
                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-gray-500">Contact Information</div>
                            <div className="font-medium flex items-center">
                              <Mail className="h-4 w-4 mr-1" />
                              {customer.email}
                            </div>
                            {customer.phone && (
                              <div className="text-gray-600 flex items-center">
                                <Phone className="h-4 w-4 mr-1" />
                                {customer.phone}
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <div className="text-gray-500">Booking History</div>
                            <div className="font-medium">
                              {customer.totalBookings} booking{customer.totalBookings !== 1 ? 's' : ''} • {formatCurrency(customer.totalSpent)}
                            </div>
                            <div className="text-gray-600">
                              {customer.lastBookingDate ? `Last: ${formatDate(customer.lastBookingDate)}` : 'No bookings yet'}
                            </div>
                          </div>
                          
                          <div>
                            <div className="text-gray-500">Account Details</div>
                            <div className="font-medium">
                              Registered {formatDate(customer.createdAt)}
                            </div>
                            <div className={`text-sm ${customer.isActive ? 'text-green-600' : 'text-red-600'}`}>
                              {customer.isActive ? 'Active account' : 'Inactive account'}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-6">
                        <button
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setShowModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setShowModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg"
                          title="Edit Customer"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => deleteCustomer(customer.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete Customer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
                <p>No customers match your current filters.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customer Detail Modal */}
      {showModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Customer Details - {selectedCustomer.firstName} {selectedCustomer.lastName}
                </h3>
              </div>
              
              <div className="bg-white px-6 py-4 space-y-6">
                {/* Customer Info Form */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Customer Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <input
                        type="text"
                        defaultValue={selectedCustomer.firstName}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        defaultValue={selectedCustomer.lastName}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        defaultValue={selectedCustomer.email}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        defaultValue={selectedCustomer.phone || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        defaultChecked={selectedCustomer.isActive}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Account is active</span>
                    </label>
                  </div>
                </div>

                {/* Statistics */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Statistics</h4>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-gray-500">Total Bookings</div>
                      <div className="text-xl font-bold text-gray-900">{selectedCustomer.totalBookings}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-gray-500">Total Spent</div>
                      <div className="text-xl font-bold text-gray-900">{formatCurrency(selectedCustomer.totalSpent)}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-gray-500">Avg. Per Booking</div>
                      <div className="text-xl font-bold text-gray-900">
                        {formatCurrency(selectedCustomer.totalBookings > 0 ? selectedCustomer.totalSpent / selectedCustomer.totalBookings : 0)}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-gray-500">Customer Since</div>
                      <div className="text-xl font-bold text-gray-900">{formatDate(selectedCustomer.createdAt)}</div>
                    </div>
                  </div>
                </div>

                {/* Booking History */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                    <History className="h-4 w-4 mr-2" />
                    Booking History
                  </h4>
                  <div className="max-h-64 overflow-y-auto">
                    {selectedCustomer.bookings && selectedCustomer.bookings.length > 0 ? (
                      <div className="space-y-3">
                        {selectedCustomer.bookings.map((booking) => (
                          <div key={booking.id} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium">{booking.bookingNumber}</div>
                                <div className="text-sm text-gray-600 flex items-center">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {booking.departure.schedule.route.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {formatDate(booking.departure.date)} at {formatTime(booking.departure.schedule.time)}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold">{formatCurrency(booking.totalAmount)}</div>
                                <div className={`text-xs px-2 py-1 rounded-full ${
                                  booking.status === 'PAID' ? 'bg-green-100 text-green-800' :
                                  booking.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                                  booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {booking.status}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p>No booking history available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteCustomer(selectedCustomer.id)}
                  className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  Delete Customer
                </button>
                <button
                  onClick={() => {
                    // Get form values and update customer
                    const form = document.querySelector('[data-customer-form]') as HTMLFormElement;
                    if (form) {
                      const formData = new FormData(form);
                      const updates = Object.fromEntries(formData);
                      updateCustomer(selectedCustomer.id, updates);
                    }
                  }}
                  className="px-4 py-2 text-sm text-white bg-orange-600 rounded-lg hover:bg-orange-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}