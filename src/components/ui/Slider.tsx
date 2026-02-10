import React from 'react';
import { cn } from '../../lib/utils';

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  className?: string;
  marks?: { value: number; label: string }[];
  showTrackMarkers?: boolean;
  label?: React.ReactNode;
  valueDisplay?: React.ReactNode;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  min,
  max,
  step = 1,
  onChange,
  className,
  marks,
  showTrackMarkers,
  label,
  valueDisplay,
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      {(label || valueDisplay) && (
        <div className="flex justify-between items-end">
          {label}
          {valueDisplay}
        </div>
      )}

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />

      {showTrackMarkers && marks && marks.length > 0 && (
        <div className="flex justify-between text-[10px] font-bold text-text-secondary uppercase tracking-wider px-1">
          {marks.map((mark, index) => (
            <span key={index}>{mark.label}</span>
          ))}
        </div>
      )}
    </div>
  );
};
