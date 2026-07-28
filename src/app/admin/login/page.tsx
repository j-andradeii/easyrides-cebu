/**
 * /admin/login — plan §9.5.
 *
 * Reuses the existing form primitives and the `loginSchema` that already lived
 * in src/models/validation-schemas.ts.
 */

'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from 'primereact/button';

import { FormInput } from '@/components';
import { loginSchema, type LoginFormData } from '@/models/validation-schemas';
import * as authService from '@/services/auth.service';
import { useUserStore } from '@/stores/user.store';
import type { ApiError } from '@/services/api-client';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useUserStore((state) => state.setUser);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const methods = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onSubmit',
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const user = await authService.login(data);
      // Session lives in the httpOnly cookie; the store only mirrors identity.
      setUser(user, 'cookie-session');

      const redirect = searchParams.get('redirect');
      router.replace(redirect && redirect.startsWith('/admin') ? redirect : '/admin');
      router.refresh();
    } catch (caught) {
      const apiError = caught as ApiError;
      setError(apiError?.message ?? 'Unable to sign in. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            EasyRide<span className="text-coral">CRM</span>
          </h1>
          <p className="text-slate-600 mt-2">Sign in to manage your leads</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 sm:p-8">
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
              <FormInput
                name="email"
                label="Email"
                type="email"
                placeholder="you@easyridecebu.com"
                showRequired
              />

              <FormInput
                name="password"
                label="Password"
                type="password"
                placeholder="••••••••"
                showRequired
              />

              {error && (
                <div
                  role="alert"
                  className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800"
                >
                  <i className="pi pi-exclamation-circle mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                loading={isSubmitting}
                className="w-full bg-gradient-to-r from-coral to-mango hover:from-coral-dark hover:to-mango-dark text-white py-3 px-6 rounded-xl font-semibold transition-all shadow-lg shadow-coral/25 border-0"
                label={isSubmitting ? 'Signing in…' : 'Sign in'}
                icon={isSubmitting ? 'pi pi-spin pi-spinner' : 'pi pi-sign-in'}
                iconPos="right"
              />
            </form>
          </FormProvider>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          Accounts are created by an owner with{' '}
          <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200">
            npm run create-admin
          </code>
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  // useSearchParams needs a Suspense boundary during prerendering.
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream" />}>
      <LoginForm />
    </Suspense>
  );
}
