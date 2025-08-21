'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Users,
  MapPin,
  CreditCard,
  BarChart3,
  Settings,
  Route,
  Car
} from 'lucide-react';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  description?: string;
}

const navigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    description: 'Overview and statistics'
  },
  {
    name: 'Bookings',
    href: '/admin/bookings',
    icon: CreditCard,
    description: 'Manage reservations'
  },
  {
    name: 'Schedules',
    href: '/admin/schedules-new',
    icon: Calendar,
    description: 'Departure management'
  },
  {
    name: 'Customers',
    href: '/admin/customers',
    icon: Users,
    description: 'Customer database'
  },
  {
    name: 'Routes',
    href: '/admin/routes',
    icon: Route,
    description: 'Route configuration'
  },
  {
    name: 'Locations',
    href: '/admin/pickup-locations',
    icon: MapPin,
    description: 'Pickup & dropoff points'
  },
  {
    name: 'Reports',
    href: '/admin/reports',
    icon: BarChart3,
    description: 'Analytics & insights'
  }
];

interface AdminNavigationProps {
  variant?: 'sidebar' | 'horizontal';
  className?: string;
}

export default function AdminNavigation({ 
  variant = 'horizontal', 
  className = '' 
}: AdminNavigationProps) {
  const pathname = usePathname();

  if (variant === 'sidebar') {
    return (
      <aside className={`w-64 bg-white shadow-sm border-r ${className}`}>
        <div className="p-6">
          <Link href="/admin" className="flex items-center">
            <Car className="h-8 w-8 text-orange-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">SKOOT Admin</span>
          </Link>
        </div>
        <nav className="mt-6">
          <div className="px-3">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                (item.href === '/admin/schedules-new' && pathname === '/admin/schedules');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md mb-1 transition-colors ${
                    isActive
                      ? 'bg-orange-50 text-orange-600 border-r-2 border-orange-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${
                      isActive ? 'text-orange-600' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  <div>
                    <div>{item.name}</div>
                    {item.description && (
                      <div className="text-xs text-gray-400">{item.description}</div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>
      </aside>
    );
  }

  // Horizontal navigation (default)
  return (
    <nav className={`bg-white border-b border-gray-200 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/admin" className="flex items-center px-4">
              <Car className="h-6 w-6 text-orange-600" />
              <span className="ml-2 text-lg font-semibold text-gray-900">SKOOT Admin</span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href === '/admin/schedules-new' && pathname === '/admin/schedules');
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}