/**
 * Auth Layout Component
 *
 * Layout for authentication pages (login, register, etc.)
 * Centered card design with minimal header/footer
 */

'use client';

import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
}

export function AuthLayout({ children, title }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Minimal Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <a href="/" className="text-xl font-bold text-gray-900">
              EasyRides App
            </a>
          </div>
        </div>
      </header>

      {/* Centered Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {title && (
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
            </div>
          )}
          <div className="bg-white rounded-lg shadow-md p-8">
            {children}
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} EasyRides App
          </p>
        </div>
      </footer>
    </div>
  );
}
