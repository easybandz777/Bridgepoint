'use client';

import { ReactNode, useEffect, useId, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
    const [mounted, setMounted] = useState(false);
    const titleId = useId();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = prev;
            window.removeEventListener('keydown', onKey);
        };
    }, [isOpen, onClose]);

    if (!mounted || !isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 overscroll-contain"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal Content */}
            <div
                className={cn(
                    "relative w-full max-w-xl max-h-[90vh] sm:max-h-[90vh] flex flex-col bg-[#131313] border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden",
                    className
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/6 shrink-0">
                    <h2 id={titleId} className="font-serif text-lg font-bold text-white">{title}</h2>
                    <button
                        onClick={onClose}
                        aria-label="Close dialog"
                        className="w-11 h-11 flex items-center justify-center rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto overscroll-contain p-6 scrollbar-hide" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
                    {children}
                </div>
            </div>
        </div>
    );
}
