/**
 * Sanitises the HTML the portal's rich-text editor produces — SERVER ONLY.
 *
 * The tour description is written by a signed-in admin and rendered into the
 * public page with `dangerouslySetInnerHTML`, so it is stored *already clean*:
 * sanitising on write means the site can never render markup that no longer
 * passes the allowlist, and a compromised or careless admin account cannot plant
 * a script that fires for every visitor.
 *
 * The allowlist is deliberately the exact set of nodes the editor can create
 * (see `RichTextEditor`) — anything else is markup nobody asked for.
 */

import 'server-only';

import sanitizeHtml from 'sanitize-html';

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p',
    'br',
    'strong',
    'em',
    'u',
    's',
    'code',
    'pre',
    'blockquote',
    'h2',
    'h3',
    'h4',
    'ul',
    'ol',
    'li',
    'a',
    'hr',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  // A link the admin typed points off-site; make that safe by construction
  // rather than trusting whatever the editor happened to emit.
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer nofollow' }),
    // Headings past h4 are demoted rather than dropped: the page already owns
    // h1, and losing the text entirely would be worse than losing a level.
    h1: 'h2',
    h5: 'h4',
    h6: 'h4',
  },
  // Keep the words inside a disallowed tag, drop only the tag itself.
  nonTextTags: ['style', 'script', 'textarea', 'option', 'noscript'],
};

/** Returns storage-safe HTML. Empty string when nothing survives. */
export function sanitizeRichText(html: string): string {
  const clean = sanitizeHtml(html, OPTIONS).trim();

  // TipTap serialises an empty document as "<p></p>" — store nothing instead,
  // so "is there a description?" is a simple emptiness check everywhere else.
  return clean === '<p></p>' ? '' : clean;
}
