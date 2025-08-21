import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, LiveStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Real-time GPS tracking endpoint for driver tablets
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      vehicleTrackingId, 
      latitude, 
      longitude, 
      speed, 
      heading, 
      accuracy,
      status,
      passengerCount 
    } = body;

    if (!vehicleTrackingId || !latitude || !longitude) {
      return NextResponse.json(
        { error: 'Missing required fields: vehicleTrackingId, latitude, longitude' },
        { status: 400 }
      );
    }

    // Start a transaction to update both tracking and GPS data
    const result = await prisma.$transaction(async (tx) => {
      // Update vehicle tracking record
      const vehicleTracking = await tx.vehicleTracking.update({
        where: { id: vehicleTrackingId },
        data: {
          currentLatitude: latitude,
          currentLongitude: longitude,
          lastLocationUpdate: new Date(),
          ...(status && { status }),
          ...(passengerCount !== undefined && { passengerCount }),
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
          },
          vehicle: true,
          driver: true
        }
      });

      // Create GPS tracking breadcrumb
      const gpsRecord = await tx.gpsTracking.create({
        data: {
          vehicleTrackingId,
          latitude,
          longitude,
          speed: speed || null,
          heading: heading || null,
          accuracy: accuracy || null,
          timestamp: new Date()
        }
      });

      // Update live departure status for customers
      const liveStatus = await tx.liveDepartureStatus.upsert({
        where: { departureId: vehicleTracking.departureId },
        update: {
          lastAutomaticUpdate: new Date(),
          isLiveTracked: true,
          progressPercentage: calculateRouteProgress(vehicleTracking),
          ...(status && { currentStatus: mapVehicleStatusToLiveStatus(status) })
        },
        create: {
          departureId: vehicleTracking.departureId,
          vehicleTrackingId: vehicleTrackingId,
          currentStatus: status ? mapVehicleStatusToLiveStatus(status) : LiveStatus.SCHEDULED,
          lastAutomaticUpdate: new Date(),
          isLiveTracked: true,
          progressPercentage: 0,
          trackingUrl: `/live/${vehicleTracking.departure.id}`
        }
      });

      // Create trip event for audit trail
      await tx.tripEvent.create({
        data: {
          vehicleTrackingId,
          eventType: 'LOCATION_UPDATE',
          eventData: {
            latitude,
            longitude,
            speed,
            heading,
            accuracy,
            timestamp: new Date()
          },
          latitude,
          longitude
        }
      });

      return { vehicleTracking, gpsRecord, liveStatus };
    });

    // Send real-time updates to connected clients (WebSocket would go here)
    // For now, we'll just return the updated data
    
    return NextResponse.json({
      success: true,
      data: {
        locationUpdated: true,
        currentLocation: {
          latitude,
          longitude,
          timestamp: new Date()
        },
        vehicleStatus: result.vehicleTracking.status,
        progressPercentage: result.liveStatus.progressPercentage
      }
    });

  } catch (error) {
    console.error('Error updating GPS tracking:', error);
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    );
  }
}

// Get current tracking status for a vehicle
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vehicleTrackingId = searchParams.get('vehicleTrackingId');
    const departureId = searchParams.get('departureId');

    if (!vehicleTrackingId && !departureId) {
      return NextResponse.json(
        { error: 'Either vehicleTrackingId or departureId is required' },
        { status: 400 }
      );
    }

    let vehicleTracking;

    if (vehicleTrackingId) {
      vehicleTracking = await prisma.vehicleTracking.findUnique({
        where: { id: vehicleTrackingId },
        include: {
          departure: {
            include: {
              schedule: {
                include: {
                  route: true
                }
              }
            }
          },
          vehicle: true,
          driver: true,
          liveStatus: true,
          gpsTracking: {
            orderBy: { timestamp: 'desc' },
            take: 1
          }
        }
      });
    } else {
      vehicleTracking = await prisma.vehicleTracking.findFirst({
        where: { departureId: departureId! },
        include: {
          departure: {
            include: {
              schedule: {
                include: {
                  route: true
                }
              }
            }
          },
          vehicle: true,
          driver: true,
          liveStatus: true,
          gpsTracking: {
            orderBy: { timestamp: 'desc' },
            take: 1
          }
        }
      });
    }

    if (!vehicleTracking) {
      return NextResponse.json(
        { error: 'Vehicle tracking not found' },
        { status: 404 }
      );
    }

    const lastGPS = vehicleTracking.gpsTracking[0];

    return NextResponse.json({
      success: true,
      data: {
        vehicleTracking: {
          id: vehicleTracking.id,
          status: vehicleTracking.status,
          currentLocation: {
            latitude: vehicleTracking.currentLatitude,
            longitude: vehicleTracking.currentLongitude,
            lastUpdate: vehicleTracking.lastLocationUpdate
          },
          trip: {
            route: vehicleTracking.departure.schedule.route.name,
            scheduledTime: vehicleTracking.departure.schedule.time,
            date: vehicleTracking.departure.date,
            estimatedArrival: vehicleTracking.estimatedArrival,
            passengerCount: vehicleTracking.passengerCount
          },
          vehicle: {
            name: vehicleTracking.vehicle.name,
            capacity: vehicleTracking.vehicle.capacity
          },
          driver: vehicleTracking.driver ? {
            name: `${vehicleTracking.driver.firstName} ${vehicleTracking.driver.lastName}`,
            phone: vehicleTracking.driver.phone,
            rating: vehicleTracking.driver.rating
          } : null,
          liveStatus: vehicleTracking.liveStatus,
          lastGPS: lastGPS ? {
            latitude: lastGPS.latitude,
            longitude: lastGPS.longitude,
            speed: lastGPS.speed,
            heading: lastGPS.heading,
            timestamp: lastGPS.timestamp
          } : null
        }
      }
    });

  } catch (error) {
    console.error('Error fetching tracking data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracking data' },
      { status: 500 }
    );
  }
}

// Helper functions
function calculateRouteProgress(vehicleTracking: any): number {
  // This would calculate progress based on GPS coordinates
  // For now, return a simple calculation based on time
  if (!vehicleTracking.tripStartedAt) return 0;
  
  const now = new Date().getTime();
  const startTime = new Date(vehicleTracking.tripStartedAt).getTime();
  const estimatedDuration = 120 * 60 * 1000; // 2 hours in milliseconds
  
  const elapsed = now - startTime;
  const progress = Math.min((elapsed / estimatedDuration) * 100, 100);
  
  return Math.max(0, Math.round(progress));
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