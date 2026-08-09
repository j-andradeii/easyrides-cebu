/**
 * /admin/campaigns/[id] — edit one promo page, and share it.
 *
 * The share bar sits above the form rather than inside it: it is what someone
 * arriving here after creating a campaign came to do, and it works on a saved
 * campaign regardless of whether the form below is mid-edit.
 *
 * The form is mounted only once the campaign is loaded, so its defaults are the
 * real values and no reset effect is needed. Saving re-reads the record and
 * remounts the form (`key`), which clears the dirty flag and shows what the
 * server actually stored — the same arrangement /admin/vehicles/[id] uses.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { CampaignForm } from '@/components/admin/CampaignForm';
import { ShareLinks } from '@/components/admin/ShareLinks';
import * as campaignService from '@/services/campaign.service';
import type { CampaignInput } from '@/models/campaign.schema';
import type { CampaignRecord } from '@/types/campaign';

export default function EditCampaignPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [campaign, setCampaign] = useState<CampaignRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!id) return;

    try {
      const response = await campaignService.getCampaign(id);
      setCampaign(response.campaign);
      setLoadError(null);
    } catch (caught) {
      setLoadError((caught as { message?: string })?.message ?? 'Could not load that campaign.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Clear the "saved" note on its own so it never lingers over a later edit.
  useEffect(() => {
    if (!savedAt) return;

    const timer = setTimeout(() => setSavedAt(null), 4000);
    return () => clearTimeout(timer);
  }, [savedAt]);

  const save = async (values: CampaignInput) => {
    if (!id) return;

    const { campaign: updated } = await campaignService.updateCampaign(id, values);
    setCampaign(updated);
    setSavedAt(Date.now());
  };

  const remove = async () => {
    if (!id) return;

    await campaignService.deleteCampaign(id);
    router.push('/admin/campaigns');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-600">
        <i className="pi pi-spin pi-spinner mr-2 text-xl" /> Loading campaign…
      </div>
    );
  }

  if (loadError || !campaign) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-14 text-center">
        <i className="pi pi-exclamation-circle text-2xl text-slate-300" />
        <p className="mt-3 text-sm font-medium text-slate-900">
          {loadError ?? 'That campaign no longer exists.'}
        </p>
        <Link
          href="/admin/campaigns"
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <i className="pi pi-arrow-left text-xs" />
          Back to campaigns
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {savedAt && (
        <div
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800"
        >
          <i className="pi pi-check-circle mr-2" />
          Saved — the live page has been refreshed.
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
              Share this promo
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {campaign.isPublished
                ? 'Live now — paste this anywhere.'
                : 'This campaign is unpublished, so the link will 404 until you publish it below.'}
            </p>
          </div>
          <a
            href={`/promo/${campaign.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <i className="pi pi-external-link text-xs" />
            Open the page
          </a>
        </div>

        <ShareLinks path={`/promo/${campaign.slug}`} message={campaign.shortDescription} />
      </section>

      <CampaignForm
        key={campaign.updatedAt}
        campaign={campaign}
        onSubmit={save}
        onDelete={remove}
      />
    </div>
  );
}
