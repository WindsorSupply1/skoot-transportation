import { Mail, Phone, MapPin, Clock } from 'lucide-react'

export default function ContactInfo() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-6">
          Get in Touch
        </h2>
        <p className="text-neutral-600 leading-relaxed">
          We're here to help with all your transportation needs. Contact us through any of the methods below and we'll get back to you as soon as possible.
        </p>
      </div>
      
      <div className="space-y-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center w-12 h-12 bg-primary rounded-lg">
              <Phone className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-neutral-900">Phone</h3>
            <p className="text-neutral-600">+1 (555) 123-4567</p>
            <p className="text-sm text-neutral-500">24/7 Customer Support</p>
          </div>
        </div>
        
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center w-12 h-12 bg-primary rounded-lg">
              <Mail className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-neutral-900">Email</h3>
            <p className="text-neutral-600">info@skoot-transportation.com</p>
            <p className="text-sm text-neutral-500">Response within 2 hours</p>
          </div>
        </div>
        
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center w-12 h-12 bg-primary rounded-lg">
              <MapPin className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-neutral-900">Office</h3>
            <p className="text-neutral-600">
              123 Transportation Avenue<br />
              Business District<br />
              City, State 12345
            </p>
          </div>
        </div>
        
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center w-12 h-12 bg-primary rounded-lg">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-neutral-900">Business Hours</h3>
            <div className="text-neutral-600">
              <p>Monday - Friday: 6:00 AM - 10:00 PM</p>
              <p>Saturday - Sunday: 8:00 AM - 8:00 PM</p>
            </div>
            <p className="text-sm text-neutral-500">Emergency support available 24/7</p>
          </div>
        </div>
      </div>
      
      <div className="bg-neutral-50 rounded-lg p-6">
        <h3 className="font-semibold text-neutral-900 mb-3">
          Emergency Contact
        </h3>
        <p className="text-neutral-600 text-sm mb-2">
          For urgent transportation needs or emergencies:
        </p>
        <p className="text-primary font-semibold text-lg">+1 (555) 911-SKOOT</p>
        <p className="text-neutral-500 text-sm">Available 24/7</p>
      </div>
    </div>
  )
}