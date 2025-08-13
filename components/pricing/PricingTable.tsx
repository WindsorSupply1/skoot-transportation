const pricingTiers = [
  {
    name: 'Standard',
    description: 'Perfect for individual travelers',
    price: '$25',
    features: [
      'Comfortable seating',
      'Professional driver',
      'On-time guarantee',
      'Basic luggage assistance',
      '24/7 customer support',
    ],
    popular: false,
  },
  {
    name: 'Premium',
    description: 'Enhanced comfort and service',
    price: '$45',
    features: [
      'Premium vehicle',
      'Priority booking',
      'Complimentary water',
      'Phone charging ports',
      'Flight tracking',
      'Meet & greet service',
    ],
    popular: true,
  },
  {
    name: 'Executive',
    description: 'Luxury transportation experience',
    price: '$75',
    features: [
      'Luxury vehicle',
      'Personal concierge',
      'Refreshment service',
      'Wi-Fi access',
      'Newspaper/magazines',
      'Red carpet service',
      'Flexible scheduling',
    ],
    popular: false,
  },
]

const additionalServices = [
  { service: 'Extra luggage (per bag)', price: '$5' },
  { service: 'Child seat rental', price: '$10' },
  { service: 'Pet transport', price: '$15' },
  { service: 'Additional stop', price: '$10' },
  { service: 'Wait time (per 15 min)', price: '$8' },
]

export default function PricingTable() {
  return (
    <div className="space-y-12">
      {/* Main Pricing Tiers */}
      <div className="grid md:grid-cols-3 gap-8">
        {pricingTiers.map((tier, index) => (
          <div
            key={index}
            className={`card relative ${
              tier.popular ? 'ring-2 ring-primary shadow-lg' : ''
            }`}
          >
            {tier.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              </div>
            )}
            
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-neutral-900 mb-2">
                {tier.name}
              </h3>
              <p className="text-neutral-600 mb-4">{tier.description}</p>
              <div className="text-4xl font-bold text-primary mb-2">
                {tier.price}
              </div>
              <p className="text-sm text-neutral-500">per trip</p>
            </div>
            
            <ul className="space-y-3 mb-8">
              {tier.features.map((feature, featureIndex) => (
                <li key={featureIndex} className="flex items-center">
                  <svg className="h-5 w-5 text-secondary mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-neutral-700">{feature}</span>
                </li>
              ))}
            </ul>
            
            <button
              className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                tier.popular
                  ? 'btn-primary'
                  : 'btn-outline'
              }`}
            >
              Choose {tier.name}
            </button>
          </div>
        ))}
      </div>

      {/* Additional Services */}
      <div className="card">
        <h3 className="text-2xl font-bold text-neutral-900 mb-6">
          Additional Services
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {additionalServices.map((item, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b border-neutral-100 last:border-b-0">
              <span className="text-neutral-700">{item.service}</span>
              <span className="font-semibold text-primary">{item.price}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Group Discounts */}
      <div className="card bg-secondary-50 border-secondary-200">
        <h3 className="text-xl font-semibold text-neutral-900 mb-4">
          Group Discounts
        </h3>
        <div className="grid md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-secondary mb-1">10%</div>
            <div className="text-sm text-neutral-600">6-8 passengers</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-secondary mb-1">15%</div>
            <div className="text-sm text-neutral-600">9-12 passengers</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-secondary mb-1">20%</div>
            <div className="text-sm text-neutral-600">13+ passengers</div>
          </div>
        </div>
      </div>
    </div>
  )
}