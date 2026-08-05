/**
 * FormImageUpload Component
 *
 * One image — the tour's banner. The field's value is the stored public URL,
 * not a File: the upload happens as soon as the image is picked, so saving the
 * tour is a plain JSON post and a half-finished form never loses the photo.
 *
 * The picked file is re-encoded to WebP in the browser first
 * (`optimizeImageForUpload`), which is what keeps a 12 MP phone photo inside the
 * serverless body cap.
 */

'use client';

import { useId, useRef, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { ensureExtension, resolveImageMime } from '@/lib/image-mime';
import { optimizeImageForUpload } from '@/lib/image-to-webp';
import { TOUR_IMAGE_ACCEPT, TOUR_IMAGE_MAX_BYTES } from '@/models/tour.schema';
import * as tourService from '@/services/tour.service';

import { FormError } from './FormError';
import { getNestedError } from './form-field-error';

interface FormImageUploadProps {
  name: string;
  label?: string;
  hint?: string;
  disabled?: boolean;
  showRequired?: boolean;
  className?: string;
}

/**
 * Reads the file, checks it really is an image, shrinks it and uploads it.
 * Shared with the gallery field below.
 */
export async function prepareAndUploadImage(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const mime = resolveImageMime(new Uint8Array(buffer), file.type || '', file.name);

  if (!mime) {
    throw new Error(`“${file.name}” is not an image.`);
  }

  const stable = new File([buffer], ensureExtension(file.name, mime), {
    type: mime,
    lastModified: file.lastModified,
  });

  const optimized = await optimizeImageForUpload(stable).catch(() => stable);

  if (optimized.size > TOUR_IMAGE_MAX_BYTES) {
    throw new Error(`“${file.name}” is too large — keep images under 4 MB.`);
  }

  return tourService.uploadTourImage(optimized);
}

export const FormImageUpload: React.FC<FormImageUploadProps> = ({
  name,
  label,
  hint,
  disabled = false,
  showRequired = false,
  className = '',
}) => {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const error = getNestedError(errors, name);
  const reactId = useId();
  const uniqueId = `${name}-${reactId}`;

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label htmlFor={uniqueId} className="mb-2 block text-sm font-medium text-slate-700">
          {label}
          {showRequired && <span className="ml-1 text-cebu-red">*</span>}
        </label>
      )}

      <Controller
        name={name}
        control={control}
        render={({ field }) => {
          const pick = async (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            // Reset so re-picking the same file still fires onChange.
            event.target.value = '';
            if (!file) return;

            setUploadError(null);
            setIsUploading(true);
            try {
              field.onChange(await prepareAndUploadImage(file));
            } catch (caught) {
              setUploadError(caught instanceof Error ? caught.message : 'Upload failed');
            } finally {
              setIsUploading(false);
            }
          };

          return (
            <div className="w-full">
              <input
                ref={inputRef}
                id={uniqueId}
                type="file"
                accept={TOUR_IMAGE_ACCEPT}
                onChange={pick}
                disabled={disabled || isUploading}
                className="hidden"
              />

              {field.value ? (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={field.value}
                    alt="Tour banner"
                    className="h-44 w-full bg-slate-100 object-cover"
                  />
                  <div className="flex items-center justify-between gap-3 px-3 py-2">
                    <p className="truncate text-xs text-slate-500">{field.value}</p>
                    <div className="flex shrink-0 gap-3 text-xs font-medium">
                      <button
                        type="button"
                        disabled={disabled || isUploading}
                        onClick={() => inputRef.current?.click()}
                        className="text-coral hover:text-coral-dark disabled:opacity-40"
                      >
                        {isUploading ? 'Uploading…' : 'Replace'}
                      </button>
                      <button
                        type="button"
                        disabled={disabled || isUploading}
                        onClick={() => field.onChange('')}
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
                  disabled={disabled || isUploading}
                  onClick={() => inputRef.current?.click()}
                  className="flex w-full flex-col items-center gap-1 rounded-xl border-2 border-dashed border-slate-300 bg-white px-4 py-8 text-center transition-colors hover:border-coral/60 hover:bg-coral/5 disabled:opacity-50"
                >
                  <i
                    className={`pi ${isUploading ? 'pi-spin pi-spinner' : 'pi-image'} text-lg text-slate-400`}
                  />
                  <span className="text-sm font-medium text-slate-700">
                    {isUploading ? 'Uploading…' : 'Upload the banner image'}
                  </span>
                  <span className="text-xs text-slate-500">
                    Landscape works best — it fills the top of the tour page
                  </span>
                </button>
              )}

              {hint && !error && !uploadError && (
                <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
              )}
              {uploadError && <FormError error={uploadError} />}
              {error && <FormError error={error} />}
            </div>
          );
        }}
      />
    </div>
  );
};

export default FormImageUpload;
