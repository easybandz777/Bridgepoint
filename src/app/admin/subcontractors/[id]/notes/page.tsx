import { notFound } from 'next/navigation';
import { SAMPLE_SUBCONTRACTORS } from '@/lib/subcontractors';
import { SubTabNav } from '@/components/admin/sub-tab-nav';
import { Send, Clock, User } from 'lucide-react';

export default function SubcontractorNotesPage({ params }: { params: { id: string } }) {
    const sub = SAMPLE_SUBCONTRACTORS.find(s => s.id === params.id);
    if (!sub) notFound();

    return (
        <div>
            {/* Header */}
            <div className="mb-6">
                <h1 className="font-serif text-2xl font-bold text-white mb-1">{sub.companyName}</h1>
                <p className="text-sm text-white/50">Internal Notes & Activity Log</p>
            </div>

            <SubTabNav subId={sub.id} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 flex flex-col h-[600px] bg-[#1a1a1a] border border-white/6 rounded-2xl overflow-hidden">
                    {/* Notes Feed */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Mock Note 1 */}
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-[#b8956a] flex items-center justify-center text-black font-bold text-xs shrink-0 mt-1">
                                M
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-semibold text-white">Mark S.</span>
                                    <span className="text-xs text-white/40">Today at 9:45 AM</span>
                                </div>
                                <div className="p-4 bg-white/5 border border-white/5 rounded-xl rounded-tl-none text-sm text-white/70">
                                    Called {sub.primaryContact} about the upcoming kitchen job. They confirmed availability for next week. Follow up tomorrow regarding the final materials list.
                                </div>
                            </div>
                        </div>

                        {/* Mock Note 2 */}
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs shrink-0 mt-1">
                                S
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-semibold text-white">Sarah J.</span>
                                    <span className="text-xs text-white/40">Yesterday at 2:15 PM</span>
                                </div>
                                <div className="p-4 bg-white/5 border border-white/5 rounded-xl rounded-tl-none text-sm text-white/70">
                                    Requested updated COI. Expiring in 30 days.
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-[#141414] border-t border-white/5">
                        <div className="relative">
                            <textarea
                                placeholder="Add an internal note about this subcontractor..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 pr-12 text-sm text-white focus:outline-none focus:border-[#b8956a]/50 focus:bg-white/10 transition-colors min-h-[80px] resize-none"
                            />
                            <button className="absolute right-3 bottom-3 w-8 h-8 rounded-lg bg-[#b8956a] text-black flex items-center justify-center hover:bg-[#cbb08c] transition-colors">
                                <Send size={14} />
                            </button>
                        </div>
                        <p className="text-[10px] text-white/30 mt-2 ml-1">Notes are only visible to internal staff.</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                        <h2 className="text-sm font-semibold text-white mb-6">Recent Activity</h2>

                        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/5 before:to-transparent">
                            {[
                                { action: 'Updated profile details', time: '2 days ago' },
                                { action: 'Assigned to Project: 124 Cherry Lane', time: '1 week ago' },
                                { action: 'Paid Invoice #INV-2023', time: '2 weeks ago' },
                                { action: 'Uploaded new W-9', time: '1 month ago' }
                            ].map((act, i) => (
                                <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    {/* Icon */}
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-[#1a1a1a] text-white/40 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 group-hover:text-[#b8956a] group-hover:border-[#b8956a]/40 transition-colors">
                                        <Clock size={16} />
                                    </div>
                                    {/* Text */}
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] pl-4 md:pl-0 md:group-odd:pr-4 md:group-even:pl-4">
                                        <div className="flex flex-col md:group-odd:items-end">
                                            <span className="text-xs text-white/40 uppercase tracking-widest font-semibold">{act.time}</span>
                                            <p className="text-sm text-white/70 mt-1">{act.action}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
