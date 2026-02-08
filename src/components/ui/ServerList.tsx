import React, { useEffect, useState } from 'react';
import { Wifi, Trash2, Plus, Play } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Button } from './Button';
import { cn } from '../../lib/utils';

interface ServerItemProps {
  server: { id: string, name: string, ip: string };
  onJoin: (ip: string) => void;
  onDelete: (id: string) => void;
}

const ServerItem = ({ server, onJoin, onDelete }: ServerItemProps) => {
  const [status, setStatus] = useState<{ online: boolean, players: number, max: number, ping?: number } | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`https://api.mcsrvstat.us/3/${server.ip}`);
        const data = await res.json();
        if (data.online) {
            setStatus({
                online: true,
                players: data.players.online,
                max: data.players.max
            });
        } else {
            setStatus({ online: false, players: 0, max: 0 });
        }
      } catch {
        setStatus({ online: false, players: 0, max: 0 });
      }
    };
    checkStatus();
  }, [server.ip]);

  return (
    <div className="bg-black/40 border border-white/5 p-4 rounded-xl flex items-center gap-4 group hover:bg-black/60 transition-colors">
       <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center">
          {status?.online ? (
             <span className="font-bold text-primary">{status.players}</span>
          ) : (
             <Wifi className="w-5 h-5 text-red-500/50" />
          )}
       </div>
       
       <div className="flex-1 min-w-0">
          <h4 className="font-bold truncate">{server.name}</h4>
          <div className="flex items-center gap-2 text-xs text-text-secondary">
             <span className="truncate max-w-[150px]">{server.ip}</span>
             {status?.online && <span className="text-green-500">• Online</span>}
          </div>
       </div>

       <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="icon" variant="secondary" onClick={() => onJoin(server.ip)}>
             <Play className="w-4 h-4 text-green-400 fill-current" />
          </Button>
          <Button size="icon" variant="danger" onClick={() => onDelete(server.id)}>
             <Trash2 className="w-4 h-4" />
          </Button>
       </div>
    </div>
  );
};

export const ServerList = () => {
  const { servers, addServer, removeServer } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newServerIp, setNewServerIp] = useState('');
  const [newServerName, setNewServerName] = useState('');

  const handleAdd = () => {
    if (!newServerIp) return;
    addServer({
        id: crypto.randomUUID(),
        name: newServerName || newServerIp,
        ip: newServerIp
    });
    setNewServerIp('');
    setNewServerName('');
    setIsAdding(false);
  };

  const handleJoin = (ip: string) => {
    // This would need to be passed to the launch args
    // For now we just alert
    alert(`Quick join to ${ip} will be available in next update!`);
  };

  return (
    <div className="space-y-4">
       <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Серверы</h3>
          <Button size="sm" variant="secondary" onClick={() => setIsAdding(!isAdding)} leftIcon={<Plus className="w-4 h-4" />}>
            Добавить
          </Button>
       </div>

       {isAdding && (
          <div className="bg-black/40 p-4 rounded-xl border border-white/5 space-y-3 animate-in fade-in slide-in-from-top-2">
             <input 
               placeholder="Название (опционально)"
               className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50"
               value={newServerName}
               onChange={e => setNewServerName(e.target.value)}
             />
             <div className="flex gap-2">
                <input 
                  placeholder="IP Адрес"
                  className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50"
                  value={newServerIp}
                  onChange={e => setNewServerIp(e.target.value)}
                />
                <Button onClick={handleAdd}>OK</Button>
             </div>
          </div>
       )}

       <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
          {servers.length === 0 ? (
             <div className="text-center text-text-secondary text-sm py-8 border-2 border-dashed border-white/5 rounded-xl">
                Нет сохраненных серверов
             </div>
          ) : (
             servers.map(s => (
                <ServerItem key={s.id} server={s} onJoin={handleJoin} onDelete={removeServer} />
             ))
          )}
       </div>
    </div>
  );
};
