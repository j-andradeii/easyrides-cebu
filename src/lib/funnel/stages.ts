/**
 * The funnel definition — plan §6.
 *
 * Stages live in the database as rows (so they can be renamed/reordered without
 * a migration), but their `key`s are a stable contract shared by the seed
 * script, the workflow engine and the admin UI.
 *
 * Deliberately kept to four: capture → price → paid → dead. Every stage has to
 * earn its place, because a stage nobody updates is worse than no stage at all —
 * it makes the funnel report lie. "Contacted" and "Negotiation" were dropped
 * because reaching out and haggling are *activities* on the timeline, not
 * positions in the funnel; "Completed" was dropped because a finished trip is a
 * won deal whose date has passed, which the trip date already tells you.
 */

export const STAGE_KEYS = ['new_lead', 'quote_sent', 'booked', 'lost'] as const;

export type StageKey = (typeof STAGE_KEYS)[number];

export interface StageDefinition {
  key: StageKey;
  name: string;
  sortOrder: number;
  probability: number;
  isWon: boolean;
  isLost: boolean;
  /** Tailwind classes for the stage chip in the admin portal. */
  tone: string;
}

export const DEFAULT_PIPELINE_ID = '00000000-0000-0000-0000-000000000001';
export const DEFAULT_PIPELINE_NAME = 'Sales Pipeline';

export const STAGE_DEFINITIONS: StageDefinition[] = [
  {
    key: 'new_lead',
    name: 'New Lead',
    sortOrder: 1,
    probability: 10,
    isWon: false,
    isLost: false,
    tone: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  {
    key: 'quote_sent',
    name: 'Quote Sent',
    sortOrder: 2,
    probability: 50,
    isWon: false,
    isLost: false,
    tone: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  {
    key: 'booked',
    name: 'Booked (Won)',
    sortOrder: 3,
    probability: 100,
    isWon: true,
    isLost: false,
    tone: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  {
    key: 'lost',
    name: 'Lost',
    sortOrder: 4,
    probability: 0,
    isWon: false,
    isLost: true,
    tone: 'bg-slate-200 text-slate-700 border-slate-300',
  },
];

const STAGE_BY_KEY = new Map(STAGE_DEFINITIONS.map((stage) => [stage.key, stage]));

export function getStageDefinition(key: string): StageDefinition | undefined {
  return STAGE_BY_KEY.get(key as StageKey);
}

/** Sort order of a stage key, or 0 when unknown. Used for "at or beyond" checks. */
export function stageRank(key: string): number {
  return STAGE_BY_KEY.get(key as StageKey)?.sortOrder ?? 0;
}

export function isStageKey(value: string): value is StageKey {
  return STAGE_BY_KEY.has(value as StageKey);
}
