/**
 * TourForm — create and edit a tour package.
 *
 * One form for both, because a "new tour" and an "edit tour" differ only in
 * where the defaults come from and what happens after a successful save. The
 * caller owns the save itself, so this component never talks to the API.
 *
 * Validation is `tourInputSchema` — the very schema the API route re-runs — so
 * a tour the browser accepts is a tour the server accepts.
 *
 * The resolver is wrapped rather than used bare: it prunes the blank trailing
 * rows an editor leaves behind before validating, and react-hook-form submits
 * the resolver's parsed output, so the cleaned tour is also the saved tour.
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm, type Resolver } from 'react-hook-form';

import {
  FormGallery,
  FormImageUpload,
  FormInput,
  FormItinerary,
  FormRichText,
  FormSlug,
  FormStringList,
  FormTextarea,
} from '@/components';
import {
  TOUR_SHORT_DESCRIPTION_MAX,
  tourInputSchema,
  type TourFormValues,
  type TourInput,
} from '@/models/tour.schema';
import type { TourRecord } from '@/types/tour';

// --- Defaults ---------------------------------------------------------------

/**
 * The three rates every EasyRide tour quotes, pre-labelled with usual capacities.
 *
 * The prices start empty, not 0. A text input renders 0 as a blank box anyway,
 * so a numeric default would show "nothing entered" while quietly holding a
 * valid ₱0 — and a tour would publish itself as free. Empty fails validation,
 * which is the honest answer. The schema coerces whatever is typed back to a
 * number, so the string only ever exists inside the form.
 */
const EMPTY_PRICING = {
  sedan: { price: '' as unknown as number, capacity: '1-3 pax' },
  suv: { price: '' as unknown as number, capacity: '4-6 pax' },
  van: { price: '' as unknown as number, capacity: '7-14 pax' },
};

const EMPTY_TOUR: TourFormValues = {
  title: '',
  slug: '',
  shortDescription: '',
  description: '',
  image: '',
  gallery: [],
  duration: '',
  featured: false,
  isPublished: true,
  sortOrder: 0,
  pricing: EMPTY_PRICING,
  itinerary: [],
  inclusions: [],
  exclusions: [],
};

function toFormValues(tour: TourRecord): TourFormValues {
  return {
    title: tour.title,
    slug: tour.slug,
    shortDescription: tour.shortDescription,
    description: tour.description,
    image: tour.image,
    gallery: tour.gallery ?? [],
    duration: tour.duration,
    featured: tour.featured,
    isPublished: tour.isPublished,
    sortOrder: tour.sortOrder,
    pricing: tour.pricing,
    itinerary: tour.itinerary,
    inclusions: tour.inclusions,
    exclusions: tour.exclusions,
  };
}

// --- Cleanup ----------------------------------------------------------------

/**
 * Drops the empty rows a list editor accumulates, and turns a cleared price
 * back into "nothing entered" — `Number('')` is 0, which would otherwise save a
 * free tour instead of asking for the rate.
 */
function pruneBlanks(values: TourFormValues): TourFormValues {
  const rate = (vehicle: { price: number; capacity: string }) => {
    const typed = vehicle.price as number | string | null | undefined;
    // `Number('')` is 0, so a cleared price has to become "missing" here or the
    // schema would coerce it into a free tour instead of asking for the rate.
    const isBlank = typed === '' || typed === null || typed === undefined;

    return { ...vehicle, price: isBlank ? (undefined as unknown as number) : vehicle.price };
  };

  return {
    ...values,
    pricing: {
      sedan: rate(values.pricing.sedan),
      suv: rate(values.pricing.suv),
      van: rate(values.pricing.van),
    },
    itinerary: (values.itinerary ?? [])
      .filter((stop) => (stop.activity ?? '').trim() !== '')
      .map((stop) => ({
        activity: stop.activity.trim(),
        // An empty time is absent, not blank: the public page only renders the
        // time column for the stops that actually have one.
        ...((stop.time ?? '').trim() ? { time: stop.time!.trim() } : {}),
      })),
    inclusions: (values.inclusions ?? []).map((item) => item.trim()).filter(Boolean),
    exclusions: (values.exclusions ?? []).map((item) => item.trim()).filter(Boolean),
    gallery: (values.gallery ?? []).filter(Boolean),
  };
}

// --- Layout helpers ---------------------------------------------------------

function Card({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <header className="mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-900">{title}</h2>
        {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      </header>
      {children}
    </section>
  );
}

/** One vehicle's rate — the three of them are the tour's price table. */
function RateFields({ vehicle, label }: { vehicle: 'sedan' | 'suv' | 'van'; label: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <p className="mb-2 text-sm font-semibold text-slate-900">{label}</p>
      <FormInput
        name={`pricing.${vehicle}.price`}
        label="Price (₱)"
        placeholder="4000"
        enableOnlyInteger
        className="mb-3"
      />
      <FormInput
        name={`pricing.${vehicle}.capacity`}
        label="Capacity"
        placeholder="1-3 pax"
        className="mb-0"
      />
    </div>
  );
}

// --- Component --------------------------------------------------------------

export interface TourFormProps {
  /** Absent for a new tour. */
  tour?: TourRecord;
  onSubmit: (values: TourInput) => Promise<void>;
  onDelete?: () => Promise<void>;
  /** Where Cancel goes back to. */
  cancelHref?: string;
}

export function TourForm({ tour, onSubmit, onDelete, cancelHref = '/admin/tours' }: TourFormProps) {
  const isEdit = Boolean(tour);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const defaultValues = useMemo(() => (tour ? toFormValues(tour) : EMPTY_TOUR), [tour]);

  const resolver: Resolver<TourFormValues, unknown, TourInput> = useMemo(() => {
    // The zod input type allows the coerced/defaulted shapes the form holds
    // (a price still being typed, an omitted slug); the output is `TourInput`.
    const validate = zodResolver(tourInputSchema) as unknown as Resolver<
      TourFormValues,
      unknown,
      TourInput
    >;

    return (values, context, options) => validate(pruneBlanks(values), context, options);
  }, []);

  const methods = useForm<TourFormValues, unknown, TourInput>({
    resolver,
    defaultValues,
    mode: 'onBlur',
  });

  const {
    handleSubmit,
    formState: { isSubmitting, isDirty, errors },
  } = methods;

  // A tour is a lot of typing to lose to a stray browser Back.
  useEffect(() => {
    if (!isDirty || isSubmitting) return;

    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isDirty, isSubmitting]);

  const save = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await onSubmit(values);
    } catch (caught) {
      const message =
        (caught as { message?: string })?.message ?? 'Could not save this tour. Please try again.';
      setSubmitError(message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  const remove = async () => {
    if (!onDelete) return;
    if (!window.confirm(`Delete “${tour?.title}”? This takes the page off the site for good.`)) {
      return;
    }

    setIsDeleting(true);
    setSubmitError(null);
    try {
      await onDelete();
    } catch (caught) {
      setSubmitError((caught as { message?: string })?.message ?? 'Could not delete this tour.');
      setIsDeleting(false);
    }
  };

  const isBusy = isSubmitting || isDeleting;
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <FormProvider {...methods}>
      <form onSubmit={save} noValidate className="space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <nav className="mb-1 text-sm text-slate-500">
              <Link href="/admin/tours" className="hover:text-coral">
                Tours
              </Link>
              <span className="mx-1.5">/</span>
              <span className="text-slate-700">{isEdit ? 'Edit' : 'New tour'}</span>
            </nav>
            <h1 className="truncate text-2xl font-bold text-slate-900">
              {isEdit ? tour!.title : 'New tour'}
            </h1>
            {isEdit && (
              <p className="mt-1 text-sm text-slate-600">
                <Link
                  href={`/tours/${tour!.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-coral hover:underline"
                >
                  /tours/{tour!.slug}
                  <i className="pi pi-external-link ml-1 text-[10px]" />
                </Link>
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
              {isEdit ? 'Save changes' : 'Create tour'}
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

        {hasErrors && (
          <div
            role="alert"
            className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800"
          >
            <i className="pi pi-exclamation-triangle mr-2" />
            Some details still need attention — the fields below are marked.
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card title="Basics">
              <FormInput
                name="title"
                label="Tour name"
                placeholder="Oslob Whale Shark & Tumalog Falls"
                showRequired
              />

              <FormSlug name="slug" sourceName="title" excludeId={tour?.id} autoFollow={!isEdit} />

              <FormTextarea
                name="shortDescription"
                label="Short description"
                placeholder="One or two sentences — this is the card blurb and the Google result."
                rows={3}
                maxLength={TOUR_SHORT_DESCRIPTION_MAX}
                showRequired
              />

              <FormInput
                name="duration"
                label="Duration"
                placeholder="8 hours, Full Day, 2D1N…"
                showRequired
                className="mb-0"
              />
            </Card>

            <Card title="Banner image" hint="The hero photo on the tour page and its card.">
              <FormImageUpload name="image" className="mb-0" />
            </Card>

            <Card
              title="Description"
              hint="The long copy on the tour page. Headings and lists are fine."
            >
              <FormRichText
                name="description"
                placeholder="What makes this trip worth taking?"
                className="mb-0"
              />
            </Card>

            <Card title="Pricing" hint="The rate per vehicle, all-in for the group.">
              <div className="grid gap-3 sm:grid-cols-3">
                <RateFields vehicle="sedan" label="Sedan" />
                <RateFields vehicle="suv" label="SUV" />
                <RateFields vehicle="van" label="Van" />
              </div>
            </Card>

            <Card title="Itinerary" hint="In order. A time is optional — most stops do not need one.">
              <FormItinerary name="itinerary" className="mb-0" />
            </Card>

            <div className="grid gap-6 sm:grid-cols-2">
              <Card title="Inclusions" hint="What the price covers.">
                <FormStringList
                  name="inclusions"
                  placeholder="Driver, fuel, hotel pickup…"
                  addLabel="Add inclusion"
                  emptyLabel="Nothing listed yet — start with the vehicle and driver."
                  className="mb-0"
                />
              </Card>

              <Card title="Exclusions" hint="What the guest pays on the day.">
                <FormStringList
                  name="exclusions"
                  placeholder="Entrance fees, food…"
                  addLabel="Add exclusion"
                  emptyLabel="Nothing excluded."
                  className="mb-0"
                />
              </Card>
            </div>

            <Card title="Gallery" hint="Extra photos shown below the description.">
              <FormGallery name="gallery" className="mb-0" />
            </Card>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
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
                      Visible on the site and bookable. Unpublish to take it down without deleting.
                    </span>
                  </span>
                </label>

                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    {...methods.register('featured')}
                    className="mt-0.5 h-4 w-4 accent-coral"
                  />
                  <span>
                    <span className="block text-sm font-medium text-slate-700">Featured</span>
                    <span className="block text-xs text-slate-500">
                      Shows in the homepage strip (the first three featured tours).
                    </span>
                  </span>
                </label>

                <FormInput
                  name="sortOrder"
                  label="Sort order"
                  placeholder="0"
                  className="mb-0"
                />
                <p className="-mt-3 text-xs text-slate-500">
                  Lower numbers come first; ties fall back to the tour name.
                </p>
              </div>
            </Card>

            {isEdit && (
              <Card title="Record">
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Last edited</dt>
                    <dd className="text-right text-slate-700">
                      {new Date(tour!.updatedAt).toLocaleDateString('en-PH', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </dd>
                  </div>
                  {tour!.updatedByName && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">By</dt>
                      <dd className="text-right text-slate-700">{tour!.updatedByName}</dd>
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
                    {isDeleting ? 'Deleting…' : 'Delete tour'}
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

export default TourForm;
