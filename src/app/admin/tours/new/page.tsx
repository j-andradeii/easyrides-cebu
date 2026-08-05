/**
 * /admin/tours/new — add a package to the catalogue.
 *
 * The form owns validation; this page owns only what happens after a save:
 * straight into the new tour's editor, so the slug it was actually given is
 * visible and a follow-up edit needs no second trip through the table.
 */

'use client';

import { useRouter } from 'next/navigation';

import { TourForm } from '@/components/admin/TourForm';
import * as tourService from '@/services/tour.service';
import type { TourInput } from '@/models/tour.schema';

export default function NewTourPage() {
  const router = useRouter();

  const create = async (values: TourInput) => {
    const { tour } = await tourService.createTour(values);
    router.push(`/admin/tours/${tour.id}`);
  };

  return <TourForm onSubmit={create} />;
}
