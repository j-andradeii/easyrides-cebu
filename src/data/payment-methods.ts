/**
 * Payment options shown on the customer's quote page (`/quote/[token]`).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  TO ADD YOUR QR CODES: upload each image (Vercel Blob, or /public) and paste
 *  the URL into `qrImageUrl` below. A method with an empty `qrImageUrl` still
 *  works — the page just shows the account details without a QR panel, so you
 *  can ship now and add the images whenever they're ready.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Client-safe: no server imports, so the checkout page can render it directly.
 */

export interface PaymentMethod {
  /** Stored on `quotes.payment_method` when the customer picks this. */
  key: string;
  label: string;
  /** PrimeIcons class, e.g. 'pi-wallet'. */
  icon: string;
  /** Short line under the label, e.g. "Send to 0917 804 6988". */
  tagline: string;
  accountName: string;
  accountNumber: string;
  /** Public image URL for the scannable QR. Empty = no QR panel rendered. */
  qrImageUrl: string;
  /** Filename used when the customer saves the QR to their phone. */
  qrFilename: string;
  instructions: string;
  /** Ask for a reference/receipt number after paying. */
  requiresReference: boolean;
  /**
   * True when the money changes hands at pickup rather than up front. The
   * booking emails read this to decide between "we're confirming your payment"
   * and "have the amount ready for your driver".
   */
  paidOnPickup: boolean;
  /**
   * Whether checkout still offers this method.
   *
   * Retiring a method is not the same as deleting it: quotes and payments
   * already carry the old key, and `paymentMethodLabel()` has to keep
   * resolving it or historical records in the admin portal and in past
   * booking emails start showing a raw slug. So a retired method stays in
   * this list, and only `/quote/[token]` filters on this flag.
   */
  selectable: boolean;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    key: 'gcash',
    label: 'GCash',
    icon: 'pi-wallet',
    tagline: 'Scan the QR or send to our number',
    accountName: 'Trishia Andrade',
    accountNumber: '0917 804 6988',
    qrImageUrl: 'https://djuny0idasckxayv.public.blob.vercel-storage.com/payments/gcash.jpg',
    qrFilename: 'easyridecebu-gcash-qr.jpg',
    instructions:
      'Open GCash → Scan QR (or Send Money to the number above) → enter the amount → confirm. Keep the reference number from your receipt.',
    requiresReference: true,
    paidOnPickup: false,
    selectable: true,
  },
  {
    key: 'bpi',
    label: 'BPI Bank Transfer',
    icon: 'pi-credit-card',
    tagline: 'Scan with your banking app, or transfer manually',
    accountName: 'Trishia Cansancio',
    accountNumber: '1199778214',
    qrImageUrl: 'https://djuny0idasckxayv.public.blob.vercel-storage.com/payments/bpi.jpg',
    qrFilename: 'easyridecebu-bpi-qr.jpg',
    instructions:
      'Open your BPI app → Scan QR (or transfer to the account above) → enter the amount → confirm. Keep the reference number from your receipt.',
    requiresReference: true,
    paidOnPickup: false,
    selectable: true,
  },
  {
    key: 'cash',
    label: 'Cash on pickup',
    icon: 'pi-money-bill',
    tagline: 'Pay the driver when your ride arrives',
    accountName: 'EasyRideCebu',
    accountNumber: '—',
    qrImageUrl: '',
    qrFilename: '',
    instructions:
      'Hand the payment to your driver at pickup. Please have the exact amount ready where possible.',
    requiresReference: false,
    paidOnPickup: true,
    // Retired from checkout — kept so historical 'cash' rows still resolve a label.
    selectable: false,
  },
];

/**
 * What checkout offers today. Everything else in the app reads
 * `PAYMENT_METHODS` so retired keys still resolve; only the customer-facing
 * picker uses this.
 */
export const SELECTABLE_PAYMENT_METHODS: PaymentMethod[] = PAYMENT_METHODS.filter(
  (method) => method.selectable
);

export function getPaymentMethod(key: string | null | undefined): PaymentMethod | undefined {
  if (!key) return undefined;
  return PAYMENT_METHODS.find((method) => method.key === key);
}

export function paymentMethodLabel(key: string | null | undefined): string {
  return getPaymentMethod(key)?.label ?? key ?? '—';
}
