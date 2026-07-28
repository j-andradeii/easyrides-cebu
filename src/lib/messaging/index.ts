/**
 * Messaging — the cheap building blocks the plan calls for (§3 "buy vs. build").
 *
 * Email goes out through Resend when RESEND_API_KEY is configured; otherwise
 * every send is logged and recorded on the activity timeline, so the funnel is
 * fully testable before you pay for a provider.
 *
 * WhatsApp is a click-to-chat deep link rather than the Business API: the
 * automation stores a ready-to-send link on the activity, and an agent sends it
 * in one tap from the lead detail screen.
 */

import { renderTemplate, type RenderedMessage, type TemplateContext, type TemplateKey } from './templates';

export type MessageChannel = 'email' | 'sms' | 'whatsapp';

export interface DeliveryResult {
  channel: MessageChannel;
  /** Whether the message actually left the building (vs. logged for an agent to send). */
  delivered: boolean;
  provider: 'resend' | 'log' | 'whatsapp-link';
  subject: string;
  body: string;
  /** A one-tap wa.me link, for whatsapp sends. */
  link?: string;
  error?: string;
}

export interface DeliverMessageInput {
  channel: MessageChannel;
  template: TemplateKey;
  context: TemplateContext;
  /** 'customer' sends to the contact; 'admin' sends to ADMIN_NOTIFY_EMAIL. */
  audience: 'customer' | 'admin';
}

/** Digits-only phone for wa.me links (they reject '+' and spaces). */
export function toWhatsAppNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 ? digits : null;
}

export function buildWhatsAppLink(phone: string | null | undefined, text: string): string | null {
  const number = toWhatsAppNumber(phone);
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

async function sendEmail(to: string, message: RenderedMessage): Promise<DeliveryResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM ?? 'EasyRideCebu <onboarding@resend.dev>';

  if (!apiKey) {
    console.info(
      `[messaging] email → ${to} :: ${message.subject}\n${message.body}\n(RESEND_API_KEY not set — logged only)`
    );
    return {
      channel: 'email',
      delivered: false,
      provider: 'log',
      subject: message.subject,
      body: message.body,
    };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: message.subject,
        // Both parts when the template provides HTML: clients that block or
        // can't render it still get a readable message.
        text: message.body,
        ...(message.html ? { html: message.html } : {}),
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      return {
        channel: 'email',
        delivered: false,
        provider: 'resend',
        subject: message.subject,
        body: message.body,
        error: `Resend responded ${response.status}: ${detail.slice(0, 300)}`,
      };
    }

    return {
      channel: 'email',
      delivered: true,
      provider: 'resend',
      subject: message.subject,
      body: message.body,
    };
  } catch (error) {
    return {
      channel: 'email',
      delivered: false,
      provider: 'resend',
      subject: message.subject,
      body: message.body,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Render a template and hand it to the right channel. Never throws — a failed
 * send is reported in the result so the workflow engine can log it and move on
 * rather than stalling the whole enrollment.
 */
export async function deliverMessage(input: DeliverMessageInput): Promise<DeliveryResult> {
  const message = renderTemplate(input.template, input.context);
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL;

  if (input.channel === 'email') {
    const to = input.audience === 'admin' ? adminEmail : input.context.email;
    if (!to) {
      return {
        channel: 'email',
        delivered: false,
        provider: 'log',
        subject: message.subject,
        body: message.body,
        error:
          input.audience === 'admin'
            ? 'ADMIN_NOTIFY_EMAIL is not set'
            : 'Contact has no email address',
      };
    }
    return sendEmail(to, message);
  }

  if (input.channel === 'whatsapp') {
    const target =
      input.audience === 'admin' ? process.env.WHATSAPP_BUSINESS_NUMBER : input.context.phone;
    const link = buildWhatsAppLink(target, message.body);
    if (!link) {
      return {
        channel: 'whatsapp',
        delivered: false,
        provider: 'whatsapp-link',
        subject: message.subject,
        body: message.body,
        error: 'No usable phone number for a WhatsApp link',
      };
    }
    console.info(`[messaging] whatsapp link ready :: ${message.subject}`);
    return {
      channel: 'whatsapp',
      // The link still needs an agent tap, so this is "prepared", not "delivered".
      delivered: false,
      provider: 'whatsapp-link',
      subject: message.subject,
      body: message.body,
      link,
    };
  }

  // SMS is intentionally a stub — wire a provider here when you buy one.
  console.info(`[messaging] sms → ${input.context.phone} :: ${message.subject}`);
  return {
    channel: 'sms',
    delivered: false,
    provider: 'log',
    subject: message.subject,
    body: message.body,
    error: 'No SMS provider configured',
  };
}

export { renderTemplate };
export type { TemplateContext, TemplateKey, RenderedMessage };
