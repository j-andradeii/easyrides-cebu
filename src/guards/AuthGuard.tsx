/**
 * Auth Guard Component
 *
 * Client-side route protection component
 * Wraps protected pages and redirects if not authenticated
 */

'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/stores/user.store';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated } = useUserStore();

  useEffect(() => {
    if (!isAuthenticated) {
      // Redirect to login page
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Show fallback while checking authentication
  if (!isAuthenticated) {
    return fallback || <div>Loading...</div>;
  }

  return <>{children}</>;
}
