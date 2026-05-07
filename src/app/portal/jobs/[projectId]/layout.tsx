'use client';

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    use,
    type ReactNode,
} from 'react';
import { Loader2 } from 'lucide-react';
import { JobDetailHeader } from '@/components/portal/job-detail-header';
import { JobTabNav } from '@/components/portal/job-tab-nav';
import { useT } from '@/lib/portal-i18n';
import { portalFetch } from '@/lib/portal-client';

export interface PortalJobDetail {
    project: {
        id: string;
        projectNumber: string;
        name: string;
        status: string;
        clientName: string;
        clientPhone: string;
        clientEmail: string;
        address: string;
        city: string;
        state: string;
        zip: string;
        description: string;
        startDate: string | null;
        endDate: string | null;
        projectManager: string;
    };
    phases: {
        id: string;
        name: string;
        status: string;
        phaseOrder: number;
        completionPct: number;
        startDate: string | null;
        endDate: string | null;
        actualStartDate: string | null;
        actualEndDate: string | null;
        notes: string;
        assignedSubIds: string[];
        canEdit: boolean;
    }[];
    mySubAssignment: {
        id: string;
        scopeOfWork: string;
        assignmentStatus: string;
        agreedAmount: number;
        billedAmount: number;
        approvedAmount: number;
        paidAmount: number;
        startDate: string | null;
        endDate: string | null;
        completionPct: number;
        notes: string;
    } | null;
    recentActivity: { id: string; action: string; description: string; created_at: string; actor: string }[];
    isLead: boolean;
}

interface JobDetailContextValue {
    projectId: string;
    data: PortalJobDetail;
    refresh: () => Promise<void>;
}

const JobDetailContext = createContext<JobDetailContextValue | null>(null);

export function useJobDetail(): JobDetailContextValue {
    const ctx = useContext(JobDetailContext);
    if (!ctx) {
        throw new Error('useJobDetail must be used inside the job detail layout');
    }
    return ctx;
}

export default function JobDetailLayout({
    children,
    params,
}: {
    children: ReactNode;
    params: Promise<{ projectId: string }>;
}) {
    const { projectId } = use(params);
    const t = useT();

    const [data, setData] = useState<PortalJobDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            const res = await portalFetch<PortalJobDetail>(`/api/portal/jobs/${projectId}`);
            setData(res);
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        load();
    }, [load]);

    const refresh = useCallback(async () => {
        await load();
    }, [load]);

    const value = useMemo<JobDetailContextValue | null>(() => {
        if (!data) return null;
        return { projectId, data, refresh };
    }, [data, projectId, refresh]);

    if (loading) {
        return (
            <div className="px-4 sm:px-6 py-12 max-w-3xl mx-auto">
                <div className="flex items-center justify-center gap-2 text-white/40 text-sm">
                    <Loader2 size={16} className="animate-spin" />
                    {t('jobDetail.loading')}
                </div>
            </div>
        );
    }

    if (error || !data || !value) {
        const isForbidden = error && /403|Forbidden/i.test(error);
        const isNotFound = error && /404|Not found/i.test(error);
        return (
            <div className="px-4 sm:px-6 py-12 max-w-3xl mx-auto">
                <div className="bg-[#1a1a1a] border border-red-500/20 rounded-2xl p-6 text-center">
                    <p className="text-sm text-red-300 mb-3">
                        {isForbidden
                            ? t('jobDetail.unauthorized')
                            : isNotFound
                            ? t('jobDetail.notFound')
                            : t('jobDetail.errorLoading')}
                    </p>
                    <button
                        type="button"
                        onClick={() => { setLoading(true); setError(null); load(); }}
                        className="text-xs uppercase tracking-[0.2em] text-[#b8956a] hover:text-[#cbb08c]"
                    >
                        {t('common.retry')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="px-4 sm:px-6 pt-4 sm:pt-6 max-w-4xl mx-auto">
                <JobDetailHeader project={value.data.project} />
                <JobTabNav projectId={projectId} />
            </div>
            <JobDetailContext.Provider value={value}>
                {children}
            </JobDetailContext.Provider>
        </>
    );
}
