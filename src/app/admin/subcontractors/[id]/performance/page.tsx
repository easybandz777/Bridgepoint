// @ts-nocheck
import { notFound } from 'next/navigation';
import { SAMPLE_SUBCONTRACTORS } from '@/lib/subcontractors';
import { SubTabNav } from '@/components/admin/sub-tab-nav';
import { Star, AlertTriangle, MessageSquare, Briefcase, ThumbsUp, ThumbsDown } from 'lucide-react';

export default function SubcontractorPerformancePage({ params }: { params: { id: string } }) {
    const sub = SAMPLE_SUBCONTRACTORS.find(s => s.id === params.id);
    if (!sub) notFound();

    return (
        <div>
            {/* Header */}
            <div className="mb-6">
                <h1 className="font-serif text-2xl font-bold text-white mb-1">{sub.companyName}</h1>
                <p className="text-sm text-white/50">Performance Metrics & Reviews</p>
            </div>

            <SubTabNav subId={sub.id} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Metrics Breakdown */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                        <div className="text-center mb-6 pb-6 border-b border-white/5">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/5 border-2 border-[#fbbf24]/20 mb-3">
                                <span className="text-3xl font-bold text-white">{sub.metrics.averageRating.toFixed(1)}</span>
                            </div>
                            <h2 className="text-sm font-semibold text-white">Overall Rating</h2>
                            <div className="flex justify-center gap-1 mt-2">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <Star key={star} size={16} className={star <= Math.round(sub.metrics.averageRating) ? 'text-[#fbbf24] fill-[#fbbf24]' : 'text-white/20'} />
                                ))}
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <div className="flex justify-between text-xs mb-1.5">
                                    <span className="text-white/60">Quality of Work</span>
                                    <span className="text-white font-medium">4.8</span>
                                </div>
                                <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#fbbf24] rounded-full" style={{ width: '96%' }} />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs mb-1.5">
                                    <span className="text-white/60">Schedule Adherence</span>
                                    <span className="text-white font-medium">4.2</span>
                                </div>
                                <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#fbbf24] rounded-full" style={{ width: '84%' }} />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs mb-1.5">
                                    <span className="text-white/60">Communication</span>
                                    <span className="text-white font-medium">4.5</span>
                                </div>
                                <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#fbbf24] rounded-full" style={{ width: '90%' }} />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs mb-1.5">
                                    <span className="text-white/60">Cleanliness & Safety</span>
                                    <span className="text-white font-medium">4.9</span>
                                </div>
                                <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#fbbf24] rounded-full" style={{ width: '98%' }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                        <h2 className="text-sm font-semibold text-white mb-4">Past Issues</h2>
                        {sub.metrics.reliabilityScore < 90 ? (
                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3">
                                <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-amber-200">Reliability Warning</p>
                                    <p className="text-xs text-amber-200/60 mt-1">This sub has fallen below the 90% reliability threshold. Consider reviewing recent performance before assigning new critical path tasks.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-white/5 border border-white/5 rounded-xl flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#34d399]/10 flex items-center justify-center text-[#34d399] shrink-0">
                                    <ThumbsUp size={14} />
                                </div>
                                <p className="text-sm text-white/70">No major issues reported recently. Reliability score is good.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Reviews / Feedback Feed */}
                <div className="lg:col-span-2">
                    <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6 h-full">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-sm font-semibold text-white">Project Feedback</h2>
                            <button className="text-xs font-semibold text-[#b8956a] hover:text-[#cbb08c] transition-colors">
                                + Log Feedback
                            </button>
                        </div>

                        {/* Mock Feedback Feed */}
                        <div className="space-y-4">
                            {[
                                {
                                    project: "124 Cherry Lane Renovation",
                                    author: "Mark S.",
                                    date: "2 weeks ago",
                                    rating: 5,
                                    text: "Outstanding work on the rough framing. Finished a day ahead of schedule and left the site spotless.",
                                    sentiment: "positive"
                                },
                                {
                                    project: "890 West End Addition",
                                    author: "Sarah J.",
                                    date: "1 month ago",
                                    rating: 4,
                                    text: "Good quality, but communication was a bit lacking regarding arrival times. Result was solid though.",
                                    sentiment: "neutral"
                                },
                                {
                                    project: "55 Main St Kitchen",
                                    author: "Mark S.",
                                    date: "3 months ago",
                                    rating: 5,
                                    text: "Flawless execution. Client was very happy.",
                                    sentiment: "positive"
                                }
                            ].map((review, i) => (
                                <div key={i} className="p-5 bg-white/5 border border-white/5 rounded-xl">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/50 text-xs font-bold">
                                                {review.author.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white">{review.author}</p>
                                                <div className="flex items-center gap-2 text-[10px] text-white/40 uppercase tracking-wider mt-0.5">
                                                    <Briefcase size={10} />
                                                    {review.project}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex gap-0.5">
                                                {[...Array(5)].map((_, j) => (
                                                    <Star key={j} size={12} className={j < review.rating ? 'text-[#fbbf24] fill-[#fbbf24]' : 'text-white/20'} />
                                                ))}
                                            </div>
                                            <span className="text-[10px] text-white/30 uppercase tracking-widest">{review.date}</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-white/70 leading-relaxed pl-11">
                                        {review.text}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
