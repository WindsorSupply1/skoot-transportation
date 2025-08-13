import { CheckCircle, Clock, Shield, Users } from 'lucide-react'

const features = [
  {
    icon: CheckCircle,
    title: 'Reliable Service',
    description: 'On-time arrivals and dependable transportation you can count on.',
  },
  {
    icon: Clock,
    title: '24/7 Availability',
    description: 'Round-the-clock service to meet your transportation needs.',
  },
  {
    icon: Shield,
    title: 'Safe & Secure',
    description: 'Professional drivers and well-maintained vehicles for your safety.',
  },
  {
    icon: Users,
    title: 'Group Friendly',
    description: 'Accommodate individuals or groups with our flexible seating options.',
  },
]

export default function Features() {
  return (
    <section className="section-padding bg-neutral-50">
      <div className="container-width">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-neutral-900 mb-4">
            Why Choose SKOOT?
          </h2>
          <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
            Experience the difference with our premium transportation services
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-6">
                <feature.icon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-4">
                {feature.title}
              </h3>
              <p className="text-neutral-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}