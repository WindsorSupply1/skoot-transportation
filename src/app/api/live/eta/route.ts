import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { etaService, COMMON_LOCATIONS } from '@/lib/eta';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

// Calculate real-time ETA for a departure
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const departureId = searchParams.get('departureId');

    if (!departureId) {
      return NextResponse.json(
        { error: 'departureId is required' },
        { status: 400 }
      );
    }

    // Get departure and vehicle tracking info
    const departure = await prisma.departure.findUnique({
      where: { id: departureId },
      include: {
        schedule: {
          include: {
            route: true
          }
        },
        vehicleTracking: {
          orderBy: { updatedAt: 'desc' },
          take: 1
        },
        liveStatus: true,
        bookings: {
          include: {
            pickupLocation: true,
            dropoffLocation: true
          }
        }
      }
    });

    if (!departure) {
      return NextResponse.json(
        { error: 'Departure not found' },
        { status: 404 }
      );
    }

    const route = departure.schedule.route;
    const vehicleTracking = departure.vehicleTracking[0];
    const liveStatus = departure.liveStatus;

    // Determine current location
    let currentLocation = {
      lat: 0,
      lng: 0,
      name: route.origin
    };

    // Use actual GPS location if available
    if (vehicleTracking?.currentLatitude && vehicleTracking?.currentLongitude) {
      currentLocation = {
        lat: vehicleTracking.currentLatitude,
        lng: vehicleTracking.currentLongitude,
        name: 'Current Position'
      };
    } else {
      // Fall back to route origin coordinates
      const originLocation = getRouteLocation(route.origin);
      if (originLocation) {
        currentLocation = originLocation;
      }
    }

    // Determine destination
    const destinationLocation = getRouteLocation(route.destination);
    if (!destinationLocation) {
      return NextResponse.json(
        { error: 'Destination location not found' },
        { status: 500 }
      );
    }

    // Get remaining pickup stops
    const pickupStops = departure.bookings
      .filter(booking => {
        // Only include stops that haven't been reached yet
        // This would require more sophisticated tracking in a real system
        return booking.pickupLocation && vehicleTracking?.status === 'BOARDING';
      })
      .map(booking => ({
        lat: parseFloat(String(booking.pickupLocation?.latitude || '0')),
        lng: parseFloat(String(booking.pickupLocation?.longitude || '0')),
        name: booking.pickupLocation?.name || 'Pickup Stop'
      }))
      .filter(stop => stop.lat !== 0 && stop.lng !== 0);

    // Calculate ETA
    const departureTime = vehicleTracking?.tripStartedAt || departure.date;
    const eta = etaService.calculateETA(
      currentLocation,
      destinationLocation,
      pickupStops,
      new Date(departureTime)
    );

    // Update ETA with progress if available
    let finalETA = eta;
    if (liveStatus?.progressPercentage && liveStatus.progressPercentage > 0) {
      finalETA = etaService.updateETAWithProgress(
        eta,
        currentLocation,
        destinationLocation,
        liveStatus.progressPercentage
      );
    }

    // Calculate additional metrics
    const progress = liveStatus?.progressPercentage || 0;
    const isDelayed = vehicleTracking?.status === 'DELAYED' || (liveStatus?.delayMinutes ?? 0) > 0;
    const delayMinutes = liveStatus?.delayMinutes || 0;

    // Format response
    const response = {
      departureId,
      route: {
        name: route.name,
        origin: route.origin,
        destination: route.destination
      },
      currentLocation: {
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        name: currentLocation.name
      },
      destination: destinationLocation,
      eta: {
        estimatedArrival: finalETA.estimatedArrival.toISOString(),
        arrivalTime: etaService.formatArrivalTime(finalETA),
        timeRemaining: etaService.formatETA(finalETA),
        totalMinutes: finalETA.totalMinutes,
        confidence: finalETA.confidence,
        lastUpdated: finalETA.lastUpdated.toISOString()
      },
      progress: {
        percentage: progress,
        distanceRemaining: finalETA.distanceKm,
        totalDistance: eta.distanceKm + finalETA.distanceKm
      },
      status: {
        current: vehicleTracking?.status || 'SCHEDULED',
        isDelayed,
        delayMinutes,
        message: liveStatus?.statusMessage || 'Trip in progress'
      },
      traffic: {
        delayMinutes: finalETA.trafficDelay,
        multiplier: etaService.getTrafficMultiplier(new Date())
      }
    };

    return NextResponse.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error calculating ETA:', error);
    return NextResponse.json(
      { error: 'Failed to calculate ETA' },
      { status: 500 }
    );
  }
}

// Helper function to get coordinates for route locations
function getRouteLocation(locationName: string) {
  // Map common route names to coordinates
  const locationMap: { [key: string]: { lat: number; lng: number; name: string } } = {
    'Columbia': COMMON_LOCATIONS.COLUMBIA_DOWNTOWN,
    'Columbia Downtown': COMMON_LOCATIONS.COLUMBIA_DOWNTOWN,
    'USC Campus': COMMON_LOCATIONS.USC_CAMPUS,
    'Columbia Airport': COMMON_LOCATIONS.COLUMBIA_AIRPORT,
    'Charleston': COMMON_LOCATIONS.CHARLESTON_DOWNTOWN,
    'Charleston Downtown': COMMON_LOCATIONS.CHARLESTON_DOWNTOWN,
    'Charleston Airport': COMMON_LOCATIONS.CHARLESTON_AIRPORT,
    'Folly Beach': COMMON_LOCATIONS.FOLLY_BEACH
  };

  // Try exact match first
  if (locationMap[locationName]) {
    return locationMap[locationName];
  }

  // Try partial match
  const partialMatch = Object.keys(locationMap).find(key => 
    key.toLowerCase().includes(locationName.toLowerCase()) ||
    locationName.toLowerCase().includes(key.toLowerCase())
  );

  if (partialMatch) {
    return locationMap[partialMatch];
  }

  return null;
}

// Bulk ETA calculation for multiple departures
export async function POST(request: NextRequest) {
  try {
    const { departureIds } = await request.json();

    if (!departureIds || !Array.isArray(departureIds)) {
      return NextResponse.json(
        { error: 'departureIds array is required' },
        { status: 400 }
      );
    }

    // Calculate ETAs for all requested departures
    const etaPromises = departureIds.map(async (departureId: string) => {
      try {
        const etaResponse = await fetch(`${request.url}?departureId=${departureId}`);
        if (etaResponse.ok) {
          const etaData = await etaResponse.json();
          return { departureId, ...etaData.data };
        } else {
          return { departureId, error: 'Failed to calculate ETA' };
        }
      } catch (error) {
        return { departureId, error: 'ETA calculation failed' };
      }
    });

    const results = await Promise.all(etaPromises);

    return NextResponse.json({
      success: true,
      data: {
        etas: results,
        calculatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in bulk ETA calculation:', error);
    return NextResponse.json(
      { error: 'Failed to calculate bulk ETAs' },
      { status: 500 }
    );
  }
}