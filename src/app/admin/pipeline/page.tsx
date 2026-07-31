/**
 * /admin/pipeline — the kanban board (plan §10.1, Phase 3 optional).
 *
 * Same data as the list, laid out by stage. Cards are draggable between
 * columns; dropping one calls the same PATCH the stage stepper uses, so the
 * automations fire identically however you move a lead.
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { LeadReference } from '@/components/admin/LeadReference';
import { serviceLabel } from '@/lib/crm/normalize';
import { formatDate, formatPeso } from '@/lib/format';
import * as inquiryService from '@/services/inquiry.service';
import type { InquiryListItem, InquiryListResponse } from '@/models/crm.types';

/** Enough to keep the board useful without turning it into an infinite scroll. */
const BOARD_PAGE_SIZE = 100;

export default function AdminPipelinePage() {
  const [data, setData] = useState<InquiryListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await inquiryService.listInquiries({ pageSize: BOARD_PAGE_SIZE });
      setData(response);
      setError(null);
    } catch {
      setError('Could not load the pipeline.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const byStage = useMemo(() => {
    const map = new Map<string, InquiryListItem[]>();
    for (const item of data?.items ?? []) {
      const bucket = map.get(item.stageKey) ?? [];
      bucket.push(item);
      map.set(item.stageKey, bucket);
    }
    return map;
  }, [data?.items]);

  const handleDrop = async (stageKey: string) => {
    setDropTarget(null);
    const opportunityId = draggingId;
    setDraggingId(null);
    if (!opportunityId) return;

    const item = data?.items.find((row) => row.opportunityId === opportunityId);
    if (!item || item.stageKey === stageKey) return;

    let lostReason: string | undefined;
    if (stageKey === 'lost') {
      const reason = window.prompt('Why was this lead lost?');
      if (reason === null) return;
      lostReason = reason.trim() || 'No reason given';
    }

    try {
      await inquiryService.patchOpportunity(opportunityId, { stageKey, lostReason });
      await load();
    } catch {
      setError('Could not move that lead.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-600">
        <i className="pi pi-spin pi-spinner mr-2 text-xl" /> Loading pipeline…
      </div>
    );
  }

  const stages = [...(data?.stages ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pipeline</h1>
          <p className="mt-1 text-sm text-slate-600">
            Drag a lead to a new stage — the same automations fire as on the detail screen.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          <i className="pi pi-refresh mr-1.5 text-xs" /> Refresh
        </button>
      </header>

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="overflow-x-auto pb-4">
        <div className="flex min-w-max gap-4">
          {stages.map((stage) => {
            const items = byStage.get(stage.key) ?? [];
            const total = items.reduce(
              (sum, item) => sum + (Number.parseFloat(item.monetaryValue) || 0),
              0
            );

            return (
              <div
                key={stage.id}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDropTarget(stage.key);
                }}
                onDragLeave={() => setDropTarget((current) => (current === stage.key ? null : current))}
                onDrop={() => handleDrop(stage.key)}
                className={`w-72 shrink-0 rounded-xl border p-3 transition-colors ${
                  dropTarget === stage.key
                    ? 'border-coral bg-coral/5'
                    : 'border-slate-200 bg-slate-100/60'
                }`}
              >
                <div className="mb-3 flex items-baseline justify-between px-1">
                  <h2 className="text-sm font-semibold text-slate-800">{stage.name}</h2>
                  <span className="text-xs text-slate-600">{items.length}</span>
                </div>
                {total > 0 && (
                  <p className="mb-3 px-1 text-xs text-slate-600">{formatPeso(total)} in play</p>
                )}

                <div className="space-y-2">
                  {items.length === 0 && (
                    <p className="px-1 py-6 text-center text-xs text-slate-500">No leads here</p>
                  )}

                  {items.map((item) => (
                    <Link
                      key={item.opportunityId}
                      href={`/admin/inquiries/${item.opportunityId}`}
                      draggable
                      onDragStart={() => setDraggingId(item.opportunityId)}
                      onDragEnd={() => setDraggingId(null)}
                      className={`block cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing ${
                        draggingId === item.opportunityId ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {item.contactName ?? 'Unnamed lead'}
                        </p>
                        <LeadReference reference={item.reference} className="shrink-0" />
                      </div>
                      <p className="mt-0.5 truncate text-xs text-slate-600">
                        {serviceLabel(item.serviceType)}
                        {item.tourTitle ? ` · ${item.tourTitle}` : ''}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="text-slate-600">{formatDate(item.preferredDate)}</span>
                        <span className="font-medium text-slate-800">
                          {formatPeso(item.monetaryValue)}
                        </span>
                      </div>
                      {item.openTaskCount > 0 && (
                        <span className="mt-2 inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-800">
                          <i className="pi pi-clock text-[10px]" />
                          {item.openTaskCount} task{item.openTaskCount === 1 ? '' : 's'}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
