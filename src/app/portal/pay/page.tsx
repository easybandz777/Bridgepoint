'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useT } from '@/lib/portal-i18n';
import { usePortalUser } from '@/lib/portal-context';
import { portalFetch } from '@/lib/portal-client';
import { PaySummary, type PortalPayResponse } from '@/components/portal/pay-summary';
import { BillingsSummary, type PortalBillingsResponse } from '@/components/portal/billings-summary';

type PayPayload = PortalPayResponse | PortalBillingsResponse;

export default function PortalPayPage() {
    const t = useT();
    const { user } = usePortalUser();
    const [data, setData] = useState<PayPayload | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let alive = true;
        async function load() {
            setLoading(true);
            setError(null);
            try {
                const d = await portalFetch<PayPayload>('/api/portal/pay');
                if (alive) setData(d);
            } catch (e) {
                if (alive) setError(e instanceof Error ? e.message : String(e));
            } finally {
                if (alive) setLoading(false);
            }
        }
        load();
        return () => { alive = false; };
    }, []);

    const heading = user.userType === 'subcontractor' ? t('nav.billings') : t('pay.title');

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-5xl mx-auto space-y-6">
            <header>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
                    {heading}
                </h1>
            </header>

            {loading && (
                <div className="flex items-center justify-center min-h-[40vh] text-white/45 gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-sm">{t('common.loading')}</span>
                </div>
            )}

            {!loading && error && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-sm text-red-300">
                    {t('pay.errorLoading')}
                    <p className="mt-2 text-xs text-red-300/70">{error}</p>
                </div>
            )}

            {!loading && !error && data && data.userType === 'employee' && (
                <PaySummary data={data} />
            )}

            {!loading && !error && data && data.userType === 'subcontractor' && (
                <BillingsSummary data={data} />
            )}
        </div>
    );
}
