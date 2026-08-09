/**
 * CampaignForm — create and edit a promo page.
 *
 * One form for both, because a "new campaign" and an "edit campaign" differ
 * only in where the defaults come from and what happens after a successful
 * save. The caller owns the save itself, so this component never talks to the
 * API — the same contract `TourForm` and `VehicleForm` keep.
 *
 * The one thing here that the other two editors do not have is the link
 * preview: a campaign exists to be pasted into a Facebook or Viber post, and
 * the banner, name and one-liner are not three fields — they are one card that
 * either makes someone tap or does not. Showing that card while it is being
 * written is the difference between guessing and seeing.
 *
 * Validation is `campaignInputSchema` — the schema the API route re-runs — so a
 * campaign the browser accepts is a campaign the server accepts.
 *
 * Because Save lives in the header of a two-column editor that is taller than a
 * screen, a rejected submit has to say more than "something is wrong": each
 * field carries its own message, and the summary at the top names every one of
 * them and scrolls to it. A 400 from the API is unpacked the same way, so a
 * server-side rejection lands on the field that caused it.
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm, useWatch, type Resolver } from 'react-hook-form';

import {
  FormCalendar,
  FormImageUpload,
  FormInput,
  FormRichText,
  FormSelect,
  FormSlug,
  FormTextarea,
} from '@/components';
import * as campaignService from '@/services/campaign.service';
import {
  CAMPAIGN_BANNER_RATIO,
  CAMPAIGN_SHORT_DESCRIPTION_MAX,
  campaignInputSchema,
  type CampaignFormValues,
  type CampaignInput,
} from '@/models/campaign.schema';
import { SERVICE_TYPES, VEHICLE_TYPES } from '@/models/inquiry.schema';
import { serviceLabel, vehicleLabel } from '@/lib/crm/normalize';
import type { CampaignRecord } from '@/types/campaign';

// --- Options ----------------------------------------------------------------

/**
 * "Let the visitor choose" is the first option rather than an absent one: a
 * general promo ("20% off everything this month") genuinely has no single
 * service, and forcing one would mis-tag every lead it brings in.
 */
const SERVICE_OPTIONS = [
  { value: '', label: 'Let the visitor choose' },
  ...SERVICE_TYPES.map((value) => ({ value, label: serviceLabel(value) })),
];

const VEHICLE_OPTIONS = [
  { value: '', label: 'Not vehicle-specific' },
  ...VEHICLE_TYPES.map((value) => ({ value, label: vehicleLabel(value) ?? value })),
];

// --- Defaults ---------------------------------------------------------------

const EMPTY_CAMPAIGN: CampaignFormValues = {
  slug: '',
  name: '',
  shortDescription: '',
  description: '',
  bannerImage: '',
  ctaLabel: 'Send Inquiry',
  serviceType: '',
  vehicleType: '',
  isPublished: true,
  endsAt: null,
};

function toFormValues(campaign: CampaignRecord): CampaignFormValues {
  return {
    slug: campaign.slug,
    name: campaign.name,
    shortDescription: campaign.shortDescription,
    description: campaign.description,
    bannerImage: campaign.bannerImage,
    ctaLabel: campaign.ctaLabel,
    serviceType: campaign.serviceType ?? '',
    vehicleType: campaign.vehicleType ?? '',
    isPublished: campaign.isPublished,
    endsAt: campaign.endsAt ? new Date(campaign.endsAt) : null,
  };
}

/**
 * Turns the form's shapes into the payload's.
 *
 * The date picker holds a `Date` (or null) while the schema wants an ISO
 * string; the two dropdowns hold `''` for "any", which the schema's
 * `optionalEnum` maps to null.
 */
function toPayloadShape(values: CampaignFormValues): Record<string, unknown> {
  return {
    ...values,
    // End of the chosen day in the *browser's* zone — an offer that "ends 30
    // April" should still be live at 11pm in Cebu, not since 8am.
    endsAt: values.endsAt ? endOfDay(values.endsAt).toISOString() : '',
  };
}

function endOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

// --- Fields -----------------------------------------------------------------

/**
 * Every field the schema can reject, in the order it appears on the page.
 *
 * "The fields below are marked" is no help when the marked one is the banner
 * three cards down or the button text in the sidebar, so this drives a summary
 * that names each problem and jumps to it — and doubles as the allow-list for
 * mapping the API's own field errors back onto inputs.
 */
const FIELDS: ReadonlyArray<{ name: keyof CampaignFormValues; label: string }> = [
  { name: 'name', label: 'Campaign name' },
  { name: 'slug', label: 'Link' },
  { name: 'shortDescription', label: 'One-liner' },
  { name: 'bannerImage', label: 'Banner' },
  { name: 'description', label: 'Details' },
  { name: 'ctaLabel', label: 'Button text' },
  { name: 'serviceType', label: 'Pre-select service' },
  { name: 'vehicleType', label: 'Pre-select vehicle' },
  { name: 'endsAt', label: 'Offer ends' },
];

type FieldName = (typeof FIELDS)[number]['name'];

const FIELD_NAMES = new Set<string>(FIELDS.map((field) => field.name));

const anchorId = (name: string) => `campaign-field-${name}`;

/**
 * The Form* components own their own markup, so the scroll target is the
 * wrapper around one and the thing to focus is whichever control it rendered —
 * a plain input, a PrimeReact widget's inner input, TipTap's contenteditable,
 * or, for the banner, the upload button (its file input is display:none, which
 * cannot take focus).
 */
function focusField(name: string) {
  const anchor = document.getElementById(anchorId(name));
  if (!anchor) return;

  anchor.scrollIntoView({ behavior: 'smooth', block: 'center' });

  const control =
    anchor.querySelector<HTMLElement>(
      'input:not([type="hidden"]):not([type="file"]), textarea, [contenteditable="true"]'
    ) ?? anchor.querySelector<HTMLElement>('button');

  control?.focus({ preventScroll: true });
}

/** Scroll target for one field, so the summary above can jump to it. */
function Field({ name, children }: { name: FieldName; children: React.ReactNode }) {
  return (
    <div id={anchorId(name)} className="scroll-mt-24">
      {children}
    </div>
  );
}

// --- Layout helpers ---------------------------------------------------------

function Card({
  title,
  hint,
  required,
  children,
}: {
  title: string;
  hint?: string;
  /** The card *is* the field's label — the banner has no label of its own. */
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <header className="mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
          {title}
          {required && <span className="ml-1 text-cebu-red">*</span>}
        </h2>
        {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      </header>
      {children}
    </section>
  );
}

/**
 * What the link looks like once it is posted.
 *
 * Deliberately styled like a social card and not like the rest of the portal —
 * it is a preview of somewhere else, and making it look native to this page
 * would defeat the point.
 */
function LinkPreview({
  banner,
  name,
  shortDescription,
  slug,
}: {
  banner: string;
  name: string;
  shortDescription: string;
  slug: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-300 bg-white">
      {banner ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={banner} alt="" className="aspect-[1200/630] w-full bg-slate-100 object-cover" />
      ) : (
        <div className="flex aspect-[1200/630] w-full items-center justify-center bg-slate-100 text-center text-xs text-slate-400">
          The banner shows here
        </div>
      )}
      <div className="border-t border-slate-200 bg-slate-50 px-3 py-2">
        <p className="text-[10px] uppercase tracking-wide text-slate-500">
          easyridecebutours.com
        </p>
        <p className="mt-0.5 truncate text-sm font-semibold text-slate-900">
          {name || 'Your promo name'}
        </p>
        <p className="line-clamp-2 text-xs text-slate-600">
          {shortDescription || 'The one-liner you write below appears here.'}
        </p>
      </div>
      <p className="truncate px-3 py-2 font-mono text-[11px] text-slate-500">
        /promo/{slug || '…'}
      </p>
    </div>
  );
}

// --- Component --------------------------------------------------------------

export interface CampaignFormProps {
  /** Absent for a new campaign. */
  campaign?: CampaignRecord;
  onSubmit: (values: CampaignInput) => Promise<void>;
  onDelete?: () => Promise<void>;
  /** Where Cancel goes back to. */
  cancelHref?: string;
}

export function CampaignForm({
  campaign,
  onSubmit,
  onDelete,
  cancelHref = '/admin/campaigns',
}: CampaignFormProps) {
  const isEdit = Boolean(campaign);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const defaultValues = useMemo(
    () => (campaign ? toFormValues(campaign) : EMPTY_CAMPAIGN),
    [campaign]
  );

  const resolver: Resolver<CampaignFormValues, unknown, CampaignInput> = useMemo(() => {
    const validate = zodResolver(campaignInputSchema) as unknown as Resolver<
      CampaignFormValues,
      unknown,
      CampaignInput
    >;

    return (values, context, options) =>
      validate(toPayloadShape(values) as CampaignFormValues, context, options);
  }, []);

  const methods = useForm<CampaignFormValues, unknown, CampaignInput>({
    resolver,
    defaultValues,
    // Nothing goes red while a field is still being typed for the first time,
    // but once it has been left — or a save has been attempted — corrections
    // clear as they are made rather than at the next blur.
    mode: 'onTouched',
    // Only the slug box registers a DOM ref; the rest are Controller-wrapped
    // PrimeReact widgets whose refs react-hook-form cannot focus. Left on, it
    // would skip past the actual first error to whichever field it *can* focus,
    // so `focusField` below does the job for every field instead.
    shouldFocusError: false,
  });

  const {
    control,
    handleSubmit,
    setError,
    formState: { isSubmitting, isDirty, errors, submitCount },
  } = methods;

  // The preview redraws as these three are typed — that is its whole job.
  const [banner, name, shortDescription, slug] = useWatch({
    control,
    name: ['bannerImage', 'name', 'shortDescription', 'slug'],
  });

  const suggestSlug = useCallback(
    (input: { title?: string; slug?: string; excludeId?: string }) =>
      campaignService.suggestSlug({
        name: input.title,
        slug: input.slug,
        excludeId: input.excludeId,
      }),
    []
  );

  // An uploaded banner and a written-out offer are worth protecting from a
  // stray browser Back.
  useEffect(() => {
    if (!isDirty || isSubmitting) return;

    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isDirty, isSubmitting]);

  const save = handleSubmit(
    async (values) => {
      setSubmitError(null);
      try {
        await onSubmit(values);
      } catch (caught) {
        const failure = caught as { message?: string; errors?: Record<string, string[]> };

        // The API validates with this same schema and answers with the same
        // field paths, so each message goes back on the input that caused it
        // rather than into one opaque banner.
        const rejected = Object.entries(failure.errors ?? {}).flatMap(([path, messages]) =>
          FIELD_NAMES.has(path) && messages?.[0] ? [[path, messages[0]] as const] : []
        );

        for (const [path, message] of rejected) {
          setError(path as FieldName, { type: 'server', message });
        }

        setSubmitError(
          rejected.length
            ? 'The server rejected some details — they are listed below.'
            : (failure.message ?? 'Could not save this campaign. Please try again.')
        );

        if (rejected.length) focusField(rejected[0][0]);
        else window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    (invalid) => {
      // Save sits in the header. Without this, clicking it from the top of a
      // form taller than the screen looks like nothing happened at all.
      const first = FIELDS.find(({ name }) => invalid[name]);
      if (first) focusField(first.name);
    }
  );

  const remove = async () => {
    if (!onDelete) return;
    if (
      !window.confirm(
        `Delete “${campaign?.name}”? Anyone who already has the link will get a 404. The leads it captured are kept.`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    setSubmitError(null);
    try {
      await onDelete();
    } catch (caught) {
      setSubmitError((caught as { message?: string })?.message ?? 'Could not delete this campaign.');
      setIsDeleting(false);
    }
  };

  const isBusy = isSubmitting || isDeleting;

  const invalidFields = FIELDS.flatMap(({ name, label }) => {
    const message = errors[name]?.message;
    return typeof message === 'string' ? [{ name, label, message }] : [];
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={save} noValidate className="space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <nav className="mb-1 text-sm text-slate-500">
              <Link href="/admin/campaigns" className="hover:text-coral">
                Campaigns
              </Link>
              <span className="mx-1.5">/</span>
              <span className="text-slate-700">{isEdit ? 'Edit' : 'New campaign'}</span>
            </nav>
            <h1 className="truncate text-2xl font-bold text-slate-900">
              {isEdit ? campaign!.name : 'New campaign'}
            </h1>
            {isEdit && (
              <p className="mt-1 truncate font-mono text-sm text-slate-600">
                /promo/{campaign!.slug}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={cancelHref}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isBusy}
              className="inline-flex items-center gap-2 rounded-lg bg-coral px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-coral-dark disabled:opacity-50"
            >
              {isSubmitting && <i className="pi pi-spin pi-spinner text-xs" />}
              {isEdit ? 'Save changes' : 'Create campaign'}
            </button>
          </div>
        </header>

        {submitError && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800"
          >
            {submitError}
          </div>
        )}

        {/*
          Only after a save has been attempted: a summary that appears the
          moment someone tabs out of an empty box would be nagging, while the
          field's own message underneath is not.
        */}
        {submitCount > 0 && invalidFields.length > 0 && (
          <div
            role="alert"
            aria-live="polite"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3"
          >
            <p className="flex items-center gap-2 text-sm font-semibold text-red-900">
              <i className="pi pi-exclamation-circle" />
              {invalidFields.length === 1
                ? 'One field needs attention before this can be saved'
                : `${invalidFields.length} fields need attention before this can be saved`}
            </p>

            <ul className="mt-2 space-y-1">
              {invalidFields.map((field) => (
                <li key={field.name} className="flex gap-2 text-sm text-red-800">
                  <span aria-hidden className="select-none">
                    •
                  </span>
                  <button
                    type="button"
                    onClick={() => focusField(field.name)}
                    className="text-left underline-offset-2 hover:underline"
                  >
                    <span className="font-medium">{field.label}:</span> {field.message}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card title="The offer" hint="What the page says and what the shared link says.">
              <Field name="name">
                <FormInput
                  name="name"
                  label="Campaign name"
                  placeholder="Summer Oslob Whale Shark Promo 2026"
                  showRequired
                />
              </Field>

              <Field name="slug">
                <FormSlug
                  name="slug"
                  sourceName="name"
                  prefix="/promo/"
                  excludeId={campaign?.id}
                  autoFollow={!isEdit}
                  resolve={suggestSlug}
                  noun="campaign"
                />
              </Field>

              <Field name="shortDescription">
                <FormTextarea
                  name="shortDescription"
                  label="One-liner"
                  rows={2}
                  placeholder="₱1,000 off any Oslob day tour booked before 30 April — vehicle, driver and fuel included."
                  maxLength={CAMPAIGN_SHORT_DESCRIPTION_MAX}
                  showRequired
                />
              </Field>
              <p className="-mt-3 text-xs text-slate-500">
                This is the line Facebook shows under the banner, and the page&apos;s meta
                description. One sentence with the actual offer in it beats a slogan.
              </p>
            </Card>

            <Card
              title="Banner"
              required
              hint={`This is the image that shows when the link is shared. ${CAMPAIGN_BANNER_RATIO} works everywhere — anything else gets cropped to it.`}
            >
              <Field name="bannerImage">
                <FormImageUpload
                  name="bannerImage"
                  folder="campaigns"
                  placeholder="Upload the promo banner"
                  placeholderHint="Wide and legible on a phone — keep any text well inside the edges"
                  className="mb-0"
                />
              </Field>
            </Card>

            <Card
              title="Details"
              hint="Optional. Inclusions, how the discount works, the fine print — whatever someone needs before they fill in the form."
            >
              <Field name="description">
                <FormRichText
                  name="description"
                  placeholder="What's included, what the offer covers, any conditions…"
                  className="mb-0"
                />
              </Field>
            </Card>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <Card title="Link preview" hint="Roughly what a Facebook or Viber post will show.">
              <LinkPreview
                banner={banner}
                name={name}
                shortDescription={shortDescription}
                slug={slug}
              />
            </Card>

            <Card title="The form" hint="What the visitor fills in at the bottom of the page.">
              <Field name="ctaLabel">
                <FormInput
                  name="ctaLabel"
                  label="Button text"
                  placeholder="Claim this offer"
                  showRequired
                />
              </Field>

              <Field name="serviceType">
                <FormSelect
                  name="serviceType"
                  label="Pre-select service"
                  options={SERVICE_OPTIONS}
                  placeholder="Let the visitor choose"
                />
              </Field>

              <Field name="vehicleType">
                <FormSelect
                  name="vehicleType"
                  label="Pre-select vehicle"
                  options={VEHICLE_OPTIONS}
                  placeholder="Not vehicle-specific"
                  className="mb-0"
                />
              </Field>
            </Card>

            <Card title="Publishing">
              <div className="space-y-4">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    {...methods.register('isPublished')}
                    className="mt-0.5 h-4 w-4 accent-coral"
                  />
                  <span>
                    <span className="block text-sm font-medium text-slate-700">Published</span>
                    <span className="block text-xs text-slate-500">
                      Live at the URL above. Unpublish to take it down without deleting.
                    </span>
                  </span>
                </label>

                <Field name="endsAt">
                  <FormCalendar
                    name="endsAt"
                    label="Offer ends"
                    placeholder="Runs until I stop it"
                    minDate={new Date()}
                    className="mb-0"
                  />
                </Field>
                <p className="-mt-3 text-xs text-slate-500">
                  Optional. After this the page still opens — a link already shared should explain
                  itself rather than 404 — but the form closes.
                </p>
              </div>
            </Card>

            {isEdit && (
              <Card title="Record">
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Leads captured</dt>
                    <dd className="text-right font-semibold text-slate-900 tabular-nums">
                      {campaign!.leadCount}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Page views</dt>
                    <dd className="text-right text-slate-700 tabular-nums">
                      {campaign!.viewCount}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Last edited</dt>
                    <dd className="text-right text-slate-700">
                      {new Date(campaign!.updatedAt).toLocaleDateString('en-PH', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </dd>
                  </div>
                  {campaign!.updatedByName && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">By</dt>
                      <dd className="text-right text-slate-700">{campaign!.updatedByName}</dd>
                    </div>
                  )}
                </dl>

                {onDelete && (
                  <button
                    type="button"
                    onClick={remove}
                    disabled={isBusy}
                    className="mt-4 w-full rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-cebu-red transition-colors hover:bg-red-50 disabled:opacity-40"
                  >
                    {isDeleting ? 'Deleting…' : 'Delete campaign'}
                  </button>
                )}
              </Card>
            )}
          </aside>
        </div>
      </form>
    </FormProvider>
  );
}

export default CampaignForm;
