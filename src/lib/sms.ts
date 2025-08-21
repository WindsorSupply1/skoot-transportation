// SMS notification service using Twilio
// This service handles sending SMS notifications to customers

interface SMSConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

interface SMSMessage {
  to: string;
  message: string;
  trackingUrl?: string;
}

interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

class SMSService {
  private config: SMSConfig;
  private isEnabled: boolean;

  constructor() {
    this.config = {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      fromNumber: process.env.TWILIO_FROM_NUMBER || '+1234567890'
    };
    
    this.isEnabled = !!(this.config.accountSid && this.config.authToken);
    
    if (!this.isEnabled) {
      console.warn('SMS service disabled: Twilio credentials not configured');
    }
  }

  async sendSMS({ to, message, trackingUrl }: SMSMessage): Promise<SMSResponse> {
    if (!this.isEnabled) {
      console.log('SMS service disabled, would send:', { to, message });
      return { success: false, error: 'SMS service not configured' };
    }

    try {
      // Clean phone number (remove non-digits, ensure +1 prefix)
      const cleanPhone = this.formatPhoneNumber(to);
      
      if (!cleanPhone) {
        return { success: false, error: 'Invalid phone number format' };
      }

      // Add tracking link if provided
      let fullMessage = message;
      if (trackingUrl) {
        fullMessage += `\n\nTrack live: https://skoot.bike${trackingUrl}`;
      }

      // In development, just log the message
      if (process.env.NODE_ENV === 'development') {
        console.log('📱 SMS (DEV MODE):', {
          to: cleanPhone,
          from: this.config.fromNumber,
          message: fullMessage
        });
        return { success: true, messageId: `dev_${Date.now()}` };
      }

      // Use Twilio in production
      const twilio = require('twilio')(this.config.accountSid, this.config.authToken);
      
      const result = await twilio.messages.create({
        body: fullMessage,
        from: this.config.fromNumber,
        to: cleanPhone
      });

      return { success: true, messageId: result.sid };

    } catch (error: any) {
      console.error('SMS sending failed:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to send SMS' 
      };
    }
  }

  private formatPhoneNumber(phone: string): string | null {
    if (!phone) return null;
    
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Handle US phone numbers
    if (digits.length === 10) {
      return `+1${digits}`;
    } else if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    } else if (digits.startsWith('1') && digits.length === 11) {
      return `+${digits}`;
    }
    
    // If already has + prefix, use as-is
    if (phone.startsWith('+')) {
      return phone;
    }
    
    return null;
  }

  // Batch send multiple SMS messages
  async sendBulkSMS(messages: SMSMessage[]): Promise<SMSResponse[]> {
    const results = await Promise.allSettled(
      messages.map(message => this.sendSMS(message))
    );

    return results.map(result => 
      result.status === 'fulfilled' 
        ? result.value 
        : { success: false, error: 'Batch send failed' }
    );
  }

  // Verify phone number format
  isValidPhoneNumber(phone: string): boolean {
    return this.formatPhoneNumber(phone) !== null;
  }

  // Get service status
  getStatus(): { enabled: boolean; configured: boolean } {
    return {
      enabled: this.isEnabled,
      configured: !!(this.config.accountSid && this.config.authToken && this.config.fromNumber)
    };
  }
}

// Export singleton instance
export const smsService = new SMSService();

// Message templates for different trip events
export const SMS_TEMPLATES = {
  BOOKING_CONFIRMED: (route: string, date: string, time: string, trackingUrl: string) =>
    `✅ SKOOT booking confirmed! ${route} on ${date} at ${time}. Track your van: https://skoot.bike${trackingUrl}`,
    
  BOARDING_STARTED: (route: string, location: string, trackingUrl: string) =>
    `🚌 Your SKOOT van is now boarding at ${location}. Track live: https://skoot.bike${trackingUrl}`,
    
  DEPARTED: (origin: string, destination: string, eta: string, trackingUrl: string) =>
    `🛣️ Your SKOOT van has departed ${origin} en route to ${destination}. ETA: ${eta}. Track live: https://skoot.bike${trackingUrl}`,
    
  DELAYED: (delayMinutes: number, reason: string, trackingUrl: string) =>
    `⚠️ Your SKOOT van is delayed by ${delayMinutes} minutes${reason ? `: ${reason}` : ''}. Track live: https://skoot.bike${trackingUrl}`,
    
  ARRIVED: (destination: string, driverName: string, driverPhone: string) =>
    `✅ Your SKOOT van has arrived at ${destination}! Look for driver ${driverName}. Call if needed: ${driverPhone}`,
    
  TRIP_COMPLETED: (route: string) =>
    `🏁 Your SKOOT trip (${route}) is complete. Thank you for riding with us! Rate your trip: https://skoot.bike/feedback`,
    
  EMERGENCY: (route: string, supportPhone: string) =>
    `🚨 Your SKOOT van (${route}) is experiencing an emergency. Please call support immediately: ${supportPhone}`,
    
  PICKUP_REMINDER: (route: string, time: string, location: string, trackingUrl: string) =>
    `⏰ Reminder: Your SKOOT van (${route}) departs in 30 minutes at ${time} from ${location}. Track: https://skoot.bike${trackingUrl}`
};

// Helper function to send trip status SMS
export async function sendTripStatusSMS(
  phoneNumber: string,
  status: string,
  tripData: any,
  trackingUrl?: string
): Promise<SMSResponse> {
  const { route, destination, driverName, driverPhone } = tripData;
  
  let message = '';
  
  switch (status) {
    case 'BOARDING':
      message = SMS_TEMPLATES.BOARDING_STARTED(route.name, route.origin, trackingUrl || '');
      break;
      
    case 'EN_ROUTE':
      const eta = new Date(Date.now() + 120 * 60 * 1000).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      message = SMS_TEMPLATES.DEPARTED(route.origin, route.destination, eta, trackingUrl || '');
      break;
      
    case 'DELAYED':
      message = SMS_TEMPLATES.DELAYED(15, tripData.delayReason || '', trackingUrl || '');
      break;
      
    case 'ARRIVED':
      message = SMS_TEMPLATES.ARRIVED(route.destination, driverName || 'your driver', driverPhone || '(555) 123-4567');
      break;
      
    case 'COMPLETED':
      message = SMS_TEMPLATES.TRIP_COMPLETED(route.name);
      break;
      
    default:
      message = `Your SKOOT trip status: ${status}. Track live: https://skoot.bike${trackingUrl}`;
  }
  
  return await smsService.sendSMS({
    to: phoneNumber,
    message,
    trackingUrl
  });
}