import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Package, 
  Settings, 
  Gamepad2,
  Shirt
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useStore } from '../../store/useStore';

const navItems = [
  { icon: Home, label: 'Главная', path: '/' },
  { icon: Gamepad2, label: 'Версии', path: '/versions' },
  { icon: Users, label: 'Аккаунты', path: '/accounts' },
  { icon: Package, label: 'Контент', path: '/content' },
  { icon: Shirt, label: 'Скины', path: '/skins' },
  { icon: Settings, label: 'Настройки', path: '/settings' },
];

export const Sidebar: React.FC = () => {
  const { activeAccount } = useStore();

  return (
    <div className="h-full w-20 flex flex-col items-center py-6 bg-black/20 backdrop-blur-xl border-r border-white/5 z-50">
      <div className="mb-8 relative group cursor-pointer">
        <div className="w-12 h-12 rounded-2xl overflow-hidden bg-primary/20 flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_20px_-5px_var(--color-primary)]">
          <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain drop-shadow-md" />
        </div>
      </div>
      
      <nav className="flex-1 flex flex-col gap-3 w-full px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "relative flex items-center justify-center w-full aspect-square rounded-xl transition-all duration-300 group",
              isActive 
                ? "bg-primary text-white shadow-lg shadow-primary/25" 
                : "text-text-secondary hover:bg-white/5 hover:text-white"
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn(
                  "w-6 h-6 transition-transform duration-300",
                  !isActive && "group-hover:scale-110"
                )} />
                
                {/* Tooltip */}
                <div className="absolute left-full ml-4 px-3 py-1.5 bg-[#1a1a1c] border border-white/10 rounded-lg text-sm font-medium text-white opacity-0 -translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap z-50 shadow-xl">
                  {item.label}
                  {/* Arrow */}
                  <div className="absolute top-1/2 right-full -mt-1 -mr-1 border-4 border-transparent border-r-[#1a1a1c] border-b-transparent border-t-transparent" />
                </div>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto px-3">
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden hover:border-primary/50 transition-colors cursor-pointer group relative">
           {activeAccount ? (
             <img src={activeAccount.avatarUrl} alt={activeAccount.username} className="w-full h-full object-cover" />
           ) : (
             <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/10 animate-pulse" />
           )}
           
           <div className="absolute left-full ml-4 px-3 py-1.5 bg-[#1a1a1c] border border-white/10 rounded-lg text-sm font-medium text-white opacity-0 -translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap z-50 shadow-xl">
              {activeAccount?.username || 'Войти'}
           </div>
        </div>
      </div>
    </div>
  );
};
