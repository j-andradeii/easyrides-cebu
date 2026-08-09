/**
 * ShareLinks — copy a link, or hand it straight to a social app.
 *
 * A campaign that cannot be shared in two clicks does not get shared, so this
 * sits next to every promo rather than leaving an owner to select a URL out of
 * the address bar on a phone.
 *
 * Every target is a plain share *intent* URL — the public, documented endpoint
 * each platform exposes for exactly this. There is no SDK, no tracking pixel
 * and no API key: the browser opens the platform's own composer with the link
 * pre-filled, and the person posting decides what to write around it.
 *
 * The link is built from `NEXT_PUBLIC_APP_URL` when it is set, falling back to
 * the browser's own origin. Sharing a localhost URL to Facebook is a wasted
 * post, but it is a less confusing failure than a hard-coded production domain
 * that quietly points a staging test at the live site.
 */

'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';

export interface ShareLinksProps {
  /** Site-relative path, e.g. "/promo/summer-oslob-2026". */
  path: string;
  /** Prefilled message for the apps that accept one. */
  message?: string;
  /** Compact row of icons instead of labelled buttons — for table rows. */
  compact?: boolean;
  className?: string;
}

/**
 * The browser's origin, or '' while rendering on the server.
 *
 * `useSyncExternalStore` rather than an effect: this is a read of something
 * outside React that never changes, and its server snapshot is what keeps
 * hydration from mismatching. Subscribing is a no-op because `location.origin`
 * cannot change without a navigation.
 */
function useOrigin(): string {
  return useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => ''
  );
}

export function ShareLinks({ path, message, compact = false, className = '' }: ShareLinksProps) {
  const origin = useOrigin();
  const [copied, setCopied] = useState(false);

  /**
   * Empty until the origin resolves on the client, which is what the `url ? …`
   * guards below are for — a share link built against an empty base would send
   * someone to a relative path on facebook.com.
   */
  const url = useMemo(() => {
    const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
    const base = configured || origin.replace(/\/$/, '');
    return base ? `${base}${path}` : '';
  }, [origin, path]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Clipboard access is denied over plain http and in some in-app
      // browsers. Selecting the text is the honest fallback.
      window.prompt('Copy this link', url);
    }
  };

  const encodedUrl = encodeURIComponent(url);
  const encodedMessage = encodeURIComponent(message ? `${message} ${url}` : url);

  const targets = [
    {
      key: 'facebook',
      label: 'Facebook',
      icon: 'pi-facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      tone: 'text-[#1877F2]',
    },
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      icon: 'pi-whatsapp',
      href: `https://wa.me/?text=${encodedMessage}`,
      tone: 'text-[#25D366]',
    },
    {
      key: 'telegram',
      label: 'Telegram',
      icon: 'pi-telegram',
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(message ?? '')}`,
      tone: 'text-[#229ED9]',
    },
    {
      key: 'x',
      label: 'X',
      icon: 'pi-twitter',
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodeURIComponent(
        message ?? ''
      )}`,
      tone: 'text-slate-900',
    },
  ];

  if (compact) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <button
          type="button"
          onClick={copy}
          title={copied ? 'Copied' : 'Copy link'}
          aria-label={copied ? 'Link copied' : 'Copy link'}
          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
        >
          <i className={`pi ${copied ? 'pi-check text-emerald-600' : 'pi-copy'} text-sm`} />
        </button>
        {targets.map((target) => (
          <a
            key={target.key}
            href={url ? target.href : undefined}
            target="_blank"
            rel="noopener noreferrer"
            title={`Share on ${target.label}`}
            aria-label={`Share on ${target.label}`}
            className={`rounded-lg p-2 transition-colors hover:bg-slate-100 ${target.tone}`}
          >
            <i className={`pi ${target.icon} text-sm`} />
          </a>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-stretch gap-2">
        <p className="min-w-0 flex-1 truncate rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700">
          {url || '…'}
        </p>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          <i className={`pi ${copied ? 'pi-check' : 'pi-copy'} mr-1.5 text-xs`} />
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {targets.map((target) => (
          <a
            key={target.key}
            href={url ? target.href : undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <i className={`pi ${target.icon} ${target.tone}`} />
            {target.label}
          </a>
        ))}
      </div>
    </div>
  );
}

export default ShareLinks;
