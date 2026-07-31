/**
 * The funnel stage stepper (plan §10.3, meaning #1 of "workflow").
 *
 * Clicking a stage advances the lead — which is also what fires W3 and W4, so
 * this control is the main way a human drives the automations.
 */

'use client';

import type { StageSummary } from '@/models/crm.types';

interface StageStepperProps {
  stages: StageSummary[];
  currentStageKey: string;
  onSelect: (stageKey: string) => void;
  disabled?: boolean;
}

export function StageStepper({ stages, currentStageKey, onSelect, disabled }: StageStepperProps) {
  const ordered = [...stages].sort((a, b) => a.sortOrder - b.sortOrder);
  const currentIndex = ordered.findIndex((stage) => stage.key === currentStageKey);
  const isLost = currentStageKey === 'lost';

  return (
    <div className="overflow-x-auto">
      <ol className="flex min-w-max items-start gap-1 sm:gap-2">
        {ordered.map((stage, index) => {
          const isCurrent = stage.key === currentStageKey;
          // "Lost" is terminal, not a further step — don't paint the path to it.
          const isComplete = !isLost && currentIndex > index;
          const isFinal = index === ordered.length - 1;

          return (
            <li key={stage.id} className="flex items-start">
              <button
                type="button"
                disabled={disabled || isCurrent}
                onClick={() => onSelect(stage.key)}
                title={
                  isCurrent ? `Currently at ${stage.name}` : `Move this lead to ${stage.name}`
                }
                className="group flex w-24 flex-col items-center gap-2 text-center disabled:cursor-default sm:w-28"
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors ${
                    isCurrent
                      ? 'border-coral bg-coral text-white'
                      : isComplete
                        ? 'border-coral bg-coral/15 text-coral'
                        : 'border-slate-300 bg-white text-slate-500 group-hover:border-coral/60 group-hover:text-coral'
                  }`}
                >
                  {isComplete ? <i className="pi pi-check text-[10px]" /> : stage.sortOrder}
                </span>
                <span
                  className={`text-[11px] leading-tight sm:text-xs ${
                    isCurrent ? 'font-semibold text-slate-900' : 'text-slate-600 group-hover:text-slate-800'
                  }`}
                >
                  {stage.name}
                </span>
              </button>

              {!isFinal && (
                <span
                  aria-hidden
                  className={`mt-3.5 h-0.5 w-3 shrink-0 sm:w-5 ${
                    isComplete ? 'bg-coral' : 'bg-slate-200'
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default StageStepper;
