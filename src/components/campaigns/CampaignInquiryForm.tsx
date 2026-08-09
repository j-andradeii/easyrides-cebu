/**
 * CampaignInquiryForm — the capture form at the bottom of /promo/[slug].
 *
 * Field for field the same inquiry every other form on the site submits, so a
 * promo lead arrives in /admin/inquiries indistinguishable from a tour or fleet
 * lead — same contact dedupe, same New Lead stage, same W1 automation. The only
 * additions are the `campaignSlug` that attributes it and the campaign's own
 * pre-selected service, which is why this is a thin wrapper rather than a
 * fourth hand-written form.
 *
 * The service dropdown is rendered only when the campaign has not already
 * chosen one: a promo for "Oslob day tour" asking "what do you need?" is a
 * question the visitor has already answered by clicking the link.
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from 'primereact/button';

import { FormCalendar, FormInput, FormPhoneInput, FormSelect, FormTextarea } from '@/components';
import { FORM_CONST } from '@/core/constants';
import FORM_MESSAGES from '@/core/form-messages';
import { SERVICE_TYPES } from '@/models/inquiry.schema';
import { serviceLabel } from '@/lib/crm/normalize';
import type { Campaign } from '@/types/campaign';

const SERVICE_OPTIONS = SERVICE_TYPES.map((value) => ({ value, label: serviceLabel(value) }));

const campaignFormSchema = z.object({
  fullName: z
    .string()
    .min(1, FORM_MESSAGES.NAME_REQUIRED)
    .max(
      FORM_CONST.NAME_MAX_LENGTH,
      FORM_MESSAGES.NAME_MAX.replace('${max}', String(FORM_CONST.NAME_MAX_LENGTH))
    ),
  email: z
    .string()
    .min(1, FORM_MESSAGES.EMAIL_REQUIRED)
    .regex(FORM_CONST.EMAIL_REGEX, FORM_MESSAGES.EMAIL_INVALID),
  countryCode: z.string(),
  phone: z
    .string()
    .min(1, FORM_MESSAGES.PHONE_REQUIRED)
    .min(
      FORM_CONST.PHONE_MIN_LENGTH,
      FORM_MESSAGES.PHONE_MIN.replace('${min}', String(FORM_CONST.PHONE_MIN_LENGTH))
    ),
  serviceType: z.enum(SERVICE_TYPES, { message: FORM_MESSAGES.SELECT_REQUIRED }),
  preferredDate: z.date({ message: FORM_MESSAGES.DATE_REQUIRED }),
  message: z.string().max(FORM_CONST.MESSAGE_MAX_LENGTH).optional(),
  /**
   * Honeypot — see `inquirySubmissionSchema`. A promo link is the most public
   * URL this site has, so it is the one form most worth trapping bots on.
   */
  website: z.string().max(200).optional(),
});

type CampaignFormData = z.infer<typeof campaignFormSchema>;

export interface CampaignInquiryFormProps {
  campaign: Campaign;
}

export function CampaignInquiryForm({ campaign }: CampaignInquiryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const presetService = SERVICE_TYPES.find((value) => value === campaign.serviceType);

  const methods = useForm<CampaignFormData>({
    resolver: zodResolver(campaignFormSchema),
    mode: 'onChange',
    defaultValues: {
      fullName: '',
      email: '',
      countryCode: '+63',
      phone: '',
      serviceType: presetService,
      preferredDate: undefined,
      message: '',
      website: '',
    },
  });

  // A campaign edited from "tour" to "car rental" while a visitor has the page
  // open would otherwise keep submitting the stale value.
  useEffect(() => {
    if (presetService) methods.setValue('serviceType', presetService);
  }, [presetService, methods]);

  const onSubmit = async (data: CampaignFormData) => {
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
          // Overwritten server-side with "campaign:<slug>" once the slug below
          // resolves; sent so an unknown slug still records a usable source.
          source: 'campaign',
          campaignSlug: campaign.slug,
          vehicleType: campaign.vehicleType ?? undefined,
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

  if (campaign.hasEnded) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
          <i className="pi pi-clock text-xl text-slate-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">This promo has ended</h2>
        <p className="mx-auto mt-2 max-w-md text-slate-600">
          You have not missed out entirely — we run car rentals, airport transfers and tours around
          Cebu all year, and we are happy to quote you.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/tours"
            className="rounded-xl bg-gradient-to-r from-coral to-mango px-5 py-3 font-semibold text-white"
          >
            See our tours
          </Link>
          <a
            href="https://wa.me/639178046988"
            className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700"
          >
            <i className="pi pi-whatsapp" /> Chat with us
          </a>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <i className="pi pi-check text-2xl text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">You&apos;re all set!</h2>
        <p className="mx-auto mt-2 max-w-md text-slate-600">
          We have your details and someone from the team will message you shortly with availability
          and your total.
        </p>
        <a
          href="https://wa.me/639178046988"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700"
        >
          <i className="pi pi-whatsapp" /> Chat with us now
        </a>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-xl">
      <div className="border-b border-slate-200 bg-gradient-to-r from-cream-light to-white px-6 py-5 sm:px-8">
        <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Claim this offer</h2>
        <p className="mt-1 text-sm text-slate-600">
          Tell us what you need and we&apos;ll come back with a price — no payment needed to
          reserve.
        </p>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} noValidate className="px-6 py-6 sm:px-8">
          {/* Same wide grid as the fleet form — see the note there on why the
              explicit `grid-cols-1` and `min-w-0` are load-bearing on a phone. */}
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 [&>*]:min-w-0 sm:grid-cols-2">
            <FormInput
              name="fullName"
              label="Full Name"
              placeholder="Juan dela Cruz"
              showRequired
              className="mb-0"
            />

            <FormInput
              name="email"
              label="Email Address"
              type="email"
              placeholder="juan@email.com"
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

            <FormCalendar
              name="preferredDate"
              label="Preferred Date"
              placeholder="Select a date"
              minDate={new Date()}
              showRequired
              className="mb-0"
            />

            {!presetService && (
              <div className="sm:col-span-2">
                <FormSelect
                  name="serviceType"
                  label="What do you need?"
                  options={SERVICE_OPTIONS}
                  placeholder="Select a service"
                  showRequired
                  className="mb-0"
                />
              </div>
            )}

            <div className="sm:col-span-2">
              <FormTextarea
                name="message"
                label="Message / Special Requests"
                rows={3}
                placeholder="Group size, pickup point, flight number — anything else we should know…"
                maxLength={FORM_CONST.MESSAGE_MAX_LENGTH}
                className="mb-0"
              />
            </div>
          </div>

          {/* The honeypot. Hidden from people and from screen readers; bots
              fill it in and the intake route silently discards the submission. */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="promo-website">Website</label>
            <input id="promo-website" tabIndex={-1} autoComplete="off" {...methods.register('website')} />
          </div>

          {error && (
            <p
              role="alert"
              className="mt-5 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-800"
            >
              {error}
            </p>
          )}

          <div className="mt-6 border-t border-slate-200 pt-6">
            <Button
              type="submit"
              disabled={isSubmitting}
              loading={isSubmitting}
              className="w-full justify-center rounded-xl border-0 bg-gradient-to-r from-coral to-mango px-6 py-4 font-semibold text-white shadow-lg shadow-coral/25 transition-all hover:-translate-y-0.5 hover:from-coral-dark hover:to-mango-dark disabled:from-coral/70 disabled:to-mango/70"
              label={isSubmitting ? 'Sending…' : campaign.ctaLabel}
              icon={isSubmitting ? 'pi pi-spin pi-spinner' : 'pi pi-send'}
              iconPos="right"
            />
            <p className="mt-2 text-center text-xs text-slate-500">
              We confirm availability first — no card needed.
            </p>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}

export default CampaignInquiryForm;
