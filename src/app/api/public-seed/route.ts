import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Public seeder without auth for debugging
export async function POST(request: NextRequest) {
  try {
    console.log('Starting public seed...');

    // Create a simple route first to test database connection
    const route = await prisma.route.create({
      data: {
        name: 'Test Route',
        origin: 'Columbia, SC',
        destination: 'Charleston, SC',
        duration: 120,
        price: 35,
        isActive: true,
      }
    });

    console.log('Created test route:', route.id);

    // Create a simple location
    const location = await prisma.location.create({
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
    });

    console.log('Created test location:', location.id);

    return NextResponse.json({
      success: true,
      message: 'Basic test data created successfully!',
      data: {
        routeId: route.id,
        locationId: location.id,
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