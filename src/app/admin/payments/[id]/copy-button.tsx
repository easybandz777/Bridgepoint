'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
    value: string;
}

export function CopyButton({ value }: CopyButtonProps) {
    const [copied, setCopied] = useState(false);

    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
        } catch {
            // Clipboard API may be unavailable (e.g. http origins). Swallow.
        }
    }

    return (
        <button
            type="button"
            onClick={handleCopy}
            className="w-6 h-6 inline-flex items-center justify-center rounded-md text-white/40 hover:text-[#b8956a] hover:bg-white/5 transition-colors"
            aria-label={copied ? 'Copied' : 'Copy to clipboard'}
        >
            {copied ? <Check size={12} /> : <Copy size={12} />}
        </button>
    );
}
