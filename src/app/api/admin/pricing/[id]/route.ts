import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

// PUT - Update specific pricing tier
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (req, user) => {
    try {
      const { id } = params;
      const { name, description, basePrice, customerType, isActive } = await req.json();

      if (!name || !basePrice || !customerType) {
        return NextResponse.json({ 
          error: 'Name, base price, and customer type are required' 
        }, { status: 400 });
      }

      // Check if another pricing tier for this customer type exists (excluding current one)
      const existingTier = await prisma.pricingTier.findFirst({
        where: { 
          customerType, 
          isActive: true,
          id: { not: id }
        }
      });

      if (existingTier && isActive !== false) {
        return NextResponse.json({ 
          error: `Another active pricing tier for ${customerType} already exists` 
        }, { status: 400 });
      }

      const updatedTier = await prisma.pricingTier.update({
        where: { id },
        data: {
          name,
          description,
          basePrice: parseFloat(basePrice),
          customerType,
          isActive: isActive !== undefined ? isActive : true
        }
      });

      return NextResponse.json(updatedTier);

    } catch (error) {
      console.error('Error updating pricing tier:', error);
      return NextResponse.json({ error: 'Failed to update pricing tier' }, { status: 500 });
    }
  }, true);
}

// DELETE - Delete pricing tier
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (req, user) => {
    try {
      const { id } = params;

      // Check if pricing tier is being used in any bookings
      const bookingsUsingTier = await prisma.booking.findFirst({
        where: { pricingTierId: id }
      });

      if (bookingsUsingTier) {
        return NextResponse.json({ 
          error: 'Cannot delete pricing tier that is being used in bookings. Deactivate it instead.' 
        }, { status: 400 });
      }

      await prisma.pricingTier.delete({
        where: { id }
      });

      return NextResponse.json({ message: 'Pricing tier deleted successfully' });

    } catch (error) {
      console.error('Error deleting pricing tier:', error);
      return NextResponse.json({ error: 'Failed to delete pricing tier' }, { status: 500 });
    }
  }, true);
}