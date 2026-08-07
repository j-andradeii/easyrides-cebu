/**
 * VehicleForm — create and edit a vehicle in the fleet.
 *
 * One form for both, because a "new vehicle" and an "edit vehicle" differ only
 * in where the defaults come from and what happens after a successful save. The
 * caller owns the save itself, so this component never talks to the API — the
 * same contract `TourForm` keeps.
 *
 * Every field is one of the shared `Form*` components, so a fleet card is
 * edited with the very inputs the tour editor uses.
 *
 * Validation is `vehicleInputSchema` — the schema the API route re-runs — so a
 * vehicle the browser accepts is a vehicle the server accepts. The resolver is
 * wrapped rather than used bare: it prunes the blank rows an editor leaves
 * behind before validating, and react-hook-form submits the resolver's parsed
 * output, so the cleaned vehicle is also the saved vehicle.
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm, type Resolver } from 'react-hook-form';

import { FormGallery, FormImageUpload, FormInput, FormSlug, FormStringList } from '@/components';
import * as vehicleService from '@/services/vehicle.service';
import {
  VEHICLE_FEATURE_COUNT_MAX,
  VEHICLE_GALLERY_MAX,
  vehicleInputSchema,
  type VehicleFormValues,
  type VehicleInput,
} from '@/models/vehicle.schema';
import type { VehicleRecord } from '@/types/vehicle';

// --- Defaults ---------------------------------------------------------------

/**
 * The rate starts empty, not 0. A text input renders 0 as a blank box anyway,
 * so a numeric default would show "nothing entered" while quietly holding a
 * valid ₱0 — and a vehicle would publish itself as free. Empty fails
 * validation, which is the honest answer. The schema coerces whatever is typed
 * back to a number, so the string only ever exists inside the form.
 */
const EMPTY_VEHICLE: VehicleFormValues = {
  slug: '',
  type: '',
  models: '',
  capacity: '',
  rate: '' as unknown as number,
  features: [],
  image: '',
  gallery: [],
  popular: false,
  isPublished: true,
  sortOrder: 0,
};

function toFormValues(vehicle: VehicleRecord): VehicleFormValues {
  return {
    slug: vehicle.slug,
    type: vehicle.type,
    models: vehicle.models,
    capacity: vehicle.capacity,
    rate: vehicle.rate,
    features: vehicle.features,
    image: vehicle.image,
    // A vehicle saved before the column existed comes back without one.
    gallery: vehicle.gallery ?? [],
    popular: vehicle.popular,
    isPublished: vehicle.isPublished,
    sortOrder: vehicle.sortOrder,
  };
}

// --- Cleanup ----------------------------------------------------------------

/**
 * Drops the empty rows the feature list accumulates, and turns a cleared rate
 * back into "nothing entered" — `Number('')` is 0, which would otherwise save a
 * free vehicle instead of asking for the price.
 */
function pruneBlanks(values: VehicleFormValues): VehicleFormValues {
  const typed = values.rate as number | string | null | undefined;
  const isBlank = typed === '' || typed === null || typed === undefined;

  return {
    ...values,
    rate: isBlank ? (undefined as unknown as number) : values.rate,
    features: (values.features ?? []).map((item) => item.trim()).filter(Boolean),
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

// --- Component --------------------------------------------------------------

export interface VehicleFormProps {
  /** Absent for a new vehicle. */
  vehicle?: VehicleRecord;
  onSubmit: (values: VehicleInput) => Promise<void>;
  onDelete?: () => Promise<void>;
  /** Where Cancel goes back to. */
  cancelHref?: string;
}

export function VehicleForm({
  vehicle,
  onSubmit,
  onDelete,
  cancelHref = '/admin/vehicles',
}: VehicleFormProps) {
  const isEdit = Boolean(vehicle);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const defaultValues = useMemo(
    () => (vehicle ? toFormValues(vehicle) : EMPTY_VEHICLE),
    [vehicle]
  );

  const resolver: Resolver<VehicleFormValues, unknown, VehicleInput> = useMemo(() => {
    // The zod input type allows the coerced/defaulted shapes the form holds (a
    // rate still being typed); the output is `VehicleInput`.
    const validate = zodResolver(vehicleInputSchema) as unknown as Resolver<
      VehicleFormValues,
      unknown,
      VehicleInput
    >;

    return (values, context, options) => validate(pruneBlanks(values), context, options);
  }, []);

  const methods = useForm<VehicleFormValues, unknown, VehicleInput>({
    resolver,
    defaultValues,
    mode: 'onBlur',
  });

  const {
    handleSubmit,
    watch,
    formState: { isSubmitting, isDirty, errors },
  } = methods;

  // The slug preview is derived from the models *and* the class, so the lookup
  // has to carry whatever the class box holds right now — FormSlug itself only
  // knows about its one source field.
  const type = watch('type');
  const suggestSlug = useCallback(
    (input: { title?: string; slug?: string; excludeId?: string }) =>
      vehicleService.suggestSlug({
        models: input.title,
        type,
        slug: input.slug,
        excludeId: input.excludeId,
      }),
    [type]
  );

  // An uploaded photo and a typed-out feature list are worth protecting from a
  // stray browser Back.
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
        (caught as { message?: string })?.message ??
        'Could not save this vehicle. Please try again.';
      setSubmitError(message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  const remove = async () => {
    if (!onDelete) return;
    if (!window.confirm(`Delete “${vehicle?.type}”? This takes the card off the site for good.`)) {
      return;
    }

    setIsDeleting(true);
    setSubmitError(null);
    try {
      await onDelete();
    } catch (caught) {
      setSubmitError((caught as { message?: string })?.message ?? 'Could not delete this vehicle.');
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
              <Link href="/admin/vehicles" className="hover:text-coral">
                Fleet
              </Link>
              <span className="mx-1.5">/</span>
              <span className="text-slate-700">{isEdit ? 'Edit' : 'New vehicle'}</span>
            </nav>
            <h1 className="truncate text-2xl font-bold text-slate-900">
              {isEdit ? vehicle!.type : 'New vehicle'}
            </h1>
            {isEdit && <p className="mt-1 truncate text-sm text-slate-600">{vehicle!.models}</p>}
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
              {isEdit ? 'Save changes' : 'Create vehicle'}
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
            <Card title="Basics" hint="What the card says under the photo.">
              <FormInput
                name="type"
                label="Vehicle class"
                placeholder="Sedan, SUV, Van…"
                showRequired
              />

              <FormInput
                name="models"
                label="Models"
                placeholder="Vios / Mirage G4 (AT)"
                showRequired
              />

              <FormSlug
                name="slug"
                sourceName="models"
                prefix="/fleet/"
                excludeId={vehicle?.id}
                autoFollow={!isEdit}
                resolve={suggestSlug}
                noun="vehicle"
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput
                  name="capacity"
                  label="Capacity"
                  placeholder="5-seater"
                  showRequired
                  className="mb-0"
                />

                <FormInput
                  name="rate"
                  label="Rate per 24 hours (₱)"
                  placeholder="1500"
                  enableOnlyInteger
                  showRequired
                  className="mb-0"
                />
              </div>
            </Card>

            <Card title="Photo" hint="The car on a plain background — it is shown uncropped.">
              <FormImageUpload
                name="image"
                folder="vehicles"
                placeholder="Upload the vehicle photo"
                placeholderHint="A cut-out on white works best — the card shows the whole car"
                fit="contain"
                className="mb-0"
              />
            </Card>

            <Card
              title="Gallery"
              hint="Extra shots for the vehicle page — interior, boot, dashboard. The arrows set the order they appear in."
            >
              <FormGallery
                name="gallery"
                folder="vehicles"
                max={VEHICLE_GALLERY_MAX}
                hint="Optional. The photo above stays the headline shot; these show underneath it."
                className="mb-0"
              />
            </Card>

            <Card title="Features" hint="The ticked lines on the card. Four reads best.">
              <FormStringList
                name="features"
                placeholder="Air Conditioned, Automatic Transmission…"
                addLabel="Add feature"
                emptyLabel="Nothing listed yet — start with the transmission and aircon."
                max={VEHICLE_FEATURE_COUNT_MAX}
                className="mb-0"
              />
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
                      Visible in the fleet section. Unpublish to take it down without deleting.
                    </span>
                  </span>
                </label>

                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    {...methods.register('popular')}
                    className="mt-0.5 h-4 w-4 accent-coral"
                  />
                  <span>
                    <span className="block text-sm font-medium text-slate-700">Most popular</span>
                    <span className="block text-xs text-slate-500">
                      Adds the ribbon and the coral highlight. Usually only one vehicle wears it.
                    </span>
                  </span>
                </label>

                <FormInput name="sortOrder" label="Sort order" placeholder="0" className="mb-0" />
                <p className="-mt-3 text-xs text-slate-500">
                  Lower numbers come first; ties fall back to the class name.
                </p>
              </div>
            </Card>

            {isEdit && (
              <Card title="Record">
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Last edited</dt>
                    <dd className="text-right text-slate-700">
                      {new Date(vehicle!.updatedAt).toLocaleDateString('en-PH', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </dd>
                  </div>
                  {vehicle!.updatedByName && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">By</dt>
                      <dd className="text-right text-slate-700">{vehicle!.updatedByName}</dd>
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
                    {isDeleting ? 'Deleting…' : 'Delete vehicle'}
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

export default VehicleForm;
