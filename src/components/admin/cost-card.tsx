import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface CostCardProps {
    title: string;
    amount: number;
    subtitle?: string;
    variance?: number;
    varianceThreshold?: number; // point at which it goes red
    invertVariance?: boolean; // if true, positive variance is bad (e.g. costs)
    icon?: ReactNode;
    className?: string;
}

export function formatCurrency(n: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

export function formatCurrencyPrecise(n: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

export function CostCard({
    title,
    amount,
    subtitle,
    variance,
    varianceThreshold = 0,
    invertVariance = false,
    icon,
    className
}: CostCardProps) {

    let varianceColor = 'text-white/40';
    let VarianceIcon = Minus;

    if (variance !== undefined && variance !== 0) {
        const isBad = invertVariance ? variance > varianceThreshold : variance < varianceThreshold;
        const isGood = invertVariance ? variance < 0 : variance > 0;

        if (isBad) {
            varianceColor = 'text-[#f87171]';
            VarianceIcon = invertVariance ? TrendingUp : TrendingDown;
        } else if (isGood) {
            varianceColor = 'text-[#34d399]';
            VarianceIcon = invertVariance ? TrendingDown : TrendingUp;
        } else {
            varianceColor = 'text-[#fbbf24]'; // Warning/Amber
            VarianceIcon = invertVariance ? TrendingUp : TrendingDown;
        }
    }

    return (
        <div className={cn("bg-[#1a1a1a] border border-white/6 rounded-2xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden group", className)}>
            {/* Background Icon */}
            {icon && (
                <div className="absolute -right-4 -bottom-4 opacity-[0.03] transform group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                    <div className="w-32 h-32 flex items-center justify-center text-white">
                        {icon}
                    </div>
                </div>
            )}

            <div>
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xs font-semibold text-white/50">{title}</h3>
                </div>
                <div className="font-serif text-2xl font-bold text-white mb-1">
                    {formatCurrency(amount)}
                </div>
                {subtitle && (
                    <p className="text-[10px] text-white/30 uppercase tracking-widest">{subtitle}</p>
                )}
            </div>

            {variance !== undefined && (
                <div className="mt-4 pt-3 border-t border-white/6 flex items-center gap-2">
                    <div className={cn("p-1 rounded-md bg-white/5", varianceColor)}>
                        <VarianceIcon size={12} />
                    </div>
                    <div>
                        <span className={cn("text-xs font-bold", varianceColor)}>
                            {variance > 0 ? '+' : ''}{formatCurrency(variance)}
                        </span>
                        <span className="text-[10px] text-white/30 ml-2 uppercase tracking-wide">Variance</span>
                    </div>
                </div>
            )}
        </div>
    );
}
