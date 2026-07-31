/**
 * /admin/inquiries — every inquiry, searchable and filterable (plan §10.2).
 *
 * Server-side pagination and filtering: the table asks the API for one page at
 * a time, so this stays fast once you have thousands of leads.
 */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, type DataTablePageEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';

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

export default function AdminInquiriesPage() {
  const router = useRouter();

  const [data, setData] = useState<InquiryListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [stage, setStage] = useState('');
  const [source, setSource] = useState('');
  const [owner, setOwner] = useState('');
  const [status, setStatus] = useState('');
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
  }, [query, stage, source, owner, status, page, pageSize]);

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

  const statusOptions = [
    ANY_OPTION,
    { label: 'Open', value: 'open' },
    { label: 'Won', value: 'won' },
    { label: 'Lost', value: 'lost' },
  ];

  const hasFilters = Boolean(query || stage || source || owner || status);

  const clearFilters = () => {
    setSearchInput('');
    setQuery('');
    setStage('');
    setSource('');
    setOwner('');
    setStatus('');
    setPage(1);
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
          <p className="text-slate-500 mt-1 text-sm">
            {data ? `${data.total} lead${data.total === 1 ? '' : 's'} captured` : 'Loading…'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={load}
            className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-medium"
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
            <label className="block text-xs font-medium text-slate-500 mb-1.5" htmlFor="lead-search">
              Search
            </label>
            <span className="p-input-icon-left w-full block">
              <InputText
                id="lead-search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Name, phone or email"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </span>
          </div>

          <FilterSelect label="Stage" value={stage} options={stageOptions} onChange={(value) => { setStage(value); setPage(1); }} />
          <FilterSelect label="Source" value={source} options={sourceOptions} onChange={(value) => { setSource(value); setPage(1); }} />
          <FilterSelect label="Owner" value={owner} options={ownerOptions} onChange={(value) => { setOwner(value); setPage(1); }} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 mt-3">
          <FilterSelect label="Status" value={status} options={statusOptions} onChange={(value) => { setStatus(value); setPage(1); }} />
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
            className="text-sm"
            stripedRows
          >
            <Column
              header="Date"
              body={(row: InquiryListItem) => (
                <span className="whitespace-nowrap text-slate-600">
                  {formatDateTime(row.createdAt)}
                </span>
              )}
            />
            <Column
              header="Name"
              body={(row: InquiryListItem) => (
                <div className="min-w-[10rem]">
                  <div className="font-medium text-slate-900">
                    {row.contactName ?? 'Unnamed lead'}
                  </div>
                  <div className="text-xs text-slate-500">{row.phone ?? row.email ?? '—'}</div>
                </div>
              )}
            />
            <Column
              header="Service"
              body={(row: InquiryListItem) => (
                <div className="min-w-[9rem]">
                  <div className="text-slate-800">{serviceLabel(row.serviceType)}</div>
                  <div className="text-xs text-slate-500">
                    {row.tourTitle ?? vehicleLabel(row.vehicleType) ?? '—'}
                  </div>
                </div>
              )}
            />
            <Column
              header="Trip date"
              body={(row: InquiryListItem) => (
                <span className="whitespace-nowrap text-slate-600">
                  {formatDate(row.preferredDate)}
                </span>
              )}
            />
            <Column
              header="Stage"
              body={(row: InquiryListItem) => (
                <StageBadge stageKey={row.stageKey} stageName={row.stageName} />
              )}
            />
            <Column
              header="Status"
              body={(row: InquiryListItem) => <StatusBadge status={row.status} />}
            />
            <Column
              header="Source"
              body={(row: InquiryListItem) => (
                <span className="text-slate-600 whitespace-nowrap">{sourceLabel(row.source)}</span>
              )}
            />
            <Column
              header="Owner"
              body={(row: InquiryListItem) => (
                <span className={row.ownerName ? 'text-slate-700' : 'text-slate-400 italic'}>
                  {row.ownerName ?? 'Unassigned'}
                </span>
              )}
            />
            <Column
              header="Value"
              body={(row: InquiryListItem) => (
                <span className="whitespace-nowrap text-slate-700">
                  {formatPeso(row.monetaryValue)}
                </span>
              )}
            />
            <Column
              header="Tasks"
              body={(row: InquiryListItem) =>
                row.openTaskCount > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-xs font-medium">
                    <i className="pi pi-clock text-[10px]" />
                    {row.openTaskCount}
                  </span>
                ) : (
                  <span className="text-slate-300">—</span>
                )
              }
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
      <label className="block text-xs font-medium text-slate-500 mb-1.5">{label}</label>
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
