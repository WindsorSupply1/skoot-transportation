import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAuth } from '@/lib/auth';
import { smsService, SMS_TEMPLATES } from '@/lib/sms';

const prisma = new PrismaClient();

// Send manual SMS notifications
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { 
        departureId, 
        message, 
        useTemplate, 
        templateType,
        phoneNumbers 
      } = await req.json();

      if (!departureId && !phoneNumbers) {
        return NextResponse.json(
          { error: 'Either departureId or phoneNumbers array is required' },
          { status: 400 }
        );
      }

      let recipients: string[] = [];
      let departure: any = null;

      // Get recipients from departure bookings or use provided phone numbers
      if (departureId) {
        departure = await prisma.departure.findUnique({
          where: { id: departureId },
          include: {
            bookings: {
              include: {
                user: true
              }
            },
            schedule: {
              include: {
                route: true
              }
            }
          }
        });

        if (!departure) {
          return NextResponse.json(
            { error: 'Departure not found' },
            { status: 404 }
          );
        }

        // Extract phone numbers from bookings
        recipients = departure.bookings
          .map((booking: any) => booking.user?.phone || booking.guestPhone)
          .filter(Boolean);
      } else {
        recipients = phoneNumbers;
      }

      if (recipients.length === 0) {
        return NextResponse.json(
          { error: 'No valid phone numbers found' },
          { status: 400 }
        );
      }

      let finalMessage = message;

      // Use template if requested
      if (useTemplate && templateType && departure) {
        const route = departure.schedule.route;
        const trackingUrl = `/live/${departureId}`;
        
        switch (templateType) {
          case 'BOARDING_STARTED':
            finalMessage = SMS_TEMPLATES.BOARDING_STARTED(
              route.name, 
              route.origin, 
              trackingUrl
            );
            break;
          case 'DEPARTED':
            const eta = new Date(Date.now() + 120 * 60 * 1000).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            });
            finalMessage = SMS_TEMPLATES.DEPARTED(
              route.origin, 
              route.destination, 
              eta, 
              trackingUrl
            );
            break;
          case 'DELAYED':
            finalMessage = SMS_TEMPLATES.DELAYED(15, 'Traffic conditions', trackingUrl);
            break;
          case 'ARRIVED':
            finalMessage = SMS_TEMPLATES.ARRIVED(
              route.destination, 
              'Your SKOOT Driver', 
              '(555) 123-4567'
            );
            break;
          case 'PICKUP_REMINDER':
            const departureTime = new Date(departure.date).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            });
            finalMessage = SMS_TEMPLATES.PICKUP_REMINDER(
              route.name,
              departureTime,
              route.origin,
              trackingUrl
            );
            break;
        }
      }

      if (!finalMessage) {
        return NextResponse.json(
          { error: 'Message content is required' },
          { status: 400 }
        );
      }

      // Send SMS messages
      const results = await Promise.allSettled(
        recipients.map(async (phoneNumber) => {
          const smsResult = await smsService.sendSMS({
            to: phoneNumber,
            message: finalMessage,
            trackingUrl: departureId ? `/live/${departureId}` : undefined
          });

          // Create notification record
          if (departureId) {
            const booking = departure.bookings.find(
              (b: any) => (b.user?.phone || b.guestPhone) === phoneNumber
            );

            if (booking) {
              await prisma.customerNotification.create({
                data: {
                  bookingId: booking.id,
                  departureId: departureId,
                  notificationType: 'SMS',
                  recipientPhone: phoneNumber,
                  message: finalMessage,
                  trackingUrl: departureId ? `/live/${departureId}` : undefined,
                  status: smsResult.success ? 'SENT' : 'FAILED',
                  sentAt: smsResult.success ? new Date() : undefined
                }
              });
            }
          }

          return {
            phoneNumber,
            success: smsResult.success,
            messageId: smsResult.messageId,
            error: smsResult.error
          };
        })
      );

      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failed = results.length - successful;

      return NextResponse.json({
        success: true,
        data: {
          messagesSent: successful,
          messagesFailed: failed,
          totalRecipients: recipients.length,
          results: results.map(r => 
            r.status === 'fulfilled' ? r.value : { success: false, error: 'Promise rejected' }
          )
        }
      });

    } catch (error) {
      console.error('Error sending SMS notifications:', error);
      return NextResponse.json(
        { error: 'Failed to send SMS notifications' },
        { status: 500 }
      );
    }
  }, true); // Require admin access
}

// Get SMS notification history
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const departureId = searchParams.get('departureId');
      const status = searchParams.get('status');
      const limit = parseInt(searchParams.get('limit') || '50');
      const offset = parseInt(searchParams.get('offset') || '0');

      const where: any = {
        notificationType: 'SMS'
      };

      if (departureId) where.departureId = departureId;
      if (status) where.status = status;

      const notifications = await prisma.customerNotification.findMany({
        where,
        include: {
          booking: {
            include: {
              user: true,
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
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });

      const total = await prisma.customerNotification.count({ where });

      return NextResponse.json({
        success: true,
        data: {
          notifications,
          pagination: {
            total,
            limit,
            offset,
            hasMore: offset + limit < total
          }
        }
      });

    } catch (error) {
      console.error('Error fetching SMS notifications:', error);
      return NextResponse.json(
        { error: 'Failed to fetch SMS notifications' },
        { status: 500 }
      );
    }
  }, true); // Require admin access
}