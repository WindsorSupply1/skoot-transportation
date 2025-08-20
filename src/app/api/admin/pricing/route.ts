import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

// GET - Fetch all pricing tiers
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const pricingTiers = await prisma.pricingTier.findMany({
        orderBy: { customerType: 'asc' }
      });

      // Get fee settings
      const luggageFeeSetting = await prisma.siteSettings.findUnique({ 
        where: { key: 'extraLuggageFee' } 
      });
      const petFeeSetting = await prisma.siteSettings.findUnique({ 
        where: { key: 'petFee' } 
      });

      return NextResponse.json({
        pricingTiers,
        fees: {
          extraLuggageFee: luggageFeeSetting ? parseFloat(luggageFeeSetting.value) : 5,
          petFee: petFeeSetting ? parseFloat(petFeeSetting.value) : 10
        }
      });

    } catch (error) {
      console.error('Error fetching pricing:', error);
      return NextResponse.json({ error: 'Failed to fetch pricing' }, { status: 500 });
    }
  }, true);
}

// POST - Create new pricing tier
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { name, description, basePrice, customerType, isActive = true } = await req.json();

      if (!name || !basePrice || !customerType) {
        return NextResponse.json({ 
          error: 'Name, base price, and customer type are required' 
        }, { status: 400 });
      }

      // Check if pricing tier for this customer type already exists
      const existingTier = await prisma.pricingTier.findFirst({
        where: { customerType, isActive: true }
      });

      if (existingTier) {
        return NextResponse.json({ 
          error: `Active pricing tier for ${customerType} already exists` 
        }, { status: 400 });
      }

      const pricingTier = await prisma.pricingTier.create({
        data: {
          name,
          description,
          basePrice: parseFloat(basePrice),
          customerType,
          isActive
        }
      });

      return NextResponse.json(pricingTier);

    } catch (error) {
      console.error('Error creating pricing tier:', error);
      return NextResponse.json({ error: 'Failed to create pricing tier' }, { status: 500 });
    }
  }, true);
}

// PUT - Update fees
export async function PUT(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { extraLuggageFee, petFee } = await req.json();

      const updates = [];

      if (extraLuggageFee !== undefined) {
        updates.push(
          prisma.siteSettings.upsert({
            where: { key: 'extraLuggageFee' },
            update: { value: extraLuggageFee.toString() },
            create: { key: 'extraLuggageFee', value: extraLuggageFee.toString() }
          })
        );
      }

      if (petFee !== undefined) {
        updates.push(
          prisma.siteSettings.upsert({
            where: { key: 'petFee' },
            update: { value: petFee.toString() },
            create: { key: 'petFee', value: petFee.toString() }
          })
        );
      }

      await Promise.all(updates);

      return NextResponse.json({ 
        message: 'Fees updated successfully',
        extraLuggageFee,
        petFee
      });

    } catch (error) {
      console.error('Error updating fees:', error);
      return NextResponse.json({ error: 'Failed to update fees' }, { status: 500 });
    }
  }, true);
}