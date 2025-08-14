import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerType = searchParams.get('customerType') as string;
    const passengerCount = parseInt(searchParams.get('passengerCount') || '1');
    const extraLuggage = parseInt(searchParams.get('extraLuggage') || '0');
    const pets = parseInt(searchParams.get('pets') || '0');
    const isRoundTrip = searchParams.get('roundTrip') === 'true';

    // Get current pricing from database
    const pricingTiers = await prisma.pricingTier.findMany({
      where: { isActive: true }
    });

    // Get fee settings using key-value structure
    const luggageFeeSetting = await prisma.siteSettings.findUnique({ where: { key: 'extraLuggageFee' } });
    const petFeeSetting = await prisma.siteSettings.findUnique({ where: { key: 'petFee' } });
    
    const luggageFee = luggageFeeSetting ? parseFloat(luggageFeeSetting.value) : 5;
    const petFee = petFeeSetting ? parseFloat(petFeeSetting.value) : 10;

    // Base prices by customer type
    const basePrices: Record<string, number> = {
      LEGACY: 31,
      STUDENT: 32,
      MILITARY: 32,
      REGULAR: 35
    };

    const basePrice = basePrices[customerType] || basePrices.REGULAR;
    const passengerCost = basePrice * passengerCount;
    const luggageCost = extraLuggage * luggageFee;
    const petCost = pets * petFee;
    const subtotal = passengerCost + luggageCost + petCost;

    let total = subtotal;
    let savings = 0;

    if (isRoundTrip) {
      // Round trip: double the price with 10% discount
      const roundTripTotal = subtotal * 2;
      savings = Math.round(roundTripTotal * 0.1);
      total = roundTripTotal - savings;
    }

    const breakdown = {
      basePrice,
      passengerCount,
      passengerCost,
      extraLuggage,
      luggageCost,
      pets,
      petCost,
      subtotal,
      isRoundTrip,
      savings,
      total,
      customerType
    };

    // Get available pricing tiers for display
    const availableTiers = pricingTiers.map(tier => ({
      name: tier.name,
      basePrice: tier.basePrice,
      description: tier.description,
      eligibility: tier.eligibilityRequirements
    }));

    return NextResponse.json({ 
      breakdown,
      availableTiers,
      fees: {
        extraLuggage: luggageFee,
        pets: petFee
      }
    });

  } catch (error) {
    console.error('Pricing calculation error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}