'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const bookingSchema = z.object({
  pickupLocation: z.string().min(1, 'Pickup location is required'),
  destination: z.string().min(1, 'Destination is required'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  passengers: z.number().min(1, 'At least 1 passenger required').max(8, 'Maximum 8 passengers'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Phone number is required'),
})

type BookingFormData = z.infer<typeof bookingSchema>

export default function BookingForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
  })

  const onSubmit = async (data: BookingFormData) => {
    setIsSubmitting(true)
    try {
      // TODO: Implement booking submission
      console.log('Booking data:', data)
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      alert('Booking submitted successfully!')
      reset()
    } catch (error) {
      console.error('Booking error:', error)
      alert('Error submitting booking. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="card">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Pickup Location
            </label>
            <input
              {...register('pickupLocation')}
              className="input-field"
              placeholder="Enter pickup address"
            />
            {errors.pickupLocation && (
              <p className="mt-1 text-sm text-red-600">{errors.pickupLocation.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Destination
            </label>
            <input
              {...register('destination')}
              className="input-field"
              placeholder="Enter destination"
            />
            {errors.destination && (
              <p className="mt-1 text-sm text-red-600">{errors.destination.message}</p>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Date
            </label>
            <input
              type="date"
              {...register('date')}
              className="input-field"
            />
            {errors.date && (
              <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Time
            </label>
            <input
              type="time"
              {...register('time')}
              className="input-field"
            />
            {errors.time && (
              <p className="mt-1 text-sm text-red-600">{errors.time.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Passengers
            </label>
            <select
              {...register('passengers', { valueAsNumber: true })}
              className="input-field"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                <option key={num} value={num}>{num} passenger{num > 1 ? 's' : ''}</option>
              ))}
            </select>
            {errors.passengers && (
              <p className="mt-1 text-sm text-red-600">{errors.passengers.message}</p>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Full Name
            </label>
            <input
              {...register('name')}
              className="input-field"
              placeholder="Your full name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Email
            </label>
            <input
              type="email"
              {...register('email')}
              className="input-field"
              placeholder="your@email.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              {...register('phone')}
              className="input-field"
              placeholder="(555) 123-4567"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Book Transportation'}
        </button>
      </form>
    </div>
  )
}