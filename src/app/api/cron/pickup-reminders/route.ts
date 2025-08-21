import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { SMS_TEMPLATES, smsService } from '@/lib/sms';

const prisma = new PrismaClient();

// Automated pickup reminders for departures in the next 30 minutes
// This endpoint should be called by a cron service (Vercel Cron, GitHub Actions, etc.)
export async function POST(request: NextRequest) {
  try {
    // Verify the request is from an authorized source (basic security)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN;
    
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const now = new Date();
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
    const fortyMinutesFromNow = new Date(now.getTime() + 40 * 60 * 1000);

    // Find departures happening in the next 30-40 minutes that haven't received reminders
    const upcomingDepartures = await prisma.departure.findMany({
      where: {
        date: {
          gte: thirtyMinutesFromNow,
          lte: fortyMinutesFromNow
        },
        // Only include departures that haven't been reminded yet
        reminderSent: {
          not: true
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
            status: 'PAID' // Only confirmed bookings
          },
          include: {
            user: true,
            pickupLocation: true
          }
        },
        liveDepartureStatus: true
      }
    });

    console.log(`Found ${upcomingDepartures.length} departures needing pickup reminders`);

    const results = await Promise.all(
      upcomingDepartures.map(async (departure) => {
        try {
          const route = departure.schedule.route;
          const departureTime = departure.schedule.time;
          const trackingUrl = `/live/${departure.id}`;

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

          // Send reminders to all passengers
          const reminderResults = await Promise.all(
            departure.bookings.map(async (booking) => {
              const phoneNumber = booking.user?.phone || booking.guestPhone;
              if (!phoneNumber) return null;

              const pickupLocationName = booking.pickupLocation?.name || route.origin;
              
              const message = SMS_TEMPLATES.PICKUP_REMINDER(
                route.name,
                departureTime,
                pickupLocationName,
                trackingUrl
              );

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
                  errorMessage: smsResult.error
                }
              });

              return {
                bookingId: booking.id,
                phoneNumber,
                success: smsResult.success,
                error: smsResult.error
              };
            })
          );

          // Mark departure as reminded
          await prisma.departure.update({
            where: { id: departure.id },
            data: {
              reminderSent: true,
              reminderSentAt: new Date()
            }
          });

          const successCount = reminderResults.filter(r => r?.success).length;
          const failureCount = reminderResults.filter(r => r && !r.success).length;

          console.log(`Departure ${departure.id}: ${successCount} reminders sent, ${failureCount} failed`);

          return {
            departureId: departure.id,
            route: route.name,
            time: departureTime,
            totalBookings: departure.bookings.length,
            remindersSent: successCount,
            remindersFailed: failureCount,
            success: true
          };

        } catch (error) {
          console.error(`Error processing departure ${departure.id}:`, error);
          return {
            departureId: departure.id,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    const totalReminders = results.reduce((sum, r) => sum + (r.remindersSent || 0), 0);
    const totalFailures = results.reduce((sum, r) => sum + (r.remindersFailed || 0), 0);

    // Log the summary
    console.log(`Pickup reminder batch complete: ${totalReminders} sent, ${totalFailures} failed`);

    return NextResponse.json({
      success: true,
      data: {
        processedAt: new Date().toISOString(),
        departuresProcessed: upcomingDepartures.length,
        totalRemindersSent: totalReminders,
        totalRemindersFailed: totalFailures,
        results
      }
    });

  } catch (error) {
    console.error('Error in pickup reminder cron job:', error);
    return NextResponse.json(
      { 
        error: 'Pickup reminder cron job failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for manual testing and status checking
export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
    const fortyMinutesFromNow = new Date(now.getTime() + 40 * 60 * 1000);

    // Find upcoming departures that would be eligible for reminders
    const upcomingDepartures = await prisma.departure.findMany({
      where: {
        date: {
          gte: thirtyMinutesFromNow,
          lte: fortyMinutesFromNow
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
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    const eligibleBookings = upcomingDepartures.reduce((total, dep) => {
      return total + dep.bookings.filter(b => b.user?.phone || b.guestPhone).length;
    }, 0);

    return NextResponse.json({
      success: true,
      data: {
        currentTime: now.toISOString(),
        reminderWindow: {
          start: thirtyMinutesFromNow.toISOString(),
          end: fortyMinutesFromNow.toISOString()
        },
        upcomingDepartures: upcomingDepartures.length,
        eligibleBookings,
        departures: upcomingDepartures.map(dep => ({
          id: dep.id,
          route: dep.schedule.route.name,
          time: dep.schedule.time,
          date: dep.date,
          bookings: dep.bookings.length,
          reminderSent: dep.reminderSent,
          reminderSentAt: dep.reminderSentAt
        }))
      }
    });

  } catch (error) {
    console.error('Error checking pickup reminder status:', error);
    return NextResponse.json(
      { error: 'Failed to check pickup reminder status' },
      { status: 500 }
    );
  }
}