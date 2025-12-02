'use client';

import { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from 'primereact/button';
import { FormInput, FormSelect, FormTextarea, FormCheckbox, FormCalendar } from '@/components';
import { FORM_CONST } from '@/core/constants';
import FORM_MESSAGES from '@/core/form-messages';

type Toast = {
  message: string;
  type: 'success' | 'error';
} | null;

const serviceTypes = ['car-rental', 'airport-transfer', 'tour', 'custom'] as const;
const vehicleTypes = ['sedan', 'suv', 'van'] as const;

// Zod validation schema
const contactFormSchema = z.object({
  fullName: z
    .string()
    .min(1, FORM_MESSAGES.NAME_REQUIRED)
    .min(FORM_CONST.NAME_MIN_LENGTH, FORM_MESSAGES.NAME_MIN.replace('${min}', String(FORM_CONST.NAME_MIN_LENGTH)))
    .max(FORM_CONST.NAME_MAX_LENGTH, FORM_MESSAGES.NAME_MAX.replace('${max}', String(FORM_CONST.NAME_MAX_LENGTH))),
  email: z
    .string()
    .min(1, FORM_MESSAGES.EMAIL_REQUIRED)
    .regex(FORM_CONST.EMAIL_REGEX, FORM_MESSAGES.EMAIL_INVALID),
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

type ContactFormData = z.infer<typeof contactFormSchema>;

const serviceOptions = [
  { value: 'car-rental', label: 'Car Rental' },
  { value: 'airport-transfer', label: 'Airport Transfer' },
  { value: 'tour', label: 'Tour Package' },
  { value: 'custom', label: 'Custom Tour / Other' },
];

const vehicleOptions = [
  { value: 'sedan', label: 'Sedan (5-seater) - ₱1,500/day' },
  { value: 'suv', label: 'SUV (7-seater) - ₱2,500/day' },
  { value: 'van', label: 'Van (15-seater) - ₱3,500/day' },
];

export function ContactSection() {
  const [toast, setToast] = useState<Toast>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const methods = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    mode: 'onChange',
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      serviceType: undefined,
      vehicleType: undefined,
      preferredDate: undefined,
      message: '',
      addDriver: false,
    },
  });

  const {
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isSubmitting },
  } = methods;

  const addDriver = watch('addDriver');

  // Listen for add driver event from DriverBanner
  useEffect(() => {
    const handleAddDriver = () => {
      setValue('addDriver', true);
    };

    window.addEventListener('addDriverToBooking', handleAddDriver);
    return () => {
      window.removeEventListener('addDriverToBooking', handleAddDriver);
    };
  }, [setValue]);

  const onSubmit = async (data: ContactFormData) => {
    try {
      const response = await fetch('/api/submit-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          preferredDate: data.preferredDate?.toISOString(),
          source: 'contact-form',
        }),
      });

      if (response.ok) {
        setToast({ message: 'Thank you! We will contact you shortly.', type: 'success' });
        reset();
      } else {
        setToast({ message: 'Something went wrong. Please try again or contact us directly.', type: 'error' });
      }
    } catch {
      setToast({ message: 'Something went wrong. Please try again or contact us directly.', type: 'error' });
    }
  };

  return (
    <section id="contact" className="py-24 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
      {/* Toast Notification */}
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

      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-coral/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-mango/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white text-terracotta px-4 py-2 rounded-full text-sm font-medium mb-4 shadow-sm border border-papaya/30">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Get In Touch
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            Ready to <span className="bg-gradient-to-r from-coral to-mango bg-clip-text text-transparent">Book Your Ride?</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Fill out the form below or contact us directly. We&apos;ll get back to you within the
            hour during business hours.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-12">
          {/* Contact Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100">
              <FormProvider {...methods}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                  {/* Name & Email */}
                  <div className="grid sm:grid-cols-2 gap-3">
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
                  </div>

                  {/* Phone & Service Type */}
                  <div className="grid sm:grid-cols-2 gap-3">
                    <FormInput
                      name="phone"
                      label="Phone / WhatsApp"
                      placeholder="+63 9XX XXX XXXX"
                      enablePhoneNumberFormat
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
                  </div>

                  {/* Vehicle Type & Preferred Date */}
                    <FormSelect
                      name="vehicleType"
                      label="Vehicle Type"
                      options={vehicleOptions}
                      placeholder="Select (optional)"
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


                  {/* Message */}
                  <FormTextarea
                    name="message"
                    label="Message / Special Requests"
                    rows={2}
                    placeholder="Tell us about your trip - destinations, special requirements..."
                    maxLength={FORM_CONST.MESSAGE_MAX_LENGTH}
                    className="mb-0"
                  />

                  {/* Add Driver Option */}
                  <div className={`p-3 rounded-lg border-2 transition-all ${addDriver ? 'bg-mango/10 border-mango' : 'bg-slate-50 border-slate-200 hover:border-mango/50'}`}>
                    <div className="flex items-center justify-between">
                      <FormCheckbox
                        name="addDriver"
                        label="Add Driver"
                        description="₱850/day (8 hours)"
                      />
                      {addDriver && (
                        <svg className="w-5 h-5 text-mango shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>

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
          </div>

          {/* Contact Info & Direct Contact */}
          <div className="lg:col-span-2 space-y-6">
            {/* Direct Contact Options */}
            <div className="bg-gradient-to-br from-coral to-coral-dark rounded-2xl p-6 text-white">
              <h3 className="text-xl font-bold mb-4">Prefer Direct Contact?</h3>
              <p className="text-white/80 mb-6">
                Get instant responses through our messaging channels or give us a call.
              </p>

              <div className="space-y-3">
                {/* WhatsApp */}
                <a
                  href="https://wa.me/639123456789"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-white/10 hover:bg-white/20 px-4 py-3 rounded-lg transition-colors"
                >
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold">WhatsApp</div>
                    <div className="text-white/70 text-sm">+63 912 345 6789</div>
                  </div>
                  <svg
                    className="w-5 h-5 ml-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>

                {/* Messenger */}
                <a
                  href="https://m.me/easyridescebu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-white/10 hover:bg-white/20 px-4 py-3 rounded-lg transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.301 2.246.464 3.443.464 6.627 0 12-4.974 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.259L19.752 8l-6.561 6.963z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold">Messenger</div>
                    <div className="text-white/70 text-sm">@easyridescebu</div>
                  </div>
                  <svg
                    className="w-5 h-5 ml-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>

                {/* Phone */}
                <a
                  href="tel:+639123456789"
                  className="flex items-center gap-3 bg-white/10 hover:bg-white/20 px-4 py-3 rounded-lg transition-colors"
                >
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold">Call Us</div>
                    <div className="text-white/70 text-sm">+63 912 345 6789</div>
                  </div>
                  <svg
                    className="w-5 h-5 ml-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </a>
              </div>
            </div>

            {/* Business Info */}
            <div className="bg-slate-50 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Business Hours</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Monday - Saturday</span>
                  <span className="text-slate-900 font-medium">8:00 AM - 8:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Sunday</span>
                  <span className="text-slate-900 font-medium">9:00 AM - 6:00 PM</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-200">
                <h4 className="font-semibold text-slate-900 mb-2">Location</h4>
                <p className="text-slate-600 text-sm">Cebu City, Philippines</p>
                <p className="text-slate-500 text-xs mt-1">
                  Vehicle pickup can be arranged at your location
                </p>
              </div>
            </div>

            {/* Response Time */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-green-900">Fast Response</div>
                  <div className="text-green-700 text-sm">
                    We typically respond within 1 hour during business hours
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
