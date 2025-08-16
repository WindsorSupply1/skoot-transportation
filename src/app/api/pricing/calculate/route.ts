import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Pricing calculation request interface
interface PricingRequest {
  routeId: string;
  passengerCount: number;
  customerType?: 'REGULAR' | 'STUDENT' | 'MILITARY' | 'LEGACY';
  ticketType?: 'ADULT' | 'CHILD' | 'SENIOR';
  isRoundTrip?: boolean;
  extraLuggageBags?: number;
  petCount?: number;
  promoCode?: string;
}

// Pricing calculation result
interface PricingResult {
  subtotal: number;
  discounts: number;
  fees: number;
  taxes: number;
  total: number;
  breakdown: {
    basePrice: number;
    passengerCount: number;
    customerDiscount?: number;
    roundTripDiscount?: number;
    extraLuggageFee?: number;
    petFee?: number;
    promoDiscount?: number;
    processingFee?: number;
    taxAmount?: number;
  };
  promoCodeApplied?: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: PricingRequest = await request.json();
    
    const {
      routeId,
      passengerCount,
      customerType = 'REGULAR',
      ticketType = 'ADULT',
      isRoundTrip = false,
      extraLuggageBags = 0,
      petCount = 0,
      promoCode
    } = data;

    // Validate input
    if (!routeId || !passengerCount || passengerCount < 1) {
      return NextResponse.json({
        error: 'Invalid pricing request parameters'
      }, { status: 400 });
    }

    // Get active pricing tier for customer type
    const pricingTier = await prisma.pricingTier.findFirst({
      where: {
        customerType,
        isActive: true,
        validFrom: { lte: new Date() },
        OR: [
          { validTo: null },
          { validTo: { gte: new Date() } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!pricingTier) {
      return NextResponse.json({
        error: 'No active pricing found for customer type'
      }, { status: 404 });
    }

    // Calculate base price
    let basePrice = pricingTier.basePrice;
    
    // Apply ticket type modifiers
    switch (ticketType) {
      case 'CHILD':
        basePrice *= 0.75; // 25% discount for children
        break;
      case 'SENIOR':
        basePrice *= 0.85; // 15% discount for seniors
        break;
      default:
        // ADULT - no modification
        break;
    }

    // Calculate subtotal
    const subtotal = basePrice * passengerCount;
    
    // Initialize breakdown
    const breakdown: PricingResult['breakdown'] = {
      basePrice,
      passengerCount
    };

    let discounts = 0;
    let fees = 0;

    // Apply customer type discounts
    if (customerType === 'STUDENT') {
      const studentDiscount = subtotal * 0.10; // 10% student discount
      discounts += studentDiscount;
      breakdown.customerDiscount = studentDiscount;
    } else if (customerType === 'MILITARY') {
      const militaryDiscount = subtotal * 0.15; // 15% military discount
      discounts += militaryDiscount;
      breakdown.customerDiscount = militaryDiscount;
    }

    // Round trip discount (10% off return trip)
    if (isRoundTrip) {
      const roundTripDiscount = subtotal * 0.10;
      discounts += roundTripDiscount;
      breakdown.roundTripDiscount = roundTripDiscount;
    }

    // Extra luggage fee ($10 per bag)
    if (extraLuggageBags > 0) {
      const extraLuggageFee = extraLuggageBags * 10;
      fees += extraLuggageFee;
      breakdown.extraLuggageFee = extraLuggageFee;
    }

    // Pet fee ($15 per pet)
    if (petCount > 0) {
      const petFee = petCount * 15;
      fees += petFee;
      breakdown.petFee = petFee;
    }

    // Apply promo code if provided
    let promoCodeApplied: string | undefined;
    if (promoCode) {
      const promoDiscount = await applyPromoCode(promoCode, subtotal - discounts + fees);
      if (promoDiscount > 0) {
        discounts += promoDiscount;
        breakdown.promoDiscount = promoDiscount;
        promoCodeApplied = promoCode;
      }
    }

    // Calculate pre-tax total
    const preTaxTotal = Math.max(0, subtotal - discounts + fees);

    // Processing fee (2.9% + $0.30 for credit card processing)
    const processingFee = Math.round((preTaxTotal * 0.029 + 0.30) * 100) / 100;
    fees += processingFee;
    breakdown.processingFee = processingFee;

    // Tax calculation (if applicable - currently 0% for transportation services)
    const taxRate = 0.00; // No tax on transportation services
    const taxAmount = (preTaxTotal + processingFee) * taxRate;
    breakdown.taxAmount = taxAmount;

    // Final total
    const total = Math.round((preTaxTotal + processingFee + taxAmount) * 100) / 100;

    const result: PricingResult = {
      subtotal: Math.round(subtotal * 100) / 100,
      discounts: Math.round(discounts * 100) / 100,
      fees: Math.round(fees * 100) / 100,
      taxes: Math.round(taxAmount * 100) / 100,
      total,
      breakdown,
      ...(promoCodeApplied && { promoCodeApplied })
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Pricing calculation error:', error);
    return NextResponse.json({
      error: 'Failed to calculate pricing'
    }, { status: 500 });
  }
}

// Helper function to apply promo codes
async function applyPromoCode(promoCode: string, subtotal: number): Promise<number> {
  try {
    // This would typically check a promo_codes table in the database
    // For now, implementing some basic promo codes
    const upperPromoCode = promoCode.toUpperCase();
    
    switch (upperPromoCode) {
      case 'WELCOME10':
        return Math.min(subtotal * 0.10, 20); // 10% off up to $20
      
      case 'STUDENT15':
        return subtotal * 0.15; // 15% off
      
      case 'FIRSTRIDE':
        return Math.min(subtotal * 0.20, 25); // 20% off up to $25
      
      case 'SAVE5':
        return Math.min(5, subtotal); // $5 off
      
      default:
        // Check database for other promo codes
        const promoRecord = await prisma.siteSettings.findUnique({
          where: { key: `promo_${upperPromoCode.toLowerCase()}` }
        });
        
        if (promoRecord && promoRecord.value) {
          try {
            const promoData = JSON.parse(promoRecord.value);
            if (promoData.active && new Date() <= new Date(promoData.expiresAt)) {
              if (promoData.type === 'percentage') {
                const discount = subtotal * (promoData.value / 100);
                return promoData.maxDiscount ? Math.min(discount, promoData.maxDiscount) : discount;
              } else if (promoData.type === 'fixed') {
                return Math.min(promoData.value, subtotal);
              }
            }
          } catch (e) {
            console.error('Error parsing promo code data:', e);
          }
        }
        
        return 0; // No discount if promo code not found or invalid
    }
  } catch (error) {
    console.error('Error applying promo code:', error);
    return 0;
  }
}

// GET endpoint for route pricing information
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get('routeId');

    if (!routeId) {
      return NextResponse.json({
        error: 'Route ID is required'
      }, { status: 400 });
    }

    // Get all active pricing tiers
    const pricingTiers = await prisma.pricingTier.findMany({
      where: {
        isActive: true,
        validFrom: { lte: new Date() },
        OR: [
          { validTo: null },
          { validTo: { gte: new Date() } }
        ]
      },
      orderBy: { customerType: 'asc' }
    });

    // Get route information
    const route = await prisma.route.findUnique({
      where: { id: routeId },
      select: {
        id: true,
        name: true,
        origin: true,
        destination: true,
        duration: true,
      }
    });

    if (!route) {
      return NextResponse.json({
        error: 'Route not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      route,
      pricingTiers: pricingTiers.map(tier => ({
        customerType: tier.customerType,
        basePrice: tier.basePrice,
        description: tier.description
      })),
      fees: {
        extraLuggage: 10, // $10 per bag
        pet: 15, // $15 per pet
        processingRate: 2.9, // 2.9% + $0.30
        processingFixed: 0.30
      },
      discounts: {
        child: 0.25, // 25% discount
        senior: 0.15, // 15% discount
        student: 0.10, // 10% additional discount
        military: 0.15, // 15% additional discount
        roundTrip: 0.10 // 10% discount on return trip
      }
    });

  } catch (error) {
    console.error('Route pricing fetch error:', error);
    return NextResponse.json({
      error: 'Failed to fetch route pricing'
    }, { status: 500 });
  }
}