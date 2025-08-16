import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Public endpoint to get active pickup and dropoff locations for booking forms
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'pickup', 'dropoff', or 'all'
    const includeInactive = searchParams.get('includeInactive') === 'true';

    let whereClause: any = {
      ...(includeInactive ? {} : { isActive: true }),
    };

    // Filter by type
    if (type === 'pickup') {
      whereClause.isPickup = true;
    } else if (type === 'dropoff' || type === 'destination') {
      whereClause.isDropoff = true;
    } else if (type === 'all') {
      whereClause.OR = [
        { isPickup: true },
        { isDropoff: true }
      ];
    } else {
      // Default to pickup locations for backwards compatibility
      whereClause.isPickup = true;
    }

    const locations = await prisma.location.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        latitude: true,
        longitude: true,
        isPickup: true,
        isDropoff: true,
        instructions: true,
        operatingHours: true,
        maxCapacity: true,
        sortOrder: true,
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ]
    });

    // Check availability based on current day/time
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    const locationsWithAvailability = locations.map(location => {
      let isCurrentlyAvailable = true;
      
      if (location.operatingHours && typeof location.operatingHours === 'object') {
        const todaySchedule = (location.operatingHours as any)[currentDay];
        if (todaySchedule && !todaySchedule.enabled) {
          isCurrentlyAvailable = false;
        } else if (todaySchedule && todaySchedule.enabled) {
          const openTime = todaySchedule.open || '00:00';
          const closeTime = todaySchedule.close || '23:59';
          
          if (currentTime < openTime || currentTime > closeTime) {
            isCurrentlyAvailable = false;
          }
        }
      }

      return {
        ...location,
        fullAddress: `${location.address}, ${location.city}, ${location.state} ${location.zipCode}`,
        isCurrentlyAvailable,
        types: [
          ...(location.isPickup ? ['pickup'] : []),
          ...(location.isDropoff ? ['dropoff'] : [])
        ]
      };
    });

    return NextResponse.json({ 
      locations: locationsWithAvailability,
      meta: {
        total: locationsWithAvailability.length,
        available: locationsWithAvailability.filter(l => l.isCurrentlyAvailable).length,
        pickupCount: locationsWithAvailability.filter(l => l.isPickup).length,
        dropoffCount: locationsWithAvailability.filter(l => l.isDropoff).length,
      }
    });

  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
  }
}