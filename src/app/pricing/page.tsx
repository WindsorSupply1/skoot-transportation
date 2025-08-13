'use client';

import React, { useState } from 'react';
import { Check, Star, Users, Luggage, Heart, Calculator } from 'lucide-react';

export default function PricingPage() {
  const [passengerCount, setPassengerCount] = useState(1);
  const [customerType, setCustomerType] = useState('REGULAR');
  const [extraLuggage, setExtraLuggage] = useState(0);
  const [pets, setPets] = useState(0);
  const [isRoundTrip, setIsRoundTrip] = useState(false);

  const calculatePricing = () => {
    const basePrices = {
      LEGACY: 31,
      STUDENT: 32,
      MILITARY: 32,
      REGULAR: 35
    };

    const basePrice = basePrices[customerType as keyof typeof basePrices];
    const passengerCost = basePrice * passengerCount;
    const luggageCost = extraLuggage * 5;
    const petCost = pets * 10;
    const subtotal = passengerCost + luggageCost + petCost;

    let total = subtotal;
    let savings = 0;

    if (isRoundTrip) {
      const roundTripTotal = subtotal * 2;
      savings = Math.round(roundTripTotal * 0.1);
      total = roundTripTotal - savings;
    }

    return {
      basePrice,
      passengerCost,
      luggageCost,
      petCost,
      subtotal,
      savings,
      total
    };
  };

  const pricing = calculatePricing();

  const pricingTiers = [
    {
      name: 'Legacy Rate',
      price: '$31',
      type: 'LEGACY',
      popular: true,
      description: 'First 100 customers only',
      features: [
        'Forever rate - never increases',
        'Limited time offer',
        'Same premium service',
        'Round trip discount eligible'
      ],
      badge: 'Limited Time',
      badgeColor: 'bg-orange-100 text-orange-800'
    },
    {
      name: 'Student Rate',
      price: '$32',
      type: 'STUDENT',
      description: 'Valid student ID required',
      features: [
        'Forever rate with valid ID',
        'USC, Midlands Tech, other schools',
        'ID verification required',
        'Round trip discount eligible'
      ],
      badge: 'Forever Rate',
      badgeColor: 'bg-green-100 text-green-800'
    },
    {
      name: 'Military Rate', 
      price: '$32',
      type: 'MILITARY',
      description: 'Active duty & veterans',
      features: [
        'Forever rate with military ID',
        'Active duty and veterans',
        'Fort Jackson pickup available',
        'Round trip discount eligible'
      ],
      badge: 'Forever Rate',
      badgeColor: 'bg-green-100 text-green-800'
    },
    {
      name: 'Regular Rate',
      price: '$35',
      type: 'REGULAR',
      description: 'Standard fare',
      features: [
        'No ID verification required',
        'Available to everyone',
        'Professional service',
        'Round trip discount eligible'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-lg text-gray-600">
              Starting at $31 • Student & Military Discounts • Round Trip Savings
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Pricing Calculator */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Calculator className="h-5 w-5 text-orange-600" />
            <h2 className="text-xl font-semibold text-gray-900">Pricing Calculator</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Type
                </label>
                <select
                  value={customerType}
                  onChange={(e) => setCustomerType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="LEGACY">Legacy Customer ($31)</option>
                  <option value="STUDENT">Student ($32)</option>
                  <option value="MILITARY">Military ($32)</option>
                  <option value="REGULAR">Regular ($35)</option>
                </select>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Passengers
                  </label>
                  <select
                    value={passengerCount}
                    onChange={(e) => setPassengerCount(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    {[...Array(15)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1} passenger{i > 0 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Extra Luggage
                  </label>
                  <select
                    value={extraLuggage}
                    onChange={(e) => setExtraLuggage(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    {[...Array(11)].map((_, i) => (
                      <option key={i} value={i}>{i} bag{i !== 1 ? 's' : ''} (+${i * 5})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pets
                </label>
                <select
                  value={pets}
                  onChange={(e) => setPets(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  {[...Array(6)].map((_, i) => (
                    <option key={i} value={i}>{i} pet{i !== 1 ? 's' : ''} (+${i * 10})</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="roundTrip"
                  checked={isRoundTrip}
                  onChange={(e) => setIsRoundTrip(e.target.checked)}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <label htmlFor="roundTrip" className="text-sm font-medium text-gray-700">
                  Round trip (save 10%)
                </label>
              </div>
            </div>

            {/* Pricing Breakdown */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Breakdown</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Base fare × {passengerCount}</span>
                  <span>${pricing.passengerCost}</span>
                </div>
                {extraLuggage > 0 && (
                  <div className="flex justify-between">
                    <span>Extra luggage × {extraLuggage}</span>
                    <span>${pricing.luggageCost}</span>
                  </div>
                )}
                {pets > 0 && (
                  <div className="flex justify-between">
                    <span>Pets × {pets}</span>
                    <span>${pricing.petCost}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${pricing.subtotal}</span>
                  </div>
                </div>
                {isRoundTrip && (
                  <>
                    <div className="flex justify-between">
                      <span>Round trip (×2)</span>
                      <span>${pricing.subtotal * 2}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Round trip discount (10%)</span>
                      <span>-${pricing.savings}</span>
                    </div>
                  </>
                )}
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>${pricing.total}</span>
                  </div>
                </div>
              </div>
              <button className="w-full mt-4 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors">
                Book Now - ${pricing.total}
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Tiers */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Choose Your Rate</h2>
            <p className="text-gray-600">All rates include the same premium service and amenities</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricingTiers.map((tier, index) => (
              <div
                key={tier.name}
                className={`bg-white rounded-lg shadow-sm border-2 transition-all ${
                  tier.popular ? 'border-orange-200 ring-2 ring-orange-100' : 'border-gray-200'
                }`}
              >
                <div className="p-6">
                  {tier.badge && (
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mb-4 ${tier.badgeColor}`}>
                      {tier.popular && <Star className="w-3 h-3 mr-1" />}
                      {tier.badge}
                    </div>
                  )}
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{tier.name}</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-900">{tier.price}</span>
                    <span className="text-gray-500 text-sm ml-1">per person</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-6">{tier.description}</p>
                  
                  <ul className="space-y-2 mb-6">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <button
                    onClick={() => setCustomerType(tier.type)}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                      customerType === tier.type
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {customerType === tier.type ? 'Selected' : 'Select'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Information */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Luggage className="h-5 w-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">What's Included</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Door-to-door transportation</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>1 carry-on + 1 checked bag</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Free WiFi and device charging</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Professional licensed drivers</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Climate-controlled vehicles</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Real-time GPS tracking</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="h-5 w-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">Additional Fees</h3>
            </div>
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Extra luggage</span>
                <span className="font-medium">$5 per bag</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Pet-friendly transport</span>
                <span className="font-medium">$10 per pet</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Round trip discount</span>
                <span className="font-medium text-green-600">Save 10%</span>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <p className="text-xs text-gray-500">
                  * Round trip tickets valid for 30 days
                  <br />
                  * Student/Military rates require valid ID verification
                  <br />
                  * Legacy rate limited to first 100 customers
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Comparison with Competitors */}
        <div className="mt-8 bg-orange-50 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
            Why Choose Skoot?
          </h3>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-orange-600 mb-2">$31-35</div>
              <div className="text-sm text-gray-600">vs $60-80+ rideshare</div>
              <div className="font-medium text-gray-900">Save 50%+</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600 mb-2">Every 2hrs</div>
              <div className="text-sm text-gray-600">vs unpredictable</div>
              <div className="font-medium text-gray-900">Reliable Schedule</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600 mb-2">15 seats</div>
              <div className="text-sm text-gray-600">vs cramped cars</div>
              <div className="font-medium text-gray-900">More Comfort</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}