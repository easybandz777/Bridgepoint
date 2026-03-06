'use client';

import { Modal } from './modal';
import { AlertCircle, Trash2 } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    destructive?: boolean;
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    destructive = false,
}: ConfirmDialogProps) {

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            className="max-w-md"
        >
            <div className="flex items-start gap-4 mb-8 text-white/70">
                <div className="shrink-0 mt-0.5">
                    {destructive ? (
                        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
                            <Trash2 size={20} />
                        </div>
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                            <AlertCircle size={20} />
                        </div>
                    )}
                </div>
                <p className="text-sm leading-relaxed">{message}</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/6">
                <button
                    onClick={onClose}
                    className="h-10 px-5 rounded-full text-sm font-semibold text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                >
                    {cancelText}
                </button>
                <button
                    onClick={() => {
                        onConfirm();
                        onClose();
                    }}
                    className={`h-10 px-5 rounded-full text-sm font-semibold transition-colors flex items-center ${destructive
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : 'bg-white text-black hover:bg-white/90'
                        }`}
                >
                    {confirmText}
                </button>
            </div>
        </Modal>
    );
}
