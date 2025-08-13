import ContactForm from '@/components/contact/ContactForm'
import ContactInfo from '@/components/contact/ContactInfo'

export default function ContactPage() {
  return (
    <div className="section-padding">
      <div className="container-width">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-4 text-neutral-900">
            Contact Us
          </h1>
          <p className="text-xl text-center text-neutral-600 mb-12">
            Get in touch with our team for any questions or support
          </p>
          
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <ContactForm />
            </div>
            <div>
              <ContactInfo />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}