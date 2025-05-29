'use client'

import { Button } from './ui/button'
import { cn, formatCurrency } from '@/lib/utils'

interface ChipSelectionProps {
  selectedChip: number;
  onSelectChip: (value: number) => void;
  maxChip: number;
}

const AVAILABLE_CHIPS = [100, 500, 1000, 2000, 5000, 10000];

export default function ChipSelection({ selectedChip, onSelectChip, maxChip }: ChipSelectionProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-center text-gray-300 font-medium mb-4">Seleccionar Ficha</h3>
      <div className="grid grid-cols-3 gap-2">
        {AVAILABLE_CHIPS.filter(value => value <= maxChip).map(value => {
          const isDisabled = value > maxChip;
          return (
            <Button
              key={value}
              onClick={() => onSelectChip(value)}
              disabled={isDisabled}
              className={cn(
                'relative transition-all transform hover:scale-105',
                selectedChip === value
                  ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-gray-900'
                  : '',
                isDisabled
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:shadow-lg'
              )}
            >
              <div className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center text-white font-bold',
                value <= 500 ? 'bg-blue-600' :
                value <= 2000 ? 'bg-green-600' :
                value <= 5000 ? 'bg-purple-600' : 'bg-red-600'
              )}>
                {formatCurrency(value)}
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
