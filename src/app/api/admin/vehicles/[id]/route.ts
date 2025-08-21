import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

// GET - Fetch specific vehicle
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (req, user) => {
    try {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: params.id }
      });

      if (!vehicle) {
        return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
      }

      return NextResponse.json(vehicle);

    } catch (error) {
      console.error('Error fetching vehicle:', error);
      return NextResponse.json({ error: 'Failed to fetch vehicle' }, { status: 500 });
    }
  }, true);
}

// PATCH - Update specific fields (for price modifier changes)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (req, user) => {
    try {
      const body = await req.json();
      const { priceMultiplier } = body;

      // Validate priceMultiplier
      if (priceMultiplier !== undefined) {
        if (typeof priceMultiplier !== 'number' || priceMultiplier < 0.1 || priceMultiplier > 5.0) {
          return NextResponse.json({ 
            error: 'Price multiplier must be a number between 0.1 and 5.0' 
          }, { status: 400 });
        }
      }

      // Check if vehicle exists
      const existingVehicle = await prisma.vehicle.findUnique({
        where: { id: params.id }
      });

      if (!existingVehicle) {
        return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
      }

      // Update only the price multiplier
      const updatedVehicle = await prisma.vehicle.update({
        where: { id: params.id },
        data: { priceMultiplier: parseFloat(priceMultiplier) }
      });

      return NextResponse.json(updatedVehicle);

    } catch (error) {
      console.error('Error updating vehicle price modifier:', error);
      return NextResponse.json({ error: 'Failed to update vehicle price modifier' }, { status: 500 });
    }
  }, true);
}

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