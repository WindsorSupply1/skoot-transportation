'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import UserProfileMenu from '@/components/auth/UserProfileMenu';
import { Menu, X, Phone, User, CreditCard } from 'lucide-react';

interface NavigationHeaderProps {
  transparent?: boolean;
  fixed?: boolean;
}

export default function NavigationHeader({ 
  transparent = false, 
  fixed = true 
}: NavigationHeaderProps) {
  const { isAuthenticated, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { href: '/#home', label: 'Home' },
    { href: '/#schedule', label: 'Schedule' },
    { href: '/#pricing', label: 'Pricing' },
    { href: '/#faq', label: 'FAQ' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <header className={`${
      fixed ? 'fixed top-0 left-0 right-0 z-50' : 'relative'
    } transition-all duration-300 ${
      transparent 
        ? 'bg-white/95 backdrop-blur-sm border-b border-gray-200/50' 
        : 'bg-white border-b border-gray-200'
    }`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-xl font-bold text-gray-900">SKOOT</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-gray-600 hover:text-orange-600 transition-colors font-medium"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <a
              href="tel:+1-803-SKOOT-SC"
              className="flex items-center text-gray-600 hover:text-orange-600 transition-colors"
            >
              <Phone className="w-4 h-4 mr-1" />
              <span className="text-sm">Support</span>
            </a>
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <Link
                  href="/bookings"
                  className="flex items-center space-x-1 text-gray-600 hover:text-orange-600 transition-colors"
                >
                  <CreditCard className="w-4 h-4" />
                  <span className="text-sm">My Bookings</span>
                </Link>
                <UserProfileMenu />
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/auth/signin"
                  className="flex items-center space-x-1 text-gray-600 hover:text-orange-600 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm">Sign In</span>
                </Link>
                <Link
                  href="/booking"
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors font-medium"
                >
                  Book Now
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-orange-600 transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-4">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-gray-600 hover:text-orange-600 transition-colors font-medium px-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              
              <div className="border-t border-gray-200 pt-4 mt-4">
                <a
                  href="tel:+1-803-SKOOT-SC"
                  className="flex items-center text-gray-600 hover:text-orange-600 transition-colors px-2 mb-3"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  <span>Support</span>
                </a>
                
                {isAuthenticated ? (
                  <div className="space-y-3 px-2">
                    <Link
                      href="/bookings"
                      className="flex items-center space-x-2 text-gray-600 hover:text-orange-600 transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>My Bookings</span>
                    </Link>
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-orange-600 font-semibold text-xs">
                          {user?.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <span className="text-sm text-gray-900">{user?.name}</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 px-2">
                    <Link
                      href="/auth/signin"
                      className="flex items-center space-x-2 text-gray-600 hover:text-orange-600 transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      <span>Sign In</span>
                    </Link>
                    <Link
                      href="/booking"
                      className="inline-block bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors font-medium text-center w-full"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Book Now
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}