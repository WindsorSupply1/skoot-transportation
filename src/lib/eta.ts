// Real-time ETA calculation service
// This service calculates estimated arrival times based on distance, traffic, and current location

interface ETAConfig {
  averageSpeedMph: number;
  trafficDelayFactor: number;
  pickupStopMinutes: number;
  bufferMinutes: number;
}

interface Location {
  lat: number;
  lng: number;
  name?: string;
}

interface ETACalculation {
  estimatedArrival: Date;
  totalMinutes: number;
  distanceKm: number;
  trafficDelay: number;
  confidence: number; // 0-100%
  lastUpdated: Date;
}

interface RouteSegment {
  from: Location;
  to: Location;
  distanceKm: number;
  estimatedMinutes: number;
}

class ETAService {
  private config: ETAConfig;

  constructor() {
    this.config = {
      averageSpeedMph: 45, // Average speed including city/highway
      trafficDelayFactor: 1.2, // 20% delay factor for traffic
      pickupStopMinutes: 3, // Time for passenger pickup
      bufferMinutes: 5 // Safety buffer
    };
  }

  // Calculate distance between two coordinates using Haversine formula
  calculateDistance(point1: Location, point2: Location): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(point2.lat - point1.lat);
    const dLng = this.toRadians(point2.lng - point1.lng);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.lat)) * Math.cos(this.toRadians(point2.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Calculate ETA from current location to destination
  calculateETA(
    currentLocation: Location,
    destination: Location,
    pickupStops: Location[] = [],
    departureTime?: Date
  ): ETACalculation {
    const now = new Date();
    const startTime = departureTime || now;

    // Build route segments
    const segments: RouteSegment[] = [];
    let currentPoint = currentLocation;

    // Add segments for pickup stops
    for (const stop of pickupStops) {
      const distance = this.calculateDistance(currentPoint, stop);
      const baseMinutes = (distance / this.config.averageSpeedMph) * 60;
      const adjustedMinutes = baseMinutes * this.config.trafficDelayFactor + this.config.pickupStopMinutes;
      
      segments.push({
        from: currentPoint,
        to: stop,
        distanceKm: distance,
        estimatedMinutes: adjustedMinutes
      });
      
      currentPoint = stop;
    }

    // Final segment to destination
    const finalDistance = this.calculateDistance(currentPoint, destination);
    const finalBaseMinutes = (finalDistance / this.config.averageSpeedMph) * 60;
    const finalAdjustedMinutes = finalBaseMinutes * this.config.trafficDelayFactor;
    
    segments.push({
      from: currentPoint,
      to: destination,
      distanceKm: finalDistance,
      estimatedMinutes: finalAdjustedMinutes
    });

    // Calculate totals
    const totalDistance = segments.reduce((sum, segment) => sum + segment.distanceKm, 0);
    const totalMinutes = segments.reduce((sum, segment) => sum + segment.estimatedMinutes, 0);
    const trafficDelay = totalMinutes - (totalDistance / this.config.averageSpeedMph) * 60;
    
    // Add buffer time
    const finalMinutes = totalMinutes + this.config.bufferMinutes;
    const estimatedArrival = new Date(startTime.getTime() + finalMinutes * 60 * 1000);

    // Calculate confidence based on factors
    const confidence = this.calculateConfidence(totalDistance, pickupStops.length, now);

    return {
      estimatedArrival,
      totalMinutes: Math.round(finalMinutes),
      distanceKm: Math.round(totalDistance * 10) / 10,
      trafficDelay: Math.round(trafficDelay),
      confidence,
      lastUpdated: now
    };
  }

  // Calculate confidence level based on various factors
  private calculateConfidence(distance: number, stopCount: number, time: Date): number {
    let confidence = 90; // Base confidence

    // Reduce confidence for longer distances
    if (distance > 100) confidence -= 10;
    else if (distance > 50) confidence -= 5;

    // Reduce confidence for more stops
    confidence -= stopCount * 3;

    // Reduce confidence during rush hours
    const hour = time.getHours();
    if ((hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 18)) {
      confidence -= 15; // Rush hour uncertainty
    }

    // Reduce confidence on weekends (different traffic patterns)
    const dayOfWeek = time.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      confidence -= 5;
    }

    return Math.max(50, Math.min(95, confidence)); // Clamp between 50-95%
  }

  // Get time-based traffic multiplier
  getTrafficMultiplier(time: Date): number {
    const hour = time.getHours();
    const dayOfWeek = time.getDay();

    // Weekend traffic is generally lighter
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return 1.1;
    }

    // Weekday traffic patterns
    if (hour >= 7 && hour <= 9) return 1.4; // Morning rush
    if (hour >= 16 && hour <= 18) return 1.5; // Evening rush
    if (hour >= 11 && hour <= 14) return 1.2; // Lunch traffic
    if (hour >= 22 || hour <= 6) return 0.9; // Late night/early morning

    return 1.2; // Default daytime traffic
  }

  // Update ETA based on current progress
  updateETAWithProgress(
    originalETA: ETACalculation,
    currentLocation: Location,
    destination: Location,
    progressPercentage: number
  ): ETACalculation {
    const remainingDistance = originalETA.distanceKm * (1 - progressPercentage / 100);
    const currentTrafficMultiplier = this.getTrafficMultiplier(new Date());
    
    // Recalculate remaining time
    const baseMinutes = (remainingDistance / this.config.averageSpeedMph) * 60;
    const adjustedMinutes = baseMinutes * currentTrafficMultiplier + this.config.bufferMinutes;
    
    const estimatedArrival = new Date(Date.now() + adjustedMinutes * 60 * 1000);
    
    // Adjust confidence based on progress
    const progressConfidenceBonus = progressPercentage * 0.2; // Up to 20% bonus for progress
    const confidence = Math.min(95, originalETA.confidence + progressConfidenceBonus);

    return {
      estimatedArrival,
      totalMinutes: Math.round(adjustedMinutes),
      distanceKm: Math.round(remainingDistance * 10) / 10,
      trafficDelay: Math.round(adjustedMinutes - baseMinutes),
      confidence: Math.round(confidence),
      lastUpdated: new Date()
    };
  }

  // Format ETA for display
  formatETA(eta: ETACalculation): string {
    const now = new Date();
    const minutesFromNow = Math.round((eta.estimatedArrival.getTime() - now.getTime()) / (1000 * 60));

    if (minutesFromNow < 1) {
      return 'Arriving now';
    } else if (minutesFromNow < 60) {
      return `${minutesFromNow} min`;
    } else {
      const hours = Math.floor(minutesFromNow / 60);
      const minutes = minutesFromNow % 60;
      return `${hours}h ${minutes}m`;
    }
  }

  // Get arrival time as formatted string
  formatArrivalTime(eta: ETACalculation): string {
    return eta.estimatedArrival.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  // Check if ETA needs updating (based on age)
  needsUpdate(eta: ETACalculation, maxAgeMinutes: number = 2): boolean {
    const ageMinutes = (Date.now() - eta.lastUpdated.getTime()) / (1000 * 60);
    return ageMinutes > maxAgeMinutes;
  }
}

// Export singleton instance
export const etaService = new ETAService();

// Predefined locations for common routes
export const COMMON_LOCATIONS = {
  // Columbia locations
  COLUMBIA_DOWNTOWN: { lat: 34.0007, lng: -81.0348, name: 'Columbia Downtown' },
  USC_CAMPUS: { lat: 34.0224, lng: -81.0557, name: 'USC Campus' },
  COLUMBIA_AIRPORT: { lat: 33.9388, lng: -81.1195, name: 'Columbia Airport' },
  
  // Charleston locations
  CHARLESTON_DOWNTOWN: { lat: 32.7765, lng: -79.9311, name: 'Charleston Downtown' },
  CHARLESTON_AIRPORT: { lat: 32.8987, lng: -80.0405, name: 'Charleston Airport' },
  FOLLY_BEACH: { lat: 32.6554, lng: -79.9398, name: 'Folly Beach' }
};

// Helper function to get location by name
export function getLocationByName(name: string): Location | undefined {
  return Object.values(COMMON_LOCATIONS).find(loc => 
    loc.name?.toLowerCase().includes(name.toLowerCase())
  );
}

// Helper function for quick ETA calculation between common routes
export function calculateQuickETA(
  fromLocationName: string,
  toLocationName: string,
  departureTime?: Date
): ETACalculation | null {
  const fromLocation = getLocationByName(fromLocationName);
  const toLocation = getLocationByName(toLocationName);
  
  if (!fromLocation || !toLocation) {
    return null;
  }
  
  return etaService.calculateETA(fromLocation, toLocation, [], departureTime);
}