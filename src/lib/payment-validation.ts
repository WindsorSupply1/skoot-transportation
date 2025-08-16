import { z } from 'zod';

// Validation schemas
export const createPaymentIntentSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3).default('usd'),
});

export const pricingCalculationSchema = z.object({
  routeId: z.string().min(1, 'Route ID is required'),
  passengerCount: z.number().int().min(1, 'At least 1 passenger required').max(15, 'Maximum 15 passengers allowed'),
  customerType: z.enum(['REGULAR', 'STUDENT', 'MILITARY', 'LEGACY']).default('REGULAR'),
  ticketType: z.enum(['ADULT', 'CHILD', 'SENIOR']).default('ADULT'),
  isRoundTrip: z.boolean().default(false),
  extraLuggageBags: z.number().int().min(0).max(10).default(0),
  petCount: z.number().int().min(0).max(3).default(0),
  promoCode: z.string().optional(),
});

export const refundRequestSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  reason: z.string().optional(),
  amount: z.number().positive().optional(),
  notifyCustomer: z.boolean().default(true),
});

// Payment validation utilities
export class PaymentValidator {
  // Validate payment amount against booking
  static validatePaymentAmount(requestedAmount: number, bookingAmount: number): boolean {
    const requestedCents = Math.round(requestedAmount * 100);
    const bookingCents = Math.round(bookingAmount * 100);
    return requestedCents === bookingCents;
  }

  // Validate credit card number (basic Luhn algorithm check)
  static validateCreditCard(cardNumber: string): boolean {
    const cleaned = cardNumber.replace(/\D/g, '');
    
    if (cleaned.length < 13 || cleaned.length > 19) {
      return false;
    }

    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  // Validate email format
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate phone number (basic US format)
  static validatePhoneNumber(phone: string): boolean {
    const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    return phoneRegex.test(phone);
  }

  // Validate booking window (can't book past trips)
  static validateBookingDate(departureDate: Date): boolean {
    const now = new Date();
    const minBookingTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now
    return departureDate > minBookingTime;
  }

  // Validate departure capacity
  static validateCapacity(requestedSeats: number, availableSeats: number): boolean {
    return requestedSeats <= availableSeats && requestedSeats > 0;
  }

  // Validate promo code format
  static validatePromoCode(promoCode: string): boolean {
    if (!promoCode) return false;
    const promoRegex = /^[A-Z0-9]{3,15}$/;
    return promoRegex.test(promoCode.toUpperCase());
  }
}

// Error handling utilities
export class PaymentError extends Error {
  public code: string;
  public statusCode: number;
  public userMessage: string;

  constructor(
    message: string, 
    code: string = 'PAYMENT_ERROR', 
    statusCode: number = 400,
    userMessage?: string
  ) {
    super(message);
    this.name = 'PaymentError';
    this.code = code;
    this.statusCode = statusCode;
    this.userMessage = userMessage || this.getDefaultUserMessage(code);
  }

  private getDefaultUserMessage(code: string): string {
    switch (code) {
      case 'CARD_DECLINED':
        return 'Your card was declined. Please try a different payment method.';
      case 'INSUFFICIENT_FUNDS':
        return 'Your card has insufficient funds. Please use a different payment method.';
      case 'EXPIRED_CARD':
        return 'Your card has expired. Please use a different payment method.';
      case 'INVALID_CVC':
        return 'The security code you entered is invalid. Please check and try again.';
      case 'BOOKING_NOT_FOUND':
        return 'Booking not found. Please start over or contact support.';
      case 'PAYMENT_ALREADY_PROCESSED':
        return 'This booking has already been paid for.';
      case 'INVALID_AMOUNT':
        return 'The payment amount is invalid. Please refresh and try again.';
      case 'CAPACITY_EXCEEDED':
        return 'This departure is fully booked. Please select a different time.';
      case 'BOOKING_EXPIRED':
        return 'This booking has expired. Please start a new booking.';
      case 'INVALID_PROMO_CODE':
        return 'The promotional code you entered is invalid or expired.';
      default:
        return 'An error occurred processing your payment. Please try again.';
    }
  }
}

// Response formatting utilities
export class PaymentResponse {
  static success<T>(data: T, message?: string) {
    return {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    };
  }

  static error(
    error: string | PaymentError, 
    code?: string, 
    statusCode: number = 400
  ) {
    if (error instanceof PaymentError) {
      return {
        success: false,
        error: {
          message: error.message,
          code: error.code,
          userMessage: error.userMessage,
        },
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: false,
      error: {
        message: typeof error === 'string' ? error : 'Unknown error',
        code: code || 'UNKNOWN_ERROR',
        userMessage: 'An unexpected error occurred. Please try again.',
      },
      timestamp: new Date().toISOString(),
    };
  }
}

// Rate limiting utilities
export class RateLimiter {
  private static attempts = new Map<string, { count: number; resetTime: number }>();

  static isRateLimited(identifier: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(identifier);

    if (!attempts || now > attempts.resetTime) {
      this.attempts.set(identifier, { count: 1, resetTime: now + windowMs });
      return false;
    }

    if (attempts.count >= maxAttempts) {
      return true;
    }

    attempts.count++;
    return false;
  }

  static getRemainingTime(identifier: string): number {
    const attempts = this.attempts.get(identifier);
    if (!attempts) return 0;
    return Math.max(0, attempts.resetTime - Date.now());
  }

  static reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

// Security utilities
export class SecurityUtils {
  // Sanitize user input
  static sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '')
      .substring(0, 1000); // Limit length
  }

  // Generate secure booking reference
  static generateBookingReference(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `SKT${result}`;
  }

  // Hash sensitive data for logging
  static hashForLogging(sensitive: string): string {
    if (sensitive.length < 4) return '***';
    return sensitive.substring(0, 2) + '*'.repeat(sensitive.length - 4) + sensitive.slice(-2);
  }

  // Validate webhook timestamp to prevent replay attacks
  static validateWebhookTimestamp(timestamp: number, tolerance: number = 300): boolean {
    const now = Math.floor(Date.now() / 1000);
    return Math.abs(now - timestamp) <= tolerance;
  }
}

// Audit logging
export class AuditLogger {
  static async log(data: {
    action: string;
    userId?: string;
    bookingId?: string;
    amount?: number;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      ...data,
      // Hash sensitive data
      metadata: data.metadata ? this.sanitizeMetadata(data.metadata) : undefined,
    };

    console.log('AUDIT_LOG:', JSON.stringify(logEntry));
    
    // In production, you might want to send this to a dedicated logging service
    // like Winston, Logstash, or a database table
  }

  private static sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
    const sanitized = { ...metadata };
    const sensitiveKeys = ['card', 'ssn', 'password', 'token', 'key'];
    
    Object.keys(sanitized).forEach(key => {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }
}

// Type guards for runtime type checking
export const isValidBookingStatus = (status: string): status is 'PENDING' | 'CONFIRMED' | 'PAID' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED' => {
  return ['PENDING', 'CONFIRMED', 'PAID', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'REFUNDED'].includes(status);
};

export const isValidPaymentStatus = (status: string): status is 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED' => {
  return ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'].includes(status);
};

export const isValidCustomerType = (type: string): type is 'REGULAR' | 'STUDENT' | 'MILITARY' | 'LEGACY' => {
  return ['REGULAR', 'STUDENT', 'MILITARY', 'LEGACY'].includes(type);
};