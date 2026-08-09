/**
 * /admin/campaigns — the promo pages you share on social media.
 *
 * Cards, not a table. Every other list in the portal is rows of text because
 * what an agent scans for is a name or a number; a campaign's most important
 * field is the banner, and a promo whose banner is wrong is worth spotting
 * before it is posted rather than after.
 *
 * The three numbers on each card are the only ones that matter: views (did the
 * post get clicks), leads (did the page convert them), booked (did the leads
 * turn into money). Everything else is on the edit screen.
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { ShareLinks } from '@/components/admin/ShareLinks';
import { formatDate } from '@/lib/format';
import * as campaignService from '@/services/campaign.service';
import type { CampaignListItem } from '@/types/campaign';

export default function AdminCampaignsPage() {
  const [items, setItems] = useState<CampaignListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await campaignService.listCampaigns();
      setItems(response.items);
      setError(null);
    } catch {
      setError('Could not load campaigns.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totals = useMemo(
    () =>
      items.reduce(
        (sum, item) => ({
          leads: sum.leads + item.leadCount,
          views: sum.views + item.viewCount,
          live: sum.live + (item.isPublished && !item.hasEnded ? 1 : 0),
        }),
        { leads: 0, views: 0, live: 0 }
      ),
    [items]
  );

  /**
   * Publishing from the card rather than the editor: taking a promo down is
   * usually urgent (wrong price, sold out) and should not need a form.
   */
  const togglePublished = async (campaign: CampaignListItem) => {
    setBusyId(campaign.id);
    setError(null);
    try {
      await campaignService.updateCampaign(campaign.id, { isPublished: !campaign.isPublished });
      await load();
    } catch (caught) {
      setError((caught as { message?: string })?.message ?? 'Could not update that campaign.');
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-600">
        <i className="pi pi-spin pi-spinner mr-2 text-xl" /> Loading campaigns…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Campaigns</h1>
          <p className="mt-1 text-sm text-slate-600">
            {items.length === 0
              ? 'Shareable promo pages that capture leads'
              : `${totals.live} live · ${totals.leads} lead${totals.leads === 1 ? '' : 's'} captured · ${totals.views} view${totals.views === 1 ? '' : 's'}`}
          </p>
        </div>
        <Link
          href="/admin/campaigns/new"
          className="inline-flex items-center gap-2 rounded-lg bg-coral px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-coral-dark"
        >
          <i className="pi pi-plus text-xs" />
          New campaign
        </Link>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <i className="pi pi-megaphone text-3xl text-slate-300" />
          <h2 className="mt-4 text-lg font-semibold text-slate-900">No campaigns yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            A campaign is one banner, one offer and one form, living at its own link. Post the link
            to Facebook or Viber; everyone who fills it in lands in Inquiries, tagged with the promo
            that brought them.
          </p>
          <Link
            href="/admin/campaigns/new"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-coral px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-coral-dark"
          >
            <i className="pi pi-plus text-xs" />
            Create the first one
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((campaign) => (
            <article
              key={campaign.id}
              className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white"
            >
              <Link href={`/admin/campaigns/${campaign.id}`} className="block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={campaign.bannerImage}
                  alt=""
                  className="aspect-[1200/630] w-full bg-slate-100 object-cover"
                />
              </Link>

              <div className="flex flex-1 flex-col p-4">
                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                  <StatusChip campaign={campaign} />
                  {campaign.endsAt && (
                    <span className="text-xs text-slate-500">
                      {campaign.hasEnded ? 'Ended' : 'Ends'} {formatDate(campaign.endsAt)}
                    </span>
                  )}
                </div>

                <Link
                  href={`/admin/campaigns/${campaign.id}`}
                  className="font-semibold text-slate-900 hover:text-coral"
                >
                  {campaign.name}
                </Link>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                  {campaign.shortDescription}
                </p>

                <dl className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-3 text-center">
                  <Stat label="Views" value={campaign.viewCount} />
                  <Stat label="Leads" value={campaign.leadCount} accent />
                  <Stat label="Booked" value={campaign.bookedCount} />
                </dl>

                {campaign.leadCount > 0 && (
                  <Link
                    href={`/admin/inquiries?campaign=${campaign.id}`}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-coral hover:text-coral-dark"
                  >
                    View the leads
                    <i className="pi pi-arrow-right text-[10px]" />
                  </Link>
                )}

                <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <ShareLinks path={`/promo/${campaign.slug}`} message={campaign.name} compact />

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => togglePublished(campaign)}
                      disabled={busyId === campaign.id}
                      title={campaign.isPublished ? 'Unpublish' : 'Publish'}
                      className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:opacity-40"
                    >
                      <i
                        className={`pi ${campaign.isPublished ? 'pi-eye-slash' : 'pi-eye'} text-sm`}
                      />
                    </button>
                    <Link
                      href={`/admin/campaigns/${campaign.id}`}
                      title="Edit"
                      className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                    >
                      <i className="pi pi-pencil text-sm" />
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <div>
      <dd
        className={`text-lg font-bold tabular-nums ${accent ? 'text-coral' : 'text-slate-900'}`}
      >
        {value}
      </dd>
      <dt className="text-[11px] uppercase tracking-wide text-slate-500">{label}</dt>
    </div>
  );
}

/**
 * Three states, not two: an ended promo is still published — its page explains
 * itself to anyone arriving from an old post — but it is no longer taking
 * leads, and reading it as "Live" would be a lie.
 */
function StatusChip({ campaign }: { campaign: CampaignListItem }) {
  if (!campaign.isPublished) {
    return (
      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
        Draft
      </span>
    );
  }
  if (campaign.hasEnded) {
    return (
      <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
        Ended
      </span>
    );
  }
  return (
    <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
      Live
    </span>
  );
}
