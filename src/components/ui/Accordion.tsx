import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export type AccordionItem = {
  id: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  defaultOpen?: boolean;
  content: React.ReactNode;
};

type AccordionProps = {
  items: AccordionItem[];
  className?: string;
};

export const Accordion: React.FC<AccordionProps> = ({ items, className }) => {
  const [openIds, setOpenIds] = useState<Record<string, boolean>>(() =>
    items.reduce((acc, item, index) => {
      acc[item.id] = Boolean(item.defaultOpen ?? index === 0);
      return acc;
    }, {} as Record<string, boolean>)
  );

  const toggle = (id: string) => {
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {items.map((item) => {
        const isOpen = Boolean(openIds[item.id]);
        return (
          <div key={item.id} className="rounded-xl border border-white/10 overflow-hidden bg-white/2">
            <button
              type="button"
              onClick={() => toggle(item.id)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition-colors"
            >
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white truncate">{item.title}</div>
                {item.subtitle && <div className="text-xs text-text-secondary">{item.subtitle}</div>}
              </div>
              <motion.span
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="ml-3 text-text-secondary"
              >
                <ChevronDown className="w-4 h-4" />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.2, 0.7, 0.2, 1] }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 pt-2">{item.content}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};
