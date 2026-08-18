/**
 * /admin/vehicles — the fleet.
 *
 * A fleet is a handful of rows, so like /admin/tours this loads once and
 * filters in the browser: sorting and searching stay instant.
 *
 * Publish and Most-popular are toggled straight from the row — the two edits
 * made most often, and the ones that never need the form.
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';

import { formatDate, formatPeso } from '@/lib/format';
import * as vehicleService from '@/services/vehicle.service';
import type { VehicleListItem } from '@/types/vehicle';

type Filter = 'all' | 'published' | 'drafts' | 'popular';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'drafts', label: 'Drafts' },
  { value: 'popular', label: 'Popular' },
];

export default function AdminVehiclesPage() {
  const router = useRouter();

  const [vehicles, setVehicles] = useState<VehicleListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  /** Id of the row whose toggle is in flight — disables just that row. */
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await vehicleService.listVehicles();
      setVehicles(response.items);
      setError(null);
    } catch (caught) {
      setError((caught as { message?: string })?.message ?? 'Could not load the fleet.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return vehicles.filter((vehicle) => {
      if (filter === 'published' && !vehicle.isPublished) return false;
      if (filter === 'drafts' && vehicle.isPublished) return false;
      if (filter === 'popular' && !vehicle.popular) return false;

      if (!needle) return true;
      return (
        vehicle.type.toLowerCase().includes(needle) ||
        vehicle.models.toLowerCase().includes(needle) ||
        vehicle.capacity.toLowerCase().includes(needle)
      );
    });
  }, [vehicles, search, filter]);

  const stats = useMemo(
    () => ({
      total: vehicles.length,
      published: vehicles.filter((vehicle) => vehicle.isPublished).length,
    }),
    [vehicles]
  );

  /**
   * Optimistic: the switch answers immediately and the row is reconciled with
   * the server's copy when it replies, or rolled back if it does not.
   */
  const toggle = async (
    vehicle: VehicleListItem,
    patch: { isPublished?: boolean; popular?: boolean }
  ) => {
    setBusyId(vehicle.id);
    setVehicles((rows) => rows.map((row) => (row.id === vehicle.id ? { ...row, ...patch } : row)));

    try {
      await vehicleService.updateVehicle(vehicle.id, patch);
      setError(null);
    } catch (caught) {
      setVehicles((rows) => rows.map((row) => (row.id === vehicle.id ? vehicle : row)));
      setError((caught as { message?: string })?.message ?? 'Could not update that vehicle.');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (vehicle: VehicleListItem) => {
    if (!window.confirm(`Delete “${vehicle.type}”? This takes the card off the site for good.`)) {
      return;
    }

    setBusyId(vehicle.id);
    try {
      await vehicleService.deleteVehicle(vehicle.id);
      setVehicles((rows) => rows.filter((row) => row.id !== vehicle.id));
      setError(null);
    } catch (caught) {
      setError((caught as { message?: string })?.message ?? 'Could not delete that vehicle.');
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-600">
        <i className="pi pi-spin pi-spinner mr-2 text-xl" /> Loading fleet…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fleet</h1>
          <p className="mt-1 text-sm text-slate-600">
            {stats.total} vehicle{stats.total === 1 ? '' : 's'} · {stats.published} shown on the
            homepage
          </p>
        </div>

        <Link
          href="/admin/vehicles/new"
          className="inline-flex items-center gap-2 rounded-lg bg-coral px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-coral-dark"
        >
          <i className="pi pi-plus text-xs" />
          New vehicle
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
            placeholder="Search by class, model or capacity…"
            className="w-full rounded-lg border border-slate-500 py-2.5 pl-9 pr-4 text-sm text-slate-700"
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

      {vehicles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-14 text-center">
          <i className="pi pi-car text-2xl text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-900">No vehicles yet</p>
          <p className="mt-1 text-sm text-slate-600">
            Add the first one and it appears in the homepage fleet section as soon as it is
            published.
          </p>
          <Link
            href="/admin/vehicles/new"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-coral px-4 py-2 text-sm font-semibold text-white hover:bg-coral-dark"
          >
            <i className="pi pi-plus text-xs" />
            New vehicle
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <DataTable
            value={visible}
            dataKey="id"
            removableSort
            emptyMessage="No vehicles match that search."
            className="admin-table text-sm"
          >
            <Column
              header="Vehicle"
              sortable
              sortField="type"
              body={(vehicle: VehicleListItem) => (
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={vehicle.image}
                    alt=""
                    className="h-11 w-16 shrink-0 rounded-md bg-slate-100 object-contain p-1"
                  />
                  <div className="min-w-0">
                    <Link
                      href={`/admin/vehicles/${vehicle.id}`}
                      className="block truncate font-medium text-slate-900 hover:text-coral"
                    >
                      {vehicle.type}
                    </Link>
                    <span className="block truncate text-xs text-slate-500">{vehicle.models}</span>
                  </div>
                </div>
              )}
            />

            <Column header="Capacity" field="capacity" sortable />

            <Column
              header="Rate / 24h"
              field="rate"
              sortable
              body={(vehicle: VehicleListItem) => (
                <span className="font-medium text-slate-900">{formatPeso(vehicle.rate)}</span>
              )}
            />

            <Column
              header="Content"
              body={(vehicle: VehicleListItem) => (
                <span className="whitespace-nowrap text-xs text-slate-600">
                  <i className="pi pi-check-circle mr-1 text-[10px]" />
                  {vehicle.featureCount}
                  <span className="mx-1.5 text-slate-300">·</span>
                  <i className="pi pi-images mr-1 text-[10px]" />
                  {vehicle.galleryCount}
                </span>
              )}
            />

            <Column
              header="Order"
              field="sortOrder"
              sortable
              body={(vehicle: VehicleListItem) => (
                <span className="text-slate-600">{vehicle.sortOrder}</span>
              )}
            />

            <Column
              header="Status"
              sortable
              sortField="isPublished"
              body={(vehicle: VehicleListItem) => (
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    disabled={busyId === vehicle.id}
                    onClick={() => toggle(vehicle, { isPublished: !vehicle.isPublished })}
                    title={vehicle.isPublished ? 'Unpublish' : 'Publish'}
                    className={`rounded px-2 py-0.5 text-xs font-medium transition-colors disabled:opacity-40 ${
                      vehicle.isPublished
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {vehicle.isPublished ? 'Live' : 'Draft'}
                  </button>

                  <button
                    type="button"
                    disabled={busyId === vehicle.id}
                    onClick={() => toggle(vehicle, { popular: !vehicle.popular })}
                    title={
                      vehicle.popular ? 'Remove the popular ribbon' : 'Mark as the most popular'
                    }
                    aria-label={vehicle.popular ? 'Unmark as popular' : 'Mark as popular'}
                    className={`rounded px-1.5 py-0.5 text-xs transition-colors disabled:opacity-40 ${
                      vehicle.popular
                        ? 'bg-mango/20 text-amber-700 hover:bg-mango/30'
                        : 'text-slate-300 hover:bg-slate-100 hover:text-slate-500'
                    }`}
                  >
                    <i className={`pi ${vehicle.popular ? 'pi-star-fill' : 'pi-star'}`} />
                  </button>
                </div>
              )}
            />

            <Column
              header="Updated"
              field="updatedAt"
              sortable
              body={(vehicle: VehicleListItem) => (
                <span className="whitespace-nowrap text-xs text-slate-600">
                  {formatDate(vehicle.updatedAt)}
                </span>
              )}
            />

            <Column
              header=""
              body={(vehicle: VehicleListItem) => (
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => router.push(`/admin/vehicles/${vehicle.id}`)}
                    title="Edit"
                    aria-label={`Edit ${vehicle.type}`}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  >
                    <i className="pi pi-pencil text-xs" />
                  </button>

                  <Link
                    href="/#fleet"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="View the fleet section"
                    aria-label="View the fleet section on the site"
                    className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  >
                    <i className="pi pi-external-link text-xs" />
                  </Link>

                  <button
                    type="button"
                    disabled={busyId === vehicle.id}
                    onClick={() => remove(vehicle)}
                    title="Delete"
                    aria-label={`Delete ${vehicle.type}`}
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
