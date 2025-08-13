'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';

const faqData = [
  {
    category: 'Booking & Travel',
    questions: [
      {
        question: 'How do I book a ride with Skoot?',
        answer: 'You can book online through our website, call us at (803) 555-SKOOT, or email hello@skoot.bike. We recommend booking in advance to guarantee your seat, especially for popular departure times.'
      },
      {
        question: 'Where exactly do you pick up and drop off?',
        answer: 'We offer pickup from Downtown Columbia Hub (Main & Gervais), USC Campus (Russell House), Fort Jackson Main Gate, and select hotels. We make a 10-minute stop in Rock Hill for additional passengers, then provide direct drop-off at CLT Airport terminals.'
      },
      {
        question: 'Can I cancel or change my reservation?',
        answer: 'Yes! You can cancel up to 24 hours before departure for a full refund. Changes can be made up to 2 hours before departure subject to availability. Contact us at (803) 555-SKOOT or hello@skoot.bike.'
      },
      {
        question: 'What if my flight is delayed or cancelled?',
        answer: 'If your return flight is delayed, contact us immediately. We offer flexible rebooking for flight delays at no extra charge. For cancelled flights, we provide full refunds or credit toward a future trip.'
      },
      {
        question: 'How long does the journey take?',
        answer: 'The journey takes 100-130 minutes including our 10-minute stop in Rock Hill. We recommend arriving at the airport 2+ hours before your flight boarding time, as these are estimated travel times.'
      }
    ]
  },
  {
    category: 'Pricing & Tickets',
    questions: [
      {
        question: 'Who qualifies for the $31 student and military rate?',
        answer: 'Students with valid ID from USC, Midlands Tech, or other accredited institutions qualify for $32 forever rate. Active duty military and veterans with military ID qualify for $32 forever rate. The $31 legacy rate is only for the first 100 customers.'
      },
      {
        question: "What's the difference between pricing tiers?",
        answer: 'Legacy ($31) - First 100 customers only, forever rate. Student ($32) - Valid student ID required, forever rate. Military ($32) - Active duty/veterans with military ID, forever rate. Regular ($35) - Standard fare for everyone else.'
      },
      {
        question: 'Are there any additional fees?',
        answer: 'Extra luggage costs $5 per bag beyond your included carry-on and checked bag. Pet-friendly transport is $10 per pet. Round trip bookings save 10% off the total fare.'
      },
      {
        question: 'How long are tickets valid?',
        answer: 'One-way tickets are valid for the specific departure time booked. Round trip tickets are valid for 30 days from the initial departure date, giving you flexibility for your return.'
      }
    ]
  },
  {
    category: 'Luggage & Policies',
    questions: [
      {
        question: "What's included in my ticket?",
        answer: 'Your ticket includes door-to-door transportation, 1 carry-on bag, 1 checked bag, free WiFi, device charging, climate-controlled vehicle, and professional licensed driver service.'
      },
      {
        question: 'What is the baggage allowance?',
        answer: 'Each ticket includes 1 carry-on bag and 1 standard checked bag. Additional bags are $5 each. We accommodate standard airline baggage - no size/weight restrictions beyond airline standards.'
      },
      {
        question: 'Can I bring pets on the shuttle?',
        answer: 'Yes! We are pet-friendly. Pet transport costs $10 per pet. Pets must be in carriers or on leashes. Service animals ride free with proper documentation.'
      }
    ]
  },
  {
    category: 'Safety & Vehicles',
    questions: [
      {
        question: 'What type of vehicles do you use?',
        answer: 'We operate modern 15-passenger Mercedes Sprinter and Ford Transit vans. All vehicles feature climate control, WiFi, device charging ports, and comfortable seating. We plan to expand to 30+ passenger vehicles as demand grows.'
      },
      {
        question: 'What safety measures do you have in place?',
        answer: 'All drivers have commercial licenses and clean driving records. Vehicles undergo regular safety inspections and maintenance. We carry full commercial insurance and provide real-time GPS tracking for all trips.'
      },
      {
        question: 'Are your drivers licensed and insured?',
        answer: 'Yes! All Skoot drivers hold valid commercial licenses, pass background checks, and complete professional training. We maintain comprehensive commercial insurance covering all passengers and vehicles.'
      },
      {
        question: 'Do you guarantee arrival times?',
        answer: 'We provide estimated arrival times based on normal traffic conditions. While we cannot guarantee exact times due to variables like traffic and weather, our professional drivers monitor conditions and adjust routes to minimize delays.'
      }
    ]
  }
];

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const toggleItem = (questionId: string) => {
    setOpenItems(prev => 
      prev.includes(questionId) 
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const filteredFAQ = faqData.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => 
        q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => 
    !selectedCategory || category.category === selectedCategory
  ).filter(category => category.questions.length > 0);

  const allCategories = faqData.map(cat => cat.category);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-gray-600">
              Everything you need to know about Skoot Transportation
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search frequently asked questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div className="sm:w-64">
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">All Categories</option>
                {allCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* FAQ Content */}
        <div className="space-y-8">
          {filteredFAQ.length > 0 ? (
            filteredFAQ.map((category) => (
              <div key={category.category} className="bg-white rounded-lg shadow-sm">
                <div className="border-b border-gray-200 px-6 py-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {category.category}
                  </h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {category.questions.map((faq, index) => {
                    const questionId = `${category.category}-${index}`;
                    const isOpen = openItems.includes(questionId);
                    
                    return (
                      <div key={questionId} className="px-6 py-4">
                        <button
                          onClick={() => toggleItem(questionId)}
                          className="w-full flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-inset rounded-lg p-2 -m-2"
                        >
                          <h3 className="text-lg font-medium text-gray-900 pr-4">
                            {faq.question}
                          </h3>
                          {isOpen ? (
                            <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                          )}
                        </button>
                        
                        {isOpen && (
                          <div className="mt-4 pr-8">
                            <p className="text-gray-700 leading-relaxed">
                              {faq.answer}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="text-gray-400 mb-4">
                <Search className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No questions found
              </h3>
              <p className="text-gray-500">
                {searchTerm 
                  ? `No questions match "${searchTerm}". Try a different search term or browse all categories.`
                  : 'No questions in the selected category.'
                }
              </p>
              {(searchTerm || selectedCategory) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory(null);
                  }}
                  className="mt-4 text-orange-600 hover:text-orange-700 font-medium"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Contact Section */}
        <div className="mt-8 bg-orange-50 rounded-lg p-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Still have questions?
            </h3>
            <p className="text-gray-600 mb-4">
              Our customer service team is here to help 6am-10pm daily
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="tel:803-555-SKOOT"
                className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
              >
                Call (803) 555-SKOOT
              </a>
              <a
                href="mailto:hello@skoot.bike"
                className="bg-white text-orange-600 border border-orange-600 px-6 py-2 rounded-lg hover:bg-orange-50 transition-colors"
              >
                Email hello@skoot.bike
              </a>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <h4 className="font-semibold text-gray-900 mb-2">Book Your Ride</h4>
            <p className="text-gray-600 text-sm mb-4">Ready to travel? Book your seat now</p>
            <a
              href="/"
              className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Book Now
            </a>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <h4 className="font-semibold text-gray-900 mb-2">View Schedule</h4>
            <p className="text-gray-600 text-sm mb-4">Check departure times and availability</p>
            <a
              href="/schedule"
              className="inline-block bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              View Schedule
            </a>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 text-center sm:col-span-2 lg:col-span-1">
            <h4 className="font-semibold text-gray-900 mb-2">Pricing Info</h4>
            <p className="text-gray-600 text-sm mb-4">See rates and calculate your fare</p>
            <a
              href="/pricing"
              className="inline-block bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              View Pricing
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}