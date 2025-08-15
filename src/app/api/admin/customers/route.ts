import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '50');
      const search = searchParams.get('search');
      const status = searchParams.get('status');
      const registeredFrom = searchParams.get('registeredFrom');
      const registeredTo = searchParams.get('registeredTo');
      const minBookings = searchParams.get('minBookings');
      const minSpent = searchParams.get('minSpent');

      const skip = (page - 1) * limit;

      // Build where clause for users
      const where: any = {};

      if (search) {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } }
        ];
      }

      if (status && status !== 'all') {
        // Note: isActive field doesn't exist in User model, so active/inactive filters are ignored
        if (status === 'new') {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          where.createdAt = { gte: weekAgo };
        }
        // 'active' and 'inactive' status filters are not supported since isActive field doesn't exist
      }

      if (registeredFrom || registeredTo) {
        where.createdAt = {};
        if (registeredFrom) where.createdAt.gte = new Date(registeredFrom);
        if (registeredTo) where.createdAt.lte = new Date(registeredTo);
      }

      // Get all users with their booking data
      const users = await prisma.user.findMany({
        where,
        include: {
          bookings: {
            include: {
              departure: {
                include: {
                  schedule: {
                    include: {
                      route: true
                    }
                  }
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      });

      // Transform data to include calculated fields
      const customers = users.map(user => {
        const totalBookings = user.bookings.length;
        const totalSpent = user.bookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
        const lastBookingDate = user.bookings.length > 0 ? user.bookings[0].createdAt : null;

        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          isActive: true, // Default to active since field doesn't exist in schema
          totalBookings,
          totalSpent,
          lastBookingDate,
          bookings: user.bookings.map(booking => ({
            id: booking.id,
            bookingNumber: booking.bookingNumber,
            status: booking.status,
            totalAmount: booking.totalAmount,
            createdAt: booking.createdAt,
            departure: {
              date: booking.departure.date,
              schedule: {
                time: booking.departure.schedule.time,
                route: {
                  name: booking.departure.schedule.route.name,
                  origin: booking.departure.schedule.route.origin,
                  destination: booking.departure.schedule.route.destination
                }
              }
            }
          }))
        };
      });

      // Apply additional filters that require calculated fields
      let filteredCustomers = customers;

      if (minBookings) {
        const minBookingsNum = parseInt(minBookings);
        filteredCustomers = filteredCustomers.filter(customer => customer.totalBookings >= minBookingsNum);
      }

      if (minSpent) {
        const minSpentNum = parseFloat(minSpent);
        filteredCustomers = filteredCustomers.filter(customer => customer.totalSpent >= minSpentNum);
      }

      if (status === 'frequent') {
        filteredCustomers = filteredCustomers.filter(customer => customer.totalBookings >= 3);
      }

      // Get total count for pagination
      const totalCount = await prisma.user.count({ where });
      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      return NextResponse.json({
        customers: filteredCustomers,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage,
          hasPreviousPage,
          limit
        }
      });

    } catch (error) {
      console.error('Customers fetch error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }, true);
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const body = await req.json();
      const { email, firstName, lastName, phone } = body;

      if (!email || !firstName || !lastName) {
        return NextResponse.json({ 
          error: 'Email, first name, and last name are required' 
        }, { status: 400 });
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return NextResponse.json({ 
          error: 'A user with this email already exists' 
        }, { status: 400 });
      }

      // Create new user
      const newUser = await prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          phone
          // Note: isActive and password fields don't exist in User model
        }
      });

      return NextResponse.json({
        message: 'Customer created successfully',
        customer: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          phone: newUser.phone,
          createdAt: newUser.createdAt,
          updatedAt: newUser.updatedAt,
          isActive: true, // Default to active since field doesn't exist in schema
          totalBookings: 0,
          totalSpent: 0,
          lastBookingDate: null,
          bookings: []
        }
      });

    } catch (error) {
      console.error('Customer creation error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }, true);
}