import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

// GET - Fetch all vehicles
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const vehicles = await prisma.vehicle.findMany({
        orderBy: { name: 'asc' }
      });

      return NextResponse.json({ vehicles });

    } catch (error) {
      console.error('Error fetching vehicles:', error);
      return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 });
    }
  }, true);
}

// POST - Create new vehicle
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { name, capacity, priceMultiplier, isActive = true } = await req.json();

      if (!name || !capacity) {
        return NextResponse.json({ 
          error: 'Name and capacity are required' 
        }, { status: 400 });
      }

      // Check if vehicle name already exists
      const existingVehicle = await prisma.vehicle.findFirst({
        where: { name: { equals: name, mode: 'insensitive' } }
      });

      if (existingVehicle) {
        return NextResponse.json({ 
          error: 'A vehicle with this name already exists' 
        }, { status: 400 });
      }

      const vehicle = await prisma.vehicle.create({
        data: {
          name,
          capacity: parseInt(capacity),
          priceMultiplier: parseFloat(priceMultiplier) || 1.0,
          isActive
        }
      });

      return NextResponse.json(vehicle);

    } catch (error) {
      console.error('Error creating vehicle:', error);
      return NextResponse.json({ error: 'Failed to create vehicle' }, { status: 500 });
    }
  }, true);
}