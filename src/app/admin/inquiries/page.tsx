/**
 * /admin/inquiries — every inquiry, searchable and filterable (plan §10.2).
 *
 * Server-side pagination and filtering: the table asks the API for one page at
 * a time, so this stays fast once you have thousands of leads.
 */

'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DataTable, type DataTablePageEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';

import { LeadReference } from '@/components/admin/LeadReference';
import { NewLeadDialog } from '@/components/admin/NewLeadDialog';
import { StageBadge, StatusBadge } from '@/components/admin/StageBadge';
import { formatDate, formatDateTime, formatPeso } from '@/lib/format';
import { serviceLabel, sourceLabel, vehicleLabel } from '@/lib/crm/normalize';
import * as inquiryService from '@/services/inquiry.service';
import type { InquiryListItem, InquiryListResponse } from '@/models/crm.types';
import type { AdminLeadData } from '@/models/inquiry.schema';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const SEARCH_DEBOUNCE_MS = 350;

const ANY_OPTION = { label: 'Any', value: '' };

/**
 * `useSearchParams` opts the tree into client-side rendering, which Next
 * requires a Suspense boundary for. The wrapper is the whole reason this file
 * has two components rather than one.
 */
export default function AdminInquiriesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center text-slate-600">
          <i className="pi pi-spin pi-spinner mr-2 text-xl" /> Loading inquiries…
        </div>
      }
    >
      <InquiriesTable />
    </Suspense>
  );
}

function InquiriesTable() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<InquiryListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [stage, setStage] = useState('');
  const [source, setSource] = useState('');
  const [owner, setOwner] = useState('');
  const [status, setStatus] = useState('');
  /**
   * Seeded from the URL so /admin/inquiries?campaign=… lands pre-filtered —
   * that link is how every campaign card on /admin/campaigns gets here, and a
   * filter the page ignored would show all leads and quietly claim they came
   * from that promo.
   */
  const [campaign, setCampaign] = useState(() => searchParams.get('campaign') ?? '');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);

  // Debounce the search box so typing doesn't hammer the API.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setQuery(searchInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await inquiryService.listInquiries({
        query: query || undefined,
        stage: stage || undefined,
        source: source || undefined,
        campaign: campaign || undefined,
        owner: owner || undefined,
        status: status || undefined,
        page,
        pageSize,
      });
      setData(response);
    } catch {
      setError('Could not load inquiries. Check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }, [query, stage, source, campaign, owner, status, page, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  const stageOptions = useMemo(
    () => [
      ANY_OPTION,
      ...(data?.stages ?? []).map((item) => ({ label: item.name, value: item.key })),
    ],
    [data?.stages]
  );

  const sourceOptions = useMemo(
    () => [
      ANY_OPTION,
      ...(data?.sources ?? []).map((item) => ({ label: sourceLabel(item), value: item })),
    ],
    [data?.sources]
  );

  const ownerOptions = useMemo(
    () => [
      ANY_OPTION,
      { label: 'Unassigned', value: 'unassigned' },
      ...(data?.owners ?? []).map((item) => ({ label: item.name, value: item.id })),
    ],
    [data?.owners]
  );

  /**
   * The campaign that was filtered by is kept in the list even when the API no
   * longer offers it (an unpublished promo whose only lead was deleted), so an
   * arriving ?campaign= link never shows a filter dropdown reading "Any" while
   * the table is filtered.
   */
  const campaignOptions = useMemo(() => {
    const known = data?.campaigns ?? [];
    const missing =
      campaign && !known.some((item) => item.id === campaign)
        ? [{ id: campaign, name: 'Selected campaign' }]
        : [];

    return [
      ANY_OPTION,
      ...[...known, ...missing].map((item) => ({ label: item.name, value: item.id })),
    ];
  }, [data?.campaigns, campaign]);

  const statusOptions = [
    ANY_OPTION,
    { label: 'Open', value: 'open' },
    { label: 'Won', value: 'won' },
    { label: 'Lost', value: 'lost' },
  ];

  const hasFilters = Boolean(query || stage || source || campaign || owner || status);

  const clearFilters = () => {
    setSearchInput('');
    setQuery('');
    setStage('');
    setSource('');
    setCampaign('');
    setOwner('');
    setStatus('');
    setPage(1);
    // Drop the ?campaign= too, or a refresh would bring the filter back.
    router.replace('/admin/inquiries');
  };

  const onPage = (event: DataTablePageEvent) => {
    setPage(Math.floor((event.first ?? 0) / (event.rows ?? pageSize)) + 1);
    setPageSize(event.rows ?? pageSize);
  };

  const openInquiry = (opportunityId: string) => {
    router.push(`/admin/inquiries/${opportunityId}`);
  };

  /**
   * Straight to the new lead's detail screen — the agent is almost always still
   * talking to the customer and needs somewhere to log the call or send a quote.
   */
  const createLead = async (input: AdminLeadData) => {
    const result = await inquiryService.createLead(input);
    setIsNewLeadOpen(false);
    router.push(`/admin/inquiries/${result.opportunityId}`);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inquiries</h1>
          <p className="text-slate-600 mt-1 text-sm">
            {data ? `${data.total} lead${data.total === 1 ? '' : 's'} captured` : 'Loading…'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={load}
            className="border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-medium"
            icon="pi pi-refresh"
            label="Refresh"
          />
          <Button
            type="button"
            onClick={() => setIsNewLeadOpen(true)}
            className="bg-coral hover:bg-coral-dark text-white px-4 py-2 rounded-lg text-sm font-medium"
            icon="pi pi-plus"
            label="Add lead"
          />
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1.5" htmlFor="lead-search">
              Search
            </label>
            <span className="p-input-icon-left w-full block">
              <InputText
                id="lead-search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Name, phone, email or L-000000"
                className="w-full px-3 py-2 border border-slate-500 rounded-lg text-sm"
              />
            </span>
          </div>

          <FilterSelect label="Stage" value={stage} options={stageOptions} onChange={(value) => { setStage(value); setPage(1); }} />
          <FilterSelect label="Source" value={source} options={sourceOptions} onChange={(value) => { setSource(value); setPage(1); }} />
          <FilterSelect label="Owner" value={owner} options={ownerOptions} onChange={(value) => { setOwner(value); setPage(1); }} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 mt-3">
          <FilterSelect label="Status" value={status} options={statusOptions} onChange={(value) => { setStatus(value); setPage(1); }} />
          {/* Only worth a slot once a promo has produced something — an empty
              dropdown next to four working ones is just noise. */}
          {campaignOptions.length > 1 && (
            <FilterSelect
              label="Campaign"
              value={campaign}
              options={campaignOptions}
              onChange={(value) => { setCampaign(value); setPage(1); }}
            />
          )}
          {hasFilters && (
            <div className="flex items-end">
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm text-coral hover:text-coral-dark font-medium py-2"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <DataTable
            value={data?.items ?? []}
            loading={isLoading}
            lazy
            paginator
            rows={pageSize}
            first={(page - 1) * pageSize}
            totalRecords={data?.total ?? 0}
            rowsPerPageOptions={PAGE_SIZE_OPTIONS}
            onPage={onPage}
            dataKey="opportunityId"
            selectionMode="single"
            onRowClick={(event) => openInquiry((event.data as InquiryListItem).opportunityId)}
            rowClassName={() => 'cursor-pointer'}
            emptyMessage={
              hasFilters
                ? 'No leads match these filters.'
                : 'No inquiries yet — website submissions land here, or use “Add lead”.'
            }
            className="admin-table text-sm"
          >
            <Column
              header="Lead"
              body={(row: InquiryListItem) => (
                <div className="flex min-w-[13rem] items-center gap-3">
                  <Monogram name={row.contactName} />
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-slate-900">
                      {row.contactName ?? 'Unnamed lead'}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <LeadReference reference={row.reference} />
                      <span className="truncate text-xs text-slate-600 tabular-nums">
                        {row.phone ?? row.email ?? ''}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            />
            <Column
              header="Service"
              body={(row: InquiryListItem) => {
                const detail = row.tourTitle ?? vehicleLabel(row.vehicleType);
                return (
                  <div className="min-w-[9rem]">
                    <div className="text-slate-800">{serviceLabel(row.serviceType)}</div>
                    {/* Only render a second line when there is one — an em dash
                        under every other row is just visual debris. */}
                    {detail && <div className="truncate text-xs text-slate-600">{detail}</div>}
                  </div>
                );
              }}
            />
            <Column
              header="Trip date"
              body={(row: InquiryListItem) =>
                row.preferredDate ? (
                  <span className="whitespace-nowrap text-slate-800">
                    {formatDate(row.preferredDate)}
                  </span>
                ) : (
                  <Empty />
                )
              }
            />
            <Column
              header="Stage"
              body={(row: InquiryListItem) => (
                <div className="flex flex-wrap items-center gap-1.5">
                  <StageBadge stageKey={row.stageKey} stageName={row.stageName} />
                  {redundantStatus(row) ? null : <StatusBadge status={row.status} />}
                </div>
              )}
            />
            <Column
              header="Source"
              body={(row: InquiryListItem) =>
                // The campaign's real name beats the slug `sourceLabel` would
                // title-case out of "campaign:summer-oslob-2026" — this is the
                // one place the row is loaded, so the name is there to use.
                row.campaignName ? (
                  <span
                    className="inline-flex max-w-[11rem] items-center gap-1.5 rounded-full bg-coral/10 px-2 py-0.5 text-xs font-medium text-coral-dark"
                    title={row.campaignName}
                  >
                    <i className="pi pi-megaphone text-[10px]" />
                    <span className="truncate">{row.campaignName}</span>
                  </span>
                ) : (
                  <span className="whitespace-nowrap text-slate-700">{sourceLabel(row.source)}</span>
                )
              }
            />
            <Column
              header="Owner"
              body={(row: InquiryListItem) =>
                row.ownerName ? (
                  <span className="whitespace-nowrap text-slate-800">{row.ownerName}</span>
                ) : (
                  <span className="whitespace-nowrap text-slate-500">Unassigned</span>
                )
              }
            />
            <Column
              header="Value"
              alignHeader="right"
              body={(row: InquiryListItem) => {
                const amount = Number(row.monetaryValue ?? 0);
                return (
                  <div
                    className={`whitespace-nowrap text-right tabular-nums ${
                      amount > 0 ? 'font-semibold text-slate-900' : 'text-slate-400'
                    }`}
                  >
                    {amount > 0 ? formatPeso(row.monetaryValue) : '—'}
                  </div>
                );
              }}
            />
            <Column
              header="Added"
              body={(row: InquiryListItem) => {
                const [date, time] = splitTimestamp(row.createdAt);
                return (
                  <div className="whitespace-nowrap text-right">
                    <div className="text-xs text-slate-700">{date}</div>
                    <div className="text-xs text-slate-500 tabular-nums">{time}</div>
                  </div>
                );
              }}
              alignHeader="right"
            />
            <Column
              header="Tasks"
              alignHeader="center"
              body={(row: InquiryListItem) => (
                <div className="text-center">
                  {row.openTaskCount > 0 ? (
                    <span
                      className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200"
                      title={`${row.openTaskCount} open task${row.openTaskCount === 1 ? '' : 's'}`}
                    >
                      <i className="pi pi-clock text-[10px]" />
                      {row.openTaskCount}
                    </span>
                  ) : (
                    <Empty />
                  )}
                </div>
              )}
            />
          </DataTable>
        </div>
      </div>

      <NewLeadDialog
        open={isNewLeadOpen}
        onClose={() => setIsNewLeadOpen(false)}
        onCreate={createLead}
      />
    </div>
  );
}

/**
 * Whether the status badge would just repeat the stage badge.
 *
 * The two are separate columns in the database and can legitimately disagree —
 * `PATCH /api/admin/opportunities/[id]` flips status without touching the stage
 * ("A manual status flip without a stage change"). So this cannot be a fixed
 * list of statuses: a deal marked lost while still sitting in Quote Sent has to
 * show the badge, or the row lies about where it stands.
 *
 * Rule: hide it only when the stage name already contains the word — "Booked
 * (Won)" covers won, "Lost" covers lost — and always hide plain "open", which
 * is the default every live deal is in and therefore carries no information.
 */
function redundantStatus(row: InquiryListItem): boolean {
  if (row.status === 'open') return true;
  return (row.stageName ?? '').toLowerCase().includes(row.status.toLowerCase());
}

/** A muted placeholder, so an empty cell reads as "nothing here" not "broken". */
function Empty() {
  return <span className="text-slate-400">—</span>;
}

/**
 * Initials in a tinted circle. Gives every row a fixed left anchor, which is
 * what stops a wide table from reading as an undifferentiated grid — the eye
 * gets something to scan down. The tint is derived from the name so the same
 * customer keeps the same colour between visits.
 */
const MONOGRAM_TONES = [
  'bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-700',
  'bg-emerald-100 text-emerald-700',
  'bg-sky-100 text-sky-700',
  'bg-violet-100 text-violet-700',
  'bg-teal-100 text-teal-700',
];

function Monogram({ name }: { name: string | null }) {
  const trimmed = name?.trim();

  if (!trimmed) {
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <i className="pi pi-user text-xs" />
      </span>
    );
  }

  const initials = trimmed
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  // Sum of char codes — stable for a given name, and cheap enough to run per row.
  const tone =
    MONOGRAM_TONES[
      [...trimmed].reduce((total, char) => total + char.charCodeAt(0), 0) % MONOGRAM_TONES.length
    ];

  return (
    <span
      aria-hidden="true"
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${tone}`}
    >
      {initials}
    </span>
  );
}

/**
 * "Aug 1, 5:43 AM" → ["Aug 1", "5:43 AM"] so the timestamp can stack instead of
 * forcing the column wide enough for one long line.
 */
function splitTimestamp(iso: string): [string, string] {
  const formatted = formatDateTime(iso);
  const separator = formatted.lastIndexOf(', ');
  if (separator === -1) return [formatted, ''];
  return [formatted.slice(0, separator), formatted.slice(separator + 2)];
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
      <Dropdown
        value={value}
        options={options}
        optionLabel="label"
        optionValue="value"
        onChange={(event) => onChange(event.value ?? '')}
        className="w-full form-dropdown text-sm"
        panelClassName="form-dropdown-panel"
      />
    </div>
  );
}
