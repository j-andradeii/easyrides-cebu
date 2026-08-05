/**
 * /admin/tours/[id] — edit one tour.
 *
 * The form is mounted only once the tour is loaded, so its defaults are the
 * real values and no reset effect is needed. Saving re-reads the record and
 * remounts the form (`key`), which is what clears the dirty flag and shows the
 * slug the server actually stored — a rename is visible immediately.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { TourForm } from '@/components/admin/TourForm';
import * as tourService from '@/services/tour.service';
import type { TourInput } from '@/models/tour.schema';
import type { TourRecord } from '@/types/tour';

export default function EditTourPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [tour, setTour] = useState<TourRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!id) return;

    try {
      const response = await tourService.getTour(id);
      setTour(response.tour);
      setLoadError(null);
    } catch (caught) {
      setLoadError((caught as { message?: string })?.message ?? 'Could not load that tour.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Clear the "saved" note on its own so it never lingers over a later edit.
  useEffect(() => {
    if (!savedAt) return;

    const timer = setTimeout(() => setSavedAt(null), 4000);
    return () => clearTimeout(timer);
  }, [savedAt]);

  const save = async (values: TourInput) => {
    if (!id) return;

    const { tour: updated } = await tourService.updateTour(id, values);
    setTour(updated);
    setSavedAt(Date.now());
  };

  const remove = async () => {
    if (!id) return;

    await tourService.deleteTour(id);
    router.push('/admin/tours');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-600">
        <i className="pi pi-spin pi-spinner mr-2 text-xl" /> Loading tour…
      </div>
    );
  }

  if (loadError || !tour) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-14 text-center">
        <i className="pi pi-exclamation-circle text-2xl text-slate-300" />
        <p className="mt-3 text-sm font-medium text-slate-900">
          {loadError ?? 'That tour no longer exists.'}
        </p>
        <Link
          href="/admin/tours"
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <i className="pi pi-arrow-left text-xs" />
          Back to tours
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {savedAt && (
        <div
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800"
        >
          <i className="pi pi-check-circle mr-2" />
          Saved — the live page has been refreshed.
        </div>
      )}

      <TourForm key={tour.updatedAt} tour={tour} onSubmit={save} onDelete={remove} />
    </div>
  );
}
