import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAuth } from '@/lib/auth';

const prisma = new PrismaClient();

// Get specific driver
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const driver = await prisma.driver.findUnique({
        where: { id: params.id },
        include: {
          vehicleTracking: {
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
            orderBy: { updatedAt: 'desc' },
            take: 10 // Last 10 trips
          }
        }
      });

      if (!driver) {
        return NextResponse.json(
          { error: 'Driver not found' },
          { status: 404 }
        );
      }

      // Calculate additional stats
      const totalTrips = await prisma.vehicleTracking.count({
        where: {
          driverId: driver.id,
          status: 'COMPLETED'
        }
      });

      // Generate mock rating based on trip count (in a real system, this would come from a ratings table)
      const rating = totalTrips > 0 ? Math.min(5.0, 4.0 + (Math.random() * 1.0)) : null;

      const driverWithStats = {
        ...driver,
        totalTrips,
        rating
      };

      return NextResponse.json({
        success: true,
        driver: driverWithStats
      });

    } catch (error) {
      console.error('Error fetching driver:', error);
      return NextResponse.json(
        { error: 'Failed to fetch driver' },
        { status: 500 }
      );
    }
  }, true); // Require admin access
}

// Update driver
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

      // Check if driver exists
      const existingDriver = await prisma.driver.findUnique({
        where: { id: params.id }
      });

      if (!existingDriver) {
        return NextResponse.json(
          { error: 'Driver not found' },
          { status: 404 }
        );
      }

      // Check if PIN is already in use by another driver
      if (pin !== existingDriver.pinCode) {
        const existingPin = await prisma.driver.findFirst({
          where: { 
            pinCode: pin,
            id: { not: params.id }
          }
        });

        if (existingPin) {
          return NextResponse.json(
            { error: 'PIN is already in use by another driver' },
            { status: 400 }
          );
        }
      }

      // Check if license number is already in use by another driver
      if (licenseNumber !== existingDriver.licenseNumber) {
        const existingLicense = await prisma.driver.findFirst({
          where: { 
            licenseNumber,
            id: { not: params.id }
          }
        });

        if (existingLicense) {
          return NextResponse.json(
            { error: 'License number is already in use by another driver' },
            { status: 400 }
          );
        }
      }

      const driver = await prisma.driver.update({
        where: { id: params.id },
        data: {
          firstName,
          lastName,
          email: email || null,
          phone: phone || null,
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
      console.error('Error updating driver:', error);
      return NextResponse.json(
        { error: 'Failed to update driver' },
        { status: 500 }
      );
    }
  }, true); // Require admin access
}

// Delete driver
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      // Check if driver exists
      const existingDriver = await prisma.driver.findUnique({
        where: { id: params.id },
        include: {
          vehicleTracking: {
            where: {
              status: {
                in: ['BOARDING', 'EN_ROUTE', 'ARRIVED']
              }
            }
          }
        }
      });

      if (!existingDriver) {
        return NextResponse.json(
          { error: 'Driver not found' },
          { status: 404 }
        );
      }

      // Check if driver has active trips
      if (existingDriver.vehicleTracking.length > 0) {
        return NextResponse.json(
          { error: 'Cannot delete driver with active trips. Please complete or reassign active trips first.' },
          { status: 400 }
        );
      }

      // For safety, we'll soft delete by setting isActive to false
      // In a production system, you might want to keep historical data
      await prisma.driver.update({
        where: { id: params.id },
        data: { isActive: false }
      });

      // Alternatively, for hard delete (uncomment the line below and comment the update above):
      // await prisma.driver.delete({ where: { id: params.id } });

      return NextResponse.json({
        success: true,
        message: 'Driver deactivated successfully'
      });

    } catch (error) {
      console.error('Error deleting driver:', error);
      return NextResponse.json(
        { error: 'Failed to delete driver' },
        { status: 500 }
      );
    }
  }, true); // Require admin access
}