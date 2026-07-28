/**
 * /admin/inquiries/[id] — the per-inquiry workflow screen (plan §10.3).
 *
 * Composes the three things an agent means by "workflow":
 *   1. the funnel stage stepper (where this lead is),
 *   2. the active automations panel (what the robots are doing),
 *   3. the activity timeline (everything that has happened).
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { ActivityTimeline } from '@/components/admin/ActivityTimeline';
import { AutomationsPanel } from '@/components/admin/AutomationsPanel';
import { StageStepper } from '@/components/admin/StageStepper';
import { StatusBadge } from '@/components/admin/StageBadge';
import { serviceLabel, sourceLabel, vehicleLabel } from '@/lib/crm/normalize';
import { formatDate, formatDateTime, formatPeso, formatRelative } from '@/lib/format';
import * as inquiryService from '@/services/inquiry.service';
import type { InquiryDetailResponse } from '@/models/crm.types';

export default function InquiryDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [detail, setDetail] = useState<InquiryDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [note, setNote] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDue, setTaskDue] = useState('');
  const [dealValue, setDealValue] = useState('');
  const [showRawPayload, setShowRawPayload] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const response = await inquiryService.getInquiryDetail(id);
      setDetail(response);
      setDealValue(response.opportunity.monetaryValue);
      setError(null);
    } catch {
      setError('Could not load this lead.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  /** Runs a mutation, then refreshes so automations fired server-side show up. */
  const mutate = useCallback(
    async (action: () => Promise<unknown>, successMessage: string) => {
      setIsBusy(true);
      setError(null);
      try {
        await action();
        await load();
        setNotice(successMessage);
      } catch (caught) {
        const message = (caught as { message?: string })?.message;
        setError(message ?? 'That action failed. Please try again.');
      } finally {
        setIsBusy(false);
      }
    },
    [load]
  );

  const openTasks = useMemo(
    () => detail?.tasks.filter((task) => task.status === 'open') ?? [],
    [detail?.tasks]
  );
  const doneTasks = useMemo(
    () => detail?.tasks.filter((task) => task.status !== 'open') ?? [],
    [detail?.tasks]
  );

  const latestInquiry = detail?.inquiries[0];

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
        <i className="pi pi-spin pi-spinner mr-2 text-xl" /> Loading lead…
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="space-y-4">
        <Link href="/admin/inquiries" className="text-sm text-coral hover:text-coral-dark">
          ← Back to inquiries
        </Link>
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error ?? 'This lead could not be found.'}
        </p>
      </div>
    );
  }

  const { opportunity, contact } = detail;
  const whatsAppNumber = contact.phone?.replace(/\D/g, '');

  const handleStageChange = (stageKey: string) => {
    let lostReason: string | undefined;

    if (stageKey === 'lost') {
      const reason = window.prompt(
        'Why was this lead lost? (price, dates, went elsewhere…)\nRecording it keeps the funnel report honest.'
      );
      if (reason === null) return;
      lostReason = reason.trim() || 'No reason given';
    }

    void mutate(
      () => inquiryService.patchOpportunity(opportunity.id, { stageKey, lostReason }),
      `Moved to ${detail.stages.find((stage) => stage.key === stageKey)?.name ?? stageKey}`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="space-y-3">
        <Link
          href="/admin/inquiries"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-coral"
        >
          <i className="pi pi-arrow-left text-xs" /> Back to inquiries
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{opportunity.title}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <StatusBadge status={opportunity.status} />
              <span>Captured {formatDateTime(opportunity.createdAt)}</span>
              <span>· via {sourceLabel(opportunity.source)}</span>
              {contact.referredByName && (
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-800">
                  <i className="pi pi-share-alt text-[10px]" />
                  Referred by {contact.referredByName}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <ActionButton
              label="Mark Won"
              icon="pi-check"
              tone="success"
              disabled={isBusy || opportunity.stageKey === 'booked'}
              onClick={() => handleStageChange('booked')}
            />
            <ActionButton
              label="Mark Lost"
              icon="pi-times"
              tone="danger"
              disabled={isBusy || opportunity.stageKey === 'lost'}
              onClick={() => handleStageChange('lost')}
            />
          </div>
        </div>
      </header>

      {notice && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
          {notice}
        </div>
      )}
      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Stage stepper */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Funnel stage
          </h2>
          <span className="text-xs text-slate-400">Click a stage to move this lead</span>
        </div>
        <StageStepper
          stages={detail.stages}
          currentStageKey={opportunity.stageKey}
          onSelect={handleStageChange}
          disabled={isBusy}
        />
        {opportunity.lostReason && (
          <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <span className="font-medium">Lost reason:</span> {opportunity.lostReason}
          </p>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left column — contact and inquiry */}
        <div className="space-y-6 lg:col-span-2">
          <Panel title="Contact">
            <dl className="space-y-3 text-sm">
              <Field label="Name" value={contact.fullName ?? '—'} />

              <div>
                <dt className="text-xs text-slate-500">Phone / WhatsApp</dt>
                <dd className="mt-0.5 flex flex-wrap items-center gap-2">
                  <span className="text-slate-900">{contact.phone ?? '—'}</span>
                  {whatsAppNumber && (
                    <>
                      <a
                        href={`https://wa.me/${whatsAppNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 hover:bg-green-100"
                      >
                        <i className="pi pi-whatsapp text-[11px]" /> WhatsApp
                      </a>
                      <a
                        href={`tel:${contact.phone}`}
                        className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                      >
                        <i className="pi pi-phone text-[11px]" /> Call
                      </a>
                    </>
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-slate-500">Email</dt>
                <dd className="mt-0.5 flex flex-wrap items-center gap-2">
                  <span className="break-all text-slate-900">{contact.email ?? '—'}</span>
                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                    >
                      <i className="pi pi-envelope text-[11px]" /> Email
                    </a>
                  )}
                </dd>
              </div>

              <Field label="Lifetime value" value={formatPeso(contact.lifetimeValue)} />
              <Field label="First seen via" value={sourceLabel(contact.firstSource)} />
              {contact.referralCode && (
                <Field label="Their referral code" value={contact.referralCode} mono />
              )}

              {contact.tags.length > 0 && (
                <div>
                  <dt className="text-xs text-slate-500">Tags</dt>
                  <dd className="mt-1 flex flex-wrap gap-1.5">
                    {contact.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </Panel>

          <Panel title="Inquiry details">
            <dl className="space-y-3 text-sm">
              <Field label="Service" value={serviceLabel(opportunity.serviceType)} />
              <Field label="Vehicle" value={vehicleLabel(opportunity.vehicleType) ?? '—'} />
              <Field label="Preferred date" value={formatDate(opportunity.preferredDate)} />
              {latestInquiry?.tourTitle && <Field label="Tour" value={latestInquiry.tourTitle} />}
              <Field label="Add driver" value={latestInquiry?.addDriver ? 'Yes' : 'No'} />

              {latestInquiry?.message && (
                <div>
                  <dt className="text-xs text-slate-500">Message</dt>
                  <dd className="mt-0.5 whitespace-pre-wrap text-slate-700">
                    {latestInquiry.message}
                  </dd>
                </div>
              )}

              <div>
                <dt className="text-xs text-slate-500">Deal value</dt>
                <dd className="mt-1 flex gap-2">
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={dealValue}
                    onChange={(event) => setDealValue(event.target.value)}
                    className="w-32 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm"
                  />
                  <button
                    type="button"
                    disabled={isBusy || dealValue === opportunity.monetaryValue}
                    onClick={() =>
                      mutate(
                        () =>
                          inquiryService.patchOpportunity(opportunity.id, {
                            monetaryValue: dealValue,
                          }),
                        'Deal value updated'
                      )
                    }
                    className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-700 disabled:opacity-40"
                  >
                    Save
                  </button>
                </dd>
              </div>

              <div>
                <dt className="text-xs text-slate-500">Owner</dt>
                <dd className="mt-1">
                  <select
                    value={opportunity.ownerId ?? ''}
                    disabled={isBusy}
                    onChange={(event) =>
                      mutate(
                        () =>
                          inquiryService.patchOpportunity(opportunity.id, {
                            ownerId: event.target.value || null,
                          }),
                        'Owner updated'
                      )
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm"
                  >
                    <option value="">Unassigned</option>
                    {detail.owners.map((owner) => (
                      <option key={owner.id} value={owner.id}>
                        {owner.name}
                      </option>
                    ))}
                  </select>
                </dd>
              </div>

              {latestInquiry && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowRawPayload((open) => !open)}
                    className="text-xs font-medium text-coral hover:text-coral-dark"
                  >
                    {showRawPayload ? 'Hide raw payload' : 'View raw payload'}
                  </button>
                  {showRawPayload && (
                    <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-slate-900 p-3 text-[11px] leading-relaxed text-slate-100">
                      {JSON.stringify(latestInquiry.rawPayload, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </dl>
          </Panel>

          {detail.reviews.length > 0 && (
            <Panel title="Feedback">
              <ul className="space-y-3">
                {detail.reviews.map((review) => (
                  <li key={review.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">
                        {review.rating ? `${review.rating}★` : `NPS ${review.nps ?? '—'}`}
                      </span>
                      {review.isPromoter === true && (
                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[11px] text-emerald-700">
                          promoter
                        </span>
                      )}
                      {review.isPromoter === false && (
                        <span className="rounded bg-red-100 px-1.5 py-0.5 text-[11px] text-red-700">
                          detractor
                        </span>
                      )}
                      {review.isPublished && (
                        <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[11px] text-sky-700">
                          published
                        </span>
                      )}
                    </div>
                    {review.comment && <p className="mt-1 text-slate-600">{review.comment}</p>}
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>

        {/* Right column — automations, tasks, timeline */}
        <div className="space-y-6 lg:col-span-3">
          <Panel title="Active automations">
            <AutomationsPanel
              enrollments={detail.enrollments}
              busy={isBusy}
              onAction={(enrollmentId, action) =>
                mutate(
                  () => inquiryService.updateEnrollment(enrollmentId, action),
                  `Automation ${action === 'exit' ? 'stopped' : `${action}d`}`
                )
              }
              onEnroll={(workflowKey) =>
                mutate(
                  () => inquiryService.enrollInWorkflow(opportunity.id, workflowKey),
                  'Automation started'
                )
              }
            />
          </Panel>

          <Panel title="Tasks">
            <form
              className="mb-4 flex flex-wrap gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (!taskTitle.trim()) return;
                void mutate(
                  () =>
                    inquiryService.createTask(opportunity.id, {
                      title: taskTitle.trim(),
                      dueAt: taskDue ? new Date(taskDue).toISOString() : null,
                    }),
                  'Task created'
                ).then(() => {
                  setTaskTitle('');
                  setTaskDue('');
                });
              }}
            >
              <input
                value={taskTitle}
                onChange={(event) => setTaskTitle(event.target.value)}
                placeholder="Follow up with a quote…"
                className="min-w-[12rem] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                type="datetime-local"
                value={taskDue}
                onChange={(event) => setTaskDue(event.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600"
              />
              <button
                type="submit"
                disabled={isBusy || !taskTitle.trim()}
                className="rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-coral-dark disabled:opacity-40"
              >
                Add task
              </button>
            </form>

            {openTasks.length === 0 && doneTasks.length === 0 && (
              <p className="text-sm text-slate-500">No tasks on this lead.</p>
            )}

            <ul className="space-y-2">
              {[...openTasks, ...doneTasks].map((task) => {
                const isOverdue =
                  task.status === 'open' && task.dueAt !== null && new Date(task.dueAt) < new Date();

                return (
                  <li
                    key={task.id}
                    className="flex items-start gap-3 rounded-lg border border-slate-100 p-2.5"
                  >
                    <input
                      type="checkbox"
                      checked={task.status === 'done'}
                      disabled={isBusy || task.status === 'cancelled'}
                      onChange={(event) =>
                        mutate(
                          () =>
                            inquiryService.updateTask(task.id, {
                              status: event.target.checked ? 'done' : 'open',
                            }),
                          event.target.checked ? 'Task completed' : 'Task reopened'
                        )
                      }
                      className="mt-0.5 h-4 w-4 accent-coral"
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm ${
                          task.status === 'open' ? 'text-slate-900' : 'text-slate-400 line-through'
                        }`}
                      >
                        {task.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {task.assigneeName ?? 'Unassigned'}
                        {task.dueAt && (
                          <span className={isOverdue ? 'font-medium text-red-600' : ''}>
                            {' '}
                            · due {formatRelative(task.dueAt)}
                          </span>
                        )}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel title="Activity timeline">
            <form
              className="mb-5 space-y-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (!note.trim()) return;
                void mutate(
                  () =>
                    inquiryService.addActivity(opportunity.id, {
                      type: 'note',
                      body: note.trim(),
                    }),
                  'Note added'
                ).then(() => setNote(''));
              }}
            >
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={2}
                placeholder="Add a note — what did you discuss?"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={isBusy || !note.trim()}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:opacity-40"
                >
                  Save note
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() =>
                    mutate(
                      () =>
                        inquiryService.addActivity(opportunity.id, {
                          type: 'call',
                          subject: 'Called the customer',
                          body: note.trim() || undefined,
                          channel: 'phone',
                        }),
                      'Call logged'
                    ).then(() => setNote(''))
                  }
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40"
                >
                  Log a call
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  title="Logging a reply is what tells the follow-up drip to stop chasing"
                  onClick={() =>
                    mutate(
                      () =>
                        inquiryService.addActivity(opportunity.id, {
                          type: 'message_in',
                          subject: 'Customer replied',
                          body: note.trim() || undefined,
                          channel: 'whatsapp',
                        }),
                      'Reply logged — follow-up drip will stand down'
                    ).then(() => setNote(''))
                  }
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40"
                >
                  Log a reply
                </button>
              </div>
            </form>

            <ActivityTimeline activities={detail.activities} />
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className={`mt-0.5 text-slate-900 ${mono ? 'font-mono text-sm' : ''}`}>{value}</dd>
    </div>
  );
}

function ActionButton({
  label,
  icon,
  tone,
  onClick,
  disabled,
}: {
  label: string;
  icon: string;
  tone: 'success' | 'danger';
  onClick: () => void;
  disabled?: boolean;
}) {
  const tones = {
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    danger: 'border border-slate-200 text-slate-700 hover:bg-slate-50',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40 ${tones[tone]}`}
    >
      <i className={`pi ${icon} text-xs`} />
      {label}
    </button>
  );
}
