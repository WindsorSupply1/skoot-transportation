import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const BookingSchema = z.object({
  departureId: z.string(),
  returnDepartureId: z.string().optional(),
  pickupLocationId: z.string(),
  passengerCount: z.number().min(1).max(15),
  customerType: z.enum(['REGULAR', 'STUDENT', 'MILITARY', 'LEGACY']),
  contactInfo: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(10),
  }),
  passengers: z.array(z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    dateOfBirth: z.string().optional(),
  })),
  extraLuggage: z.number().min(0).max(10),
  pets: z.number().min(0).max(5),
  specialRequests: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = BookingSchema.parse(body);

    // Check departure availability
    const departure = await prisma.departure.findUnique({
      where: { id: validatedData.departureId },
      include: {
        schedule: { include: { route: true } },
        _count: { select: { passengers: true } }
      }
    });

    if (!departure) {
      return NextResponse.json({ error: 'Departure not found' }, { status: 404 });
    }

    const availableSeats = departure.capacity - departure._count.passengers;
    if (availableSeats < validatedData.passengerCount) {
      return NextResponse.json({ 
        error: 'Not enough seats available',
        availableSeats 
      }, { status: 400 });
    }

    // Calculate pricing
    const basePrices = {
      LEGACY: 31,
      STUDENT: 32,
      MILITARY: 32,
      REGULAR: 35
    };

    const basePrice = basePrices[validatedData.customerType];
    const passengerCost = basePrice * validatedData.passengerCount;
    const luggageCost = validatedData.extraLuggage * 5;
    const petCost = validatedData.pets * 10;
    const subtotal = passengerCost + luggageCost + petCost;

    // Round trip discount (10% off total)
    const isRoundTrip = !!validatedData.returnDepartureId;
    const discount = isRoundTrip ? Math.round(subtotal * 0.1) : 0;
    const total = isRoundTrip ? (subtotal * 2) - discount : subtotal;

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        departureId: validatedData.departureId,
        returnDepartureId: validatedData.returnDepartureId,
        pickupLocationId: validatedData.pickupLocationId,
        userId: null, // Guest booking
        passengerCount: validatedData.passengerCount,
        totalAmount: total,
        status: 'PENDING',
        status: 'PENDING',
        customerType: validatedData.customerType,
        contactEmail: validatedData.contactInfo.email,
        contactPhone: validatedData.contactInfo.phone,
        extraLuggage: validatedData.extraLuggage,
        pets: validatedData.pets,
        specialRequests: validatedData.specialRequests,
        passengers: {
          create: validatedData.passengers.map((passenger, index) => ({
            firstName: passenger.firstName,
            lastName: passenger.lastName,
            dateOfBirth: passenger.dateOfBirth ? new Date(passenger.dateOfBirth) : null,
            seatNumber: null,
            checkInStatus: 'NOT_CHECKED_IN',
          }))
        }
      },
      include: {
        departure: {
          include: {
            schedule: { include: { route: true } },
            pickupLocation: true
          }
        },
        returnDeparture: {
          include: {
            schedule: { include: { route: true } },
            pickupLocation: true
          }
        },
        passengers: true,
      }
    });

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        confirmationCode: booking.confirmationCode,
        totalAmount: booking.totalAmount,
        departure: {
          date: booking.departure.date,
          departureTime: booking.departure.schedule.departureTime,
          pickupLocation: booking.departure.pickupLocation?.name,
        },
        returnDeparture: booking.returnDeparture ? {
          date: booking.returnDeparture.date,
          departureTime: booking.returnDeparture.schedule.departureTime,
          pickupLocation: booking.returnDeparture.pickupLocation?.name,
        } : null,
        passengers: booking.passengers,
        paymentRequired: booking.totalAmount,
      }
    });

  } catch (error) {
    console.error('Booking creation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error',
        details: error.errors 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const confirmationCode = searchParams.get('confirmationCode');
    const email = searchParams.get('email');

    if (!confirmationCode || !email) {
      return NextResponse.json({ 
        error: 'Confirmation code and email required' 
      }, { status: 400 });
    }

    const booking = await prisma.booking.findFirst({
      where: {
        confirmationCode,
        contactEmail: email,
      },
      include: {
        departure: {
          include: {
            schedule: { include: { route: true } },
            pickupLocation: true
          }
        },
        returnDeparture: {
          include: {
            schedule: { include: { route: true } },
            pickupLocation: true
          }
        },
        passengers: true,
        payment: true,
      }
    });

    if (!booking) {
      return NextResponse.json({ 
        error: 'Booking not found' 
      }, { status: 404 });
    }

    return NextResponse.json({ booking });

  } catch (error) {
    console.error('Booking lookup error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}