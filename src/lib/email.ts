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
        toEmail: booking.user.email,
        fromEmail: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@skoot.bike',
        subject: `Booking Confirmed - ${booking.bookingNumber} - Skoot Transportation`,
        status: 'SENT',
        sentAt: new Date(),
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
        toEmail: booking.user.email,
        fromEmail: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@skoot.bike',
        subject: `Booking Confirmed - ${booking.bookingNumber} - Skoot Transportation`,
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

    const paidDate = booking.payment.processedAt 
      ? new Date(booking.payment.processedAt).toLocaleDateString()
      : new Date().toLocaleDateString();

    let emailBody = emailTemplate.htmlBody;
    let textBody = emailTemplate.textBody || '';

    const replacements = {
      '{{confirmationCode}}': booking.bookingNumber,
      '{{paymentAmount}}': `$${booking.payment.amount.toFixed(2)}`,
      '{{paymentMethod}}': booking.payment.paymentMethod || 'Credit Card',
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
        toEmail: booking.user.email,
        fromEmail: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@skoot.bike',
        subject: `Payment Receipt - ${booking.bookingNumber} - Skoot Transportation`,
        status: 'SENT',
        sentAt: new Date(),
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
      '{{pickupLocation}}': booking.pickupLocation.name,
      '{{pickupAddress}}': booking.pickupLocation.address,
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
        toEmail: booking.user.email,
        fromEmail: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@skoot.bike',
        subject: `Departure Reminder - ${booking.bookingNumber} - Skoot Transportation`,
        status: 'SENT',
        sentAt: new Date(),
      }
    });

    return true;

  } catch (error) {
    console.error('Error sending reminder email:', error);
    return false;
  }
}

// Enhanced payment receipt email with detailed breakdown
export async function sendPaymentReceiptEmail(receiptData: {
  bookingNumber: string;
  receiptNumber?: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  currency: string;
  paymentDate: Date;
  transactionId: string;
  tripDetails: {
    route: string;
    date: string;
    passengers: number;
    pickupLocation: string;
    dropoffLocation: string;
  };
  processingFee?: number;
  netAmount?: number;
}) {
  try {
    const receiptTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt - SKOOT Transportation</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .receipt-box { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin: 20px 0; }
    .amount { font-size: 28px; font-weight: bold; color: #059669; text-align: center; margin: 20px 0; }
    .details-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    .details-table th, .details-table td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    .details-table th { background-color: #f3f4f6; font-weight: 600; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; }
    .badge { display: inline-block; background-color: #059669; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin: 5px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚌 SKOOT Transportation</h1>
      <h2>Payment Receipt</h2>
    </div>
    
    <div class="content">
      <div class="badge">✅ PAYMENT SUCCESSFUL</div>
      
      <div class="receipt-box">
        <div class="amount">$${receiptData.amount.toFixed(2)} ${receiptData.currency.toUpperCase()}</div>
        
        <table class="details-table">
          <tr><th>Receipt Number:</th><td>${receiptData.receiptNumber || 'N/A'}</td></tr>
          <tr><th>Booking Number:</th><td>${receiptData.bookingNumber}</td></tr>
          <tr><th>Customer:</th><td>${receiptData.customerName}</td></tr>
          <tr><th>Payment Date:</th><td>${receiptData.paymentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
          <tr><th>Transaction ID:</th><td>${receiptData.transactionId}</td></tr>
        </table>
      </div>

      <div class="receipt-box">
        <h3>🎫 Trip Details</h3>
        <table class="details-table">
          <tr><th>Route:</th><td>${receiptData.tripDetails.route}</td></tr>
          <tr><th>Travel Date:</th><td>${new Date(receiptData.tripDetails.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
          <tr><th>Passengers:</th><td>${receiptData.tripDetails.passengers}</td></tr>
          <tr><th>Pickup Location:</th><td>${receiptData.tripDetails.pickupLocation}</td></tr>
          <tr><th>Drop-off Location:</th><td>${receiptData.tripDetails.dropoffLocation}</td></tr>
        </table>
      </div>

      ${receiptData.processingFee ? `
      <div class="receipt-box">
        <h3>💳 Payment Breakdown</h3>
        <table class="details-table">
          <tr><th>Ticket Amount:</th><td>$${(receiptData.amount - receiptData.processingFee).toFixed(2)}</td></tr>
          <tr><th>Processing Fee:</th><td>$${receiptData.processingFee.toFixed(2)}</td></tr>
          <tr style="border-top: 2px solid #2563eb;"><th><strong>Total Paid:</strong></th><td><strong>$${receiptData.amount.toFixed(2)}</strong></td></tr>
        </table>
      </div>
      ` : ''}

      <div class="receipt-box">
        <h3>📋 Important Information</h3>
        <ul>
          <li>Keep this receipt for your records</li>
          <li>Arrive 10 minutes before departure time</li>
          <li>Bring a valid ID for travel</li>
          <li>Contact us at support@skoot.bike for any questions</li>
        </ul>
      </div>
    </div>
    
    <div class="footer">
      <p>Thank you for choosing SKOOT Transportation!</p>
      <p>This is an automated email. Please do not reply to this message.</p>
      <p>© ${new Date().getFullYear()} SKOOT Transportation. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

    const textReceipt = `
SKOOT Transportation - Payment Receipt
=====================================

✅ PAYMENT SUCCESSFUL

Amount Paid: $${receiptData.amount.toFixed(2)} ${receiptData.currency.toUpperCase()}

Receipt Details:
- Receipt Number: ${receiptData.receiptNumber || 'N/A'}
- Booking Number: ${receiptData.bookingNumber}
- Customer: ${receiptData.customerName}
- Payment Date: ${receiptData.paymentDate.toLocaleDateString()}
- Transaction ID: ${receiptData.transactionId}

Trip Details:
- Route: ${receiptData.tripDetails.route}
- Travel Date: ${new Date(receiptData.tripDetails.date).toLocaleDateString()}
- Passengers: ${receiptData.tripDetails.passengers}
- Pickup: ${receiptData.tripDetails.pickupLocation}
- Drop-off: ${receiptData.tripDetails.dropoffLocation}

${receiptData.processingFee ? `
Payment Breakdown:
- Ticket Amount: $${(receiptData.amount - receiptData.processingFee).toFixed(2)}
- Processing Fee: $${receiptData.processingFee.toFixed(2)}
- Total Paid: $${receiptData.amount.toFixed(2)}
` : ''}

Important Information:
- Keep this receipt for your records
- Arrive 10 minutes before departure time
- Bring a valid ID for travel
- Contact us at support@skoot.bike for questions

Thank you for choosing SKOOT Transportation!
`;

    const mailOptions = {
      from: `"SKOOT Transportation" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: receiptData.customerEmail,
      subject: `Payment Receipt ${receiptData.bookingNumber} - SKOOT Transportation`,
      html: receiptTemplate,
      text: textReceipt,
    };

    const result = await transporter.sendMail(mailOptions);

    // Log email sent
    await prisma.emailLog.create({
      data: {
        toEmail: receiptData.customerEmail,
        fromEmail: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@skoot.bike',
        subject: `Payment Receipt ${receiptData.bookingNumber} - SKOOT Transportation`,
        status: 'SENT',
        sentAt: new Date(),
      }
    });

    console.log('Payment receipt email sent:', result.messageId);
    return true;

  } catch (error) {
    console.error('Error sending payment receipt email:', error);
    
    // Log email failure
    await prisma.emailLog.create({
      data: {
        toEmail: receiptData.customerEmail,
        fromEmail: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@skoot.bike',
        subject: `Payment Receipt ${receiptData.bookingNumber} - SKOOT Transportation`,
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      }
    });

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