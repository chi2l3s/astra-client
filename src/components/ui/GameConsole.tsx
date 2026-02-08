import React, { useEffect, useRef, useState } from 'react';
import { X, Terminal, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GameConsoleProps {
  isOpen: boolean;
  onClose: () => void;
  logs: string[];
}

export const GameConsole: React.FC<GameConsoleProps> = ({ isOpen, onClose, logs }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className={`fixed bottom-0 left-0 right-0 bg-background-secondary border-t border-white/10 shadow-2xl z-50 transition-all duration-300 ${
            isExpanded ? 'h-[80vh]' : 'h-64'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 bg-black/20 border-b border-white/5">
            <div className="flex items-center gap-2 text-text-secondary">
              <Terminal className="w-4 h-4" />
              <span className="text-sm font-medium">Консоль игры</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 hover:text-white text-text-secondary transition-colors"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button 
                onClick={onClose}
                className="p-1 hover:text-red-500 text-text-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Logs */}
          <div className="h-full overflow-y-auto p-4 font-mono text-xs custom-scrollbar pb-12 bg-[#0d0d0d]">
            {logs.length === 0 ? (
              <div className="text-text-secondary opacity-50 italic">Ожидание запуска игры...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1 break-words">
                  <span className="text-gray-500">[{new Date().toLocaleTimeString()}] </span>
                  <span className={
                    log.includes('ERROR') ? 'text-red-400' :
                    log.includes('WARN') ? 'text-yellow-400' :
                    log.includes('INFO') ? 'text-blue-400' :
                    'text-gray-300'
                  }>
                    {log}
                  </span>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
