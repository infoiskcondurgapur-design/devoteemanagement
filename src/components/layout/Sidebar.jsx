import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiTool } from 'react-icons/fi';
import { LayoutDashboard, Users, Calendar, Share2, MapPin, BarChart3, CalendarCheck, Shield, Briefcase, IndianRupee, GraduationCap, MessageSquare, Download, ChevronLeft } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/LanguageContext';
import { usePWA } from '../../hooks/usePWA';

const Sidebar = ({ isOpen, toggle }) => {
    const { currentUser } = useAuth();
    const { t } = useTranslation();
    const { isInstallable, installApp } = usePWA();

    const navItems = [
        { name: t('dashboard'), icon: LayoutDashboard, path: '/' },
        { name: t('devotees'), icon: Users, path: '/devotees' },
        { name: 'Counseling', icon: Users, path: '/counseling' },
        { name: 'Attendance', icon: CalendarCheck, path: '/attendance' },
        { name: t('seva'), icon: Briefcase, path: '/seva' },
        { name: t('finance'), icon: IndianRupee, path: '/finance' },
        { name: 'Network', icon: Share2, path: '/network' },
        { name: 'Live Map', icon: MapPin, path: '/map' },
        { name: 'Reports', icon: BarChart3, path: '/reports' },
        { name: 'Communication', icon: MessageSquare, path: '/communication' },
        { name: 'Events', icon: Calendar, path: '/events' },
        { name: 'Courses', icon: GraduationCap, path: '/courses' },
        { name: 'Tours', icon: MapPin, path: '/tours' },
        { name: 'Users & Roles', icon: Shield, path: '/users' },
        { name: t('settings'), icon: FiTool, path: '/settings' },
        { name: 'Maintenance', icon: FiTool, path: '/maintenance' },
    ];

    return (
        <aside className={clsx(
            "fixed left-0 top-0 h-screen w-64 bg-corporate-700 dark:bg-slate-950 border-r border-corporate-800 dark:border-slate-800 flex flex-col z-50 overflow-hidden text-white transition-transform duration-300 ease-in-out",
            isOpen ? "translate-x-0" : "-translate-x-full"
        )}>
            
            {/* Logo Area */}
            <div className="h-20 flex items-center justify-between px-6 border-b border-corporate-600/30 dark:border-slate-800/80">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-corporate-600 dark:bg-slate-800 flex items-center justify-center text-white font-bold shadow-lg">
                        <Share2 size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-white line-height-1">Devotee</h1>
                        <p className="text-[10px] uppercase tracking-widest text-blue-200/60 font-bold">Management</p>
                    </div>
                </div>
                <button
                    onClick={toggle}
                    className="p-1.5 text-blue-200/50 hover:text-white hover:bg-corporate-600/40 dark:hover:bg-slate-800 rounded-lg transition-all"
                    title="Collapse Menu"
                >
                    <ChevronLeft size={18} />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 space-y-1 overflow-y-auto px-3 relative">
                <div className="pb-4">
                    <p className="px-3 text-[10px] font-bold text-blue-200/40 uppercase tracking-wider mb-4">Main Menu</p>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                clsx(
                                    'group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium mb-1',
                                    isActive
                                        ? 'bg-corporate-600 dark:bg-slate-800 text-white shadow-md'
                                        : 'text-blue-100/70 hover:bg-corporate-600/30 dark:hover:bg-slate-800 hover:text-white'
                                )
                            }
                        >
                            <item.icon className={clsx("w-5 h-5 opacity-80 group-hover:opacity-100 transition-opacity")} />
                            <span>{item.name}</span>
                        </NavLink>
                    ))}
                </div>
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-corporate-600/30 dark:border-slate-800/80 bg-corporate-800/50 dark:bg-slate-900 space-y-2">
                {isInstallable && (
                    <button
                        onClick={installApp}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-orange-400 hover:bg-orange-500/10 rounded-lg transition-all duration-200 group"
                    >
                        <Download className="w-5 h-5 opacity-80 group-hover:opacity-100 animate-bounce" />
                        <span className="text-sm font-medium">Install App</span>
                    </button>
                )}

                {/* Small User Info */}
                <div className="mt-4 px-3 flex items-center gap-3 pt-4 border-t border-corporate-600/20 dark:border-slate-800/80">
                    <div className="w-8 h-8 rounded-lg bg-corporate-600 dark:bg-slate-800 border border-corporate-500/30 dark:border-slate-700 flex items-center justify-center text-[10px] font-black text-white">
                        {currentUser?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate text-white">{currentUser?.name || 'User'}</p>
                        <p className="text-[10px] text-blue-200/50 truncate capitalize font-bold">admin</p>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
