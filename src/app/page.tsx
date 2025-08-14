'use client';

import React, { useState } from 'react';
import { 
  MapPin, 
  Clock, 
  Phone, 
  Mail, 
  Calendar,
  Users,
  DollarSign,
  ArrowRight,
  CheckCircle,
  Star,
  ChevronDown,
  ChevronUp
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
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">SKOOT</h1>
              <span className="ml-2 text-gray-600 font-medium">Transportation</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#schedule" className="text-gray-600 hover:text-blue-600 font-medium">Schedule</a>
              <a href="#fares" className="text-gray-600 hover:text-blue-600 font-medium">Fares</a>
              <a href="#benefits" className="text-gray-600 hover:text-blue-600 font-medium">Benefits</a>
              <a href="#faq" className="text-gray-600 hover:text-blue-600 font-medium">FAQ</a>
              <a href="#contact" className="text-gray-600 hover:text-blue-600 font-medium">Contact</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-blue-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Columbia → Charlotte Airport
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8">
              Reliable shuttle service • Every 2 hours • 7 days a week
            </p>
            
            {/* Booking Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <a 
                href="tel:+1-803-SKOOT-SC" 
                className="inline-flex items-center bg-orange-500 text-white px-8 py-4 rounded-lg font-semibold hover:bg-orange-600 transition-colors text-lg shadow-lg"
              >
                <Phone className="w-5 h-5 mr-2" />
                Book by Phone
              </a>
              <a 
                href="mailto:hello@skoot.bike?subject=Booking Request&body=I would like to book a trip from Columbia to Charlotte Airport." 
                className="inline-flex items-center bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-lg shadow-lg"
              >
                <Mail className="w-5 h-5 mr-2" />
                Book by Email
              </a>
            </div>

            {/* Quick Info Cards */}
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <Clock className="w-8 h-8 text-blue-600 mb-3 mx-auto" />
                <h3 className="font-semibold text-gray-900 mb-2">Every 2 Hours</h3>
                <p className="text-gray-600 text-sm">7 departures daily</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <MapPin className="w-8 h-8 text-green-600 mb-3 mx-auto" />
                <h3 className="font-semibold text-gray-900 mb-2">2 Pickup Locations</h3>
                <p className="text-gray-600 text-sm">Downtown & Parklane</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <DollarSign className="w-8 h-8 text-orange-600 mb-3 mx-auto" />
                <h3 className="font-semibold text-gray-900 mb-2">From $31</h3>
                <p className="text-gray-600 text-sm">Legacy pricing available</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Schedule Section */}
      <section id="schedule" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Daily Schedule</h2>
            <p className="text-lg text-gray-600">7 departures daily, every day of the week</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Schedule */}
            <div className="bg-gray-50 p-8 rounded-lg">
              <h3 className="text-xl font-semibold mb-6 text-gray-900 text-center">Departure Times</h3>
              <div className="space-y-3">
                {['6:00 AM', '8:00 AM', '10:00 AM', '12:00 PM', '2:00 PM', '6:00 PM', '8:00 PM'].map((time) => (
                  <div key={time} className="flex justify-between items-center p-4 bg-white rounded-lg border">
                    <span className="font-semibold text-lg">{time}</span>
                    <span className="text-green-600 font-medium">Available</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pickup Locations */}
            <div className="bg-gray-50 p-8 rounded-lg">
              <h3 className="text-xl font-semibold mb-6 text-gray-900 text-center">Pickup Locations</h3>
              <div className="space-y-4">
                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex items-start">
                    <MapPin className="w-6 h-6 text-blue-600 mt-1 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Downtown Columbia</h4>
                      <p className="text-gray-600">Across from Hotel Trundle</p>
                      <p className="text-sm text-gray-500">1224 Taylor St area</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex items-start">
                    <MapPin className="w-6 h-6 text-blue-600 mt-1 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Parklane Road</h4>
                      <p className="text-gray-600">McDonald's parking area</p>
                      <p className="text-sm text-gray-500">Parklane Rd, Columbia</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Destination:</strong> Charlotte Douglas International Airport (CLT)<br />
                  <strong>Stop:</strong> 10-minute break in Rock Hill
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fares Section */}
      <section id="fares" className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple Fares</h2>
            <p className="text-lg text-gray-600">Transparent pricing with no hidden fees</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md border-2 border-orange-200">
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-2">Legacy Rate</h3>
                <div className="text-4xl font-bold text-orange-600 mb-2">$31</div>
                <p className="text-sm text-gray-600 mb-4">First 100 customers only</p>
                <div className="text-xs text-orange-600 font-medium">LOCKED IN FOREVER</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border-2 border-blue-200">
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-2">Student</h3>
                <div className="text-4xl font-bold text-blue-600 mb-2">$32</div>
                <p className="text-sm text-gray-600 mb-4">With valid student ID</p>
                <div className="text-xs text-blue-600 font-medium">USC & LOCAL SCHOOLS</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border-2 border-green-200">
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-2">Military</h3>
                <div className="text-4xl font-bold text-green-600 mb-2">$32</div>
                <p className="text-sm text-gray-600 mb-4">With military ID</p>
                <div className="text-xs text-green-600 font-medium">FORT JACKSON</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border-2 border-gray-200">
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-2">Regular</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">$35</div>
                <p className="text-sm text-gray-600 mb-4">Standard adult fare</p>
                <div className="text-xs text-gray-600 font-medium">ONE WAY</div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
              <h4 className="font-semibold text-gray-900 mb-3">Add-On Services</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span>Extra luggage (per bag)</span>
                  <span className="font-medium">$5</span>
                </div>
                <div className="flex justify-between">
                  <span>Pet transport</span>
                  <span className="font-medium">$10</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Skoot?</h2>
            <p className="text-lg text-gray-600">Experience the difference with professional shuttle service</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Reliable Schedule</h3>
              <p className="text-gray-600">Every 2 hours, 7 days a week. No cancellations, no delays. Count on us.</p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Comfortable Vans</h3>
              <p className="text-gray-600">15-passenger Mercedes Sprinter vans with AC, comfortable seating, and luggage space.</p>
            </div>

            <div className="text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Professional Service</h3>
              <p className="text-gray-600">Licensed, insured, and experienced drivers. Your safety is our priority.</p>
            </div>
          </div>

          {/* Testimonials */}
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">What Our Customers Say</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">"Perfect for my weekly business trips to Charlotte. The drivers are professional and the schedule is incredibly reliable."</p>
                <div className="font-medium text-gray-900">— John L., Business Executive</div>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">"Much better than driving myself and paying for airport parking. The student discount makes it very affordable!"</p>
                <div className="font-medium text-gray-900">— Sarah M., USC Student</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-gray-600">Everything you need to know about our service</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md">
                <button
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50"
                  onClick={() => toggleFaq(index)}
                >
                  <span className="font-semibold text-gray-900">{faq.question}</span>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Book?</h2>
            <p className="text-lg text-gray-600">Contact us to reserve your seat</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Call to Book</h3>
              <p className="text-gray-600 mb-4">Speak with our friendly team</p>
              <a 
                href="tel:+1-803-SKOOT-SC" 
                className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                +1-803-SKOOT-SC
              </a>
            </div>

            <div className="text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Email to Book</h3>
              <p className="text-gray-600 mb-4">Send us your booking request</p>
              <a 
                href="mailto:hello@skoot.bike?subject=Booking Request&body=I would like to book a trip from Columbia to Charlotte Airport." 
                className="inline-flex items-center bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
              >
                hello@skoot.bike
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">SKOOT Transportation</h3>
              <p className="text-gray-300 mb-4">
                Professional shuttle service from Columbia, SC to Charlotte Douglas International Airport.
              </p>
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
              <h4 className="font-semibold mb-4">Schedule</h4>
              <div className="text-gray-300 text-sm space-y-1">
                <p>Every day: 6AM, 8AM, 10AM, 12PM, 2PM, 6PM, 8PM</p>
                <p>Journey time: 100-130 minutes</p>
                <p>Includes Rock Hill stop</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Pickup Locations</h4>
              <div className="text-gray-300 text-sm space-y-2">
                <div>
                  <p className="font-medium">Downtown Columbia</p>
                  <p>Across from Hotel Trundle</p>
                </div>
                <div>
                  <p className="font-medium">Parklane Road</p>
                  <p>McDonald's parking area</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © 2025 Skoot Transportation. All rights reserved. Licensed and insured shuttle service.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}