import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

// POST - Assign a vehicle to a departure
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { departureId, vehicleId } = await req.json();

      if (!departureId) {
        return NextResponse.json({
          error: 'Departure ID is required'
        }, { status: 400 });
      }

      // Verify departure exists
      const departure = await prisma.departure.findUnique({
        where: { id: departureId }
      });

      if (!departure) {
        return NextResponse.json({
          error: 'Departure not found'
        }, { status: 404 });
      }

      // If vehicleId provided, verify vehicle exists and is active
      if (vehicleId) {
        const vehicle = await prisma.vehicle.findUnique({
          where: { id: vehicleId }
        });

        if (!vehicle) {
          return NextResponse.json({
            error: 'Vehicle not found'
          }, { status: 404 });
        }

        if (!vehicle.isActive) {
          return NextResponse.json({
            error: 'Vehicle is not active'
          }, { status: 400 });
        }

        // Update departure capacity to match vehicle capacity
        await prisma.departure.update({
          where: { id: departureId },
          data: {
            vehicleId: vehicleId,
            capacity: vehicle.capacity
          }
        });

        return NextResponse.json({
          message: `Vehicle ${vehicle.name} assigned to departure`,
          vehicleName: vehicle.name,
          capacity: vehicle.capacity,
          priceMultiplier: vehicle.priceMultiplier
        });

      } else {
        // Remove vehicle assignment
        await prisma.departure.update({
          where: { id: departureId },
          data: {
            vehicleId: null
          }
        });

        return NextResponse.json({
          message: 'Vehicle assignment removed'
        });
      }

    } catch (error) {
      console.error('Error assigning vehicle:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }, true);
}