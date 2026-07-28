/**
 * Image download hook with cross-origin blob handling.
 *
 * On a real mobile device the image is routed through the native share sheet
 * (`navigator.share({ files })`) so the customer can save the payment QR
 * straight to their Photos / camera roll — the web has no API to write to
 * Photos silently, so the share sheet is the standard one-tap path. Desktop
 * (and anything without file-share support) keeps the normal file download.
 *
 * Ported from the Gateway Church monitoring app.
 */

'use client';

import { useCallback, useState } from 'react';

/**
 * Detect a real mobile / tablet device. Desktop browsers that support the Web
 * Share API (Safari/Edge on macOS/Windows) return false so they keep the
 * ordinary download.
 */
const isMobileDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';

  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    return true;
  }

  // iPadOS 13+ Safari reports a desktop ("Macintosh") UA — detect it via touch.
  return (
    /Macintosh/.test(ua) &&
    typeof document !== 'undefined' &&
    'ontouchend' in document &&
    navigator.maxTouchPoints > 1
  );
};

/** Classic blob/anchor download used on desktop (and as the mobile fallback). */
const triggerAnchorDownload = (href: string, filename: string, newTab = false) => {
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  if (newTab) link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export function useDownloadImage() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadImage = useCallback(async (url: string, filename: string) => {
    if (!url) return;

    setIsDownloading(true);
    setError(null);

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');

      const blob = await response.blob();

      // Mobile: hand the image to the OS share sheet → "Save Image" to Photos.
      if (
        isMobileDevice() &&
        typeof navigator !== 'undefined' &&
        typeof navigator.canShare === 'function'
      ) {
        const file = new File([blob], filename, { type: blob.type || 'image/png' });

        if (navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: filename });
            return; // saved, or the user handled the sheet — done
          } catch (shareError) {
            // Sheet dismissed — treat as done rather than double-prompting.
            if (shareError instanceof Error && shareError.name === 'AbortError') return;
            // Any other share failure falls through to the blob download.
          }
        }
      }

      // Desktop (and mobile fallback): download the fetched blob.
      const blobUrl = window.URL.createObjectURL(blob);
      triggerAnchorDownload(blobUrl, filename);
      window.URL.revokeObjectURL(blobUrl);
    } catch (caught) {
      console.error('Download failed:', caught);
      setError(caught instanceof Error ? caught.message : 'Failed to download image');

      // Last resort: open it directly. Helps when CORS blocks fetch but the
      // asset itself is publicly reachable.
      triggerAnchorDownload(url, filename, true);
    } finally {
      setIsDownloading(false);
    }
  }, []);

  return { downloadImage, isDownloading, error };
}

export default useDownloadImage;
