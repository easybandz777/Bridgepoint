'use client';

import { cn } from '@/lib/utils';
import type { ProjectCategory } from '@/content/projects';

type FilterOption = ProjectCategory | 'all';

interface FilterBarProps {
  active: FilterOption;
  onChange: (filter: FilterOption) => void;
}

const FILTERS: { value: FilterOption; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'painting', label: 'Painting' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'bathroom', label: 'Bathroom' },
  { value: 'full-remodel', label: 'Full Remodel' },
  { value: 'custom', label: 'Custom' },
];

export function FilterBar({ active, onChange }: FilterBarProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {FILTERS.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onChange(filter.value)}
          className={cn(
            'cursor-pointer px-4 py-2 font-sans text-xs font-semibold uppercase',
            'tracking-widest transition-all duration-300',
            active === filter.value
              ? 'bg-charcoal text-warm-white'
              : 'bg-transparent text-slate hover:text-charcoal'
          )}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
