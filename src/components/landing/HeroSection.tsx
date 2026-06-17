'use client';

import { useState, useEffect } from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormSelect, FormCalendar, FormCheckbox, FormPhoneInput } from '@/components';
import * as queryService from '@/services/query.service';
import { useApiEventStore } from '@/stores';
import { ApiEventStatus, ApiEventType } from '@/models/api-event';

const serviceTypes = ['car-rental', 'airport-transfer', 'tour'] as const;
const vehicleTypes = ['sedan', 'suv', 'van'] as const;

const heroFormSchema = z.object({
  serviceType: z.enum(serviceTypes),
  vehicleType: z.enum(vehicleTypes).optional(),
  pickupDate: z.date({ error: 'Please select a date' }),
  countryCode: z.string(),
  phone: z.string().min(9, 'Please enter a valid phone number'),
  addDriver: z.boolean(),
});

type HeroFormData = z.infer<typeof heroFormSchema>;
type ServiceType = (typeof serviceTypes)[number];

const vehicleOptions = [
  { value: 'sedan', label: 'Sedan (5-seater) - ₱1,500/day' },
  { value: 'suv', label: 'SUV (7-seater) - ₱2,500/day' },
  { value: 'van', label: 'Van (15-seater) - ₱3,500/day' },
];

const serviceOptions: Array<{
  value: ServiceType;
  label: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    value: 'car-rental',
    label: 'Car rental',
    description: 'Self-drive or add a driver',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 17h8m-10 0h.01M18 17h.01M5 13l1.2-4.2A3 3 0 019.08 6h5.84a3 3 0 012.88 2.8L19 13m-14 0h14v5a1 1 0 01-1 1H6a1 1 0 01-1-1v-5z" />
      </svg>
    ),
  },
  {
    value: 'airport-transfer',
    label: 'Airport pickup',
    description: 'Fixed-rate arrival transfer',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 12h14M12 5l7 7-7 7M6 5l5 7-5 7" />
      </svg>
    ),
  },
  {
    value: 'tour',
    label: 'Cebu tour',
    description: 'Driver-guided day trips',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3zm0 0V3m6 18V6" />
      </svg>
    ),
  },
];

const confidenceItems = [
  'Fixed, honest rates',
  'Clean air-conditioned vehicles',
  'Fast WhatsApp replies',
];

export function HeroSection() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const subscribeToApiEvents = useApiEventStore((state) => state.subscribe);

  const methods = useForm<HeroFormData>({
    resolver: zodResolver(heroFormSchema),
    defaultValues: {
      serviceType: 'car-rental',
      vehicleType: 'sedan',
      pickupDate: undefined,
      countryCode: '+63',
      phone: '',
      addDriver: false,
    },
  });

  const { control, reset } = methods;

  const serviceType = useWatch({
    control,
    name: 'serviceType',
  });

  useEffect(() => {
    const unsubscribe = subscribeToApiEvents((event) => {
      if (!event) return;

      if (event.type !== ApiEventType.SUBMIT_QUERY) return;

      if (event.status === ApiEventStatus.COMPLETED) {
        setIsSubmitting(false);
        reset();
      }

      if (event.status === ApiEventStatus.ERROR) {
        setIsSubmitting(false);
      }
    });

    return unsubscribe;
  }, [reset, subscribeToApiEvents]);

  const handleQuickBooking = async (data: HeroFormData) => {
    setIsSubmitting(true);
    const fullPhone = `${data.countryCode}${data.phone}`;
    queryService.submitQuery({
      serviceType: data.serviceType,
      vehicleType: data.serviceType === 'car-rental' ? data.vehicleType : undefined,
      preferredDate: data.pickupDate?.toISOString(),
      phone: fullPhone,
      addDriver: data.addDriver,
      source: 'hero-quick-form',
    });
  };

  return (
    <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden pt-16">
      <div className="absolute inset-0 z-0">
        <img
          src="https://djuny0idasckxayv.public.blob.vercel-storage.com/easyrides-hero.webp"
          alt="Cebu skyline and bridge at sunset"
          className="h-full w-full object-cover saturate-[.72]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/70 to-slate-950/45" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-7xl grid-cols-1 items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-20">
        <div
          className="landing-hero-mobile-frame min-w-0 max-w-[calc(100vw-2rem)] text-center sm:max-w-3xl lg:text-left"
          style={{ width: 'min(100%, calc(100vw - 2rem))' }}
        >
          <div className="mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-medium text-white shadow-sm backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-mango" />
            <span className="min-w-0 truncate sm:hidden">Cebu rides made simple</span>
            <span className="hidden sm:inline">Cebu car rental, airport transfers & guided tours</span>
          </div>

          <h1 className="mb-6 text-3xl font-bold leading-tight text-white drop-shadow-lg sm:text-5xl lg:text-6xl">
            Easy Cebu rides,
            <span className="block bg-gradient-to-r from-mango to-coral bg-clip-text text-transparent brightness-110">
              ready when you are.
            </span>
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-base font-medium leading-relaxed text-white drop-shadow-md sm:text-xl lg:mx-0">
            <span className="sm:hidden">Clean Cebu rentals, airport pickups, and guided tours with fast, fixed quotes.</span>
            <span className="hidden sm:inline">
              Book a clean, air-conditioned vehicle for airport pickup, city driving, or a full Cebu itinerary. Tell us your plan and get a clear quote fast.
            </span>
          </p>

          <div className="mb-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <a
              href="#contact"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-coral to-mango px-7 py-4 font-semibold text-white shadow-lg shadow-coral/25 transition-all hover:-translate-y-0.5 hover:from-coral-dark hover:to-mango-dark hover:shadow-xl sm:w-auto"
            >
              Get a Free Quote
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            <a
              href="#services"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-7 py-4 font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20 sm:w-auto"
            >
              View ride options
            </a>
          </div>

          <div className="grid gap-3 text-left sm:grid-cols-3">
            {confidenceItems.map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-xl border border-white/25 bg-white/15 px-4 py-3 text-sm font-medium text-white backdrop-blur-md">
                <svg className="h-4 w-4 flex-shrink-0 text-mango" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.704 5.292a1 1 0 010 1.416l-7.25 7.25a1 1 0 01-1.416 0l-3.25-3.25a1 1 0 111.416-1.416l2.542 2.543 6.542-6.543a1 1 0 011.416 0z" clipRule="evenodd" />
                </svg>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div
          className="landing-hero-mobile-frame relative mx-0 max-w-[calc(100vw-2rem)] min-w-0 justify-self-start sm:mx-auto sm:max-w-xl sm:justify-self-center lg:mx-0 lg:justify-self-end"
          style={{ width: 'min(100%, calc(100vw - 2rem))' }}
        >
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-coral/25 to-mango/25 blur-2xl" />
          <div className="relative min-w-0 rounded-3xl border border-white/70 bg-white/95 p-5 shadow-2xl shadow-slate-950/20 backdrop-blur sm:p-6 lg:p-7">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-coral">Quick quote</p>
                <h2 className="text-2xl font-bold text-slate-900">Plan your ride</h2>
                <p className="mt-1 text-sm text-slate-500">
                  <span className="sm:hidden">We reply with price and availability.</span>
                  <span className="hidden sm:inline">No payment needed. We reply with availability and price.</span>
                </p>
              </div>
              <div className="hidden h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-coral to-mango text-white shadow-lg shadow-coral/25 sm:flex">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3M5 11h14M7 21h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            <FormProvider {...methods}>
              <form onSubmit={methods.handleSubmit(handleQuickBooking)} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    What do you need?
                  </label>
                  <div className="grid min-w-0 gap-2 sm:grid-cols-3">
                    {serviceOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => methods.setValue('serviceType', option.value, { shouldDirty: true, shouldValidate: true })}
                        className={`min-w-0 rounded-xl border p-3 text-left transition-all ${
                          serviceType === option.value
                            ? 'border-coral bg-coral/5 text-coral shadow-sm'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-coral/40 hover:bg-coral/5'
                        }`}
                      >
                        <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50">
                          {option.icon}
                        </span>
                        <span className="block text-sm font-semibold leading-tight">{option.label}</span>
                        <span className="mt-1 block text-xs leading-snug text-slate-500">{option.description}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {serviceType === 'car-rental' && (
                  <FormSelect
                    name="vehicleType"
                    label="Vehicle type"
                    options={vehicleOptions}
                    placeholder="Select vehicle type"
                    className="mb-0"
                    inputClassName="hero-dropdown"
                  />
                )}

                <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                  <FormCalendar
                    name="pickupDate"
                    label={serviceType === 'tour' ? 'Tour date' : 'Pick-up date'}
                    placeholder="Select a date"
                    minDate={new Date()}
                    dateFormat="MM dd, yy"
                    className="mb-0 min-w-0"
                    inputClassName="hero-calendar"
                  />

                  <FormPhoneInput
                    name="phone"
                    countryCodeName="countryCode"
                    label="Phone / WhatsApp"
                    placeholder="9XX XXX XXXX"
                    showRequired
                    className="mb-0 min-w-0"
                  />
                </div>

                <div className="rounded-xl border border-mango/20 bg-mango/10 p-3">
                  <FormCheckbox
                    name="addDriver"
                    label="Add a professional driver"
                    description="+₱1000/day for 8 hours"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-coral to-mango py-4 font-semibold text-white shadow-lg shadow-coral/25 transition-all hover:from-coral-dark hover:to-mango-dark disabled:from-coral/70 disabled:to-mango/70"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      Send my quote request
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            </FormProvider>

            <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <span>Prefer chat?</span>
              <div className="flex gap-3">
                <a className="font-semibold text-palm hover:text-palm-dark" href="https://wa.me/639178046988" target="_blank" rel="noopener noreferrer">
                  WhatsApp
                </a>
                <a className="font-semibold text-coral hover:text-coral-dark" href="tel:+639178046988">
                  Call +63 917 804 6988
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
