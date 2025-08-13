import Link from 'next/link'

export default function Hero() {
  return (
    <section className="bg-gradient-to-r from-primary to-primary-600 text-white">
      <div className="container-width section-padding">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Premium Transportation
            <span className="block text-4xl md:text-5xl mt-2 text-primary-100">
              Made Simple
            </span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-primary-100 leading-relaxed">
            Clean, reliable, and comfortable transportation services inspired by Munich Airport Bus standards
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="#booking" className="btn-secondary text-lg px-8 py-4">
              Book Now
            </Link>
            <Link href="/schedule" className="btn-outline text-lg px-8 py-4 bg-white text-primary hover:bg-primary-50">
              View Schedule
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}