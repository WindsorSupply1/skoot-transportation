import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAuth } from '@/lib/auth';
import { SMS_TEMPLATES, smsService } from '@/lib/sms';

const prisma = new PrismaClient();

// Send tracking link reminders for upcoming departures
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { departureIds, reminderType = 'PICKUP_REMINDER' } = await req.json();

      if (!departureIds || !Array.isArray(departureIds) || departureIds.length === 0) {
        return NextResponse.json(
          { error: 'departureIds array is required' },
          { status: 400 }
        );
      }

      const results = await Promise.all(
        departureIds.map(async (departureId: string) => {
          try {
            // Get departure with bookings
            const departure = await prisma.departure.findUnique({
              where: { id: departureId },
              include: {
                bookings: {
                  include: {
                    user: true
                  },
                  where: {
                    status: 'PAID' // Only send to confirmed bookings
                  }
                },
                schedule: {
                  include: {
                    route: true
                  }
                },
                liveDepartureStatus: true
              }
            });

            if (!departure) {
              return {
                departureId,
                success: false,
                error: 'Departure not found'
              };
            }

            const trackingUrl = `/live/${departureId}`;
            const route = departure.schedule.route;
            const departureTime = departure.schedule.time;

            // Ensure live departure status exists
            if (!departure.liveDepartureStatus) {
              await prisma.liveDepartureStatus.create({
                data: {
                  departureId: departure.id,
                  currentStatus: 'SCHEDULED',
                  isLiveTracked: true,
                  trackingUrl,
                  statusMessage: `Scheduled departure from ${route.origin}`,
                  progressPercentage: 0,
                  delayMinutes: 0
                }
              });
            }

            const smsPromises = departure.bookings.map(async (booking) => {
              const phoneNumber = booking.user?.phone || booking.guestPhone;
              if (!phoneNumber) return null;

              let message = '';
              switch (reminderType) {
                case 'PICKUP_REMINDER':
                  message = SMS_TEMPLATES.PICKUP_REMINDER(
                    route.name,
                    departureTime,
                    route.origin,
                    trackingUrl
                  );
                  break;
                case 'BOARDING_STARTED':
                  message = SMS_TEMPLATES.BOARDING_STARTED(
                    route.name,
                    route.origin,
                    trackingUrl
                  );
                  break;
                default:
                  message = `Your SKOOT van (${route.name}) is departing soon. Track live: https://skoot.bike${trackingUrl}`;
              }

              const smsResult = await smsService.sendSMS({
                to: phoneNumber,
                message,
                trackingUrl
              });

              // Create notification record
              await prisma.customerNotification.create({
                data: {
                  bookingId: booking.id,
                  departureId: departure.id,
                  notificationType: 'SMS',
                  recipientPhone: phoneNumber,
                  message,
                  trackingUrl,
                  status: smsResult.success ? 'SENT' : 'FAILED',
                  sentAt: smsResult.success ? new Date() : undefined,
                  externalId: smsResult.messageId,
                  errorMessage: smsResult.error,
                  createdByUserId: user.id
                }
              });

              return {
                bookingId: booking.id,
                phoneNumber,
                success: smsResult.success,
                error: smsResult.error
              };
            });

            const smsResults = await Promise.all(smsPromises);
            const sentCount = smsResults.filter(r => r?.success).length;
            const failedCount = smsResults.filter(r => r && !r.success).length;

            return {
              departureId,
              success: true,
              route: route.name,
              sentCount,
              failedCount,
              totalBookings: departure.bookings.length
            };

          } catch (error) {
            console.error(`Error sending reminders for departure ${departureId}:`, error);
            return {
              departureId,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        })
      );

      const totalSent = results.reduce((sum, r) => sum + (r.sentCount || 0), 0);
      const totalFailed = results.reduce((sum, r) => sum + (r.failedCount || 0), 0);

      return NextResponse.json({
        success: true,
        data: {
          results,
          summary: {
            totalDepartures: departureIds.length,
            totalSent,
            totalFailed,
            reminderType
          }
        }
      });

    } catch (error) {
      console.error('Error sending tracking reminders:', error);
      return NextResponse.json(
        { error: 'Failed to send tracking reminders' },
        { status: 500 }
      );
    }
  }, true); // Require admin access
}

// Get upcoming departures that could benefit from tracking reminders
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const hours = parseInt(searchParams.get('hours') || '24'); // Default to next 24 hours

      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + hours * 60 * 60 * 1000);

      const departures = await prisma.departure.findMany({
        where: {
          date: {
            gte: startTime,
            lte: endTime
          }
        },
        include: {
          schedule: {
            include: {
              route: true
            }
          },
          bookings: {
            where: {
              status: 'PAID'
            },
            include: {
              user: true
            }
          },
          liveDepartureStatus: true
        },
        orderBy: {
          date: 'asc'
        }
      });

      const departuresWithStats = departures.map(departure => {
        const bookingsWithPhone = departure.bookings.filter(
          booking => booking.user?.phone || booking.guestPhone
        );

        const timeUntilDeparture = departure.date.getTime() - Date.now();
        const hoursUntilDeparture = Math.round(timeUntilDeparture / (1000 * 60 * 60));

        return {
          id: departure.id,
          date: departure.date,
          route: departure.schedule.route,
          time: departure.schedule.time,
          totalBookings: departure.bookings.length,
          bookingsWithPhone: bookingsWithPhone.length,
          hoursUntilDeparture,
          hasLiveStatus: !!departure.liveDepartureStatus,
          canSendReminders: bookingsWithPhone.length > 0
        };
      });

      return NextResponse.json({
        success: true,
        data: {
          departures: departuresWithStats,
          timeRange: {
            start: startTime.toISOString(),
            end: endTime.toISOString(),
            hours
          }
        }
      });

    } catch (error) {
      console.error('Error fetching upcoming departures:', error);
      return NextResponse.json(
        { error: 'Failed to fetch upcoming departures' },
        { status: 500 }
      );
    }
  }, true); // Require admin access
}