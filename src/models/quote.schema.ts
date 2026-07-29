/**
 * Quote contracts — the priced proposal a customer opens at /quote/[token].
 *
 * A quote is a small checkout page: what they're booking, what it costs, how to
 * pay, and a single button that turns the lead into a booking.
 */

import { z } from 'zod';

/** A single priced row on the quote. */
export const quoteLineItemSchema = z.object({
  label: z.string().min(1, 'Describe what this covers').max(160),
  description: z.string().max(400).optional(),
  quantity: z.number().min(0.01).max(9999),
  unitPrice: z.number().min(0).max(10_000_000),
});

export type QuoteLineItemInput = z.infer<typeof quoteLineItemSchema>;

/** A line item once the server has computed its amount. */
export interface QuoteLineItem {
  label: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export const QUOTE_TYPES = ['full_payment', 'partial_payment'] as const;
export type QuoteType = (typeof QUOTE_TYPES)[number];

/** How each type reads to a human — used in the portal, the page and the emails. */
export const QUOTE_TYPE_LABELS: Record<QuoteType, string> = {
  full_payment: 'Full payment',
  partial_payment: 'Partial payment',
};

export function quoteTypeLabel(value: string | null | undefined): string {
  return QUOTE_TYPE_LABELS[value as QuoteType] ?? 'Full payment';
}

/** Admin → POST /api/admin/opportunities/[id]/quotes */
export const createQuoteSchema = z.object({
  lineItems: z.array(quoteLineItemSchema).min(1, 'Add at least one line item').max(25),
  discount: z.number().min(0).max(10_000_000).optional(),
  /**
   * A partial payment is one instalment of a larger booking — it is what lets
   * several quotes stay live on the same deal at once.
   */
  quoteType: z.enum(QUOTE_TYPES).default('full_payment'),
  notes: z.string().max(2000).optional(),
  /** How long the price is held. */
  validForDays: z.number().int().min(1).max(90).default(7),
  /** Send the quote email/WhatsApp immediately (default true). */
  notify: z.boolean().default(true),
  /**
   * Whether this quote retires the ones already awaiting a decision.
   *
   * True (the default) is a corrected price: the customer should only ever be
   * looking at one live number. False keeps the existing quotes live so a deal
   * can carry several at once — the instalments of a partial-payment booking.
   */
  supersedeOpen: z.boolean().default(true),
});

export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;

/** Customer → POST /api/quote/[token]/accept */
export const acceptQuoteSchema = z.object({
  paymentMethod: z.string().min(1, 'Choose how you would like to pay').max(40),
  paymentReference: z.string().max(120).optional(),
});

/** Customer → POST /api/quote/[token]/decline */
export const declineQuoteSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const QUOTE_STATUSES = [
  'sent',
  'viewed',
  'accepted',
  'declined',
  'expired',
  'cancelled',
] as const;

export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

/** What the public checkout page renders. Deliberately free of internal ids. */
export interface PublicQuote {
  token: string;
  status: QuoteStatus;
  quoteType: QuoteType;
  reference: string;
  customerName: string;
  serviceLabel: string;
  vehicleLabel: string | null;
  tripDate: string | null;
  tourTitle: string | null;
  lineItems: QuoteLineItem[];
  currency: string;
  subtotal: string;
  discount: string;
  total: string;
  depositAmount: string | null;
  notes: string | null;
  validUntil: string;
  /** Server-computed so the page never has to trust the browser clock. */
  isExpired: boolean;
  acceptedAt: string | null;
  paymentMethod: string | null;
  businessWhatsApp: string;
}

/** What the admin lead-detail screen shows for each quote. */
export interface QuoteRecord {
  id: string;
  token: string;
  status: QuoteStatus;
  quoteType: QuoteType;
  reference: string;
  currency: string;
  lineItems: QuoteLineItem[];
  subtotal: string;
  discount: string;
  total: string;
  depositAmount: string | null;
  notes: string | null;
  validUntil: string;
  isExpired: boolean;
  sentAt: string;
  viewedAt: string | null;
  acceptedAt: string | null;
  declinedAt: string | null;
  declineReason: string | null;
  paymentMethod: string | null;
  paymentReference: string | null;
  createdByName: string | null;
  /** Absolute link to hand to the customer. */
  url: string;
}
