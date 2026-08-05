/**
 * /admin/vehicles/[id] — edit one vehicle.
 *
 * The form is mounted only once the vehicle is loaded, so its defaults are the
 * real values and no reset effect is needed. Saving re-reads the record and
 * remounts the form (`key`), which is what clears the dirty flag and shows what
 * the server actually stored.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { VehicleForm } from '@/components/admin/VehicleForm';
import * as vehicleService from '@/services/vehicle.service';
import type { VehicleInput } from '@/models/vehicle.schema';
import type { VehicleRecord } from '@/types/vehicle';

export default function EditVehiclePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [vehicle, setVehicle] = useState<VehicleRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!id) return;

    try {
      const response = await vehicleService.getVehicle(id);
      setVehicle(response.vehicle);
      setLoadError(null);
    } catch (caught) {
      setLoadError((caught as { message?: string })?.message ?? 'Could not load that vehicle.');
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

  const save = async (values: VehicleInput) => {
    if (!id) return;

    const { vehicle: updated } = await vehicleService.updateVehicle(id, values);
    setVehicle(updated);
    setSavedAt(Date.now());
  };

  const remove = async () => {
    if (!id) return;

    await vehicleService.deleteVehicle(id);
    router.push('/admin/vehicles');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-600">
        <i className="pi pi-spin pi-spinner mr-2 text-xl" /> Loading vehicle…
      </div>
    );
  }

  if (loadError || !vehicle) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-14 text-center">
        <i className="pi pi-exclamation-circle text-2xl text-slate-300" />
        <p className="mt-3 text-sm font-medium text-slate-900">
          {loadError ?? 'That vehicle no longer exists.'}
        </p>
        <Link
          href="/admin/vehicles"
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <i className="pi pi-arrow-left text-xs" />
          Back to the fleet
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

      <VehicleForm
        key={vehicle.updatedAt}
        vehicle={vehicle}
        onSubmit={save}
        onDelete={remove}
      />
    </div>
  );
}
