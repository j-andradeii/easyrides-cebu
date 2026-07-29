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
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    key: 'gcash',
    label: 'GCash',
    icon: 'pi-wallet',
    tagline: 'Scan the QR or send to our number',
    accountName: 'EasyRideCebu',
    accountNumber: '0917 804 6988',
    // TODO: paste your GCash QR image URL here
    qrImageUrl: '',
    qrFilename: 'easyridecebu-gcash-qr.png',
    instructions:
      'Open GCash → Scan QR (or Send Money to the number above) → enter the amount → confirm. Keep the reference number from your receipt.',
    requiresReference: true,
    paidOnPickup: false,
  },
  {
    key: 'bpi',
    label: 'BPI Bank Transfer',
    icon: 'pi-credit-card',
    tagline: 'Scan with your banking app, or transfer manually',
    accountName: 'EasyRideCebu',
    accountNumber: '0000 0000 0000',
    // TODO: paste your BPI QR image URL here
    qrImageUrl: '',
    qrFilename: 'easyridecebu-bpi-qr.png',
    instructions:
      'Open your BPI app → Scan QR (or transfer to the account above) → enter the amount → confirm. Keep the reference number from your receipt.',
    requiresReference: true,
    paidOnPickup: false,
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
  },
];

export function getPaymentMethod(key: string | null | undefined): PaymentMethod | undefined {
  if (!key) return undefined;
  return PAYMENT_METHODS.find((method) => method.key === key);
}

export function paymentMethodLabel(key: string | null | undefined): string {
  return getPaymentMethod(key)?.label ?? key ?? '—';
}
