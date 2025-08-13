'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

const faqData = [
  {
    question: 'How far in advance should I book?',
    answer: 'We recommend booking at least 24 hours in advance to ensure availability. However, we also accept same-day bookings subject to availability.',
  },
  {
    question: 'What is your cancellation policy?',
    answer: 'You can cancel your booking free of charge up to 4 hours before your scheduled pickup time. Cancellations within 4 hours may incur a small fee.',
  },
  {
    question: 'Do you provide child seats?',
    answer: 'Yes, we provide child seats upon request for an additional $10 per seat. Please specify the age and weight of the child when booking.',
  },
  {
    question: 'Are your vehicles wheelchair accessible?',
    answer: 'We have wheelchair-accessible vehicles in our fleet. Please mention your accessibility needs when booking to ensure we assign the appropriate vehicle.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards, debit cards, and digital payment methods including PayPal and Apple Pay.',
  },
  {
    question: 'Do you provide receipts for business travel?',
    answer: 'Absolutely! We provide detailed receipts for all transactions, which can be used for business expense reporting and tax purposes.',
  },
  {
    question: 'What happens if my flight is delayed?',
    answer: 'We monitor flight schedules and automatically adjust pickup times for airport transfers. There are no additional charges for flight delays.',
  },
  {
    question: 'Can I make stops along the way?',
    answer: 'Yes, additional stops can be arranged for $10 per stop. Please mention this when booking or contact us before your trip.',
  },
]

export default function FAQSection() {
  const [openItems, setOpenItems] = useState<number[]>([])

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  return (
    <div className="space-y-4">
      {faqData.map((item, index) => (
        <div key={index} className="card">
          <button
            onClick={() => toggleItem(index)}
            className="w-full text-left flex items-center justify-between"
          >
            <h3 className="text-lg font-semibold text-neutral-900 pr-4">
              {item.question}
            </h3>
            {openItems.includes(index) ? (
              <ChevronUp className="h-5 w-5 text-neutral-500 flex-shrink-0" />
            ) : (
              <ChevronDown className="h-5 w-5 text-neutral-500 flex-shrink-0" />
            )}
          </button>
          
          {openItems.includes(index) && (
            <div className="mt-4 pt-4 border-t border-neutral-200">
              <p className="text-neutral-600 leading-relaxed">
                {item.answer}
              </p>
            </div>
          )}
        </div>
      ))}
      
      <div className="card bg-primary-50 border-primary-200 text-center">
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          Still have questions?
        </h3>
        <p className="text-neutral-600 mb-4">
          Our customer support team is here to help you 24/7.
        </p>
        <button className="btn-primary">
          Contact Support
        </button>
      </div>
    </div>
  )
}