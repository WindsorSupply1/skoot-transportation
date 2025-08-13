const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Business Traveler',
    content: 'SKOOT made my airport transfer seamless and comfortable. Professional service every time.',
    rating: 5,
  },
  {
    name: 'Mike Chen',
    role: 'Event Organizer',
    content: 'Reliable group transportation for our corporate events. The team is always punctual and professional.',
    rating: 5,
  },
  {
    name: 'Emma Davis',
    role: 'Regular Commuter',
    content: 'Clean vehicles, friendly drivers, and competitive pricing. My go-to transportation service.',
    rating: 5,
  },
]

export default function Testimonials() {
  return (
    <section className="section-padding bg-white">
      <div className="container-width">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-neutral-900 mb-4">
            What Our Customers Say
          </h2>
          <p className="text-xl text-neutral-600">
            Real feedback from satisfied customers
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="card text-center">
              <div className="flex justify-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <svg key={i} className="h-5 w-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-neutral-600 mb-6 italic">
                "{testimonial.content}"
              </p>
              <div>
                <h4 className="font-semibold text-neutral-900">{testimonial.name}</h4>
                <p className="text-sm text-neutral-500">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}