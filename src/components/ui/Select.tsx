import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

interface Option {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface SelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  variant?: 'default' | 'ghost';
  direction?: 'up' | 'down';
}

export const Select: React.FC<SelectProps> = ({ 
  options, 
  value, 
  onChange, 
  placeholder = 'Select...', 
  className = '',
  variant = 'default',
  direction = 'down'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 outline-none",
          variant === 'default' 
            ? "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white" 
            : "bg-transparent hover:bg-white/5 text-text-secondary hover:text-white",
          isOpen && "border-white/30 bg-white/10"
        )}
      >
        <div className="flex items-center gap-3 truncate">
          {selectedOption?.icon && (
            <span className="text-text-secondary">{selectedOption.icon}</span>
          )}
          <span className={cn("truncate", !selectedOption && "text-text-secondary")}>
            {selectedOption?.label || placeholder}
          </span>
        </div>
        <ChevronDown 
          className={cn(
            "w-4 h-4 text-text-secondary transition-transform duration-300",
            isOpen && (direction === 'up' ? "rotate-0" : "rotate-180")
          )} 
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: direction === 'up' ? 8 : -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: direction === 'up' ? 8 : -8, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn(
              "absolute left-0 right-0 bg-[#1a1a1c]/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl shadow-black/50 py-1",
              direction === 'up' ? "bottom-full mb-2" : "top-full mt-2"
            )}
          >
            <div className="max-h-60 overflow-y-auto custom-scrollbar p-1 space-y-0.5">
              {options.map((option) => (
                <motion.button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg transition-colors group",
                    option.value === value 
                      ? "bg-primary text-white" 
                      : "text-text-secondary hover:bg-white/10 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-3 truncate">
                    {option.icon && (
                      <span className={cn(
                        "transition-colors",
                        option.value === value ? "text-white/90" : "text-text-secondary group-hover:text-white"
                      )}>
                        {option.icon}
                      </span>
                    )}
                    <span className="truncate">{option.label}</span>
                  </div>
                  {option.value === value && <Check className="w-4 h-4 text-white" />}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
