'use client';

import React from 'react';
import { MapPin, Clock, Users, Star, Phone, Mail } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Skoot Transportation</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="/schedule" className="text-gray-600 hover:text-gray-900">Schedule</a>
              <a href="/pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
              <a href="/contact" className="text-gray-600 hover:text-gray-900">Contact</a>
              <a href="/faq" className="text-gray-600 hover:text-gray-900">FAQ</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Columbia to Charlotte Airport
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Reliable, comfortable shuttle service • Every even hour • 7 days a week
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-orange-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors text-lg"
              >
                Book Now
              </button>
              <a 
                href="#schedule" 
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-800 transition-colors"
              >
                View Schedule
              </a>
              <a 
                href="tel:+1-803-SKOOT-SC" 
                className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-800 transition-colors"
              >
                Call to Book
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Section */}
      <section id="booking-section" className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Book Your Trip</h2>
            <p className="text-lg text-gray-600">Select your departure time and pickup location</p>
          </div>

          <div className="bg-gray-50 p-8 rounded-lg shadow-lg">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Schedule */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Daily Schedule</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-white rounded border">
                    <span className="font-medium">6:00 AM</span>
                    <span className="text-green-600 text-sm">Available</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded border">
                    <span className="font-medium">8:00 AM</span>
                    <span className="text-green-600 text-sm">Available</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded border">
                    <span className="font-medium">10:00 AM</span>
                    <span className="text-green-600 text-sm">Available</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded border">
                    <span className="font-medium">12:00 PM</span>
                    <span className="text-green-600 text-sm">Available</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded border">
                    <span className="font-medium">2:00 PM</span>
                    <span className="text-green-600 text-sm">Available</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded border">
                    <span className="font-medium">6:00 PM</span>
                    <span className="text-green-600 text-sm">Available</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded border">
                    <span className="font-medium">8:00 PM</span>
                    <span className="text-green-600 text-sm">Available</span>
                  </div>
                </div>
              </div>

              {/* Pickup Locations */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Pickup Locations</h3>
                <div className="space-y-2">
                  <div className="p-3 bg-white rounded border hover:border-blue-500 cursor-pointer">
                    <div className="font-medium">Downtown Columbia</div>
                    <div className="text-sm text-gray-600">1425 Richland St</div>
                  </div>
                  <div className="p-3 bg-white rounded border hover:border-blue-500 cursor-pointer">
                    <div className="font-medium">USC Campus - Russell House</div>
                    <div className="text-sm text-gray-600">1400 Greene St</div>
                  </div>
                  <div className="p-3 bg-white rounded border hover:border-blue-500 cursor-pointer">
                    <div className="font-medium">Fort Jackson Main Gate</div>
                    <div className="text-sm text-gray-600">4442 Jackson Blvd</div>
                  </div>
                  <div className="p-3 bg-white rounded border hover:border-blue-500 cursor-pointer">
                    <div className="font-medium">Hampton Inn Downtown</div>
                    <div className="text-sm text-gray-600">822 Gervais St</div>
                  </div>
                  <div className="p-3 bg-white rounded border hover:border-blue-500 cursor-pointer">
                    <div className="font-medium">Hotel Trundle</div>
                    <div className="text-sm text-gray-600">1224 Taylor St</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <div className="mb-4">
                <p className="text-lg font-semibold text-gray-900">Ready to book?</p>
                <p className="text-gray-600">Call us or book online</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="tel:+1-803-SKOOT-SC" 
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Call +1-803-SKOOT-SC
                </a>
                <a 
                  href="mailto:hello@skoot.bike?subject=Booking Request&body=I would like to book a trip from Columbia to Charlotte Airport." 
                  className="bg-orange-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
                >
                  Email to Book
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Skoot?</h2>
            <p className="text-lg text-gray-600">Comfortable, reliable, and affordable transportation</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Regular Schedule</h3>
              <p className="text-gray-600">Departures every even hour, 7 days a week. Reliable and predictable.</p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Comfortable Vans</h3>
              <p className="text-gray-600">15-passenger Mercedes Sprinter vans with plenty of space.</p>
            </div>

            <div className="text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Multiple Pickups</h3>
              <p className="text-gray-600">Downtown, USC Campus, Fort Jackson, and hotel locations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple Pricing</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-2">Legacy Rate</h3>
              <div className="text-3xl font-bold text-blue-600 mb-2">$31</div>
              <p className="text-gray-600 mb-4">First 100 customers - locked in forever!</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-2">Regular Adult</h3>
              <div className="text-3xl font-bold text-gray-900 mb-2">$35</div>
              <p className="text-gray-600 mb-4">Standard one-way fare</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-2">Student/Military</h3>
              <div className="text-3xl font-bold text-green-600 mb-2">$32</div>
              <p className="text-gray-600 mb-4">With valid ID</p>
            </div>
          </div>

          <div className="text-center mt-8">
            <a href="/pricing" className="text-blue-600 hover:text-blue-800 font-semibold">
              View Full Pricing →
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  <span>+1-803-SKOOT-SC</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  <span>hello@skoot.bike</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <div className="space-y-2">
                <a href="/schedule" className="block hover:text-gray-300">Schedule</a>
                <a href="/pricing" className="block hover:text-gray-300">Pricing</a>
                <a href="/faq" className="block hover:text-gray-300">FAQ</a>
                <a href="/contact" className="block hover:text-gray-300">Contact</a>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Route</h3>
              <p className="text-gray-300">
                Columbia, SC → Charlotte Douglas International Airport (CLT)
              </p>
              <p className="text-gray-300 mt-2">
                With a convenient stop in Rock Hill
              </p>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © 2025 Skoot Transportation. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}