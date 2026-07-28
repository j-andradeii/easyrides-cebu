/**
 * Admin portal shell — sidebar nav + auth bootstrap (plan §10.1).
 *
 * The login page lives under /admin too, so it opts out of the chrome instead
 * of needing a second layout.
 */

'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import * as authService from '@/services/auth.service';
import { useUserStore } from '@/stores/user.store';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: 'pi-chart-bar' },
  { href: '/admin/inquiries', label: 'Inquiries', icon: 'pi-inbox' },
  { href: '/admin/pipeline', label: 'Pipeline', icon: 'pi-th-large' },
  { href: '/admin/reviews', label: 'Reviews', icon: 'pi-star' },
  { href: '/admin/referrals', label: 'Referrals', icon: 'pi-share-alt' },
];

const LOGIN_PATH = '/admin/login';

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser, clearUser } = useUserStore();
  const [identityChecked, setIdentityChecked] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);

  const isLoginPage = pathname === LOGIN_PATH;
  // Derived rather than stored, so the login page never needs a state write.
  const isBootstrapping = !isLoginPage && !identityChecked;

  useEffect(() => {
    if (isLoginPage) return;

    let cancelled = false;

    authService.me().then((identity) => {
      if (cancelled) return;

      if (identity) {
        // The real session is the httpOnly cookie; the store just mirrors the
        // identity so the UI can show who is signed in.
        setUser(identity, 'cookie-session');
      } else {
        clearUser();
        router.replace(`${LOGIN_PATH}?redirect=${encodeURIComponent(pathname)}`);
      }
      setIdentityChecked(true);
    });

    return () => {
      cancelled = true;
    };
  }, [isLoginPage, pathname, router, setUser, clearUser]);

  const handleLogout = useCallback(async () => {
    await authService.logout().catch(() => undefined);
    clearUser();
    router.replace(LOGIN_PATH);
  }, [clearUser, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isBootstrapping) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-500">
          <i className="pi pi-spin pi-spinner text-xl" />
          <span>Loading portal…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 lg:flex">
      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between bg-white border-b border-slate-200 px-4 py-3">
        <Link href="/admin" className="font-bold text-slate-900">
          EasyRide<span className="text-coral">CRM</span>
        </Link>
        <button
          type="button"
          aria-label="Toggle navigation"
          onClick={() => setIsNavOpen((open) => !open)}
          className="p-2 rounded-lg hover:bg-slate-100"
        >
          <i className={`pi ${isNavOpen ? 'pi-times' : 'pi-bars'}`} />
        </button>
      </header>

      <aside
        className={`${
          isNavOpen ? 'block' : 'hidden'
        } lg:block lg:sticky lg:top-0 lg:h-screen w-full lg:w-64 shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-slate-200`}
      >
        <div className="hidden lg:block px-6 py-5 border-b border-slate-100">
          <Link href="/admin" className="text-lg font-bold text-slate-900">
            EasyRide<span className="text-coral">CRM</span>
          </Link>
          <p className="text-xs text-slate-500 mt-0.5">Funnel &amp; lead management</p>
        </div>

        <nav className="p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsNavOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-coral/10 text-coral'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <i className={`pi ${item.icon} text-base`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 mt-auto border-t border-slate-100">
          <div className="px-3 py-2">
            <p className="text-sm font-medium text-slate-900 truncate">{user?.name ?? 'Admin'}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            {user?.role && (
              <span className="inline-block mt-1.5 text-[11px] uppercase tracking-wide bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                {user.role}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <i className="pi pi-sign-out text-base" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}

export default AdminShell;
