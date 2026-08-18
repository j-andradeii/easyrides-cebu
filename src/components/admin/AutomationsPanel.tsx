/**
 * The "Active Automations" panel (plan §10.3, meaning #2 of "workflow").
 *
 * Shows which GHL-style workflows this lead is enrolled in, what fires next and
 * when — plus the pause / resume / stop controls.
 */

'use client';

import { useState } from 'react';

import { formatRelative } from '@/lib/format';
import { WORKFLOW_DEFINITIONS } from '@/lib/workflows/definitions';
import type { EnrollmentRecord } from '@/models/crm.types';

const STATUS_STYLES: Record<string, { tone: string; icon: string; label: string }> = {
  active: { tone: 'text-emerald-700 bg-emerald-50', icon: 'pi-play-circle', label: 'Running' },
  paused: { tone: 'text-amber-700 bg-amber-50', icon: 'pi-pause-circle', label: 'Paused' },
  completed: { tone: 'text-slate-700 bg-slate-100', icon: 'pi-check-circle', label: 'Completed' },
  exited: { tone: 'text-slate-700 bg-slate-100', icon: 'pi-sign-out', label: 'Exited' },
  failed: { tone: 'text-red-700 bg-red-50', icon: 'pi-exclamation-circle', label: 'Failed' },
};

interface AutomationsPanelProps {
  enrollments: EnrollmentRecord[];
  onAction: (enrollmentId: string, action: 'pause' | 'resume' | 'exit') => Promise<void>;
  onEnroll: (workflowKey: string) => Promise<void>;
  busy?: boolean;
}

export function AutomationsPanel({ enrollments, onAction, onEnroll, busy }: AutomationsPanelProps) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);

  const enrolledKeys = new Set(
    enrollments
      .filter((item) => item.status === 'active' || item.status === 'paused')
      .map((item) => item.workflowKey)
  );

  const available = WORKFLOW_DEFINITIONS.filter((definition) => !enrolledKeys.has(definition.key));

  const run = async (id: string, action: 'pause' | 'resume' | 'exit') => {
    setPendingId(id);
    try {
      await onAction(id, action);
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-3">
      {enrollments.length === 0 && (
        <p className="text-sm text-slate-600">
          No automations have run on this lead yet.
        </p>
      )}

      {enrollments.map((enrollment) => {
        const style = STATUS_STYLES[enrollment.status] ?? STATUS_STYLES.completed;
        const isLive = enrollment.status === 'active' || enrollment.status === 'paused';
        const progress =
          enrollment.totalSteps > 0
            ? Math.min(100, Math.round((enrollment.currentStep / enrollment.totalSteps) * 100))
            : 0;

        return (
          <div key={enrollment.id} className="rounded-lg border border-slate-200 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">{enrollment.workflowName}</p>
                <span
                  className={`mt-1 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium ${style.tone}`}
                >
                  <i className={`pi ${style.icon} text-[11px]`} />
                  {style.label}
                </span>
              </div>

              {isLive && (
                <div className="flex shrink-0 gap-1">
                  {enrollment.status === 'active' ? (
                    <IconButton
                      icon="pi-pause"
                      title="Pause this automation"
                      disabled={busy || pendingId === enrollment.id}
                      onClick={() => run(enrollment.id, 'pause')}
                    />
                  ) : (
                    <IconButton
                      icon="pi-play"
                      title="Resume this automation"
                      disabled={busy || pendingId === enrollment.id}
                      onClick={() => run(enrollment.id, 'resume')}
                    />
                  )}
                  <IconButton
                    icon="pi-times"
                    title="Stop this automation for good"
                    disabled={busy || pendingId === enrollment.id}
                    onClick={() => run(enrollment.id, 'exit')}
                  />
                </div>
              )}
            </div>

            <div className="mt-2.5">
              <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${
                    enrollment.status === 'active' ? 'bg-coral' : 'bg-slate-300'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-600">
                Step {Math.min(enrollment.currentStep + 1, enrollment.totalSteps)} of{' '}
                {enrollment.totalSteps}
                {enrollment.nextStepLabel && ` · next: ${enrollment.nextStepLabel}`}
                {enrollment.status === 'active' && enrollment.nextRunAt && (
                  <> · {formatRelative(enrollment.nextRunAt)}</>
                )}
              </p>
            </div>
          </div>
        );
      })}

      {available.length > 0 && (
        <div className="pt-1">
          <label
            htmlFor="enroll-workflow"
            className="mb-1.5 block text-xs font-medium text-slate-600"
          >
            Start an automation manually
          </label>
          <select
            id="enroll-workflow"
            defaultValue=""
            disabled={busy || isEnrolling}
            onChange={async (event) => {
              const key = event.target.value;
              if (!key) return;
              event.target.value = '';
              setIsEnrolling(true);
              try {
                await onEnroll(key);
              } finally {
                setIsEnrolling(false);
              }
            }}
            className="w-full rounded-lg border border-slate-500 bg-white px-3 py-2 text-sm text-slate-800 disabled:bg-slate-50"
          >
            <option value="">Choose a workflow…</option>
            {available.map((definition) => (
              <option key={definition.key} value={definition.key}>
                {definition.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

function IconButton({
  icon,
  title,
  onClick,
  disabled,
}: {
  icon: string;
  title: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:opacity-40"
    >
      <i className={`pi ${icon} text-xs`} />
    </button>
  );
}

export default AutomationsPanel;
