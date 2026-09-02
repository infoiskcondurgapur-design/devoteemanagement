import React, { useState } from 'react';
import {
  Menu,
  ChevronRight,
  Search,
  Moon,
  Sun,
  Bell,
  Radio
} from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
  globalSearch: string;
  setGlobalSearch: (term: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  globalSearch,
  setGlobalSearch,
}) => {
  const [isDark, setIsDark] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(true);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-8 bg-white border-b border-slate-200/80 shadow-xs">
      {/* Left side: Hamburger & Breadcrumbs */}
      <div className="flex items-center gap-3 md:gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          title="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <nav className="flex items-center gap-1.5 text-xs md:text-sm text-slate-500 font-medium">
          <span className="hover:text-slate-800 transition-colors cursor-pointer">App</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-semibold">Courses</span>
        </nav>
      </div>

      {/* Right side: Global Search & Actions & Profile */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Search Bar */}
        <div className="relative hidden sm:block w-48 md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Search..."
            className="w-full pl-9 pr-3 py-1.5 text-xs md:text-sm bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-slate-800 rounded-full border border-transparent focus:border-blue-400 focus:outline-hidden transition-all"
          />
        </div>

        {/* Live Status Icon */}
        <div className="flex items-center justify-center p-1.5 text-emerald-500 hover:bg-slate-100 rounded-full cursor-pointer" title="Online / System active">
          <div className="relative flex items-center justify-center">
            <Radio className="w-4 h-4 text-emerald-500" />
            <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
          </div>
        </div>

        {/* Dark/Light mode toggle */}
        <button
          onClick={() => setIsDark(!isDark)}
          className="p-2 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors"
          title="Toggle theme"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notification Bell */}
        <button
          onClick={() => setHasNotifications(false)}
          className="relative p-2 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {hasNotifications && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          )}
        </button>

        {/* User Profile Pill */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
          <div className="hidden lg:block text-right leading-tight">
            <div className="text-xs font-bold text-slate-800">Admin</div>
            <div className="text-[11px] text-slate-500">Manager</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-800 font-bold text-xs shadow-xs">
            A
          </div>
        </div>
      </div>
    </header>
  );
};

