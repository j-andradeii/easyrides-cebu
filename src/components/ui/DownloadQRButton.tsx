/**
 * "Save QR" button for payment QR codes.
 *
 * On a phone this opens the share sheet so the customer can save the QR to
 * Photos and then open it from their banking app; on desktop it downloads the
 * file. See `useDownloadImage` for the branching.
 */

'use client';

import { useDownloadImage } from '@/hooks/useDownloadImage';

interface DownloadQRButtonProps {
  qrCodeUrl: string;
  filename: string;
  label?: string;
  className?: string;
}

export function DownloadQRButton({
  qrCodeUrl,
  filename,
  label = 'Save QR',
  className = '',
}: DownloadQRButtonProps) {
  const { downloadImage, isDownloading } = useDownloadImage();

  if (!qrCodeUrl) return null;

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        if (!isDownloading) void downloadImage(qrCodeUrl, filename);
      }}
      disabled={isDownloading}
      className={`inline-flex items-center justify-center gap-2 rounded-full border border-coral px-4 py-2 text-sm font-semibold text-coral transition-colors hover:bg-coral hover:text-white disabled:cursor-wait disabled:opacity-70 ${className}`}
    >
      <i className={`pi ${isDownloading ? 'pi-spin pi-spinner' : 'pi-download'} text-xs`} />
      <span className="leading-none">{isDownloading ? 'Saving…' : label}</span>
    </button>
  );
}

export default DownloadQRButton;
