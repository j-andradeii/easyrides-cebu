  'use client';

  import { AuthGuard } from '@/guards/AuthGuard';

  export default function AboutLayout({ children }: { children: React.ReactNode }) {
      return (
        // <AuthGuard>{children}</AuthGuard>
        <div>
            {children}
        </div>
      );
  }