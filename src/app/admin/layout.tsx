import type { Metadata } from 'next';

import { AdminShell } from '@/components/admin/AdminShell';

export const metadata: Metadata = {
  title: 'Admin Portal',
  // The portal is private — keep it out of search results entirely.
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
