/**
 * Add a lead by hand from /admin/inquiries — the walk-in at the counter and the
 * phone call that never touches a website form (plan §10.2).
 *
 * Posts the same shape the public forms do, so the created lead is a normal
 * lead: deduped against existing contacts by phone/email and parked at New
 * Lead. The one difference is deliberate — no automated messaging fires, since
 * the agent is already speaking to this customer.
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';

import { serviceLabel, sourceLabel, vehicleLabel } from '@/lib/crm/normalize';
import {
  ADMIN_LEAD_SOURCES,
  SERVICE_TYPES,
  VEHICLE_TYPES,
  type AdminLeadData,
} from '@/models/inquiry.schema';

const SOURCE_OPTIONS = ADMIN_LEAD_SOURCES.map((value) => ({
  label: sourceLabel(value),
  value,
}));

const SERVICE_OPTIONS = [
  { label: 'Not sure yet', value: '' },
  ...SERVICE_TYPES.map((value) => ({ label: serviceLabel(value), value })),
];

const VEHICLE_OPTIONS = [
  { label: 'Not sure yet', value: '' },
  ...VEHICLE_TYPES.map((value) => ({ label: vehicleLabel(value) ?? value, value })),
];

interface FormState {
  fullName: string;
  countryCode: string;
  phone: string;
  email: string;
  source: string;
  serviceType: string;
  vehicleType: string;
  preferredDate: string;
  tourTitle: string;
  referralCode: string;
  message: string;
}

const EMPTY_FORM: FormState = {
  fullName: '',
  countryCode: '+63',
  phone: '',
  email: '',
  source: 'walk-in',
  serviceType: '',
  vehicleType: '',
  preferredDate: '',
  tourTitle: '',
  referralCode: '',
  message: '',
};

export interface NewLeadDialogProps {
  open: boolean;
  onClose: () => void;
  /** Resolves once the lead exists; the caller decides where to go next. */
  onCreate: (input: AdminLeadData) => Promise<void>;
}

/**
 * Gate only. Rendering the form as a child means it MOUNTS on open, so its
 * state starts at EMPTY_FORM for free — no reset effect, and a half-typed lead
 * from the last customer can never leak into the next one.
 */
export function NewLeadDialog({ open, onClose, onCreate }: NewLeadDialogProps) {
  if (!open) return null;
  return <NewLeadForm onClose={onClose} onCreate={onCreate} />;
}

function NewLeadForm({ onClose, onCreate }: Omit<NewLeadDialogProps, 'open'>) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  // DOM-only effect: focus the first field once the panel paints so the agent
  // can start typing immediately. Touches no React state.
  useEffect(() => {
    firstFieldRef.current?.focus();
  }, []);

  // Escape closes, but never mid-save — that would hide a request the agent
  // still needs the result of.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSaving) onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isSaving, onClose]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSaving) return;

    const digits = form.phone.replace(/\D/g, '');
    if (digits.length < 7) {
      setError('Enter a phone number — it is how leads are matched to existing customers.');
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      await onCreate({
        // The intake normalizes "+63" + "0917…" into one E.164 number, so the
        // agent can type it however the customer says it.
        phone: `${form.countryCode}${form.phone}`,
        source: form.source as AdminLeadData['source'],
        countryCode: form.countryCode,
        ...(form.fullName.trim() ? { fullName: form.fullName.trim() } : {}),
        ...(form.email.trim() ? { email: form.email.trim() } : {}),
        ...(form.serviceType
          ? { serviceType: form.serviceType as AdminLeadData['serviceType'] }
          : {}),
        ...(form.vehicleType
          ? { vehicleType: form.vehicleType as AdminLeadData['vehicleType'] }
          : {}),
        ...(form.preferredDate ? { preferredDate: form.preferredDate } : {}),
        ...(form.tourTitle.trim() ? { tourTitle: form.tourTitle.trim() } : {}),
        ...(form.referralCode.trim()
          ? { referralCode: form.referralCode.trim().toUpperCase() }
          : {}),
        ...(form.message.trim() ? { message: form.message.trim() } : {}),
      });
    } catch (caught) {
      // apiClient rejects with a plain ApiError object, not an Error instance,
      // so `instanceof Error` would silently discard the server's message.
      setError((caught as { message?: string })?.message ?? 'Could not save this lead.');
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 sm:p-6"
      onMouseDown={(event) => {
        // Backdrop click closes; a drag that ends on the backdrop must not.
        if (event.target === event.currentTarget && !isSaving) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-lead-title"
        className="my-auto w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-xl"
      >
        <form onSubmit={submit}>
          <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
            <div>
              <h2 id="new-lead-title" className="text-lg font-bold text-slate-900">
                Add a lead
              </h2>
              <p className="mt-0.5 text-sm text-slate-600">
                For walk-ins and phone calls. Existing customers are matched by phone or email.
              </p>
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                <i className="pi pi-info-circle text-[11px]" />
                No automated email is sent for leads added here — follow up yourself.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              aria-label="Close"
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
            >
              <i className="pi pi-times" />
            </button>
          </header>

          <div className="space-y-4 px-5 py-4">
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              >
                {error}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" htmlFor="lead-name">
                <InputText
                  id="lead-name"
                  ref={firstFieldRef}
                  value={form.fullName}
                  onChange={(event) => update('fullName', event.target.value)}
                  placeholder="Juan dela Cruz"
                  className="w-full rounded-lg border border-slate-500 px-3 py-2 text-sm"
                />
              </Field>

              <Field label="Phone" htmlFor="lead-phone" required>
                <div className="flex gap-2">
                  <InputText
                    aria-label="Country code"
                    value={form.countryCode}
                    onChange={(event) => update('countryCode', event.target.value)}
                    className="w-20 rounded-lg border border-slate-500 px-3 py-2 text-sm"
                  />
                  <InputText
                    id="lead-phone"
                    value={form.phone}
                    onChange={(event) => update('phone', event.target.value)}
                    placeholder="917 123 4567"
                    inputMode="tel"
                    className="w-full rounded-lg border border-slate-500 px-3 py-2 text-sm"
                  />
                </div>
              </Field>

              <Field label="Email" htmlFor="lead-email">
                <InputText
                  id="lead-email"
                  value={form.email}
                  onChange={(event) => update('email', event.target.value)}
                  placeholder="juan@example.com"
                  type="email"
                  className="w-full rounded-lg border border-slate-500 px-3 py-2 text-sm"
                />
              </Field>

              <Field label="Source" htmlFor="lead-source" required>
                <Dropdown
                  inputId="lead-source"
                  value={form.source}
                  options={SOURCE_OPTIONS}
                  optionLabel="label"
                  optionValue="value"
                  onChange={(event) => update('source', event.value ?? 'walk-in')}
                  className="form-dropdown w-full text-sm"
                  panelClassName="form-dropdown-panel"
                />
              </Field>

              <Field label="Service" htmlFor="lead-service">
                <Dropdown
                  inputId="lead-service"
                  value={form.serviceType}
                  options={SERVICE_OPTIONS}
                  optionLabel="label"
                  optionValue="value"
                  onChange={(event) => update('serviceType', event.value ?? '')}
                  className="form-dropdown w-full text-sm"
                  panelClassName="form-dropdown-panel"
                />
              </Field>

              <Field label="Vehicle" htmlFor="lead-vehicle">
                <Dropdown
                  inputId="lead-vehicle"
                  value={form.vehicleType}
                  options={VEHICLE_OPTIONS}
                  optionLabel="label"
                  optionValue="value"
                  onChange={(event) => update('vehicleType', event.value ?? '')}
                  className="form-dropdown w-full text-sm"
                  panelClassName="form-dropdown-panel"
                />
              </Field>

              <Field label="Trip date" htmlFor="lead-date">
                <InputText
                  id="lead-date"
                  value={form.preferredDate}
                  onChange={(event) => update('preferredDate', event.target.value)}
                  type="date"
                  className="w-full rounded-lg border border-slate-500 px-3 py-2 text-sm"
                />
              </Field>

              <Field label="Referral code" htmlFor="lead-referral" hint="If someone sent them">
                <InputText
                  id="lead-referral"
                  value={form.referralCode}
                  onChange={(event) => update('referralCode', event.target.value)}
                  placeholder="ABC123"
                  className="w-full rounded-lg border border-slate-500 px-3 py-2 text-sm uppercase"
                />
              </Field>
            </div>

            {form.serviceType === 'tour' && (
              <Field label="Tour" htmlFor="lead-tour">
                <InputText
                  id="lead-tour"
                  value={form.tourTitle}
                  onChange={(event) => update('tourTitle', event.target.value)}
                  placeholder="Kawasan Falls Day Tour"
                  className="w-full rounded-lg border border-slate-500 px-3 py-2 text-sm"
                />
              </Field>
            )}

            <Field label="Notes" htmlFor="lead-message" hint="What did they ask for?">
              <InputTextarea
                id="lead-message"
                value={form.message}
                onChange={(event) => update('message', event.target.value)}
                rows={3}
                autoResize
                placeholder="Wants a van for 8 pax, pickup at Mactan airport 6am."
                className="w-full rounded-lg border border-slate-500 px-3 py-2 text-sm"
              />
            </Field>
          </div>

          <footer className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-4">
            <Button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              label="Cancel"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-40"
            />
            <Button
              type="submit"
              loading={isSaving}
              label={isSaving ? 'Saving…' : 'Create lead'}
              icon="pi pi-plus"
              className="bg-coral hover:bg-coral-dark rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            />
          </footer>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  required,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-600" htmlFor={htmlFor}>
        {label}
        {required && <span className="text-coral ml-0.5">*</span>}
        {hint && <span className="ml-1.5 font-normal text-slate-500">· {hint}</span>}
      </label>
      {children}
    </div>
  );
}
