import React, { useEffect, useState } from 'react';
import { Wifi, Users, Activity, Copy, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

interface ServerStatusData {
  online: boolean;
  ip: string;
  port: number;
  players: {
    online: number;
    max: number;
  };
  motd: {
    clean: string[];
  };
  icon: string;
  version: string;
}

interface ServerStatusProps {
  ip?: string;
  className?: string;
}

export const ServerStatus: React.FC<ServerStatusProps> = ({ ip = 'hypixel.net', className }) => {
  const [status, setStatus] = useState<ServerStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`https://api.mcsrvstat.us/3/${ip}`);
        const data = await res.json();
        setStatus(data);
      } catch {
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, [ip]);

  const copyIp = () => {
    navigator.clipboard.writeText(ip);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className={cn('bg-black/20 rounded-3xl p-6 border border-white/5 animate-pulse h-48', className)}>
        <div className="flex gap-4">
          <div className="w-16 h-16 bg-white/5 rounded-xl" />
          <div className="flex-1 space-y-2 py-2">
            <div className="h-4 bg-white/5 rounded w-1/2" />
            <div className="h-3 bg-white/5 rounded w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!status?.online) {
    return (
      <div className={cn('bg-black/20 rounded-3xl p-6 border border-white/5 flex flex-col items-center justify-center text-center gap-2', className)}>
        <Wifi className="w-8 h-8 text-red-500/50" />
        <div className="font-bold text-text-secondary">Сервер оффлайн</div>
        <div className="text-xs text-text-secondary/50">{ip}</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('bg-black/20 rounded-3xl p-6 border border-white/5 flex flex-col gap-4 relative group overflow-hidden', className)}
    >
      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={copyIp} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-text-secondary hover:text-white">
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex items-start gap-4 z-10">
        {status.icon ? (
          <img src={status.icon} alt="Server Icon" className="w-16 h-16 rounded-xl shadow-lg" />
        ) : (
          <div className="w-16 h-16 bg-white/5 rounded-xl flex items-center justify-center">
            <Activity className="w-8 h-8 text-text-secondary" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg truncate text-white">{ip}</h3>
          <div className="flex items-center gap-2 text-xs text-primary font-medium bg-primary/10 w-fit px-2 py-0.5 rounded-full mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Online
          </div>
          <p className="text-xs text-text-secondary truncate">{status.version}</p>
        </div>
      </div>

      <div className="space-y-3 z-10">
        <div className="bg-black/40 p-3 rounded-xl border border-white/5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Users className="w-4 h-4" />
              <span>Игроки</span>
            </div>
            <span className="font-mono font-bold text-primary">
              {status.players.online} <span className="text-text-secondary/50">/ {status.players.max}</span>
            </span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-1000 ease-out"
              style={{ width: `${Math.min((status.players.online / status.players.max) * 100, 100)}%` }}
            />
          </div>
        </div>

        {status.motd.clean && (
          <div className="text-xs text-text-secondary line-clamp-2 font-medium">{status.motd.clean.join(' ')}</div>
        )}
      </div>

      <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
    </motion.div>
  );
};
