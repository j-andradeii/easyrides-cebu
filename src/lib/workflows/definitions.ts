/**
 * The GoHighLevel-style automations — plan §7 and §7A.7.
 *
 * Definitions are plain data so they can be stored in `workflows.definition`
 * (JSONB) and toggled off with `workflows.is_active` without a deploy. The
 * engine in ./engine.ts interprets them.
 *
 * A workflow runs its steps in order. Before each step the engine evaluates
 * `exitWhen`; if any condition matches, the enrollment exits cleanly. `wait`
 * steps park the enrollment until the cron runner picks it up again.
 */

import type { StageKey } from '@/lib/funnel/stages';
import type { TemplateKey } from '@/lib/messaging/templates';

export const WORKFLOW_KEYS = [
  'w1_intake',
  'w2_followup',
  'w3_quote',
  'w4_fulfillment',
  'w5_referral_reward',
] as const;

export type WorkflowKey = (typeof WORKFLOW_KEYS)[number];

export type TriggerType =
  | 'inquiry.created'
  | 'stage.changed'
  | 'referral.converted'
  | 'manual';

/** Predicates the engine can evaluate against the current opportunity. */
export type WorkflowCondition =
  /** Someone actually reached out (stage advanced, or an outbound call/message was logged). */
  | { kind: 'contacted' }
  /** The customer answered — an inbound message/call activity exists. */
  | { kind: 'replied' }
  | { kind: 'stage_at_or_beyond'; stage: StageKey }
  | { kind: 'stage_is'; stage: StageKey }
  /** Opportunity is no longer open (won / lost / abandoned). */
  | { kind: 'closed' }
  | { kind: 'won' }
  | { kind: 'lost' }
  /** Left a 4-5 star / NPS >= 9 review. */
  | { kind: 'is_promoter' }
  | { kind: 'not_promoter' };

export type WorkflowStep =
  /** Handled transactionally by the intake route; kept for readability of the definition. */
  | { type: 'upsert_contact' }
  | { type: 'create_opportunity'; stage: StageKey }
  | {
      type: 'send_message';
      channel: 'email' | 'sms' | 'whatsapp';
      template: TemplateKey;
      to?: 'customer' | 'admin';
    }
  | { type: 'notify_admin'; template: TemplateKey }
  | { type: 'create_task'; title: string; dueInMinutes?: number }
  | { type: 'add_tags'; tags: string[] }
  | { type: 'wait'; minutes?: number; hours?: number; days?: number }
  /** Parks until the opportunity's preferred (trip) date, plus/minus an offset. */
  | { type: 'wait_until_trip_date'; offsetHours?: number; fallbackDays?: number }
  /** Exits the workflow when the condition holds; otherwise falls through. */
  | { type: 'exit_if'; condition: WorkflowCondition }
  | { type: 'move_stage'; stage: StageKey; lostReason?: string }
  | { type: 'enroll'; workflow: WorkflowKey }
  | { type: 'update_lifetime_value' }
  /** §7A — runs the anti-abuse guardrails then rewards both parties. */
  | { type: 'issue_referral_rewards' }
  | { type: 'exit' };

export interface WorkflowDefinition {
  key: WorkflowKey;
  name: string;
  description: string;
  trigger: TriggerType;
  /** For `stage.changed` triggers — the stage that enrolls the opportunity. */
  triggerStage?: StageKey;
  /** Evaluated before every step; any match exits the enrollment. */
  exitWhen: WorkflowCondition[];
  steps: WorkflowStep[];
}

// --- W1 — Instant Lead Capture & Response ----------------------------------

const w1Intake: WorkflowDefinition = {
  key: 'w1_intake',
  name: 'W1 · Instant Lead Capture & Response',
  description:
    'Fires the moment any of the three site forms is submitted. Acknowledges the customer in seconds, alerts the team, and puts a 15-minute callback task in front of an agent — speed-to-lead is the biggest lever this business has.',
  trigger: 'inquiry.created',
  exitWhen: [{ kind: 'closed' }],
  steps: [
    { type: 'upsert_contact' },
    { type: 'create_opportunity', stage: 'new_lead' },
    { type: 'send_message', channel: 'email', template: 'instant_ack', to: 'customer' },
    { type: 'notify_admin', template: 'new_lead_alert' },
    { type: 'create_task', title: 'Call back within 15 min', dueInMinutes: 15 },
    { type: 'add_tags', tags: ['source:{{source}}', 'service:{{serviceType}}'] },
    { type: 'enroll', workflow: 'w2_followup' },
  ],
};

// --- W2 — Speed-to-Lead Follow-Up (no-response drip) ------------------------

const w2Followup: WorkflowDefinition = {
  key: 'w2_followup',
  name: 'W2 · Speed-to-Lead Follow-Up',
  description:
    'Chases leads that go quiet while they sit in New Lead / Contacted. Exits the moment the customer replies or the deal advances past Quote Sent; otherwise marks the lead Lost (no response) after 72h so the funnel stays honest.',
  trigger: 'inquiry.created',
  exitWhen: [{ kind: 'closed' }, { kind: 'stage_at_or_beyond', stage: 'quote_sent' }],
  steps: [
    { type: 'wait', hours: 1 },
    { type: 'exit_if', condition: { kind: 'contacted' } },
    { type: 'send_message', channel: 'whatsapp', template: 'followup_1', to: 'customer' },
    { type: 'create_task', title: 'Lead has not been contacted — reach out now', dueInMinutes: 30 },
    { type: 'wait', hours: 24 },
    { type: 'exit_if', condition: { kind: 'replied' } },
    { type: 'send_message', channel: 'whatsapp', template: 'followup_2', to: 'customer' },
    { type: 'wait', hours: 72 },
    { type: 'exit_if', condition: { kind: 'replied' } },
    { type: 'send_message', channel: 'whatsapp', template: 'followup_final', to: 'customer' },
    { type: 'move_stage', stage: 'lost', lostReason: 'No response after 3 follow-ups' },
  ],
};

// --- W3 — Quote → Booking Conversion ---------------------------------------

const w3Quote: WorkflowDefinition = {
  key: 'w3_quote',
  name: 'W3 · Quote → Booking Conversion',
  description:
    'Enrolls when an agent moves the deal to Quote Sent. Quotes are where the money is made or lost, so this sends the summary and two well-timed nudges before conceding the deal went cold.',
  trigger: 'stage.changed',
  triggerStage: 'quote_sent',
  exitWhen: [{ kind: 'closed' }, { kind: 'stage_at_or_beyond', stage: 'booked' }],
  steps: [
    { type: 'send_message', channel: 'email', template: 'quote_summary', to: 'customer' },
    { type: 'wait', days: 1 },
    { type: 'exit_if', condition: { kind: 'won' } },
    { type: 'send_message', channel: 'whatsapp', template: 'quote_reminder', to: 'customer' },
    { type: 'move_stage', stage: 'negotiation' },
    { type: 'create_task', title: 'Follow up on the quote personally', dueInMinutes: 60 },
    { type: 'wait', days: 2 },
    { type: 'exit_if', condition: { kind: 'won' } },
    { type: 'move_stage', stage: 'lost', lostReason: 'Quote went cold — no reply after 2 nudges' },
    { type: 'notify_admin', template: 'lost_reason_prompt' },
  ],
};

// --- W4 — Fulfillment, Review & Re-Engagement -------------------------------

const w4Fulfillment: WorkflowDefinition = {
  key: 'w4_fulfillment',
  name: 'W4 · Fulfillment, Review & Re-Engagement',
  description:
    'Enrolls when a deal is Booked. Confirms the booking, reminds both sides the day before, closes the trip out, then asks for a review at the peak-end moment and invites happy customers to refer a friend.',
  trigger: 'stage.changed',
  triggerStage: 'booked',
  exitWhen: [{ kind: 'lost' }],
  steps: [
    { type: 'send_message', channel: 'email', template: 'booking_confirmation', to: 'customer' },
    { type: 'create_task', title: 'Assign a driver and confirm the itinerary' },
    { type: 'wait_until_trip_date', offsetHours: -24, fallbackDays: 3 },
    { type: 'send_message', channel: 'whatsapp', template: 'trip_reminder', to: 'customer' },
    { type: 'notify_admin', template: 'driver_reminder' },
    { type: 'wait_until_trip_date', offsetHours: 3, fallbackDays: 4 },
    { type: 'move_stage', stage: 'completed' },
    { type: 'update_lifetime_value' },
    { type: 'send_message', channel: 'email', template: 'review_request', to: 'customer' },
    { type: 'wait', days: 3 },
    { type: 'exit_if', condition: { kind: 'not_promoter' } },
    { type: 'send_message', channel: 'whatsapp', template: 'referral_invite', to: 'customer' },
    { type: 'wait', days: 30 },
    { type: 'send_message', channel: 'email', template: 're_engagement_30', to: 'customer' },
    { type: 'wait', days: 60 },
    { type: 'send_message', channel: 'email', template: 're_engagement_90', to: 'customer' },
  ],
};

// --- W5 — Referral Reward (optional add-on, §7A.7) --------------------------

const w5ReferralReward: WorkflowDefinition = {
  key: 'w5_referral_reward',
  name: 'W5 · Referral Reward',
  description:
    'Fires when a referred friend’s opportunity reaches Booked. Runs the anti-abuse guardrails (no self-referral, monthly cap), issues both rewards pending admin approval, and notifies both parties.',
  trigger: 'referral.converted',
  exitWhen: [],
  steps: [
    { type: 'issue_referral_rewards' },
    { type: 'notify_admin', template: 'referral_payout_pending' },
    { type: 'update_lifetime_value' },
  ],
};

export const WORKFLOW_DEFINITIONS: WorkflowDefinition[] = [
  w1Intake,
  w2Followup,
  w3Quote,
  w4Fulfillment,
  w5ReferralReward,
];

const DEFINITION_BY_KEY = new Map(WORKFLOW_DEFINITIONS.map((wf) => [wf.key, wf]));

export function getWorkflowDefinition(key: string): WorkflowDefinition | undefined {
  return DEFINITION_BY_KEY.get(key as WorkflowKey);
}

/** One-line summary of a step, for the "Active Automations" panel (§10.3). */
export function describeStep(step: WorkflowStep | undefined): string | null {
  if (!step) return null;

  switch (step.type) {
    case 'send_message':
      return `Send ${step.channel} · ${step.template.replace(/_/g, ' ')}`;
    case 'notify_admin':
      return 'Notify the team';
    case 'create_task':
      return `Create task · ${step.title}`;
    case 'add_tags':
      return 'Tag the contact';
    case 'wait': {
      if (step.days) return `Wait ${step.days} day${step.days === 1 ? '' : 's'}`;
      if (step.hours) return `Wait ${step.hours} hour${step.hours === 1 ? '' : 's'}`;
      return `Wait ${step.minutes ?? 0} minutes`;
    }
    case 'wait_until_trip_date':
      return (step.offsetHours ?? 0) < 0 ? 'Wait until the day before the trip' : 'Wait until after the trip';
    case 'exit_if':
      return `Check: ${step.condition.kind.replace(/_/g, ' ')}`;
    case 'move_stage':
      return `Move to ${step.stage.replace(/_/g, ' ')}`;
    case 'enroll':
      return `Start ${step.workflow}`;
    case 'update_lifetime_value':
      return 'Update lifetime value';
    case 'issue_referral_rewards':
      return 'Issue referral rewards';
    case 'upsert_contact':
    case 'create_opportunity':
      return 'Capture the lead';
    case 'exit':
      return 'Finish';
    default:
      return null;
  }
}

/** Workflows enrolled by an agent moving an opportunity into a given stage. */
export function workflowsForStage(stage: StageKey): WorkflowDefinition[] {
  return WORKFLOW_DEFINITIONS.filter(
    (wf) => wf.trigger === 'stage.changed' && wf.triggerStage === stage
  );
}
