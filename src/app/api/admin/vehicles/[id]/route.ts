import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

// PUT - Update vehicle
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (req, user) => {
    try {
      const { id } = params;
      const { name, capacity, priceMultiplier, isActive } = await req.json();

      if (!name || !capacity) {
        return NextResponse.json({ 
          error: 'Name and capacity are required' 
        }, { status: 400 });
      }

      // Check if another vehicle with this name exists (excluding current one)
      const existingVehicle = await prisma.vehicle.findFirst({
        where: { 
          name: { equals: name, mode: 'insensitive' },
          id: { not: id }
        }
      });

      if (existingVehicle) {
        return NextResponse.json({ 
          error: 'A vehicle with this name already exists' 
        }, { status: 400 });
      }

      const updatedVehicle = await prisma.vehicle.update({
        where: { id },
        data: {
          name,
          capacity: parseInt(capacity),
          priceMultiplier: parseFloat(priceMultiplier) || 1.0,
          isActive: isActive !== undefined ? isActive : true
        }
      });

      return NextResponse.json(updatedVehicle);

    } catch (error) {
      console.error('Error updating vehicle:', error);
      return NextResponse.json({ error: 'Failed to update vehicle' }, { status: 500 });
    }
  }, true);
}

// DELETE - Delete vehicle
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (req, user) => {
    try {
      const { id } = params;

      // Check if vehicle is assigned to any departures
      const departuresUsingVehicle = await prisma.departure.findFirst({
        where: { vehicleId: id }
      });

      if (departuresUsingVehicle) {
        return NextResponse.json({ 
          error: 'Cannot delete vehicle that is assigned to departures. Deactivate it instead.' 
        }, { status: 400 });
      }

      await prisma.vehicle.delete({
        where: { id }
      });

      return NextResponse.json({ message: 'Vehicle deleted successfully' });

    } catch (error) {
      console.error('Error deleting vehicle:', error);
      return NextResponse.json({ error: 'Failed to delete vehicle' }, { status: 500 });
    }
  }, true);
}