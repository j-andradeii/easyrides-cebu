/**
 * "Show us the receipt" — the screenshot upload on the quote checkout page.
 *
 * Almost every customer is on a phone, having just left this page to open GCash
 * or their banking app. So the flow is: pay, screenshot, come back, tap once.
 * Everything here exists to make that single tap survive a real phone:
 *
 *   - bytes are read immediately, because a screenshot picked from a share
 *     sheet or a floating thumbnail can point at a temp file the OS deletes;
 *   - the real image type comes from magic bytes, since phones routinely send
 *     an empty or wrong Content-Type;
 *   - the image is downscaled and re-encoded in the browser, which is what
 *     keeps a 12 MP photo inside the serverless upload limit.
 *
 * A failure here must never block the booking: the customer can always confirm
 * with just a reference number.
 */

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { ensureExtension, resolveImageMime } from '@/lib/image-mime';
import { optimizeImageForUpload } from '@/lib/image-to-webp';
import { PROOF_ACCEPT, PROOF_MAX_BYTES } from '@/models/payment.schema';

interface ProofOfPaymentFieldProps {
  value: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
  /** When true the customer cannot confirm without one — say so, don't imply it. */
  required?: boolean;
}

export function ProofOfPaymentField({
  value,
  onChange,
  disabled,
  required = false,
}: ProofOfPaymentFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derived during render; the effect below only revokes the previous URL.
  const previewUrl = useMemo(() => (value ? URL.createObjectURL(value) : null), [value]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const pick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0];
    // Clear the input so picking the same file twice still fires onChange.
    event.target.value = '';
    setError(null);

    if (!picked) return;

    setIsProcessing(true);
    try {
      const buffer = await picked.arrayBuffer();
      const mime = resolveImageMime(new Uint8Array(buffer), picked.type || '', picked.name);

      if (!mime) {
        setError('That file is not an image. Please upload a screenshot or photo of your receipt.');
        onChange(null);
        return;
      }

      const stable = new File([buffer], ensureExtension(picked.name, mime), {
        type: mime,
        lastModified: picked.lastModified,
      });

      let optimized = stable;
      try {
        optimized = await optimizeImageForUpload(stable);
      } catch {
        optimized = stable;
      }

      // HEIC that survived conversion can't be displayed anywhere, and an
      // oversized file will just fail at the edge — say so now, on the phone,
      // while the customer still has the screenshot in front of them.
      if (/image\/(heic|heif)/i.test(optimized.type) || optimized.size > PROOF_MAX_BYTES) {
        setError(
          'We could not process that photo. Take a screenshot of it (or save it as JPG) and upload that instead.'
        );
        onChange(null);
        return;
      }

      onChange(optimized);
    } catch {
      setError('We could not read that file. Save it to your phone first, then upload it.');
      onChange(null);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mt-4">
      <p className="mb-1.5 text-xs font-medium text-slate-500">
        Screenshot of your payment{' '}
        {required ? (
          <span className="font-semibold text-coral">(required)</span>
        ) : (
          <span className="text-slate-400">(optional)</span>
        )}
      </p>

      <input
        ref={inputRef}
        type="file"
        accept={PROOF_ACCEPT}
        onChange={pick}
        disabled={disabled || isProcessing}
        className="hidden"
        aria-label="Upload a screenshot of your payment"
      />

      {previewUrl && value ? (
        <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Your payment screenshot"
            className="h-20 w-20 shrink-0 rounded-lg border border-slate-100 object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">{value.name}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {isProcessing ? 'Optimising…' : `${(value.size / 1024).toFixed(0)} KB · ready to send`}
            </p>
            <div className="mt-2 flex gap-3 text-xs font-medium">
              <button
                type="button"
                disabled={disabled || isProcessing}
                onClick={() => inputRef.current?.click()}
                className="text-coral hover:text-coral-dark disabled:opacity-40"
              >
                Change
              </button>
              <button
                type="button"
                disabled={disabled || isProcessing}
                onClick={() => {
                  setError(null);
                  onChange(null);
                }}
                className="text-slate-400 hover:text-slate-600 disabled:opacity-40"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled || isProcessing}
          onClick={() => inputRef.current?.click()}
          className={`flex w-full flex-col items-center gap-1 rounded-xl border-2 border-dashed bg-white px-4 py-5 text-center transition-colors hover:border-coral/60 hover:bg-coral/5 disabled:opacity-50 ${
            required ? 'border-coral/40' : 'border-slate-500'
          }`}
        >
          {isProcessing ? (
            <>
              <i className="pi pi-spin pi-spinner text-lg text-slate-400" />
              <span className="text-sm font-medium text-slate-600">Optimising your image…</span>
            </>
          ) : (
            <>
              <i className="pi pi-cloud-upload text-lg text-slate-400" />
              <span className="text-sm font-medium text-slate-700">Add your payment screenshot</span>
              <span className="text-xs text-slate-400">
                {required
                  ? "We can't confirm your booking without it"
                  : 'It is how we confirm your booking fastest'}
              </span>
            </>
          )}
        </button>
      )}

      {error && (
        <p role="alert" className="mt-2 flex items-start gap-1.5 text-xs text-red-700">
          <i className="pi pi-exclamation-circle mt-0.5 text-[11px]" />
          {error}
        </p>
      )}
    </div>
  );
}

export default ProofOfPaymentField;
