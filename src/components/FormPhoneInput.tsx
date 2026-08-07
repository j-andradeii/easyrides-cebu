/**
 * FormPhoneInput Component
 *
 * Reusable phone input component with country code dropdown
 * Integrated with react-hook-form using Controller
 */

'use client';

import { useId } from 'react';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Controller, useFormContext } from 'react-hook-form';
import { FormError } from './FormError';

const countryCodes = [
  { value: '+63', label: '+63', country: 'Philippines' },
  { value: '+1', label: '+1', country: 'USA/Canada' },
  { value: '+44', label: '+44', country: 'UK' },
  { value: '+61', label: '+61', country: 'Australia' },
  { value: '+65', label: '+65', country: 'Singapore' },
  { value: '+81', label: '+81', country: 'Japan' },
  { value: '+82', label: '+82', country: 'South Korea' },
  { value: '+86', label: '+86', country: 'China' },
  { value: '+91', label: '+91', country: 'India' },
  { value: '+60', label: '+60', country: 'Malaysia' },
  { value: '+66', label: '+66', country: 'Thailand' },
  { value: '+84', label: '+84', country: 'Vietnam' },
  { value: '+62', label: '+62', country: 'Indonesia' },
  { value: '+49', label: '+49', country: 'Germany' },
  { value: '+33', label: '+33', country: 'France' },
  { value: '+39', label: '+39', country: 'Italy' },
  { value: '+34', label: '+34', country: 'Spain' },
  { value: '+971', label: '+971', country: 'UAE' },
  { value: '+966', label: '+966', country: 'Saudi Arabia' },
  { value: '+852', label: '+852', country: 'Hong Kong' },
];

interface FormPhoneInputProps {
  name: string;
  countryCodeName: string;
  label?: string;
  placeholder?: string;
  readonly?: boolean;
  disabled?: boolean;
  showRequired?: boolean;
  showLabel?: boolean;
  className?: string;
  defaultCountryCode?: string;
}

const countryCodeItemTemplate = (option: { value: string; label: string; country: string }) => {
  return (
    <div className="flex items-center gap-2">
      <span className="font-medium">{option.value}</span>
      <span className="text-slate-500 text-sm">{option.country}</span>
    </div>
  );
};

const selectedCountryCodeTemplate = (option: { value: string; label: string; country: string } | null) => {
  if (!option) return <span className="text-slate-400">Code</span>;
  return <span className="font-medium">{option.value}</span>;
};

export const FormPhoneInput: React.FC<FormPhoneInputProps> = ({
  name,
  countryCodeName,
  label,
  placeholder = '9XX XXX XXXX',
  readonly = false,
  disabled = false,
  showRequired = false,
  showLabel = true,
  className = '',
  defaultCountryCode = '+63',
}) => {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  // Get nested error for this field
  const getNestedError = (errors: Record<string, unknown>, path: string): string | undefined => {
    const parts = path.split('.');
    let current: Record<string, unknown> = errors;

    for (const part of parts) {
      if (!current[part]) return undefined;
      current = current[part] as Record<string, unknown>;
    }

    return current.message as string | undefined;
  };

  const phoneError = getNestedError(errors, name);
  const reactId = useId();
  const uniqueId = `${name}-${reactId}`;

  // Format phone number (remove non-digits except for formatting)
  const formatPhoneNumber = (value: string): string => {
    return value.replace(/[^0-9]/g, '');
  };

  return (
    <div className={`mb-4 ${className}`}>
      {showLabel && label && (
        <label htmlFor={uniqueId} className="block text-sm font-medium text-slate-700 mb-2">
          {label}
          {showRequired && <span className="text-cebu-red ml-1">*</span>}
        </label>
      )}

      <div className="flex items-stretch gap-2">
        {/* Country Code Dropdown */}
        <Controller
          name={countryCodeName}
          control={control}
          defaultValue={defaultCountryCode}
          render={({ field }) => (
            <Dropdown
              value={field.value}
              onChange={(e) => field.onChange(e.value)}
              options={countryCodes}
              optionLabel="label"
              optionValue="value"
              placeholder="Code"
              disabled={disabled || readonly}
              className="phone-country-dropdown shrink-0"
              panelClassName="phone-country-dropdown-panel"
              itemTemplate={countryCodeItemTemplate}
              valueTemplate={selectedCountryCodeTemplate}
            />
          )}
        />

        {/* Phone Number Input */}
        <Controller
          name={name}
          control={control}
          render={({ field, fieldState }) => (
            <InputText
              id={uniqueId}
              type="tel"
              className={`flex-1 min-w-0 px-2 py-2 border rounded-lg focus:ring-2 focus:ring-coral focus:border-transparent text-slate-700 bg-white transition-colors
                ${fieldState.invalid ? 'border-cebu-red' : 'border-slate-300'}
                ${disabled || readonly ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}
              `}
              value={field.value || ''}
              onChange={(e) => {
                const formatted = formatPhoneNumber(e.target.value);
                field.onChange(formatted);
              }}
              onBlur={field.onBlur}
              placeholder={placeholder}
              readOnly={readonly}
              disabled={disabled}
              autoComplete="tel"
            />
          )}
        />
      </div>
      {phoneError && <FormError error={phoneError} />}
    </div>
  );
};

export default FormPhoneInput;
