import { cn } from '@/lib/utils';
import { marginColor } from '@/lib/projects';

interface ProfitabilityBarProps {
    marginPct: number;
    className?: string;
}

export function ProfitabilityBar({ marginPct, className }: ProfitabilityBarProps) {
    const color = marginColor(marginPct);

    // Clamp between 0 and 100 for display
    const displayPct = Math.min(Math.max(marginPct, 0), 100);

    return (
        <div className={cn("w-full", className)}>
            <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Gross Margin</span>
                <span className="text-xs font-bold" style={{ color }}>{marginPct.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                        width: `${displayPct}%`,
                        backgroundColor: color,
                        boxShadow: `0 0 10px ${color}40`
                    }}
                />
            </div>
        </div>
    );
}
