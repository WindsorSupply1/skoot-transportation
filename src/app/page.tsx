'use client';

import React, { useState } from 'react';
import { 
  MapPin, 
  Clock, 
  Phone, 
  Mail, 
  Users,
  DollarSign,
  CheckCircle,
  Star,
  ChevronDown,
  ChevronUp,
  Calendar,
  Shield,
  Wifi,
  Car
} from 'lucide-react';

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      question: "What are your operating hours?",
      answer: "We operate departures at 6:00 AM, 8:00 AM, 10:00 AM, 12:00 PM, 2:00 PM, 6:00 PM, and 8:00 PM, 7 days a week."
    },
    {
      question: "How long does the trip take?",
      answer: "The journey from Columbia to Charlotte Airport takes approximately 100-130 minutes, including a 10-minute stop in Rock Hill."
    },
    {
      question: "What are your pickup locations?",
      answer: "We pick up from two convenient locations in Columbia: across from Hotel Trundle downtown and at McDonald's on Parklane Road."
    },
    {
      question: "How much does it cost?",
      answer: "Regular adult fare is $35. Students and military personnel pay $32 with valid ID. Our first 100 customers get a lifetime rate of $31."
    },
    {
      question: "Can I bring luggage?",
      answer: "Yes! Standard luggage is included. Extra bags are $5 each. We accommodate standard airline luggage sizes."
    },
    {
      question: "Are pets allowed?",
      answer: "Yes, we welcome pets for an additional $10 fee. Pets must be in carriers or on leash and well-behaved."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-sm border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-orange-600">SKOOT</div>
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="#schedule" className="text-gray-700 hover:text-orange-600 font-medium transition-colors">Schedule</a>
              <a href="#pricing" className="text-gray-700 hover:text-orange-600 font-medium transition-colors">Pricing</a>
              <a href="#about" className="text-gray-700 hover:text-orange-600 font-medium transition-colors">About</a>
              <a href="#contact" className="text-gray-700 hover:text-orange-600 font-medium transition-colors">Contact</a>
            </div>
            <div className="flex items-center">
              <a 
                href="tel:+1-803-SKOOT-SC" 
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Book Now
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Promo Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-2 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm font-medium">🎉 First 100 customers get lifetime $31 pricing! Book today!</p>
        </div>
      </div>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
              Columbia to<br />
              <span className="text-orange-600">Charlotte Airport</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Professional shuttle service • Every 2 hours • 7 days a week
            </p>
          </div>

          {/* Booking Widget */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Book Your Trip</h2>
              
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                {/* Schedule */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-orange-600" />
                    Daily Departures
                  </h3>
                  <div className="space-y-2">
                    {['6:00 AM', '8:00 AM', '10:00 AM', '12:00 PM', '2:00 PM', '6:00 PM', '8:00 PM'].map((time) => (
                      <div key={time} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-orange-50 transition-colors cursor-pointer">
                        <span className="font-medium text-gray-900">{time}</span>
                        <span className="text-green-600 text-sm font-medium">Available</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pickup Locations */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-orange-600" />
                    Pickup Locations
                  </h3>
                  <div className="space-y-3">
                    <div className="p-4 bg-gray-50 rounded-lg hover:bg-orange-50 transition-colors cursor-pointer">
                      <div className="font-medium text-gray-900">Downtown Columbia</div>
                      <div className="text-sm text-gray-600">Across from Hotel Trundle</div>
                      <div className="text-xs text-gray-500">1224 Taylor St area</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg hover:bg-orange-50 transition-colors cursor-pointer">
                      <div className="font-medium text-gray-900">Parklane Road</div>
                      <div className="text-sm text-gray-600">McDonald's parking area</div>
                      <div className="text-xs text-gray-500">Parklane Rd, Columbia</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-800">
                      <strong>Destination:</strong> Charlotte Douglas Int'l Airport (CLT)<br />
                      <strong>Stop:</strong> 10-minute break in Rock Hill
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="tel:+1-803-SKOOT-SC" 
                  className="flex items-center justify-center bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors shadow-lg"
                >
                  <Phone className="w-5 h-5 mr-2" />
                  Call to Book: +1-803-SKOOT-SC
                </a>
                <a 
                  href="mailto:hello@skoot.bike?subject=Booking Request&body=I would like to book a trip from Columbia to Charlotte Airport." 
                  className="flex items-center justify-center bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors shadow-lg"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Email: hello@skoot.bike
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Skoot?</h2>
            <p className="text-xl text-gray-600">Professional transportation you can count on</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200 transition-colors">
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Reliable Schedule</h3>
              <p className="text-gray-600">Every 2 hours, 7 days a week. No cancellations.</p>
            </div>

            <div className="text-center group">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200 transition-colors">
                <Car className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Comfortable Vans</h3>
              <p className="text-gray-600">15-passenger Mercedes Sprinter vans with AC.</p>
            </div>

            <div className="text-center group">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200 transition-colors">
                <Shield className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Licensed & Insured</h3>
              <p className="text-gray-600">Professional drivers, fully licensed and insured.</p>
            </div>

            <div className="text-center group">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200 transition-colors">
                <DollarSign className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Great Value</h3>
              <p className="text-gray-600">From $31. No hidden fees or surprises.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600">No hidden fees. No surprises. Just reliable transportation.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {/* Legacy Price */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-2xl shadow-lg transform hover:scale-105 transition-transform">
              <div className="text-center">
                <div className="text-sm font-medium mb-2 opacity-90">LEGACY RATE</div>
                <div className="text-4xl font-bold mb-2">$31</div>
                <div className="text-sm opacity-90 mb-4">First 100 customers</div>
                <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium">LOCKED FOREVER</div>
              </div>
            </div>

            {/* Student Price */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-blue-200 transform hover:scale-105 transition-transform">
              <div className="text-center">
                <div className="text-sm font-medium text-blue-600 mb-2">STUDENT</div>
                <div className="text-4xl font-bold text-gray-900 mb-2">$32</div>
                <div className="text-sm text-gray-600 mb-4">With valid student ID</div>
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">USC & LOCAL</div>
              </div>
            </div>

            {/* Military Price */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-green-200 transform hover:scale-105 transition-transform">
              <div className="text-center">
                <div className="text-sm font-medium text-green-600 mb-2">MILITARY</div>
                <div className="text-4xl font-bold text-gray-900 mb-2">$32</div>
                <div className="text-sm text-gray-600 mb-4">With military ID</div>
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">FORT JACKSON</div>
              </div>
            </div>

            {/* Regular Price */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-gray-200 transform hover:scale-105 transition-transform">
              <div className="text-center">
                <div className="text-sm font-medium text-gray-600 mb-2">REGULAR</div>
                <div className="text-4xl font-bold text-gray-900 mb-2">$35</div>
                <div className="text-sm text-gray-600 mb-4">Standard fare</div>
                <div className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-medium">ONE WAY</div>
              </div>
            </div>
          </div>

          {/* Add-ons */}
          <div className="mt-12 max-w-2xl mx-auto">
            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Add-On Services</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Extra luggage (per bag)</span>
                  <span className="font-semibold text-gray-900">$5</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Pet transport</span>
                  <span className="font-semibold text-gray-900">$10</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
            <div className="flex justify-center items-center mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
              ))}
              <span className="ml-2 text-gray-600">4.9/5 from 150+ reviews</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-8 rounded-2xl">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-6 italic">"Perfect for my weekly business trips to Charlotte. The drivers are professional and the schedule is incredibly reliable. Never had a delay!"</p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center mr-4">
                  <span className="text-orange-700 font-semibold">JL</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">John Lewis</div>
                  <div className="text-sm text-gray-600">Business Executive</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-8 rounded-2xl">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-6 italic">"Much better than driving myself and paying for airport parking. The student discount makes it very affordable. Highly recommend!"</p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center mr-4">
                  <span className="text-blue-700 font-semibold">SM</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Sarah Martinez</div>
                  <div className="text-sm text-gray-600">USC Student</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-8 rounded-2xl">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-6 italic">"Reliable transportation from Fort Jackson to CLT. The military discount is appreciated and the service is always on time. Great value!"</p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center mr-4">
                  <span className="text-green-700 font-semibold">MW</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Mike Wilson</div>
                  <div className="text-sm text-gray-600">Army Officer</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Early Bird CTA */}
      <section className="py-20 bg-gradient-to-r from-orange-500 to-orange-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Book Your Trip?</h2>
          <p className="text-xl text-orange-100 mb-8">Join the hundreds of satisfied customers who trust Skoot Transportation</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="tel:+1-803-SKOOT-SC" 
              className="bg-white text-orange-600 hover:bg-gray-100 px-8 py-4 rounded-xl font-semibold text-lg transition-colors shadow-lg"
            >
              Call +1-803-SKOOT-SC
            </a>
            <a 
              href="mailto:hello@skoot.bike?subject=Booking Request&body=I would like to book a trip from Columbia to Charlotte Airport." 
              className="bg-orange-700 hover:bg-orange-800 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors shadow-lg"
            >
              Email hello@skoot.bike
            </a>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600">Everything you need to know about our service</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg border border-gray-100">
                <button
                  className="w-full px-8 py-6 text-left flex justify-between items-center hover:bg-gray-50 rounded-2xl transition-colors"
                  onClick={() => toggleFaq(index)}
                >
                  <span className="font-semibold text-gray-900 text-lg">{faq.question}</span>
                  {openFaq === index ? (
                    <ChevronUp className="w-6 h-6 text-orange-600" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-orange-600" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-8 pb-6">
                    <p className="text-gray-600 text-lg leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="text-3xl font-bold text-orange-500 mb-4">SKOOT</div>
              <p className="text-gray-300 mb-6 text-lg leading-relaxed">
                Professional shuttle service from Columbia, SC to Charlotte Douglas International Airport. 
                Reliable, comfortable, and affordable transportation you can count on.
              </p>
              <div className="flex space-x-4">
                <a 
                  href="tel:+1-803-SKOOT-SC" 
                  className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Call Now
                </a>
                <a 
                  href="mailto:hello@skoot.bike" 
                  className="border border-gray-600 hover:border-gray-500 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Email Us
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4">Schedule</h4>
              <div className="text-gray-300 space-y-2">
                <p>Every day of the week:</p>
                <p className="text-sm">6AM • 8AM • 10AM • 12PM</p>
                <p className="text-sm">2PM • 6PM • 8PM</p>
                <p className="mt-3 text-sm">Journey: 100-130 minutes</p>
                <p className="text-sm">Includes Rock Hill stop</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4">Locations</h4>
              <div className="text-gray-300 space-y-3">
                <div>
                  <p className="font-medium">Downtown Columbia</p>
                  <p className="text-sm">Across from Hotel Trundle</p>
                </div>
                <div>
                  <p className="font-medium">Parklane Road</p>
                  <p className="text-sm">McDonald's parking area</p>
                </div>
                <div className="mt-4">
                  <p className="font-medium">Destination</p>
                  <p className="text-sm">Charlotte Douglas Int'l Airport</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                © 2025 Skoot Transportation. All rights reserved. Licensed and insured shuttle service.
              </p>
              <div className="flex items-center mt-4 md:mt-0">
                <span className="text-gray-400 text-sm mr-4">Contact:</span>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-gray-300">+1-803-SKOOT-SC</span>
                  <span className="text-gray-600">•</span>
                  <span className="text-gray-300">hello@skoot.bike</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}