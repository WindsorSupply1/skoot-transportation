import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const customerId = params.id;

      const customer = await prisma.user.findUnique({
        where: { id: customerId },
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
              },
              passengers: true,
              payment: true
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!customer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      }

      // Calculate customer statistics
      const totalBookings = customer.bookings.length;
      const totalSpent = customer.bookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
      const lastBookingDate = customer.bookings.length > 0 ? customer.bookings[0].createdAt : null;

      const customerData = {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
        isActive: customer.isActive,
        totalBookings,
        totalSpent,
        lastBookingDate,
        bookings: customer.bookings.map(booking => ({
          id: booking.id,
          bookingNumber: booking.bookingNumber,
          status: booking.status,
          totalAmount: booking.totalAmount,
          createdAt: booking.createdAt,
          passengerCount: booking.passengerCount,
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
          },
          passengers: booking.passengers,
          payment: booking.payment
        }))
      };

      return NextResponse.json({ customer: customerData });

    } catch (error) {
      console.error('Customer fetch error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }, true);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const customerId = params.id;
      const body = await req.json();
      const { email, firstName, lastName, phone, isActive, notes } = body;

      // Check if customer exists
      const existingCustomer = await prisma.user.findUnique({
        where: { id: customerId }
      });

      if (!existingCustomer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      }

      // If email is being changed, check if new email is already in use
      if (email && email !== existingCustomer.email) {
        const emailExists = await prisma.user.findUnique({
          where: { email }
        });

        if (emailExists) {
          return NextResponse.json({ 
            error: 'This email is already in use by another customer' 
          }, { status: 400 });
        }
      }

      // Build update data
      const updateData: any = {
        updatedAt: new Date()
      };

      if (email !== undefined) updateData.email = email;
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (phone !== undefined) updateData.phone = phone;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (notes !== undefined) updateData.notes = notes;

      // Update customer
      const updatedCustomer = await prisma.user.update({
        where: { id: customerId },
        data: updateData,
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
        }
      });

      // Calculate statistics for response
      const totalBookings = updatedCustomer.bookings.length;
      const totalSpent = updatedCustomer.bookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
      const lastBookingDate = updatedCustomer.bookings.length > 0 ? updatedCustomer.bookings[0].createdAt : null;

      const customerData = {
        id: updatedCustomer.id,
        email: updatedCustomer.email,
        firstName: updatedCustomer.firstName,
        lastName: updatedCustomer.lastName,
        phone: updatedCustomer.phone,
        createdAt: updatedCustomer.createdAt,
        updatedAt: updatedCustomer.updatedAt,
        isActive: updatedCustomer.isActive,
        totalBookings,
        totalSpent,
        lastBookingDate,
        bookings: updatedCustomer.bookings.map(booking => ({
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

      return NextResponse.json({
        message: 'Customer updated successfully',
        customer: customerData
      });

    } catch (error) {
      console.error('Customer update error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }, true);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const customerId = params.id;

      // Check if customer exists
      const existingCustomer = await prisma.user.findUnique({
        where: { id: customerId },
        include: {
          bookings: {
            include: {
              passengers: true,
              payment: true
            }
          }
        }
      });

      if (!existingCustomer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      }

      // Delete in correct order due to foreign key constraints
      
      // First, delete all passengers for all bookings
      for (const booking of existingCustomer.bookings) {
        if (booking.passengers.length > 0) {
          await prisma.passenger.deleteMany({
            where: { bookingId: booking.id }
          });
        }

        // Delete payment records
        if (booking.payment) {
          await prisma.payment.delete({
            where: { id: booking.payment.id }
          });
        }
      }

      // Delete all bookings
      if (existingCustomer.bookings.length > 0) {
        await prisma.booking.deleteMany({
          where: { userId: customerId }
        });
      }

      // Finally delete the customer
      await prisma.user.delete({
        where: { id: customerId }
      });

      return NextResponse.json({
        message: 'Customer and all associated data deleted successfully'
      });

    } catch (error) {
      console.error('Customer deletion error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }, true);
}