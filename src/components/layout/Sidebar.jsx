import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiTool } from 'react-icons/fi';
import { LayoutDashboard, Users, Calendar, CalendarDays, Share2, MapPin, BarChart3, CalendarCheck, Shield, Briefcase, IndianRupee, GraduationCap, MessageSquare, Download, ChevronLeft, User } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';
import { useDevotees } from '../../context/DevoteeContext';
import { useTranslation } from '../../context/LanguageContext';
import { usePWA } from '../../hooks/usePWA';

const Sidebar = ({ isOpen, toggle }) => {
    const { currentUser, isAdmin, isCounselor } = useAuth();
    const { devotees } = useDevotees();
    const { t } = useTranslation();
    const { isInstallable, installApp } = usePWA();

    const myDevoteeId = currentUser?.devoteeId || (Array.isArray(devotees) ? devotees.find(d => d.contact === currentUser?.username)?.id : null);
    const myProfilePath = myDevoteeId ? `/devotees/${myDevoteeId}` : '/profile';

    const allNavItems = [
        { name: t('dashboard'), icon: LayoutDashboard, path: '/', requires: 'counselor' },
        // For admin and counselors, show full congregation Devotee directory
        { name: t('devotees'), icon: Users, path: '/devotees', requires: 'counselor' },
        // For regular devotees, show their own profile directly
        { name: 'My Profile', icon: User, path: myProfilePath, requires: 'viewer_only' },
        { name: 'Counseling', icon: Users, path: '/counseling', requires: 'counselor' },
        { name: 'Attendance', icon: CalendarCheck, path: '/attendance', requires: 'counselor' },
        { name: t('seva'), icon: Briefcase, path: '/seva', requires: 'counselor' },
        { name: t('finance'), icon: IndianRupee, path: '/finance', requires: 'admin' },
        { name: 'Network', icon: Share2, path: '/network', requires: 'counselor' },
        { name: 'Reports', icon: BarChart3, path: '/reports', requires: 'admin' },
        { name: 'Communication', icon: MessageSquare, path: '/communication', requires: 'admin' },
        { name: 'Events', icon: Calendar, path: '/events', requires: 'counselor' },
        { name: 'Vaishnava Calendar', icon: CalendarDays, path: '/calendar', requires: 'counselor' },
        { name: 'Courses', icon: GraduationCap, path: '/courses', requires: 'counselor' },
        { name: 'Tours', icon: MapPin, path: '/tours', requires: 'counselor' },
        { name: 'Users & Roles', icon: Shield, path: '/users', requires: 'admin' },
        { name: t('settings'), icon: FiTool, path: '/settings', requires: 'admin' },
        { name: 'Maintenance', icon: FiTool, path: '/maintenance', requires: 'admin' },
    ];

    const navItems = allNavItems.filter(item => {
        if (!item.requires) return true;
        if (item.requires === 'admin') return isAdmin;
        if (item.requires === 'counselor') return isAdmin || isCounselor;
        if (item.requires === 'viewer_only') return !isAdmin && !isCounselor;
        return true;
    });

    return (
        <aside className={clsx(
            "fixed left-0 top-0 h-screen w-64 bg-[#142324] border-r border-[#243e40] flex flex-col z-50 overflow-hidden text-[#cde0dc] transition-transform duration-300 ease-in-out",
            isOpen ? "translate-x-0" : "-translate-x-full"
        )}>
            
            {/* Logo Area */}
            <div className="h-20 flex items-center justify-between px-6 border-b border-[#243e40]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#243f41] border border-[#385b5d] flex items-center justify-center text-amber-300 font-bold shadow-md">
                        <Share2 size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-[#cde0dc] line-height-1">Devotee</h1>
                        <p className="text-[10px] uppercase tracking-widest text-[#86a09c] font-bold">Management</p>
                    </div>
                </div>
                <button
                    onClick={toggle}
                    className="p-1.5 text-muted-foreground hover:text-[#cde0dc] hover:bg-[#203638] rounded-lg transition-all"
                    title="Collapse Menu"
                >
                    <ChevronLeft size={18} />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 space-y-1 overflow-y-auto px-3 relative">
                <div className="pb-4">
                    <p className="px-3 text-[10px] font-bold text-[#6d8e89] uppercase tracking-wider mb-4">Main Menu</p>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                clsx(
                                    'group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium mb-1',
                                    isActive
                                        ? 'bg-[#243f41] text-amber-300 font-bold border-l-4 border-amber-400 shadow-sm'
                                        : 'text-[#8fa8a4] hover:bg-[#1f3536] hover:text-[#c4d7d3]'
                                )
                            }
                        >
                            <item.icon className="w-5 h-5 opacity-80 group-hover:opacity-100 transition-opacity" />
                            <span>{item.name}</span>
                        </NavLink>
                    ))}
                </div>
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-[#243e40] bg-[#101e1f] space-y-2">
                {isInstallable && (
                    <button
                        onClick={installApp}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all duration-200 group"
                    >
                        <Download className="w-5 h-5 opacity-80 group-hover:opacity-100 animate-bounce" />
                        <span className="text-sm font-medium">Install App</span>
                    </button>
                )}

                {/* Small User Info */}
                <div className="mt-4 px-3 flex items-center gap-3 pt-4 border-t border-[#243e40]">
                    <div className="w-8 h-8 rounded-lg bg-[#243f41] border border-[#385b5d] flex items-center justify-center text-[10px] font-black text-amber-300 shadow-sm">
                        {(currentUser?.fullName || currentUser?.displayName || currentUser?.name || currentUser?.username || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate text-[#c4d7d3]">{currentUser?.fullName || currentUser?.displayName || currentUser?.name || currentUser?.username || 'User'}</p>
                        <p className="text-[10px] text-muted-foreground truncate capitalize font-bold">{currentUser?.role || 'Viewer'}</p>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
