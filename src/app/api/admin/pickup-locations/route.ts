import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema for creating/updating pickup locations
const locationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(1, 'Zip code is required'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  isPickup: z.boolean().default(true),
  isDropoff: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
  instructions: z.string().optional(),
  maxCapacity: z.number().min(1).optional(),
  operatingHours: z.object({
    monday: z.object({
      enabled: z.boolean(),
      open: z.string().optional(),
      close: z.string().optional(),
    }).optional(),
    tuesday: z.object({
      enabled: z.boolean(),
      open: z.string().optional(),
      close: z.string().optional(),
    }).optional(),
    wednesday: z.object({
      enabled: z.boolean(),
      open: z.string().optional(),
      close: z.string().optional(),
    }).optional(),
    thursday: z.object({
      enabled: z.boolean(),
      open: z.string().optional(),
      close: z.string().optional(),
    }).optional(),
    friday: z.object({
      enabled: z.boolean(),
      open: z.string().optional(),
      close: z.string().optional(),
    }).optional(),
    saturday: z.object({
      enabled: z.boolean(),
      open: z.string().optional(),
      close: z.string().optional(),
    }).optional(),
    sunday: z.object({
      enabled: z.boolean(),
      open: z.string().optional(),
      close: z.string().optional(),
    }).optional(),
  }).optional(),
});

// GET - List all pickup locations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true }
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const pickupOnly = searchParams.get('pickupOnly') !== 'false'; // Default to true

    const locations = await prisma.location.findMany({
      where: {
        ...(pickupOnly && { isPickup: true }),
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ],
      include: {
        _count: {
          select: {
            pickupBookings: true,
            dropoffBookings: true,
          }
        }
      }
    });

    return NextResponse.json({ 
      locations: locations.map(location => ({
        ...location,
        bookingCount: location._count.pickupBookings + location._count.dropoffBookings,
        pickupBookingCount: location._count.pickupBookings,
        dropoffBookingCount: location._count.dropoffBookings,
      }))
    });

  } catch (error) {
    console.error('Error fetching pickup locations:', error);
    return NextResponse.json({ error: 'Failed to fetch pickup locations' }, { status: 500 });
  }
}

// POST - Create a new pickup location
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true }
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = locationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const locationData = validationResult.data;

    // Create the location
    const location = await prisma.location.create({
      data: {
        name: locationData.name,
        address: locationData.address,
        city: locationData.city,
        state: locationData.state,
        zipCode: locationData.zipCode,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        isPickup: locationData.isPickup,
        isDropoff: locationData.isDropoff,
        isActive: locationData.isActive,
        sortOrder: locationData.sortOrder,
        instructions: locationData.instructions,
        maxCapacity: locationData.maxCapacity,
        operatingHours: locationData.operatingHours,
      }
    });

    return NextResponse.json({ location }, { status: 201 });

  } catch (error) {
    console.error('Error creating pickup location:', error);
    return NextResponse.json({ error: 'Failed to create pickup location' }, { status: 500 });
  }
}