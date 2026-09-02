import React from 'react';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  CalendarCheck,
  Briefcase,
  IndianRupee,
  Share2,
  MapPin,
  BarChart3,
  MessageSquare,
  Calendar,
  GraduationCap,
  Compass,
  Shield,
  Settings,
  Wrench,
  ChevronLeft,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onCloseMobile,
  activeTab,
  setActiveTab,
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'devotees', label: 'Devotees', icon: Users },
    { id: 'counseling', label: 'Counseling', icon: UserCheck },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'seva-board', label: 'Seva Board', icon: Briefcase },
    { id: 'finance', label: 'Finance', icon: IndianRupee },
    { id: 'network', label: 'Network', icon: Share2 },
    { id: 'live-map', label: 'Live Map', icon: MapPin },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'communication', label: 'Communication', icon: MessageSquare },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'courses', label: 'Courses', icon: GraduationCap },
    { id: 'tours', label: 'Tours', icon: Compass },
    { id: 'users-roles', label: 'Users & Roles', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
  ];

  return (
    <>
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 flex flex-col bg-[#07172C] text-slate-300 transition-transform duration-300 ease-in-out shrink-0 border-r border-slate-800/60 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-900/40">
              <Share2 className="w-5 h-5 rotate-45" />
            </div>
            <div className="leading-tight">
              <div className="font-bold text-white text-[17px] tracking-tight">
                Devotee
              </div>
              <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                MANAGEMENT
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onCloseMobile}
              className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800/80 md:hidden"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              className="hidden md:flex text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800/60 transition-colors"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          <div className="px-3 pt-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Main Menu
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#0062FF] text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* User / Profile Footer */}
        <div className="p-3 border-t border-slate-800/60 bg-[#061324]">
          <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-xs shadow">
              A
            </div>
            <div className="truncate text-left leading-tight">
              <div className="font-semibold text-white text-xs">Admin</div>
              <div className="text-[11px] text-slate-400">Admin</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

