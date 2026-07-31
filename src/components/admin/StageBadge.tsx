'use client';

import { getStageDefinition } from '@/lib/funnel/stages';

const FALLBACK_TONE = 'bg-slate-100 text-slate-800 border-slate-200';

export function StageBadge({
  stageKey,
  stageName,
  className = '',
}: {
  stageKey: string;
  stageName?: string;
  className?: string;
}) {
  const definition = getStageDefinition(stageKey);
  const tone = definition?.tone ?? FALLBACK_TONE;

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${tone} ${className}`}
    >
      {stageName ?? definition?.name ?? stageKey}
    </span>
  );
}

const STATUS_TONES: Record<string, string> = {
  open: 'bg-sky-100 text-sky-800 border-sky-200',
  won: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  lost: 'bg-slate-200 text-slate-800 border-slate-300',
  abandoned: 'bg-slate-200 text-slate-800 border-slate-300',
};

export function StatusBadge({ status, className = '' }: { status: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${
        STATUS_TONES[status] ?? FALLBACK_TONE
      } ${className}`}
    >
      {status}
    </span>
  );
}

export default StageBadge;
