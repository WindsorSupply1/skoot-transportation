import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, DepartureStatus, LiveStatus } from '@prisma/client';
import { sendTripStatusSMS } from '@/lib/sms';

const prisma = new PrismaClient();

// Update trip status from driver tablet
export async function POST(request: NextRequest) {
  try {
    const { 
      departureId, 
      status, 
      passengerCount, 
      driverId, 
      location,
      delayReason,
      notes 
    } = await request.json();

    if (!departureId || !status || !driverId) {
      return NextResponse.json(
        { error: 'Missing required fields: departureId, status, driverId' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Find or create vehicle tracking record
      let vehicleTracking = await tx.vehicleTracking.findFirst({
        where: {
          departureId: departureId,
          driverId: driverId
        },
        include: {
          departure: {
            include: {
              schedule: {
                include: {
                  route: true
                }
              }
            }
          }
        }
      });

      if (!vehicleTracking) {
        // Find the departure to get vehicle info
        const departure = await tx.departure.findUnique({
          where: { id: departureId },
          include: {
            vehicle: true,
            schedule: {
              include: {
                route: true
              }
            }
          }
        });

        if (!departure || !departure.vehicleId) {
          throw new Error('Departure or vehicle not found');
        }

        // Create vehicle tracking record
        vehicleTracking = await tx.vehicleTracking.create({
          data: {
            vehicleId: departure.vehicleId,
            driverId: driverId,
            departureId: departureId,
            status: status as any,
            passengerCount: passengerCount || 0,
            ...(location && {
              currentLatitude: location.lat,
              currentLongitude: location.lng,
              lastLocationUpdate: new Date()
            }),
            ...(status === 'BOARDING' && { tripStartedAt: new Date() }),
            ...(status === 'COMPLETED' && { 
              tripCompletedAt: new Date(),
              actualArrival: new Date()
            })
          },
          include: {
            departure: {
              include: {
                schedule: {
                  include: {
                    route: true
                  }
                }
              }
            }
          }
        });
      } else {
        // Update existing tracking record
        vehicleTracking = await tx.vehicleTracking.update({
          where: { id: vehicleTracking.id },
          data: {
            status: status as any,
            ...(passengerCount !== undefined && { passengerCount }),
            ...(location && {
              currentLatitude: location.lat,
              currentLongitude: location.lng,
              lastLocationUpdate: new Date()
            }),
            ...(status === 'BOARDING' && !vehicleTracking.tripStartedAt && { 
              tripStartedAt: new Date() 
            }),
            ...(status === 'COMPLETED' && { 
              tripCompletedAt: new Date(),
              actualArrival: new Date()
            }),
            updatedAt: new Date()
          },
          include: {
            departure: {
              include: {
                schedule: {
                  include: {
                    route: true
                  }
                }
              }
            }
          }
        });
      }

      // Update departure status
      await tx.departure.update({
        where: { id: departureId },
        data: {
          status: mapVehicleStatusToDepartureStatus(status),
          ...(passengerCount !== undefined && { bookedSeats: passengerCount })
        }
      });

      // Update live departure status for customers
      const liveStatus = await tx.liveDepartureStatus.upsert({
        where: { departureId: departureId },
        update: {
          vehicleTrackingId: vehicleTracking.id,
          currentStatus: mapVehicleStatusToLiveStatus(status),
          lastUpdateByDriver: new Date(),
          isLiveTracked: true,
          ...(status === 'BOARDING' && { 
            actualDeparture: new Date(),
            statusMessage: `Boarding passengers at ${vehicleTracking.departure.schedule.route.origin}`
          }),
          ...(status === 'EN_ROUTE' && { 
            actualDeparture: new Date(),
            statusMessage: `En route to ${vehicleTracking.departure.schedule.route.destination}`
          }),
          ...(status === 'ARRIVED' && { 
            statusMessage: `Arrived at ${vehicleTracking.departure.schedule.route.destination}`
          }),
          ...(status === 'COMPLETED' && { 
            statusMessage: 'Trip completed',
            progressPercentage: 100
          }),
          ...(status === 'DELAYED' && {
            delayMinutes: 15, // Default delay
            statusMessage: delayReason || 'Experiencing delays'
          })
        },
        create: {
          departureId: departureId,
          vehicleTrackingId: vehicleTracking.id,
          currentStatus: mapVehicleStatusToLiveStatus(status),
          lastUpdateByDriver: new Date(),
          isLiveTracked: true,
          trackingUrl: `/live/${departureId}`,
          statusMessage: getStatusMessage(status, vehicleTracking.departure.schedule.route)
        }
      });

      // Create trip event for audit trail
      await tx.tripEvent.create({
        data: {
          vehicleTrackingId: vehicleTracking.id,
          eventType: getEventType(status),
          eventData: {
            status,
            passengerCount,
            location,
            delayReason,
            notes,
            timestamp: new Date()
          },
          ...(location && {
            latitude: location.lat,
            longitude: location.lng
          }),
          createdByDriverId: driverId
        }
      });

      // Store bookings for post-transaction SMS sending
      let bookingsToNotify: any[] = [];
      
      // Send customer notifications for important status changes
      if (['BOARDING', 'EN_ROUTE', 'DELAYED', 'ARRIVED'].includes(status)) {
        // Find all bookings for this departure
        const bookings = await tx.booking.findMany({
          where: { departureId: departureId },
          include: {
            user: true
          }
        });

        bookingsToNotify = bookings;

        // Create notification records
        for (const booking of bookings) {
          const message = generateCustomerMessage(status, vehicleTracking.departure.schedule.route, liveStatus);
          
          // SMS notification
          if (booking.user?.phone || booking.guestPhone) {
            await tx.customerNotification.create({
              data: {
                bookingId: booking.id,
                departureId: departureId,
                notificationType: 'SMS',
                recipientPhone: booking.user?.phone || booking.guestPhone,
                message,
                trackingUrl: liveStatus.trackingUrl || undefined,
                status: 'PENDING'
              }
            });
          }

          // Email notification for major updates
          if (['DELAYED', 'ARRIVED'].includes(status) && (booking.user?.email || booking.guestEmail)) {
            await tx.customerNotification.create({
              data: {
                bookingId: booking.id,
                departureId: departureId,
                notificationType: 'EMAIL',
                recipientEmail: booking.user?.email || booking.guestEmail,
                subject: `SKOOT Trip Update - ${vehicleTracking.departure.schedule.route.name}`,
                message,
                trackingUrl: liveStatus.trackingUrl || undefined,
                status: 'PENDING'
              }
            });
          }
        }
      }

      return { vehicleTracking, liveStatus, bookingsToNotify };
    });

    // Send SMS notifications after successful database transaction
    if (result.bookingsToNotify.length > 0 && ['BOARDING', 'EN_ROUTE', 'DELAYED', 'ARRIVED'].includes(status)) {
      const tripData = {
        route: result.vehicleTracking.departure.schedule.route,
        destination: result.vehicleTracking.departure.schedule.route.destination,
        driverName: 'Your SKOOT Driver', // Could get from driver table
        driverPhone: '(555) 123-4567' // Could get from driver table
      };

      // Send SMS notifications asynchronously (don't block response)
      Promise.all(
        result.bookingsToNotify.map(async (booking) => {
          const phoneNumber = booking.user?.phone || booking.guestPhone;
          if (phoneNumber) {
            try {
              const smsResult = await sendTripStatusSMS(
                phoneNumber,
                status,
                tripData,
                result.liveStatus.trackingUrl || undefined
              );

              // Update notification status in database
              if (smsResult.success) {
                await prisma.customerNotification.updateMany({
                  where: {
                    bookingId: booking.id,
                    departureId: departureId,
                    notificationType: 'SMS',
                    status: 'PENDING'
                  },
                  data: {
                    status: 'SENT',
                    sentAt: new Date()
                  }
                });
              } else {
                await prisma.customerNotification.updateMany({
                  where: {
                    bookingId: booking.id,
                    departureId: departureId,
                    notificationType: 'SMS',
                    status: 'PENDING'
                  },
                  data: {
                    status: 'FAILED'
                  }
                });
              }
            } catch (error) {
              console.error('SMS sending error for booking:', booking.id, error);
            }
          }
        })
      ).catch(error => {
        console.error('Error in SMS batch sending:', error);
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        status: result.vehicleTracking.status,
        passengerCount: result.vehicleTracking.passengerCount,
        trackingUrl: result.liveStatus.trackingUrl,
        lastUpdate: new Date(),
        notificationsSent: result.bookingsToNotify.length
      }
    });

  } catch (error) {
    console.error('Error updating trip status:', error);
    return NextResponse.json(
      { error: 'Failed to update trip status' },
      { status: 500 }
    );
  }
}

// Helper functions
function mapVehicleStatusToDepartureStatus(vehicleStatus: string): DepartureStatus {
  const statusMap: { [key: string]: DepartureStatus } = {
    'SCHEDULED': DepartureStatus.SCHEDULED,
    'BOARDING': DepartureStatus.BOARDING,
    'EN_ROUTE': DepartureStatus.IN_TRANSIT,
    'ARRIVED': DepartureStatus.IN_TRANSIT,
    'COMPLETED': DepartureStatus.COMPLETED,
    'DELAYED': DepartureStatus.DELAYED,
    'EMERGENCY': DepartureStatus.DELAYED
  };
  
  return statusMap[vehicleStatus] || DepartureStatus.SCHEDULED;
}

function mapVehicleStatusToLiveStatus(vehicleStatus: string): LiveStatus {
  const statusMap: { [key: string]: LiveStatus } = {
    'SCHEDULED': LiveStatus.SCHEDULED,
    'BOARDING': LiveStatus.BOARDING,
    'EN_ROUTE': LiveStatus.EN_ROUTE,
    'ARRIVED': LiveStatus.ARRIVED,
    'COMPLETED': LiveStatus.COMPLETED,
    'DELAYED': LiveStatus.DELAYED,
    'EMERGENCY': LiveStatus.DELAYED
  };
  
  return statusMap[vehicleStatus] || LiveStatus.SCHEDULED;
}

function getEventType(status: string): string {
  const eventMap: { [key: string]: string } = {
    'BOARDING': 'STATUS_CHANGE',
    'EN_ROUTE': 'TRIP_STARTED',
    'ARRIVED': 'STATUS_CHANGE',
    'COMPLETED': 'TRIP_COMPLETED',
    'DELAYED': 'DELAY_REPORTED',
    'EMERGENCY': 'EMERGENCY'
  };
  
  return eventMap[status] || 'STATUS_CHANGE';
}

function getStatusMessage(status: string, route: any): string {
  const messages: { [key: string]: string } = {
    'SCHEDULED': `Scheduled departure from ${route.origin}`,
    'BOARDING': `Boarding passengers at ${route.origin}`,
    'EN_ROUTE': `En route to ${route.destination}`,
    'ARRIVED': `Arrived at ${route.destination}`,
    'COMPLETED': 'Trip completed',
    'DELAYED': 'Experiencing delays',
    'EMERGENCY': 'Emergency - please contact support'
  };
  
  return messages[status] || 'Status update';
}

function generateCustomerMessage(status: string, route: any, liveStatus: any): string {
  const messages: { [key: string]: string } = {
    'BOARDING': `🚌 Your SKOOT van is now boarding at ${route.origin}. Track live: skoot.bike${liveStatus.trackingUrl}`,
    'EN_ROUTE': `🛣️ Your SKOOT van has departed ${route.origin} and is en route to ${route.destination}. Track live: skoot.bike${liveStatus.trackingUrl}`,
    'DELAYED': `⚠️ Your SKOOT van is experiencing delays. We'll keep you updated. Track live: skoot.bike${liveStatus.trackingUrl}`,
    'ARRIVED': `✅ Your SKOOT van has arrived at ${route.destination}! Look for your driver at the pickup zone.`
  };
  
  return messages[status] || `Trip update: ${status}`;
}