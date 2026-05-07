'use client';

import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export function QbHowItWorks() {
    const [open, setOpen] = useState(false);

    return (
        <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl overflow-hidden mb-6">
            <button
                onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center justify-between gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors"
                aria-expanded={open}
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#b8956a]/15 border border-[#b8956a]/20 flex items-center justify-center shrink-0">
                        <HelpCircle size={14} className="text-[#b8956a]" />
                    </div>
                    <span className="text-sm font-semibold text-white">How it works</span>
                </div>
                <ChevronDown
                    size={16}
                    className={`text-white/40 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`}
                />
            </button>

            {open && (
                <div className="px-5 pb-5 pt-1 border-t border-white/6 space-y-4">
                    <Section title="What this does">
                        <p className="text-sm text-white/60 leading-relaxed">
                            When connected, every invoice you push goes to QuickBooks under the matching
                            customer. When customers pay in QuickBooks, the paid status shows up here
                            automatically.
                        </p>
                    </Section>

                    <Section title="Auto-sync triggers">
                        <ul className="text-sm text-white/60 leading-relaxed space-y-1.5">
                            <li className="flex gap-2">
                                <span className="text-[#b8956a] shrink-0">·</span>
                                <span>
                                    Mark an invoice <span className="text-white/85 font-semibold">Sent</span> → pushes to QB
                                </span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-[#b8956a] shrink-0">·</span>
                                <span>
                                    Mark an invoice <span className="text-white/85 font-semibold">Paid</span> → pushes to QB
                                </span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-[#b8956a] shrink-0">·</span>
                                <span>
                                    Mark an estimate <span className="text-white/85 font-semibold">Sent</span> or{' '}
                                    <span className="text-white/85 font-semibold">Accepted</span> → pushes to QB
                                </span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-[#b8956a] shrink-0">·</span>
                                <span>Activate a subcontractor → creates a Vendor in QB</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-[#b8956a] shrink-0">·</span>
                                <span>Add a project bill → creates a Bill in QB (if vendor synced)</span>
                            </li>
                        </ul>
                    </Section>

                    <Section title="Webhooks">
                        <p className="text-sm text-white/60 leading-relaxed">
                            Configure your QB webhook to point at{' '}
                            <code className="px-1.5 py-0.5 rounded bg-white/5 border border-white/6 text-white/80 font-mono text-[12px]">
                                /api/quickbooks/webhook
                            </code>{' '}
                            and add the verifier token in env vars to keep paid status current without
                            polling.
                        </p>
                    </Section>
                </div>
            )}
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b8956a] mb-2">
                {title}
            </p>
            {children}
        </div>
    );
}
