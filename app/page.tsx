import BookingForm from '@/components/booking/BookingForm'
import Hero from '@/components/sections/Hero'
import Features from '@/components/sections/Features'
import Testimonials from '@/components/sections/Testimonials'
import CallToAction from '@/components/sections/CallToAction'

export default function HomePage() {
  return (
    <div>
      <Hero />
      <div className="section-padding bg-white">
        <div className="container-width">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8 text-neutral-900">
              Book Your Transportation
            </h2>
            <BookingForm />
          </div>
        </div>
      </div>
      <Features />
      <Testimonials />
      <CallToAction />
    </div>
  )
}