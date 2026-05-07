'use client';

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { fetchMe, type PortalMeResponse } from '@/lib/portal-client';
import { useT } from '@/lib/portal-i18n';

interface PortalUserContextValue {
    user: PortalMeResponse['session'];
    employee?: PortalMeResponse['employee'];
    subcontractor?: PortalMeResponse['subcontractor'];
    refresh: () => Promise<void>;
}

const PortalUserContext = createContext<PortalUserContextValue | null>(null);

interface PortalUserProviderProps {
    children: ReactNode;
    onUnauthenticated?: () => void;
}

export function PortalUserProvider({ children, onUnauthenticated }: PortalUserProviderProps) {
    const router = useRouter();
    const t = useT();
    const [data, setData] = useState<PortalMeResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            const me = await fetchMe();
            if (!me) {
                if (onUnauthenticated) onUnauthenticated();
                else router.replace('/portal/login');
                return;
            }
            setData(me);
            setError(null);
        } catch (e) {
            setError(String(e));
        } finally {
            setLoading(false);
        }
    }, [router, onUnauthenticated]);

    useEffect(() => {
        load();
    }, [load]);

    const refresh = useCallback(async () => {
        await load();
    }, [load]);

    const value = useMemo<PortalUserContextValue | null>(() => {
        if (!data) return null;
        return {
            user: data.session,
            employee: data.employee,
            subcontractor: data.subcontractor,
            refresh,
        };
    }, [data, refresh]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border-2 border-[#b8956a]/30 border-t-[#b8956a] animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-6">
                <div className="text-center">
                    <p className="text-sm text-white/60 mb-3">{t('common.error')}</p>
                    <button
                        onClick={() => { setLoading(true); setError(null); load(); }}
                        className="text-xs uppercase tracking-[0.2em] text-[#b8956a] hover:text-[#b8956a]/80"
                    >
                        {t('common.retry')}
                    </button>
                </div>
            </div>
        );
    }

    if (!value) return null;

    return <PortalUserContext.Provider value={value}>{children}</PortalUserContext.Provider>;
}

export function usePortalUser(): PortalUserContextValue {
    const ctx = useContext(PortalUserContext);
    if (!ctx) {
        throw new Error('usePortalUser must be used inside <PortalUserProvider>');
    }
    return ctx;
}
