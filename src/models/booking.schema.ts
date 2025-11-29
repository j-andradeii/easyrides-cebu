import { z } from 'zod';

// Quick booking form schema (hero section)
export const quickBookingSchema = z.object({
  serviceType: z.enum(['car-rental', 'airport-transfer', 'tour']),
  vehicleType: z.enum(['sedan', 'suv', 'van']).optional(),
  preferredDate: z.string().min(1, 'Please select a date'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  source: z.string().default('hero-quick-form'),
});

export type QuickBookingFormData = z.infer<typeof quickBookingSchema>;

// Full contact form schema
export const contactFormSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  serviceType: z.enum(['car-rental', 'airport-transfer', 'tour', 'custom']),
  preferredDate: z.string().optional(),
  message: z.string().max(1000, 'Message is too long').optional(),
  source: z.string().default('contact-form'),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

// Combined booking schema for API validation
export const bookingSubmissionSchema = z.object({
  // Required fields
  phone: z.string().min(10, 'Please enter a valid phone number'),
  source: z.string(),

  // Optional fields depending on form type
  fullName: z.string().optional(),
  email: z.string().email().optional(),
  serviceType: z.enum(['car-rental', 'airport-transfer', 'tour', 'custom']).optional(),
  vehicleType: z.enum(['sedan', 'suv', 'van']).optional(),
  preferredDate: z.string().optional(),
  message: z.string().optional(),
});

export type BookingSubmissionData = z.infer<typeof bookingSubmissionSchema>;
