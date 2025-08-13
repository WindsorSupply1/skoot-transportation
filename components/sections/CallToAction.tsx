import Link from 'next/link'

export default function CallToAction() {
  return (
    <section className="section-padding bg-secondary text-white">
      <div className="container-width text-center">
        <h2 className="text-4xl font-bold mb-6">
          Ready to Book Your Transportation?
        </h2>
        <p className="text-xl mb-8 text-secondary-100 max-w-2xl mx-auto">
          Join thousands of satisfied customers who trust SKOOT for their transportation needs.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/" className="btn-primary text-lg px-8 py-4">
            Book Now
          </Link>
          <Link href="/contact" className="btn-outline text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-secondary">
            Contact Us
          </Link>
        </div>
      </div>
    </section>
  )
}