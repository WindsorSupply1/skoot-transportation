import nodemailer from 'nodemailer';
import { prisma } from './prisma';

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

interface BookingWithDetails {
  id: string;
  bookingNumber: string;
  totalAmount: number;
  passengerCount: number;
  extraLuggageBags: number;
  extraLuggageFee: number;
  petCount: number;
  petFee: number;
  user: {
    email: string;
    firstName: string;
    lastName: string;
  };
  departure: {
    date: Date;
    schedule: {
      time: string;
      route: {
        name: string;
        origin: string;
        destination: string;
      };
    };
  };
  pickupLocation: { name: string; address: string };
  dropoffLocation: { name: string; address: string };
  returnDeparture?: {
    date: Date;
    schedule: {
      time: string;
      route: {
        name: string;
      };
    };
  } | null;
  passengers: Array<{
    firstName: string;
    lastName: string;
  }>;
  payment: {
    amount: number;
    paymentMethod: string | null;
    processedAt: Date | null;
  } | null;
}

export async function sendBookingConfirmationEmail(booking: BookingWithDetails) {
  try {
    const emailTemplate = await prisma.emailTemplate.findFirst({
      where: {
        name: 'BOOKING_CONFIRMATION',
        isActive: true
      }
    });

    if (!emailTemplate) {
      throw new Error('Booking confirmation email template not found');
    }

    const departureDate = new Date(booking.departure.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const departureTime = formatTime(booking.departure.schedule.time);
    const passengerList = booking.passengers.map(p => `${p.firstName} ${p.lastName}`).join(', ');

    // Replace template variables
    let emailBody = emailTemplate.htmlBody;
    let textBody = emailTemplate.textBody || '';

    const replacements = {
      '{{confirmationCode}}': booking.bookingNumber,
      '{{passengerNames}}': passengerList,
      '{{passengerCount}}': booking.passengerCount.toString(),
      '{{departureDate}}': departureDate,
      '{{departureTime}}': departureTime,
      '{{pickupLocation}}': booking.pickupLocation.name,
      '{{pickupAddress}}': booking.pickupLocation.address,
      '{{destination}}': booking.departure.schedule.route.destination,
      '{{routeName}}': booking.departure.schedule.route.name,
      '{{totalAmount}}': `$${booking.totalAmount.toFixed(2)}`,
      '{{extraLuggage}}': booking.extraLuggageBags.toString(),
      '{{pets}}': booking.petCount.toString(),
      '{{returnInfo}}': booking.returnDeparture 
        ? `Return: ${new Date(booking.returnDeparture.date).toLocaleDateString()} at ${formatTime(booking.returnDeparture.schedule.time)}`
        : 'One-way trip',
    };

    Object.entries(replacements).forEach(([key, value]) => {
      emailBody = emailBody.replace(new RegExp(key, 'g'), value);
      textBody = textBody.replace(new RegExp(key, 'g'), value);
    });

    const mailOptions = {
      from: `"Skoot Transportation" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: booking.user.email,
      subject: `Booking Confirmed - ${booking.bookingNumber} - Skoot Transportation`,
      html: emailBody,
      text: textBody,
    };

    const result = await transporter.sendMail(mailOptions);

    // Log email sent
    await prisma.emailLog.create({
      data: {
        bookingId: booking.id,
        recipientEmail: booking.user.email,
        emailType: 'BOOKING_CONFIRMATION',
        status: 'SENT',
        sentAt: new Date(),
        messageId: result.messageId,
      }
    });

    console.log('Booking confirmation email sent:', result.messageId);
    return true;

  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    
    // Log email failure
    await prisma.emailLog.create({
      data: {
        bookingId: booking.id,
        recipientEmail: booking.user.email,
        emailType: 'BOOKING_CONFIRMATION',
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      }
    });

    return false;
  }
}

export async function sendPaymentReceiptEmail(booking: BookingWithDetails) {
  try {
    const emailTemplate = await prisma.emailTemplate.findFirst({
      where: {
        name: 'PAYMENT_RECEIPT',
        isActive: true
      }
    });

    if (!emailTemplate || !booking.payment) {
      throw new Error('Payment receipt email template or payment info not found');
    }

    const paidDate = booking.payment.paidAt 
      ? new Date(booking.payment.paidAt).toLocaleDateString()
      : new Date().toLocaleDateString();

    let emailBody = emailTemplate.htmlBody;
    let textBody = emailTemplate.textBody || '';

    const replacements = {
      '{{confirmationCode}}': booking.bookingNumber,
      '{{paymentAmount}}': `$${booking.payment.amount.toFixed(2)}`,
      '{{paymentMethod}}': booking.payment.paymentMethod,
      '{{paymentDate}}': paidDate,
      '{{passengerCount}}': booking.passengerCount.toString(),
      '{{routeName}}': booking.departure.schedule.route.name,
    };

    Object.entries(replacements).forEach(([key, value]) => {
      emailBody = emailBody.replace(new RegExp(key, 'g'), value);
      textBody = textBody.replace(new RegExp(key, 'g'), value);
    });

    const mailOptions = {
      from: `"Skoot Transportation" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: booking.user.email,
      subject: `Payment Receipt - ${booking.bookingNumber} - Skoot Transportation`,
      html: emailBody,
      text: textBody,
    };

    const result = await transporter.sendMail(mailOptions);

    await prisma.emailLog.create({
      data: {
        bookingId: booking.id,
        recipientEmail: booking.user.email,
        emailType: 'PAYMENT_RECEIPT',
        status: 'SENT',
        sentAt: new Date(),
        messageId: result.messageId,
      }
    });

    console.log('Payment receipt email sent:', result.messageId);
    return true;

  } catch (error) {
    console.error('Error sending payment receipt email:', error);
    return false;
  }
}

export async function sendBookingReminderEmail(booking: BookingWithDetails, reminderType: 'DEPARTURE_REMINDER' = 'DEPARTURE_REMINDER') {
  try {
    const emailTemplate = await prisma.emailTemplate.findFirst({
      where: {
        name: reminderType,
        isActive: true
      }
    });

    if (!emailTemplate) {
      throw new Error(`Email template ${reminderType} not found`);
    }

    const departureDate = new Date(booking.departure.date).toLocaleDateString();
    const departureTime = formatTime(booking.departure.schedule.time);

    let emailBody = emailTemplate.htmlBody;
    let textBody = emailTemplate.textBody || '';

    const replacements = {
      '{{confirmationCode}}': booking.bookingNumber,
      '{{departureDate}}': departureDate,
      '{{departureTime}}': departureTime,
      '{{pickupLocation}}': booking.departure.pickupLocation?.name || 'TBD',
      '{{pickupAddress}}': booking.departure.pickupLocation?.address || 'TBD',
      '{{passengerCount}}': booking.passengerCount.toString(),
    };

    Object.entries(replacements).forEach(([key, value]) => {
      emailBody = emailBody.replace(new RegExp(key, 'g'), value);
      textBody = textBody.replace(new RegExp(key, 'g'), value);
    });

    const mailOptions = {
      from: `"Skoot Transportation" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: booking.user.email,
      subject: `Departure Reminder - ${booking.bookingNumber} - Skoot Transportation`,
      html: emailBody,
      text: textBody,
    };

    const result = await transporter.sendMail(mailOptions);

    await prisma.emailLog.create({
      data: {
        bookingId: booking.id,
        recipientEmail: booking.user.email,
        emailType: reminderType,
        status: 'SENT',
        sentAt: new Date(),
        messageId: result.messageId,
      }
    });

    return true;

  } catch (error) {
    console.error('Error sending reminder email:', error);
    return false;
  }
}

function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes);
  
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}