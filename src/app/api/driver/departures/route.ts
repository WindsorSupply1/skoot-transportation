import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get today's departures for a driver
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get('driverId');

    if (!driverId) {
      return NextResponse.json(
        { error: 'Driver ID is required' },
        { status: 400 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all departures for today that this driver is assigned to
    // or that need a driver assignment
    const departures = await prisma.departure.findMany({
      where: {
        date: {
          gte: today,
          lt: tomorrow
        },
        status: {
          not: 'CANCELLED'
        }
      },
      include: {
        schedule: {
          include: {
            route: true
          }
        },
        vehicle: true,
        bookings: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        vehicleTracking: {
          where: {
            driverId: driverId
          }
        }
      },
      orderBy: {
        schedule: {
          time: 'asc'
        }
      }
    });

    // Create vehicle tracking records for departures that don't have them yet
    const departuresWithTracking = await Promise.all(
      departures.map(async (departure) => {
        let vehicleTracking = departure.vehicleTracking[0];
        
        // Create vehicle tracking record if it doesn't exist
        if (!vehicleTracking && departure.vehicleId) {
          vehicleTracking = await prisma.vehicleTracking.create({
            data: {
              vehicleId: departure.vehicleId,
              driverId: driverId,
              departureId: departure.id,
              status: 'SCHEDULED',
              passengerCount: 0
            }
          });

          // Create corresponding live departure status
          await prisma.liveDepartureStatus.upsert({
            where: { departureId: departure.id },
            update: {
              vehicleTrackingId: vehicleTracking.id
            },
            create: {
              departureId: departure.id,
              vehicleTrackingId: vehicleTracking.id,
              currentStatus: 'SCHEDULED',
              trackingUrl: `/live/${departure.id}`,
              isLiveTracked: false
            }
          });
        }

        return {
          ...departure,
          vehicleTracking: vehicleTracking ? [vehicleTracking] : []
        };
      })
    );

    return NextResponse.json({
      success: true,
      departures: departuresWithTracking.map(departure => ({
        id: departure.id,
        date: departure.date,
        capacity: departure.capacity,
        bookedSeats: departure.bookedSeats,
        status: departure.status,
        schedule: {
          time: departure.schedule.time,
          route: {
            name: departure.schedule.route.name,
            origin: departure.schedule.route.origin,
            destination: departure.schedule.route.destination
          }
        },
        vehicle: departure.vehicle ? {
          name: departure.vehicle.name,
          capacity: departure.vehicle.capacity
        } : null,
        vehicleTracking: departure.vehicleTracking[0] || null,
        bookings: departure.bookings.map(booking => ({
          id: booking.id,
          bookingNumber: booking.bookingNumber,
          passengerCount: booking.passengerCount,
          user: booking.user,
          guestFirstName: booking.guestFirstName,
          guestLastName: booking.guestLastName
        }))
      }))
    });

  } catch (error) {
    console.error('Error fetching driver departures:', error);
    return NextResponse.json(
      { error: 'Failed to fetch departures' },
      { status: 500 }
    );
  }
}