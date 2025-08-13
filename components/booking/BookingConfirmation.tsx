'use client'

import { CheckCircle, Calendar, MapPin, Users, Clock } from 'lucide-react'
import Link from 'next/link'

export default function BookingConfirmation() {
  // TODO: Get booking details from URL params or state
  const bookingDetails = {
    id: 'SKT-12345',
    pickupLocation: 'Downtown Hotel',
    destination: 'Airport Terminal 1',
    date: '2024-01-15',
    time: '14:30',
    passengers: 2,
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    totalAmount: '$45.00',
  }

  return (
    <div className="card">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary rounded-full mb-6">
          <CheckCircle className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">
          Booking Confirmed!
        </h1>
        <p className="text-neutral-600">
          Your transportation has been successfully booked.
        </p>
      </div>

      <div className="bg-neutral-50 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">
          Booking Details
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-neutral-600">Booking ID:</span>
            <span className="font-semibold">{bookingDetails.id}</span>
          </div>
          
          <div className="flex items-start">
            <MapPin className="h-5 w-5 text-primary mr-3 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm text-neutral-600">From</div>
              <div className="font-medium">{bookingDetails.pickupLocation}</div>
            </div>
          </div>
          
          <div className="flex items-start">
            <MapPin className="h-5 w-5 text-secondary mr-3 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm text-neutral-600">To</div>
              <div className="font-medium">{bookingDetails.destination}</div>
            </div>
          </div>
          
          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-primary mr-3" />
            <div>
              <div className="text-sm text-neutral-600">Date & Time</div>
              <div className="font-medium">{bookingDetails.date} at {bookingDetails.time}</div>
            </div>
          </div>
          
          <div className="flex items-center">
            <Users className="h-5 w-5 text-primary mr-3" />
            <div>
              <div className="text-sm text-neutral-600">Passengers</div>
              <div className="font-medium">{bookingDetails.passengers} passenger{bookingDetails.passengers > 1 ? 's' : ''}</div>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">Total Amount:</span>
              <span className="text-lg font-bold text-primary">{bookingDetails.totalAmount}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">
          What's Next?
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• You'll receive a confirmation email shortly</li>
          <li>• Your driver will contact you 30 minutes before pickup</li>
          <li>• Please be ready at the pickup location 5 minutes early</li>
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/" className="btn-primary flex-1 text-center">
          Book Another Trip
        </Link>
        <Link href="/contact" className="btn-outline flex-1 text-center">
          Contact Support
        </Link>
      </div>
    </div>
  )
}