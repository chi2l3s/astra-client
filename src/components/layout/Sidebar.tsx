import React from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  Users,
  Package,
  Settings,
  Gamepad2,
  Shirt,
  PanelLeft,
  PanelRight,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useStore } from "../../store/useStore";
import logo from "../../assets/logo.png";

const navItems = [
  { icon: Home, label: "Главная", path: "/" },
  { icon: Gamepad2, label: "Версии", path: "/versions" },
  { icon: Users, label: "Аккаунты", path: "/accounts" },
  { icon: Package, label: "Контент", path: "/content" },
  { icon: Shirt, label: "Скины", path: "/skins" },
  { icon: Settings, label: "Настройки", path: "/settings" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { activeAccount } = useStore();

  return (
    <div
      className={cn(
        "h-full flex flex-col py-6 bg-black/20 backdrop-blur-xl border-r border-white/5 z-50 transition-all duration-300 ease-out",
        collapsed ? "w-20 items-center" : "w-64 items-stretch px-4",
      )}
    >
      <div
        className={cn(
          "mb-8 relative flex items-center justify-between",
          collapsed ? "w-full px-0" : "w-full pr-3",
        )}
      >
        <div className={cn("group cursor-pointer", collapsed ? "mx-auto" : "")}>
          <div className="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_20px_-5px_var(--color-primary)]">
            <img
              src={logo}
              alt="Logo"
              className="w-10 h-10 object-contain drop-shadow-md"
            />
          </div>
        </div>
        <button
          onClick={onToggle}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 right-0 translate-x-1/2 h-10 w-6 rounded-full",
            "transition-all duration-300",
            "flex items-center justify-center",
          )}
          aria-label={collapsed ? "Развернуть" : "Свернуть"}
        >
          {collapsed ? (
            <PanelRight className="w-4 h-4 text-text-secondary" />
          ) : (
            <PanelLeft className="w-4 h-4 text-text-secondary" />
          )}
        </button>
      </div>

      <nav
        className={cn(
          "flex-1 flex flex-col gap-3 w-full",
          collapsed ? "px-3" : "",
        )}
      >
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "relative flex items-center rounded-xl transition-all duration-300 group",
                collapsed
                  ? "justify-center w-full aspect-square"
                  : "justify-start w-full px-4 py-3 gap-3",
                isActive
                  ? "bg-primary text-white"
                  : "text-text-secondary hover:bg-white/5 hover:text-white",
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={cn(
                    "w-6 h-6 transition-transform duration-300",
                    !isActive && "group-hover:scale-110",
                  )}
                />

                {!collapsed && (
                  <span className="text-sm font-medium tracking-wide">
                    {item.label}
                  </span>
                )}

                {collapsed && (
                  <div className="absolute left-full ml-4 px-3 py-1.5 bg-[#1a1a1c] border border-white/10 rounded-lg text-sm font-medium text-white opacity-0 -translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap z-50 shadow-xl">
                    {item.label}
                    <div className="absolute top-1/2 right-full -mt-1 -mr-1 border-4 border-transparent border-r-[#1a1a1c] border-b-transparent border-t-transparent" />
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className={cn("mt-auto", collapsed ? "px-3" : "")}>
        <div
          className={cn(
            "rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden hover:border-primary/50 transition-colors cursor-pointer group relative",
            collapsed ? "w-12 h-12" : "w-full h-12 px-3 gap-3 justify-start",
          )}
        >
          <div
            className={cn(
              "rounded-xl overflow-hidden",
              collapsed ? "w-12 h-12" : "w-10 h-10",
            )}
          >
            {activeAccount ? (
              <img
                src={activeAccount.avatarUrl}
                alt={activeAccount.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/10 animate-pulse" />
            )}
          </div>

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
                {activeAccount?.username || "Войти"}
              </div>
              <div className="text-xs text-text-secondary">Профиль</div>
            </div>
          )}

          {collapsed && (
            <div className="absolute left-full ml-4 px-3 py-1.5 bg-[#1a1a1c] border border-white/10 rounded-lg text-sm font-medium text-white opacity-0 -translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap z-50 shadow-xl">
              {activeAccount?.username || "Войти"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
