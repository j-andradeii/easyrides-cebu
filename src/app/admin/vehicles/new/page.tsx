/**
 * /admin/vehicles/new — add a vehicle to the fleet.
 *
 * The form owns validation; this page owns only what happens after a save:
 * straight into the new vehicle's editor, so a follow-up edit needs no second
 * trip through the table.
 */

'use client';

import { useRouter } from 'next/navigation';

import { VehicleForm } from '@/components/admin/VehicleForm';
import * as vehicleService from '@/services/vehicle.service';
import type { VehicleInput } from '@/models/vehicle.schema';

export default function NewVehiclePage() {
  const router = useRouter();

  const create = async (values: VehicleInput) => {
    const { vehicle } = await vehicleService.createVehicle(values);
    router.push(`/admin/vehicles/${vehicle.id}`);
  };

  return <VehicleForm onSubmit={create} />;
}
