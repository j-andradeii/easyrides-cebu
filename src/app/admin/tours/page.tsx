/**
 * /admin/tours — the tour catalogue.
 *
 * The whole catalogue is a handful of rows, so unlike /admin/inquiries this
 * loads once and filters in the browser: sorting and searching stay instant,
 * and the table can show the counts (stops, photos) that tell an editor at a
 * glance which tour is still half-written.
 *
 * Publish and Feature are toggled straight from the row — the two edits made
 * most often, and the ones that never need the form.
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';

import { formatDate, formatPeso } from '@/lib/format';
import * as tourService from '@/services/tour.service';
import type { TourListItem } from '@/types/tour';

type Filter = 'all' | 'published' | 'drafts' | 'featured';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'drafts', label: 'Drafts' },
  { value: 'featured', label: 'Featured' },
];

export default function AdminToursPage() {
  const router = useRouter();

  const [tours, setTours] = useState<TourListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  /** Id of the row whose toggle is in flight — disables just that row. */
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await tourService.listTours();
      setTours(response.items);
      setError(null);
    } catch (caught) {
      setError((caught as { message?: string })?.message ?? 'Could not load the tours.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return tours.filter((tour) => {
      if (filter === 'published' && !tour.isPublished) return false;
      if (filter === 'drafts' && tour.isPublished) return false;
      if (filter === 'featured' && !tour.featured) return false;

      if (!needle) return true;
      return (
        tour.title.toLowerCase().includes(needle) || tour.slug.toLowerCase().includes(needle)
      );
    });
  }, [tours, search, filter]);

  const stats = useMemo(
    () => ({
      total: tours.length,
      published: tours.filter((tour) => tour.isPublished).length,
      featured: tours.filter((tour) => tour.featured).length,
    }),
    [tours]
  );

  /**
   * Optimistic: the switch answers immediately and the row is reconciled with
   * the server's copy when it replies, or rolled back if it does not.
   */
  const toggle = async (tour: TourListItem, patch: { isPublished?: boolean; featured?: boolean }) => {
    setBusyId(tour.id);
    setTours((rows) => rows.map((row) => (row.id === tour.id ? { ...row, ...patch } : row)));

    try {
      await tourService.updateTour(tour.id, patch);
      setError(null);
    } catch (caught) {
      setTours((rows) => rows.map((row) => (row.id === tour.id ? tour : row)));
      setError((caught as { message?: string })?.message ?? 'Could not update that tour.');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (tour: TourListItem) => {
    if (!window.confirm(`Delete “${tour.title}”? This takes the page off the site for good.`)) {
      return;
    }

    setBusyId(tour.id);
    try {
      await tourService.deleteTour(tour.id);
      setTours((rows) => rows.filter((row) => row.id !== tour.id));
      setError(null);
    } catch (caught) {
      setError((caught as { message?: string })?.message ?? 'Could not delete that tour.');
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-600">
        <i className="pi pi-spin pi-spinner mr-2 text-xl" /> Loading tours…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tours</h1>
          <p className="mt-1 text-sm text-slate-600">
            {stats.total} tour{stats.total === 1 ? '' : 's'} · {stats.published} published ·{' '}
            {stats.featured} featured on the homepage
          </p>
        </div>

        <Link
          href="/admin/tours/new"
          className="inline-flex items-center gap-2 rounded-lg bg-coral px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-coral-dark"
        >
          <i className="pi pi-plus text-xs" />
          New tour
        </Link>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[15rem] flex-1">
          <i className="pi pi-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
          <InputText
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or slug…"
            className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-4 text-sm text-slate-700"
          />
        </div>

        <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
          {FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === option.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {tours.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-14 text-center">
          <i className="pi pi-map text-2xl text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-900">No tours yet</p>
          <p className="mt-1 text-sm text-slate-600">
            Add the first package and it goes live on the site as soon as it is published.
          </p>
          <Link
            href="/admin/tours/new"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-coral px-4 py-2 text-sm font-semibold text-white hover:bg-coral-dark"
          >
            <i className="pi pi-plus text-xs" />
            New tour
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <DataTable
            value={visible}
            dataKey="id"
            removableSort
            emptyMessage="No tours match that search."
            className="admin-table text-sm"
          >
            <Column
              header="Tour"
              sortable
              sortField="title"
              body={(tour: TourListItem) => (
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={tour.image}
                    alt=""
                    className="h-11 w-16 shrink-0 rounded-md bg-slate-100 object-cover"
                  />
                  <div className="min-w-0">
                    <Link
                      href={`/admin/tours/${tour.id}`}
                      className="block truncate font-medium text-slate-900 hover:text-coral"
                    >
                      {tour.title}
                    </Link>
                    <span className="block truncate text-xs text-slate-500">/{tour.slug}</span>
                  </div>
                </div>
              )}
            />

            <Column header="Duration" field="duration" sortable />

            <Column
              header="From"
              field="fromPrice"
              sortable
              body={(tour: TourListItem) => (
                <span className="font-medium text-slate-900">{formatPeso(tour.fromPrice)}</span>
              )}
            />

            <Column
              header="Content"
              body={(tour: TourListItem) => (
                <span className="whitespace-nowrap text-xs text-slate-600">
                  <i className="pi pi-map-marker mr-1 text-[10px]" />
                  {tour.itineraryCount} stop{tour.itineraryCount === 1 ? '' : 's'}
                  <span className="mx-1.5 text-slate-300">·</span>
                  <i className="pi pi-images mr-1 text-[10px]" />
                  {tour.galleryCount}
                </span>
              )}
            />

            <Column
              header="Order"
              field="sortOrder"
              sortable
              body={(tour: TourListItem) => (
                <span className="text-slate-600">{tour.sortOrder}</span>
              )}
            />

            <Column
              header="Status"
              sortable
              sortField="isPublished"
              body={(tour: TourListItem) => (
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    disabled={busyId === tour.id}
                    onClick={() => toggle(tour, { isPublished: !tour.isPublished })}
                    title={tour.isPublished ? 'Unpublish' : 'Publish'}
                    className={`rounded px-2 py-0.5 text-xs font-medium transition-colors disabled:opacity-40 ${
                      tour.isPublished
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tour.isPublished ? 'Live' : 'Draft'}
                  </button>

                  <button
                    type="button"
                    disabled={busyId === tour.id}
                    onClick={() => toggle(tour, { featured: !tour.featured })}
                    title={tour.featured ? 'Remove from the homepage' : 'Feature on the homepage'}
                    aria-label={tour.featured ? 'Unfeature tour' : 'Feature tour'}
                    className={`rounded px-1.5 py-0.5 text-xs transition-colors disabled:opacity-40 ${
                      tour.featured
                        ? 'bg-mango/20 text-amber-700 hover:bg-mango/30'
                        : 'text-slate-300 hover:bg-slate-100 hover:text-slate-500'
                    }`}
                  >
                    <i className={`pi ${tour.featured ? 'pi-star-fill' : 'pi-star'}`} />
                  </button>
                </div>
              )}
            />

            <Column
              header="Updated"
              field="updatedAt"
              sortable
              body={(tour: TourListItem) => (
                <span className="whitespace-nowrap text-xs text-slate-600">
                  {formatDate(tour.updatedAt)}
                </span>
              )}
            />

            <Column
              header=""
              body={(tour: TourListItem) => (
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => router.push(`/admin/tours/${tour.id}`)}
                    title="Edit"
                    aria-label={`Edit ${tour.title}`}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  >
                    <i className="pi pi-pencil text-xs" />
                  </button>

                  <Link
                    href={`/tours/${tour.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="View on the site"
                    aria-label={`View ${tour.title} on the site`}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  >
                    <i className="pi pi-external-link text-xs" />
                  </Link>

                  <button
                    type="button"
                    disabled={busyId === tour.id}
                    onClick={() => remove(tour)}
                    title="Delete"
                    aria-label={`Delete ${tour.title}`}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-cebu-red disabled:opacity-40"
                  >
                    <i className="pi pi-trash text-xs" />
                  </button>
                </div>
              )}
            />
          </DataTable>
        </div>
      )}
    </div>
  );
}
