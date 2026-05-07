'use client';

/**
 * Minimal client-side toast system for the crew portal.
 *
 * This is opt-in. The portal layout is owned by another agent and is not
 * wrapped with ToastProvider by default — to use toasts, a feature page
 * (or an isolated subtree) wraps its own children:
 *
 *   import { ToastProvider, useToast } from '@/components/portal/toast-provider';
 *
 *   export default function MyPage() {
 *     return (
 *       <ToastProvider>
 *         <MyPageInner />
 *       </ToastProvider>
 *     );
 *   }
 *
 *   function MyPageInner() {
 *     const toast = useToast();
 *     return <button onClick={() => toast({ title: 'Saved', kind: 'success' })}>Save</button>;
 *   }
 *
 * If `useToast` is called outside of a provider, it returns a no-op so
 * pages don't crash. The hook always returns a usable function.
 *
 * Toasts auto-dismiss after `duration` (default 3000ms). They appear
 * top-center on mobile and bottom-right on desktop.
 */

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastInput {
    title: string;
    description?: string;
    kind?: ToastKind;
    /** ms before auto-dismiss. Default 3000. Pass 0 to disable. */
    duration?: number;
}

interface ToastRow extends ToastInput {
    id: number;
}

type ToastFn = (t: ToastInput) => void;

const ToastContext = createContext<ToastFn | null>(null);

const NOOP: ToastFn = () => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
        console.warn('[toast] useToast() called outside <ToastProvider>; toast suppressed.');
    }
};

export function useToast(): ToastFn {
    const ctx = useContext(ToastContext);
    return ctx ?? NOOP;
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastRow[]>([]);
    const nextId = useRef(1);
    const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

    const dismiss = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        const handle = timers.current.get(id);
        if (handle) {
            clearTimeout(handle);
            timers.current.delete(id);
        }
    }, []);

    const toast = useCallback<ToastFn>(
        (input) => {
            const id = nextId.current++;
            const row: ToastRow = {
                id,
                title: input.title,
                description: input.description,
                kind: input.kind ?? 'info',
                duration: input.duration ?? 3000,
            };
            setToasts((prev) => [...prev, row]);
            if (row.duration && row.duration > 0) {
                const handle = setTimeout(() => dismiss(id), row.duration);
                timers.current.set(id, handle);
            }
        },
        [dismiss],
    );

    useEffect(() => {
        const map = timers.current;
        return () => {
            map.forEach((handle) => clearTimeout(handle));
            map.clear();
        };
    }, []);

    const value = useMemo(() => toast, [toast]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <ToastViewport toasts={toasts} onDismiss={dismiss} />
        </ToastContext.Provider>
    );
}

function ToastViewport({
    toasts,
    onDismiss,
}: {
    toasts: ToastRow[];
    onDismiss: (id: number) => void;
}) {
    if (toasts.length === 0) return null;

    return (
        <div
            className={cn(
                'fixed z-[100] pointer-events-none flex flex-col gap-2',
                // Mobile: top center
                'top-4 left-1/2 -translate-x-1/2 w-[min(92vw,360px)]',
                // Desktop: bottom-right
                'sm:top-auto sm:left-auto sm:translate-x-0 sm:bottom-6 sm:right-6 sm:w-[360px]',
            )}
            role="region"
            aria-label="Notifications"
        >
            {toasts.map((t) => (
                <ToastItem key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
            ))}
        </div>
    );
}

function ToastItem({ toast, onDismiss }: { toast: ToastRow; onDismiss: () => void }) {
    const Icon =
        toast.kind === 'success'
            ? CheckCircle2
            : toast.kind === 'error'
                ? AlertCircle
                : Info;

    const accent =
        toast.kind === 'success'
            ? 'text-emerald-400'
            : toast.kind === 'error'
                ? 'text-red-400'
                : 'text-[#b8956a]';

    return (
        <div
            className="pointer-events-auto rounded-2xl border border-white/10 bg-[#1a1a1a]/95 backdrop-blur shadow-2xl px-4 py-3 flex items-start gap-3"
            role="status"
        >
            <Icon size={18} className={cn('mt-0.5 shrink-0', accent)} />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{toast.title}</p>
                {toast.description && (
                    <p className="mt-0.5 text-xs text-white/55 leading-relaxed">{toast.description}</p>
                )}
            </div>
            <button
                type="button"
                onClick={onDismiss}
                aria-label="Dismiss"
                className="text-white/30 hover:text-white/70 transition-colors"
            >
                <X size={14} />
            </button>
        </div>
    );
}
