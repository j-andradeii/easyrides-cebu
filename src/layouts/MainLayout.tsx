/**
 * Main Layout Component
 *
 * Primary layout template for authenticated pages
 * Includes header, navigation, and footer
 */

'use client';

import { ReactNode } from 'react';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">EasyRides App</h1>
            </div>
            <nav className="flex space-x-4">
              <a href="/" className="text-gray-700 hover:text-gray-900 px-3 py-2">
                Home
              </a>
              <a href="/dashboard" className="text-gray-700 hover:text-gray-900 px-3 py-2">
                Dashboard
              </a>
              <a href="/profile" className="text-gray-700 hover:text-gray-900 px-3 py-2">
                Profile
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} EasyRides App. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
