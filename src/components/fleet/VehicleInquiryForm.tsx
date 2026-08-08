/**
 * VehicleInquiryForm Component
 *
 * The booking form on /fleet/[slug], pre-filled with the car the visitor is
 * looking at. Built from `TourInquiryForm` — same fields, same submit path,
 * same toast — plus the two things a car rental needs and a tour does not: how
 * many days they want it for, and where to hand the car over.
 *
 * Neither is decoration. The days field multiplies the daily rate into the
 * estimate shown above the button and rides along to the CRM as `rentalDays`;
 * the pickup point lands in `pickupLocation` next to it. Both have their own
 * column on `inquiries`, and together they are what lets an agent quote and
 * dispatch without a phone call first.
 *
 * The layout is deliberately wide — the page gives this a full-width section of
 * its own at the bottom rather than a sidebar, so the fields sit in columns
 * instead of one long stack a visitor has to scroll past the car to reach.
 */

'use client';

import { useEffect, useState } from 'react';
import { useForm, FormProvider, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from 'primereact/button';
import { FormCheckbox, FormInput, FormTextarea, FormCalendar, FormPhoneInput } from '@/components';
import { FORM_CONST } from '@/core/constants';
import FORM_MESSAGES from '@/core/form-messages';
import { VEHICLE_TYPES } from '@/models/inquiry.schema';
import * as queryService from '@/services/query.service';
import { useApiEventStore } from '@/stores';
import { ApiEvent, ApiEventStatus, ApiEventType } from '@/models/api-event';
import type { Vehicle } from '@/types/vehicle';

type Toast = {
  message: string;
  type: 'success' | 'error';
} | null;

/** Longer than this is a lease we negotiate by hand — see `inquirySubmissionSchema`. */
const MAX_RENTAL_DAYS = 365;

const vehicleInquirySchema = z.object({
  fullName: z
    .string()
    .min(1, FORM_MESSAGES.NAME_REQUIRED)
    .min(FORM_CONST.NAME_MIN_LENGTH, FORM_MESSAGES.NAME_MIN.replace('${min}', String(FORM_CONST.NAME_MIN_LENGTH)))
    .max(FORM_CONST.NAME_MAX_LENGTH, FORM_MESSAGES.NAME_MAX.replace('${max}', String(FORM_CONST.NAME_MAX_LENGTH))),
  email: z
    .string()
    .min(1, FORM_MESSAGES.EMAIL_REQUIRED)
    .regex(FORM_CONST.EMAIL_REGEX, FORM_MESSAGES.EMAIL_INVALID),
  countryCode: z.string(),
  phone: z
    .string()
    .min(1, FORM_MESSAGES.PHONE_REQUIRED)
    .min(FORM_CONST.PHONE_MIN_LENGTH, FORM_MESSAGES.PHONE_MIN.replace('${min}', String(FORM_CONST.PHONE_MIN_LENGTH))),
  preferredDate: z.date({ message: FORM_MESSAGES.DATE_REQUIRED }),
  /**
   * The box holds a string while it is being typed (and `''` when cleared), so
   * it is coerced rather than declared a number — an empty box must fail with
   * "how many days?" instead of quietly booking zero.
   */
  rentalDays: z.coerce
    .number({ message: 'How many days do you need the car?' })
    .int('Whole days only')
    .min(1, 'At least one day')
    .max(MAX_RENTAL_DAYS, `For more than ${MAX_RENTAL_DAYS} days, message us directly`),
  /**
   * Required here, unlike on the tour form: a rental starts with handing over
   * a car somewhere, and "where do we meet you?" is the question dispatch
   * would otherwise have to ring back and ask.
   */
  pickupLocation: z
    .string()
    .trim()
    .min(1, 'Where should we deliver the car?')
    .max(200, 'Keep the pickup point under 200 characters'),
  message: z
    .string()
    .max(FORM_CONST.MESSAGE_MAX_LENGTH, FORM_MESSAGES.MESSAGE_MAX.replace('${max}', String(FORM_CONST.MESSAGE_MAX_LENGTH)))
    .optional(),
  addDriver: z.boolean().optional(),
});

/** What the form submits once zod has parsed it. */
type VehicleInquiryFormData = z.infer<typeof vehicleInquirySchema>;

/**
 * What the form *holds* while it is being filled in: the days box is a text
 * input, so it carries a string until the resolver coerces it — the same split
 * `VehicleFormValues` makes for the admin editor's rate box.
 */
type VehicleInquiryFormValues = Omit<VehicleInquiryFormData, 'rentalDays'> & {
  rentalDays: number | string;
};

interface VehicleInquiryFormProps {
  vehicle: Vehicle;
}

/**
 * "SUV" → "suv", so the CRM's sedan/suv/van filters keep working. A class that
 * is none of the three (a pickup, a coaster) simply has no bucket — the exact
 * models still travel in `vehicleName`.
 */
function toVehicleTypeKey(type: string): (typeof VEHICLE_TYPES)[number] | undefined {
  const normalized = type.toLowerCase();
  return VEHICLE_TYPES.find((known) => normalized.includes(known));
}

export function VehicleInquiryForm({ vehicle }: VehicleInquiryFormProps) {
  const [toast, setToast] = useState<Toast>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const apiEventStore = useApiEventStore();

  const vehicleTypeKey = toVehicleTypeKey(vehicle.type);
  // Without a bucket to carry the class, the name has to.
  const vehicleName = vehicleTypeKey ? vehicle.models : `${vehicle.models} (${vehicle.type})`;
  const defaultMessage = `I am interested in renting the ${vehicle.models}. Please confirm availability and the total for my dates.`;

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const getApiEvents = () => {
    const unsubscribe = apiEventStore.subscribe((event) => {
      if (!event) return;
      const eventStatusHandleMap = createEventStatusHandleMap(event);
      const handleEvent = eventStatusHandleMap[event.status] || (() => {});
      handleEvent();
    });
    return () => {
      unsubscribe();
    };
  };

  const createEventStatusHandleMap = (
    apiEvent: ApiEvent
  ): { [key in ApiEventStatus]?: () => void } => {
    return {
      [ApiEventStatus.COMPLETED]: () => {
        const eventTypeHandleMap: { [key in ApiEventType]?: () => void } = {
          [ApiEventType.SUBMIT_QUERY]: async () => {
            setIsSubmitting(false);
            setToast({
              message: 'Thank you! We will confirm availability and send your total shortly.',
              type: 'success',
            });
            reset({
              ...methods.getValues(),
              fullName: '',
              email: '',
              phone: '',
              preferredDate: undefined,
              pickupLocation: '',
              message: defaultMessage,
            });
          },
        };
        const handleEventType = eventTypeHandleMap[apiEvent.type] || (() => {});
        handleEventType();
      },
      [ApiEventStatus.ERROR]: () => {
        const eventTypeHandleMap: { [key in ApiEventType]?: () => void } = {
          [ApiEventType.SUBMIT_QUERY]: async () => {
            setIsSubmitting(false);
            setToast({
              message: 'Something went wrong. Please try again or contact us directly.',
              type: 'error',
            });
          },
        };
        const handleEventType = eventTypeHandleMap[apiEvent.type] || (() => {});
        handleEventType();
      },
      [ApiEventStatus.IN_PROGRESS]: () => {},
      [ApiEventStatus.DEFAULT]: () => {},
    };
  };

  const methods = useForm<VehicleInquiryFormValues, unknown, VehicleInquiryFormData>({
    // The zod input type allows the string the days box holds mid-edit; the
    // output is the parsed `VehicleInquiryFormData` that `onSubmit` receives.
    resolver: zodResolver(vehicleInquirySchema) as unknown as Resolver<
      VehicleInquiryFormValues,
      unknown,
      VehicleInquiryFormData
    >,
    mode: 'onChange',
    defaultValues: {
      fullName: '',
      email: '',
      countryCode: '+63',
      phone: '',
      preferredDate: undefined,
      rentalDays: 1,
      pickupLocation: '',
      message: defaultMessage,
      addDriver: false,
    },
  });

  const { handleSubmit, reset, watch } = methods;

  // Subscribed after the handlers exist: `getApiEvents` closes over `reset`,
  // which only exists once `methods` above has been created.
  useEffect(() => {
    const cleanup = getApiEvents();
    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The estimate is deliberately a multiplication of the published day rate and
  // nothing else: no driver fee, no multi-day discount. Quoting either here
  // would be a number the team then has to walk back.
  const days = Number(watch('rentalDays'));
  const estimate = Number.isFinite(days) && days > 0 ? vehicle.rate * Math.floor(days) : null;

  const onSubmit = async (data: VehicleInquiryFormData) => {
    setIsSubmitting(true);
    const fullPhone = `${data.countryCode}${data.phone}`;
    queryService.submitQuery({
      ...data,
      phone: fullPhone,
      preferredDate: data.preferredDate?.toISOString(),
      source: 'vehicle-inquiry',
      serviceType: 'car-rental',
      vehicleType: vehicleTypeKey,
      vehicleName,
    });
  };

  return (
    <>
      {/* Toast Notification - Fixed bottom right */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-[slideIn_0.3s_ease-out]">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
              toast.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {toast.type === 'success' ? (
              <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <p className="text-sm font-medium">{toast.message}</p>
            <button
              onClick={() => setToast(null)}
              className={`ml-2 p-1 rounded-full transition-colors ${
                toast.type === 'success' ? 'hover:bg-green-100' : 'hover:bg-red-100'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* The outline is a full step darker than the dividers inside it: on a
          near-white page a slate-100 edge disappeared and the card read as
          floating text rather than a panel. */}
      <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-xl">
        <div className="border-b border-slate-200 bg-gradient-to-r from-cream-light to-white px-6 py-5 sm:px-8">
          <h3 className="text-xl font-bold text-slate-900 sm:text-2xl">Book this vehicle</h3>
          <p className="mt-1 text-sm text-slate-600">
            {vehicle.models} · ₱{vehicle.rate.toLocaleString()} per 24 hours · no payment needed to
            reserve
          </p>
        </div>

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-6 sm:px-8 sm:py-8">
            {/* Three columns on a wide screen: who they are on the first row,
                what they need on the second. Collapses to one on a phone.
                `grid-cols-1` is not redundant with that collapse: without an
                explicit template the phone column is an implicit `auto` track,
                which sizes itself to the widest field's min-content — the
                country-code box plus a bare input's twenty-character intrinsic
                width — and pushed every field out past the card on a phone.
                `grid-cols-*` compiles to `minmax(0, 1fr)`, whose zero floor is
                the whole point. `min-w-0` does the same for the items, which
                would otherwise refuse to shrink below their own content. */}
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 [&>*]:min-w-0 sm:grid-cols-2 lg:grid-cols-3">
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
                label="Pickup Date"
                placeholder="Select a date"
                minDate={new Date()}
                showRequired
                className="mb-0"
              />

              <FormInput
                name="rentalDays"
                label="Number of Days"
                placeholder="3"
                enableOnlyInteger
                showRequired
                className="mb-0"
              />

              <FormInput
                name="pickupLocation"
                label="Pickup Location"
                placeholder="Mactan Airport T2, hotel or address"
                showRequired
                className="mb-0"
              />

              <div className="sm:col-span-2 lg:col-span-3">
                <FormTextarea
                  name="message"
                  label="Message / Special Requests"
                  rows={3}
                  placeholder="Drop-off point, child seat, flight number — anything else we should know…"
                  maxLength={FORM_CONST.MESSAGE_MAX_LENGTH}
                  className="mb-0"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <FormCheckbox
                  name="addDriver"
                  label="Add a professional driver"
                  description="Let us know and we'll include the driver's rate in your quote."
                  className="mb-0"
                />
              </div>
            </div>

            {/* The estimate and the button share the last row: on a wide form
                the price the visitor is about to ask for should sit beside the
                thing they press, not scroll away above it. */}
            <div className="mt-6 flex flex-col gap-4 border-t border-slate-200 pt-6 lg:flex-row lg:items-center lg:justify-between">
              {estimate !== null ? (
                <div className="rounded-xl border border-slate-300 bg-cream-light px-4 py-3 lg:max-w-md lg:flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm text-slate-600">
                      Estimate · {Math.floor(days)} {Math.floor(days) === 1 ? 'day' : 'days'}
                    </span>
                    <span className="text-lg font-bold text-slate-900">
                      ₱{estimate.toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Day rate &times; days. We&apos;ll confirm the final total — longer rentals
                    usually cost less per day.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-500 lg:max-w-md lg:flex-1">
                  Tell us how many days you need and we&apos;ll show the estimate here.
                </p>
              )}

              <div className="lg:w-72 lg:shrink-0">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  loading={isSubmitting}
                  className="w-full justify-center bg-gradient-to-r from-coral to-mango hover:from-coral-dark hover:to-mango-dark disabled:from-coral/70 disabled:to-mango/70 text-white py-4 px-6 rounded-xl font-semibold transition-all shadow-lg shadow-coral/25 hover:shadow-xl hover:-translate-y-0.5 border-0 submit-button"
                  label={isSubmitting ? 'Sending...' : 'Send Inquiry'}
                  icon={isSubmitting ? 'pi pi-spin pi-spinner' : 'pi pi-send'}
                  iconPos="right"
                />
                <p className="mt-2 text-center text-xs text-slate-500">
                  We confirm availability first — no card needed.
                </p>
              </div>
            </div>
          </form>
        </FormProvider>
      </div>
    </>
  );
}

export default VehicleInquiryForm;
