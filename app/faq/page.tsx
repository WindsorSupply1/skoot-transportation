import FAQSection from '@/components/faq/FAQSection'

export default function FAQPage() {
  return (
    <div className="section-padding">
      <div className="container-width">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-4 text-neutral-900">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-center text-neutral-600 mb-12">
            Find answers to common questions about our transportation services
          </p>
          <FAQSection />
        </div>
      </div>
    </div>
  )
}