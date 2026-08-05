/**
 * FormGallery Component
 *
 * The tour's photo gallery — many images, ordered, each stored as a public URL.
 * It is `FormImageUpload`'s plural sibling and shares its upload path
 * (`prepareAndUploadImage`), so a gallery photo is re-encoded, size-checked and
 * stored by exactly the same rules as the banner.
 *
 * Uploads run as the files are picked, not on submit: a dropped batch of eight
 * photos is worth watching land, and a tour that fails validation later never
 * has to be re-uploaded.
 */

'use client';

import { useId, useRef, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { TOUR_GALLERY_MAX, TOUR_IMAGE_ACCEPT } from '@/models/tour.schema';

import { FormError } from './FormError';
import { prepareAndUploadImage } from './FormImageUpload';
import { getNestedError } from './form-field-error';

interface FormGalleryProps {
  name: string;
  label?: string;
  hint?: string;
  max?: number;
  disabled?: boolean;
  className?: string;
}

export const FormGallery: React.FC<FormGalleryProps> = ({
  name,
  label,
  hint,
  max = TOUR_GALLERY_MAX,
  disabled = false,
  className = '',
}) => {
  const {
    control,
    getValues,
    formState: { errors },
  } = useFormContext();

  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(0);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);

  const error = getNestedError(errors, name);
  const reactId = useId();
  const uniqueId = `${name}-${reactId}`;
  const isUploading = pending > 0;

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      )}

      <Controller
        name={name}
        control={control}
        render={({ field }) => {
          const images: string[] = Array.isArray(field.value) ? field.value : [];

          const pick = async (event: React.ChangeEvent<HTMLInputElement>) => {
            const files = Array.from(event.target.files ?? []);
            event.target.value = '';
            if (files.length === 0) return;

            const room = max - images.length;
            const accepted = files.slice(0, room);
            const rejected = files.length - accepted.length;

            setUploadErrors(
              rejected > 0
                ? [`Only ${max} photos fit in a gallery — ${rejected} were not uploaded.`]
                : []
            );

            setPending((count) => count + accepted.length);

            // Settled, not all: one bad file in a batch must not discard the
            // photos that uploaded fine alongside it.
            const results = await Promise.allSettled(accepted.map(prepareAndUploadImage));
            setPending((count) => count - accepted.length);

            const uploaded = results
              .filter((result) => result.status === 'fulfilled')
              .map((result) => result.value);

            const failures = results
              .filter((result) => result.status === 'rejected')
              .map((result) =>
                result.reason instanceof Error ? result.reason.message : 'An upload failed'
              );

            if (uploaded.length > 0) {
              // `getValues`, not `field.value`: this closure captured the field
              // object from the render that started the upload, so a photo that
              // landed in the meantime would be overwritten by that snapshot.
              const current = (getValues(name) as string[] | undefined) ?? [];
              field.onChange([...current, ...uploaded].slice(0, max));
            }
            if (failures.length > 0) {
              setUploadErrors((existing) => [...existing, ...failures]);
            }
          };

          const removeAt = (index: number) =>
            field.onChange(images.filter((_, position) => position !== index));

          const move = (index: number, delta: number) => {
            const target = index + delta;
            if (target < 0 || target >= images.length) return;

            const next = [...images];
            [next[index], next[target]] = [next[target], next[index]];
            field.onChange(next);
          };

          return (
            <div className="w-full">
              <input
                ref={inputRef}
                id={uniqueId}
                type="file"
                accept={TOUR_IMAGE_ACCEPT}
                multiple
                onChange={pick}
                disabled={disabled || isUploading}
                className="hidden"
              />

              {images.length > 0 && (
                <ul className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {images.map((url, index) => (
                    <li
                      key={`${url}-${index}`}
                      className="group relative overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Gallery photo ${index + 1}`}
                        className="h-28 w-full object-cover"
                      />

                      <span className="absolute left-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[11px] font-medium text-white">
                        {index + 1}
                      </span>

                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/55 px-1 py-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                        <div className="flex">
                          <button
                            type="button"
                            disabled={disabled || index === 0}
                            onClick={() => move(index, -1)}
                            aria-label={`Move photo ${index + 1} earlier`}
                            className="flex h-6 w-6 items-center justify-center rounded text-white hover:bg-white/20 disabled:opacity-30"
                          >
                            <i className="pi pi-chevron-left text-[10px]" />
                          </button>
                          <button
                            type="button"
                            disabled={disabled || index === images.length - 1}
                            onClick={() => move(index, 1)}
                            aria-label={`Move photo ${index + 1} later`}
                            className="flex h-6 w-6 items-center justify-center rounded text-white hover:bg-white/20 disabled:opacity-30"
                          >
                            <i className="pi pi-chevron-right text-[10px]" />
                          </button>
                        </div>

                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => removeAt(index)}
                          aria-label={`Remove photo ${index + 1}`}
                          className="flex h-6 w-6 items-center justify-center rounded text-white hover:bg-white/20 disabled:opacity-30"
                        >
                          <i className="pi pi-trash text-[10px]" />
                        </button>
                      </div>
                    </li>
                  ))}

                  {isUploading &&
                    Array.from({ length: pending }).map((_, index) => (
                      <li
                        key={`pending-${index}`}
                        className="flex h-28 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50"
                      >
                        <i className="pi pi-spin pi-spinner text-slate-400" />
                      </li>
                    ))}
                </ul>
              )}

              <button
                type="button"
                disabled={disabled || isUploading || images.length >= max}
                onClick={() => inputRef.current?.click()}
                className={`flex w-full flex-col items-center gap-1 rounded-xl border-2 border-dashed border-slate-300 bg-white px-4 text-center transition-colors hover:border-coral/60 hover:bg-coral/5 disabled:opacity-50 ${
                  images.length > 0 ? 'py-4' : 'py-8'
                }`}
              >
                <i
                  className={`pi ${isUploading ? 'pi-spin pi-spinner' : 'pi-images'} text-lg text-slate-400`}
                />
                <span className="text-sm font-medium text-slate-700">
                  {isUploading
                    ? `Uploading ${pending} photo${pending === 1 ? '' : 's'}…`
                    : images.length >= max
                      ? `Gallery is full (${max} photos)`
                      : 'Add gallery photos'}
                </span>
                {!isUploading && images.length < max && (
                  <span className="text-xs text-slate-500">
                    Pick several at once — {max - images.length} slot
                    {max - images.length === 1 ? '' : 's'} left
                  </span>
                )}
              </button>

              {hint && !error && uploadErrors.length === 0 && (
                <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
              )}
              {uploadErrors.map((message, index) => (
                <FormError key={`${message}-${index}`} error={message} />
              ))}
              {error && <FormError error={error} />}
            </div>
          );
        }}
      />
    </div>
  );
};

export default FormGallery;
