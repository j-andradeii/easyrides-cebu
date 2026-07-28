/**
 * /r/[code] — the warm landing for a referred friend (plan §7A.5).
 *
 * "Juan recommends EasyRideCebu — here's ₱300 off." Greeting them by the
 * referrer's name is rule 7 of §7A.3: they should feel personally introduced,
 * not marketed to.
 *
 * The form posts to the same /api/inquiries intake as every other lead, just
 * tagged with the referral code so W5 can reward on conversion.
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from 'primereact/button';

import { FormCalendar, FormInput, FormPhoneInput, FormSelect, FormTextarea } from '@/components';
import { FORM_CONST } from '@/core/constants';
import FORM_MESSAGES from '@/core/form-messages';

const serviceTypes = ['car-rental', 'airport-transfer', 'tour', 'custom'] as const;

const referralFormSchema = z.object({
  fullName: z
    .string()
    .min(1, FORM_MESSAGES.NAME_REQUIRED)
    .max(FORM_CONST.NAME_MAX_LENGTH, FORM_MESSAGES.NAME_MAX.replace('${max}', String(FORM_CONST.NAME_MAX_LENGTH))),
  email: z.string().min(1, FORM_MESSAGES.EMAIL_REQUIRED).regex(FORM_CONST.EMAIL_REGEX, FORM_MESSAGES.EMAIL_INVALID),
  countryCode: z.string(),
  phone: z
    .string()
    .min(1, FORM_MESSAGES.PHONE_REQUIRED)
    .min(FORM_CONST.PHONE_MIN_LENGTH, FORM_MESSAGES.PHONE_MIN.replace('${min}', String(FORM_CONST.PHONE_MIN_LENGTH))),
  serviceType: z.enum(serviceTypes, { message: FORM_MESSAGES.SELECT_REQUIRED }),
  preferredDate: z.date({ message: FORM_MESSAGES.DATE_REQUIRED }),
  message: z.string().max(FORM_CONST.MESSAGE_MAX_LENGTH).optional(),
});

type ReferralFormData = z.infer<typeof referralFormSchema>;

const serviceOptions = [
  { value: 'car-rental', label: 'Car Rental' },
  { value: 'airport-transfer', label: 'Airport Transfer' },
  { value: 'tour', label: 'Tour Package' },
  { value: 'custom', label: 'Custom Tour / Other' },
];

interface ReferralContext {
  code: string;
  referrerName: string;
  refereeReward: string;
}

export default function ReferralLandingPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const code = params?.code;

  const [context, setContext] = useState<ReferralContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const methods = useForm<ReferralFormData>({
    resolver: zodResolver(referralFormSchema),
    mode: 'onChange',
    defaultValues: {
      fullName: '',
      email: '',
      countryCode: '+63',
      phone: '',
      serviceType: undefined,
      preferredDate: undefined,
      message: '',
    },
  });

  useEffect(() => {
    if (!code) return;

    // Resolving the code also logs the click, so the referrer gets credit even
    // if the friend never fills in the form.
    fetch(`/api/r/${encodeURIComponent(code)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error('invalid');
        return (await response.json()) as ReferralContext;
      })
      .then(setContext)
      .catch(() => setContext(null))
      .finally(() => setIsLoading(false));
  }, [code]);

  const onSubmit = async (data: ReferralFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          phone: `${data.countryCode}${data.phone}`,
          preferredDate: data.preferredDate?.toISOString(),
          source: 'referral',
          referralCode: code,
        }),
      });

      if (!response.ok) throw new Error('failed');
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please message us on WhatsApp instead.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream">
        <p className="text-slate-500">
          <i className="pi pi-spin pi-spinner mr-2" /> Checking your invite…
        </p>
      </main>
    );
  }

  if (!context) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream px-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl">
          <h1 className="text-2xl font-bold text-slate-900">That invite link isn&apos;t valid</h1>
          <p className="mt-2 text-slate-600">
            No problem — you can still book with us directly.
          </p>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="mt-6 rounded-xl bg-gradient-to-r from-coral to-mango px-6 py-3 font-semibold text-white"
          >
            Go to EasyRideCebu
          </button>
        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream px-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <i className="pi pi-check text-2xl text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">You&apos;re all set!</h1>
          <p className="mt-2 text-slate-600">
            We have your request and your {context.refereeReward} is locked in. Someone from the
            team will message you within the hour.
          </p>
          <a
            href="https://wa.me/639178046988"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700"
          >
            <i className="pi pi-whatsapp" /> Chat with us now
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream px-4 py-10">
      <div className="mx-auto max-w-lg">
        {/* Warm intro */}
        <div className="rounded-3xl bg-gradient-to-br from-coral to-mango p-6 text-white shadow-xl sm:p-8">
          <p className="text-sm font-medium text-white/80">
            {context.referrerName} recommends EasyRideCebu
          </p>
          <h1 className="mt-2 text-3xl font-bold">
            Here&apos;s {context.refereeReward}
          </h1>
          <p className="mt-3 text-white/90">
            Car rentals, airport transfers and tours around Cebu — with a driver who knows the
            island. {context.referrerName} rode with us, and passed this on to you.
          </p>
          <div className="mt-4 inline-block rounded-lg bg-white/20 px-3 py-1.5 font-mono text-sm">
            {context.code}
          </div>
        </div>

        {/* Prefilled inquiry form → same intake as every other lead */}
        <div className="mt-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-xl sm:p-8">
          <h2 className="text-lg font-bold text-slate-900">Claim your discount</h2>
          <p className="mb-5 mt-1 text-sm text-slate-600">
            Tell us what you need and we&apos;ll send a price with the discount applied.
          </p>

          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)} noValidate className="space-y-4">
              <FormInput name="fullName" label="Full Name" placeholder="Your name" showRequired className="mb-0" />
              <FormInput
                name="email"
                label="Email Address"
                type="email"
                placeholder="you@email.com"
                showRequired
                className="mb-0"
              />
              <FormPhoneInput
                name="phone"
                countryCodeName="countryCode"
                label="Phone / WhatsApp"
                placeholder="9XX XXX XXXX"
                showRequired
                className="mb-0"
              />
              <FormSelect
                name="serviceType"
                label="What do you need?"
                options={serviceOptions}
                placeholder="Select a service"
                showRequired
                className="mb-0"
              />
              <FormCalendar
                name="preferredDate"
                label="Preferred Date"
                placeholder="Select a date"
                minDate={new Date()}
                showRequired
                className="mb-0"
              />
              <FormTextarea
                name="message"
                label="Anything else?"
                rows={2}
                placeholder="Destinations, group size, pickup point…"
                maxLength={FORM_CONST.MESSAGE_MAX_LENGTH}
                className="mb-0"
              />

              {error && (
                <p role="alert" className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-800">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                loading={isSubmitting}
                className="w-full rounded-xl border-0 bg-gradient-to-r from-coral to-mango px-6 py-4 font-semibold text-white shadow-lg shadow-coral/25 transition-all hover:-translate-y-0.5"
                label={isSubmitting ? 'Sending…' : 'Claim my discount'}
                icon={isSubmitting ? 'pi pi-spin pi-spinner' : 'pi pi-gift'}
                iconPos="right"
              />
            </form>
          </FormProvider>
        </div>
      </div>
    </main>
  );
}
