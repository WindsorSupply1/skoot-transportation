import PricingTable from '@/components/pricing/PricingTable'

export default function PricingPage() {
  return (
    <div className="section-padding">
      <div className="container-width">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-4 text-neutral-900">
            Transportation Pricing
          </h1>
          <p className="text-xl text-center text-neutral-600 mb-12">
            Transparent pricing for all your transportation needs
          </p>
          <PricingTable />
        </div>
      </div>
    </div>
  )
}