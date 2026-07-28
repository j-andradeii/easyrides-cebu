/**
 * The activity timeline (plan §10.3, meaning #3 of "workflow").
 *
 * Every note, message, task and automation step in one chronological log.
 */

'use client';

import { formatDateTime } from '@/lib/format';
import type { ActivityRecord } from '@/models/crm.types';

const TYPE_STYLES: Record<string, { icon: string; tone: string; label: string }> = {
  note: { icon: 'pi-pencil', tone: 'bg-slate-100 text-slate-600', label: 'Note' },
  stage_change: { icon: 'pi-flag', tone: 'bg-coral/10 text-coral', label: 'Stage' },
  message_out: { icon: 'pi-send', tone: 'bg-sky-100 text-sky-700', label: 'Sent' },
  message_in: { icon: 'pi-comment', tone: 'bg-emerald-100 text-emerald-700', label: 'Received' },
  call: { icon: 'pi-phone', tone: 'bg-violet-100 text-violet-700', label: 'Call' },
  email: { icon: 'pi-envelope', tone: 'bg-sky-100 text-sky-700', label: 'Email' },
  task_created: { icon: 'pi-check-square', tone: 'bg-amber-100 text-amber-700', label: 'Task' },
  task_completed: { icon: 'pi-check', tone: 'bg-emerald-100 text-emerald-700', label: 'Done' },
  workflow: { icon: 'pi-cog', tone: 'bg-indigo-100 text-indigo-700', label: 'Automation' },
  system: { icon: 'pi-info-circle', tone: 'bg-slate-100 text-slate-600', label: 'System' },
};

const FALLBACK = { icon: 'pi-circle', tone: 'bg-slate-100 text-slate-600', label: 'Event' };

export function ActivityTimeline({ activities }: { activities: ActivityRecord[] }) {
  if (activities.length === 0) {
    return (
      <p className="text-sm text-slate-500 py-6 text-center">
        Nothing has happened on this lead yet.
      </p>
    );
  }

  return (
    <ol className="space-y-4">
      {activities.map((activity) => {
        const style = TYPE_STYLES[activity.type] ?? FALLBACK;
        const link = typeof activity.metadata?.link === 'string' ? activity.metadata.link : null;
        const delivered = activity.metadata?.delivered;
        const error = typeof activity.metadata?.error === 'string' ? activity.metadata.error : null;

        return (
          <li key={activity.id} className="flex gap-3">
            <span
              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${style.tone}`}
            >
              <i className={`pi ${style.icon} text-xs`} />
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-sm font-medium text-slate-900">
                  {activity.subject ?? style.label}
                </span>
                <span className="text-xs text-slate-400">
                  {activity.adminName ?? 'Automation'} · {formatDateTime(activity.createdAt)}
                </span>
              </div>

              {activity.body && (
                <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-600">
                  {activity.body}
                </p>
              )}

              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                {activity.channel && (
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500">
                    {activity.channel}
                  </span>
                )}

                {delivered === false && !link && (
                  <span
                    className="rounded bg-amber-50 px-1.5 py-0.5 text-[11px] text-amber-700"
                    title={error ?? 'No provider configured — logged only'}
                  >
                    not sent
                  </span>
                )}

                {link && (
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700 hover:bg-green-100"
                  >
                    <i className="pi pi-whatsapp text-[11px]" />
                    Send on WhatsApp
                  </a>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default ActivityTimeline;
