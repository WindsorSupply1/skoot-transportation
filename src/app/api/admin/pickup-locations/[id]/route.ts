import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema for updating pickup locations
const updateLocationSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  address: z.string().min(1, 'Address is required').optional(),
  city: z.string().min(1, 'City is required').optional(),
  state: z.string().min(1, 'State is required').optional(),
  zipCode: z.string().min(1, 'Zip code is required').optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  isPickup: z.boolean().optional(),
  isDropoff: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
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
}).partial();

// GET - Get a specific pickup location by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const location = await prisma.location.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            pickupBookings: true,
            dropoffBookings: true,
          }
        },
        pickupBookings: {
          take: 10, // Get recent bookings
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              }
            },
            departure: {
              include: {
                schedule: {
                  include: {
                    route: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    return NextResponse.json({
      location: {
        ...location,
        bookingCount: location._count.pickupBookings + location._count.dropoffBookings,
        pickupBookingCount: location._count.pickupBookings,
        dropoffBookingCount: location._count.dropoffBookings,
      }
    });

  } catch (error) {
    console.error('Error fetching pickup location:', error);
    return NextResponse.json({ error: 'Failed to fetch pickup location' }, { status: 500 });
  }
}

// PUT - Update a pickup location
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if location exists
    const existingLocation = await prisma.location.findUnique({
      where: { id: params.id }
    });

    if (!existingLocation) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = updateLocationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // Update the location
    const location = await prisma.location.update({
      where: { id: params.id },
      data: {
        ...(updateData.name !== undefined && { name: updateData.name }),
        ...(updateData.address !== undefined && { address: updateData.address }),
        ...(updateData.city !== undefined && { city: updateData.city }),
        ...(updateData.state !== undefined && { state: updateData.state }),
        ...(updateData.zipCode !== undefined && { zipCode: updateData.zipCode }),
        ...(updateData.latitude !== undefined && { latitude: updateData.latitude }),
        ...(updateData.longitude !== undefined && { longitude: updateData.longitude }),
        ...(updateData.isPickup !== undefined && { isPickup: updateData.isPickup }),
        ...(updateData.isDropoff !== undefined && { isDropoff: updateData.isDropoff }),
        ...(updateData.isActive !== undefined && { isActive: updateData.isActive }),
        ...(updateData.sortOrder !== undefined && { sortOrder: updateData.sortOrder }),
        ...(updateData.instructions !== undefined && { instructions: updateData.instructions }),
        ...(updateData.maxCapacity !== undefined && { maxCapacity: updateData.maxCapacity }),
        ...(updateData.operatingHours !== undefined && { operatingHours: updateData.operatingHours }),
      }
    });

    return NextResponse.json({ location });

  } catch (error) {
    console.error('Error updating pickup location:', error);
    return NextResponse.json({ error: 'Failed to update pickup location' }, { status: 500 });
  }
}

// DELETE - Delete a pickup location
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if location exists
    const existingLocation = await prisma.location.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            pickupBookings: true,
            dropoffBookings: true,
          }
        }
      }
    });

    if (!existingLocation) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    // Check if location has any bookings
    const totalBookings = existingLocation._count.pickupBookings + existingLocation._count.dropoffBookings;
    if (totalBookings > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete location with existing bookings. Please disable it instead.' 
      }, { status: 400 });
    }

    // Delete the location
    await prisma.location.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Location deleted successfully' });

  } catch (error) {
    console.error('Error deleting pickup location:', error);
    return NextResponse.json({ error: 'Failed to delete pickup location' }, { status: 500 });
  }
}