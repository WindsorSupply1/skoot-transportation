import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting data seed...');

    // Clear existing data (optional - comment out if you want to keep existing)
    // await prisma.departure.deleteMany({});
    // await prisma.schedule.deleteMany({});
    // await prisma.route.deleteMany({});
    // await prisma.location.deleteMany({});

    // Create Locations
    const locations = await Promise.all([
      prisma.location.create({
        data: {
          name: 'Columbia Downtown',
          address: '1200 Main St',
          city: 'Columbia',
          state: 'SC',
          zipCode: '29201',
          isPickup: true,
          isDropoff: true,
          isActive: true,
          sortOrder: 1,
        }
      }),
      prisma.location.create({
        data: {
          name: 'USC Campus',
          address: '918 Assembly St',
          city: 'Columbia',
          state: 'SC',
          zipCode: '29208',
          isPickup: true,
          isDropoff: true,
          isActive: true,
          sortOrder: 2,
        }
      }),
      prisma.location.create({
        data: {
          name: 'Charleston Airport (CHS)',
          address: '5500 International Blvd',
          city: 'Charleston',
          state: 'SC',
          zipCode: '29418',
          isPickup: true,
          isDropoff: true,
          isActive: true,
          sortOrder: 3,
        }
      }),
      prisma.location.create({
        data: {
          name: 'Charleston Downtown',
          address: '375 Meeting St',
          city: 'Charleston',
          state: 'SC',
          zipCode: '29403',
          isPickup: true,
          isDropoff: true,
          isActive: true,
          sortOrder: 4,
        }
      }),
    ]);

    console.log(`Created ${locations.length} locations`);

    // Create Routes
    const routes = await Promise.all([
      prisma.route.create({
        data: {
          name: 'Columbia to Charleston',
          origin: 'Columbia, SC',
          destination: 'Charleston, SC',
          duration: 120, // 2 hours in minutes
          isActive: true,
        }
      }),
      prisma.route.create({
        data: {
          name: 'Charleston to Columbia',
          origin: 'Charleston, SC',
          destination: 'Columbia, SC',
          duration: 120,
          isActive: true,
        }
      }),
    ]);

    console.log(`Created ${routes.length} routes`);

    // Create Schedules (departure times)
    const times = ['06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];
    const schedules = [];

    for (const route of routes) {
      for (const time of times) {
        const schedule = await prisma.schedule.create({
          data: {
            routeId: route.id,
            time: time,
            dayOfWeek: 1, // Monday
            capacity: 20,
            isActive: true,
          }
        });
        schedules.push(schedule);
      }
    }

    console.log(`Created ${schedules.length} schedules`);

    // Create Departures for the next 30 days
    const departures = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const date = new Date(today);
      date.setDate(date.getDate() + dayOffset);

      for (const schedule of schedules) {
        const departure = await prisma.departure.create({
          data: {
            scheduleId: schedule.id,
            date: date,
            capacity: schedule.capacity,
            bookedSeats: 0,
            availableSeats: schedule.capacity,
            status: 'SCHEDULED',
          }
        });
        departures.push(departure);
      }
    }

    console.log(`Created ${departures.length} departures`);

    // Create Pricing Tiers
    const pricingTiers = await Promise.all([
      prisma.pricingTier.create({
        data: {
          name: 'Regular Adult',
          customerType: 'REGULAR',
          basePrice: 35,
          isActive: true,
        }
      }),
      prisma.pricingTier.create({
        data: {
          name: 'Student',
          customerType: 'STUDENT',
          basePrice: 30,
          isActive: true,
        }
      }),
      prisma.pricingTier.create({
        data: {
          name: 'Senior',
          customerType: 'SENIOR',
          basePrice: 32,
          isActive: true,
        }
      }),
      prisma.pricingTier.create({
        data: {
          name: 'Military',
          customerType: 'MILITARY',
          basePrice: 32,
          isActive: true,
        }
      }),
    ]);

    console.log(`Created ${pricingTiers.length} pricing tiers`);

    return NextResponse.json({
      success: true,
      message: 'Data seeded successfully!',
      data: {
        locations: locations.length,
        routes: routes.length,
        schedules: schedules.length,
        departures: departures.length,
        pricingTiers: pricingTiers.length,
      }
    });

  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to seed data'
    }, { status: 500 });
  }
}