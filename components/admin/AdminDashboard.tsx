'use client'

import { useState } from 'react'
import { Calendar, Users, DollarSign, Car, TrendingUp, Clock } from 'lucide-react'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')

  const stats = [
    {
      title: 'Total Bookings',
      value: '1,234',
      change: '+12%',
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Active Customers',
      value: '856',
      change: '+8%',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Monthly Revenue',
      value: '$45,678',
      change: '+15%',
      icon: DollarSign,
      color: 'text-primary',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Fleet Utilization',
      value: '87%',
      change: '+3%',
      icon: Car,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ]

  const recentBookings = [
    { id: 'SKT-001', customer: 'John Doe', route: 'Downtown → Airport', status: 'completed', amount: '$45' },
    { id: 'SKT-002', customer: 'Jane Smith', route: 'Hotel → Conference Center', status: 'in-progress', amount: '$32' },
    { id: 'SKT-003', customer: 'Bob Johnson', route: 'Airport → Downtown', status: 'scheduled', amount: '$45' },
    { id: 'SKT-004', customer: 'Alice Brown', route: 'Business District → Airport', status: 'completed', amount: '$38' },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in-progress': return 'bg-yellow-100 text-yellow-800'
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">{stat.title}</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-neutral-900">{stat.value}</p>
                  <span className="ml-2 text-sm font-medium text-green-600">{stat.change}</span>
                </div>
              </div>
              <div className={`${stat.bgColor} rounded-full p-3`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview' },
            { id: 'bookings', name: 'Recent Bookings' },
            { id: 'analytics', name: 'Analytics' },
            { id: 'fleet', name: 'Fleet Management' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid md:grid-cols-2 gap-8">
          <div className="card">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Today's Schedule
            </h3>
            <div className="space-y-4">
              {[
                { time: '08:00', route: 'Downtown → Airport', driver: 'Mike Wilson' },
                { time: '10:30', route: 'Hotel → Conference', driver: 'Sarah Johnson' },
                { time: '14:15', route: 'Airport → Downtown', driver: 'David Chen' },
                { time: '16:45', route: 'Business → Airport', driver: 'Emma Davis' },
              ].map((trip, index) => (
                <div key={index} className="flex items-center justify-between border-b border-neutral-100 pb-2">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-neutral-400 mr-2" />
                    <span className="font-medium">{trip.time}</span>
                  </div>
                  <div className="text-sm text-neutral-600">{trip.route}</div>
                  <div className="text-sm text-neutral-500">{trip.driver}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <button className="btn-primary text-center">
                New Booking
              </button>
              <button className="btn-outline text-center">
                Add Driver
              </button>
              <button className="btn-outline text-center">
                Fleet Status
              </button>
              <button className="btn-outline text-center">
                Reports
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="card">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            Recent Bookings
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-3 px-4 font-semibold text-neutral-900">Booking ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-900">Customer</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-900">Route</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-900">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-900">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((booking, index) => (
                  <tr key={index} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="py-3 px-4 font-medium">{booking.id}</td>
                    <td className="py-3 px-4">{booking.customer}</td>
                    <td className="py-3 px-4">{booking.route}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-primary">{booking.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(activeTab === 'analytics' || activeTab === 'fleet') && (
        <div className="card text-center py-16">
          <TrendingUp className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-neutral-900 mb-2">
            {activeTab === 'analytics' ? 'Analytics Dashboard' : 'Fleet Management'}
          </h3>
          <p className="text-neutral-600">
            This section is under development. Coming soon!
          </p>
        </div>
      )}
    </div>
  )
}