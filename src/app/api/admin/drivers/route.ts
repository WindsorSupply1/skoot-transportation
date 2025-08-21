import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAuth } from '@/lib/auth';

const prisma = new PrismaClient();

// Get all drivers
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const includeStats = searchParams.get('includeStats') === 'true';

      const drivers = await prisma.driver.findMany({
        include: {
          vehicleTracking: includeStats ? {
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
            },
            where: {
              status: {
                in: ['BOARDING', 'EN_ROUTE', 'ARRIVED']
              }
            }
          } : false,
          _count: includeStats ? {
            select: {
              vehicleTracking: true
            }
          } : false
        },
        orderBy: [
          { isActive: 'desc' },
          { firstName: 'asc' },
          { lastName: 'asc' }
        ]
      });

      // Calculate additional stats if requested
      const driversWithStats = await Promise.all(
        drivers.map(async (driver) => {
          let totalTrips = 0;
          let rating = null;

          if (includeStats) {
            // Get total completed trips
            const completedTrips = await prisma.vehicleTracking.count({
              where: {
                driverId: driver.id,
                status: 'COMPLETED'
              }
            });
            totalTrips = completedTrips;

            // Calculate average rating (would need a ratings table in a real system)
            // For now, generate a mock rating based on trip count
            if (totalTrips > 0) {
              rating = Math.min(5.0, 4.0 + (Math.random() * 1.0));
            }
          }

          return {
            ...driver,
            totalTrips,
            rating
          };
        })
      );

      return NextResponse.json({
        success: true,
        drivers: driversWithStats
      });

    } catch (error) {
      console.error('Error fetching drivers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch drivers' },
        { status: 500 }
      );
    }
  }, true); // Require admin access
}

// Create new driver
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { firstName, lastName, email, phone, licenseNumber, pin, isActive } = await req.json();

      if (!firstName || !lastName || !licenseNumber || !pin) {
        return NextResponse.json(
          { error: 'First name, last name, license number, and PIN are required' },
          { status: 400 }
        );
      }

      // Validate PIN format
      if (!/^\d{4}$/.test(pin)) {
        return NextResponse.json(
          { error: 'PIN must be exactly 4 digits' },
          { status: 400 }
        );
      }

      // Check if PIN is already in use
      const existingPin = await prisma.driver.findFirst({
        where: { pinCode: pin }
      });

      if (existingPin) {
        return NextResponse.json(
          { error: 'PIN is already in use' },
          { status: 400 }
        );
      }

      // Check if license number is already in use
      const existingLicense = await prisma.driver.findFirst({
        where: { licenseNumber }
      });

      if (existingLicense) {
        return NextResponse.json(
          { error: 'License number is already in use' },
          { status: 400 }
        );
      }

      const driver = await prisma.driver.create({
        data: {
          firstName,
          lastName,
          email: email && email.trim() ? email.trim() : null,
          phone: phone && phone.trim() ? phone.trim() : null,
          licenseNumber,
          pinCode: pin,
          isActive: isActive ?? true
        }
      });

      return NextResponse.json({
        success: true,
        driver
      });

    } catch (error) {
      console.error('Error creating driver:', error);
      return NextResponse.json(
        { error: 'Failed to create driver' },
        { status: 500 }
      );
    }
  }, true); // Require admin access
}