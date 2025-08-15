import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const includeSchedules = searchParams.get('includeSchedules') === 'true';

      // Get routes with optional schedule data
      const routes = await prisma.route.findMany({
        include: includeSchedules ? {
          schedules: {
            orderBy: { time: 'asc' }
          }
        } : undefined,
        orderBy: { name: 'asc' }
      });

      return NextResponse.json({ routes });

    } catch (error) {
      console.error('Routes fetch error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }, true);
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const body = await req.json();
      const { 
        name, 
        origin, 
        destination, 
        duration, 
        isActive = true 
      } = body;

      if (!name || !origin || !destination || !duration) {
        return NextResponse.json({ 
          error: 'Name, origin, destination, and duration are required' 
        }, { status: 400 });
      }

      // Check for duplicate route name
      const existingRoute = await prisma.route.findFirst({
        where: {
          name: {
            equals: name,
            mode: 'insensitive'
          }
        }
      });

      if (existingRoute) {
        return NextResponse.json({ 
          error: 'A route with this name already exists' 
        }, { status: 400 });
      }

      // Create new route
      const newRoute = await prisma.route.create({
        data: {
          name,
          origin,
          destination,
          duration: parseInt(duration),
          isActive
          // Note: price is handled through PricingTier system, not stored on Route
        }
      });

      return NextResponse.json({
        message: 'Route created successfully',
        route: newRoute
      });

    } catch (error) {
      console.error('Route creation error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }, true);
}