import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Public seeder without auth for debugging
export async function POST(request: NextRequest) {
  try {
    console.log('Starting public seed...');

    // Test database connection first
    const testQuery = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Database connection test:', testQuery);

    // Check if data already exists
    const existingRoutes = await prisma.route.count();
    console.log('Existing routes:', existingRoutes);

    if (existingRoutes > 0) {
      return NextResponse.json({
        success: true,
        message: 'Data already exists - skipping seed',
        data: {
          existingRoutes,
          note: 'Database already has data'
        }
      });
    }

    // Create routes
    const route1 = await prisma.route.create({
      data: {
        name: 'Columbia to Charleston',
        origin: 'Columbia, SC',
        destination: 'Charleston, SC',
        duration: 120,
        isActive: true,
      }
    });

    const route2 = await prisma.route.create({
      data: {
        name: 'Charleston to Columbia',
        origin: 'Charleston, SC',
        destination: 'Columbia, SC',
        duration: 120,
        isActive: true,
      }
    });

    console.log('Created routes:', route1.id, route2.id);

    // Create locations
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
          name: 'Charleston Airport',
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
    ]);

    console.log(`Created ${locations.length} locations`);

    // Create pricing tiers
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
    ]);

    console.log(`Created ${pricingTiers.length} pricing tiers`);

    // Create schedules for routes
    const schedules = await Promise.all([
      prisma.schedule.create({
        data: {
          routeId: route1.id,
          dayOfWeek: 1, // Monday
          time: '09:00',
          isActive: true,
        }
      }),
      prisma.schedule.create({
        data: {
          routeId: route1.id,
          dayOfWeek: 1,
          time: '15:00',
          isActive: true,
        }
      }),
      prisma.schedule.create({
        data: {
          routeId: route2.id,
          dayOfWeek: 1,
          time: '12:00',
          isActive: true,
        }
      }),
    ]);

    console.log(`Created ${schedules.length} schedules`);

    return NextResponse.json({
      success: true,
      message: 'Sample data created successfully!',
      data: {
        routes: 2,
        locations: locations.length,
        pricingTiers: pricingTiers.length,
        schedules: schedules.length,
      }
    });

  } catch (error) {
    console.error('Public seed error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create test data',
      details: error instanceof Error ? error.stack : 'Unknown error'
    }, { status: 500 });
  }
}