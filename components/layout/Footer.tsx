import Link from 'next/link'
import { Mail, Phone, MapPin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-neutral-900 text-white">
      <div className="container-width px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="md:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <span className="text-2xl font-bold text-primary">SKOOT</span>
            </Link>
            <p className="text-neutral-300 text-sm leading-relaxed">
              Premium transportation services with a focus on comfort, reliability, and customer satisfaction.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/schedule" className="text-neutral-300 hover:text-white transition-colors">
                  Schedule
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-neutral-300 hover:text-white transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-neutral-300 hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-neutral-300 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold mb-4">Services</h3>
            <ul className="space-y-2 text-sm">
              <li className="text-neutral-300">Airport Transfers</li>
              <li className="text-neutral-300">Corporate Transportation</li>
              <li className="text-neutral-300">Event Transportation</li>
              <li className="text-neutral-300">Regular Routes</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold mb-4">Contact Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-primary" />
                <span className="text-neutral-300">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-primary" />
                <span className="text-neutral-300">info@skoot-transportation.com</span>
              </div>
              <div className="flex items-start">
                <MapPin className="h-4 w-4 mr-2 text-primary mt-0.5" />
                <span className="text-neutral-300">123 Transportation Ave<br />City, State 12345</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-neutral-800 mt-8 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-neutral-400">
            <p>&copy; 2024 SKOOT Transportation. All rights reserved.</p>
            <div className="mt-4 sm:mt-0">
              <Link href="/privacy" className="hover:text-white transition-colors mr-6">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}