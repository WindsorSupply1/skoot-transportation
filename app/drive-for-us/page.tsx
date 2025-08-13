export default function DriveForUsPage() {
  return (
    <div className="section-padding">
      <div className="container-width">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-4 text-neutral-900">
            Drive for SKOOT
          </h1>
          <p className="text-xl text-center text-neutral-600 mb-12">
            Join our team of professional drivers
          </p>
          
          <div className="card">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4 text-neutral-900">
                Coming Soon
              </h2>
              <p className="text-neutral-600 mb-8">
                We're currently building our driver application process. 
                Check back soon for opportunities to join the SKOOT team.
              </p>
              <div className="bg-neutral-100 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2 text-neutral-900">
                  Interested in driving for us?
                </h3>
                <p className="text-neutral-600">
                  Contact us at{' '}
                  <a 
                    href="mailto:drivers@skoot-transportation.com"
                    className="text-primary hover:text-primary-600"
                  >
                    drivers@skoot-transportation.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}