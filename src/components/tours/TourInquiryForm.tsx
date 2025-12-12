/**
 * TourInquiryForm Component
 *
 * Contact form for tour inquiries, pre-filled with tour title
 * Based on ContactSection form structure
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from 'primereact/button';
import { FormInput, FormSelect, FormTextarea, FormCalendar, FormPhoneInput } from '@/components';
import { FORM_CONST } from '@/core/constants';
import FORM_MESSAGES from '@/core/form-messages';
import * as queryService from '@/services/query.service';
import { useApiEventStore } from '@/stores';
import { ApiEvent, ApiEventStatus, ApiEventType } from '@/models/api-event';

type Toast = {
  message: string;
  type: 'success' | 'error';
} | null;

const serviceTypes = ['car-rental', 'airport-transfer', 'tour', 'custom'] as const;
const vehicleTypes = ['sedan', 'suv', 'van'] as const;

const tourInquirySchema = z.object({
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
  serviceType: z.enum(serviceTypes, { message: FORM_MESSAGES.SELECT_REQUIRED }),
  vehicleType: z.enum(vehicleTypes).optional(),
  preferredDate: z.date({ message: FORM_MESSAGES.DATE_REQUIRED }),
  message: z
    .string()
    .max(FORM_CONST.MESSAGE_MAX_LENGTH, FORM_MESSAGES.MESSAGE_MAX.replace('${max}', String(FORM_CONST.MESSAGE_MAX_LENGTH)))
    .optional(),
  addDriver: z.boolean().optional(),
});

type TourInquiryFormData = z.infer<typeof tourInquirySchema>;

const serviceOptions = [
  { value: 'car-rental', label: 'Car Rental' },
  { value: 'airport-transfer', label: 'Airport Transfer' },
  { value: 'tour', label: 'Tour Package' },
  { value: 'custom', label: 'Custom Tour / Other' },
];

const vehicleOptions = [
  { value: 'sedan', label: 'Sedan (1-3 pax)' },
  { value: 'suv', label: 'SUV (4-6 pax)' },
  { value: 'van', label: 'Van (7-14 pax)' },
];

interface TourInquiryFormProps {
  tourTitle: string;
}

export function TourInquiryForm({ tourTitle }: TourInquiryFormProps) {
  const [toast, setToast] = useState<Toast>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const apiEventStore = useApiEventStore();
  const defaultMessage = `I am interested in booking the "${tourTitle}" tour. Please provide more information about availability and pricing.`;

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    const cleanup = getApiEvents();
    return () => {
      cleanup();
    };
  }, []);

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
            setToast({ message: 'Thank you! We will contact you shortly with tour details.', type: 'success' });
            reset({
              ...methods.getValues(),
              fullName: '',
              email: '',
              phone: '',
              preferredDate: undefined,
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
            setToast({ message: 'Something went wrong. Please try again or contact us directly.', type: 'error' });
          },
        };
        const handleEventType = eventTypeHandleMap[apiEvent.type] || (() => {});
        handleEventType();
      },
      [ApiEventStatus.IN_PROGRESS]: () => {},
      [ApiEventStatus.DEFAULT]: () => {},
    };
  };

  const methods = useForm<TourInquiryFormData>({
    resolver: zodResolver(tourInquirySchema),
    mode: 'onChange',
    defaultValues: {
      fullName: '',
      email: '',
      countryCode: '+63',
      phone: '',
      serviceType: 'tour',
      vehicleType: undefined,
      preferredDate: undefined,
      message: defaultMessage,
      addDriver: true,
    },
  });

  const { handleSubmit, reset } = methods;

  const onSubmit = async (data: TourInquiryFormData) => {
    setIsSubmitting(true);
    const fullPhone = `${data.countryCode}${data.phone}`;
    queryService.submitQuery({
      ...data,
      phone: fullPhone,
      preferredDate: data.preferredDate?.toISOString(),
      source: 'tour-inquiry',
      tourTitle,
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

      <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100">
        <h3 className="text-xl font-bold text-slate-900 mb-4">Book This Tour</h3>
      <p className="text-slate-600 text-sm mb-6">Fill out the form and we&apos;ll get back to you with availability and pricing.</p>

      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

          <FormSelect
            name="serviceType"
            label="Service Type"
            options={serviceOptions}
            placeholder="Select a service"
            showRequired
            className="mb-0"
          />

          <FormSelect
            name="vehicleType"
            label="Vehicle Type"
            options={vehicleOptions}
            placeholder="Select vehicle"
            className="mb-0"
          />

          <FormCalendar
            name="preferredDate"
            label="Preferred Date"
            placeholder="Select a date"
            minDate={new Date()}
            showRequired
            className="mb-0"
          />

          <FormTextarea
            name="message"
            label="Message / Special Requests"
            rows={3}
            placeholder="Tell us about your trip..."
            maxLength={FORM_CONST.MESSAGE_MAX_LENGTH}
            className="mb-0"
          />

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            loading={isSubmitting}
            className="w-full bg-gradient-to-r from-coral to-mango hover:from-coral-dark hover:to-mango-dark disabled:from-coral/70 disabled:to-mango/70 text-white py-4 px-6 rounded-xl font-semibold transition-all shadow-lg shadow-coral/25 hover:shadow-xl hover:-translate-y-0.5 border-0 submit-button"
            label={isSubmitting ? 'Sending...' : 'Send Inquiry'}
            icon={isSubmitting ? 'pi pi-spin pi-spinner' : 'pi pi-send'}
            iconPos="right"
          />
        </form>
      </FormProvider>
      </div>
    </>
  );
}
