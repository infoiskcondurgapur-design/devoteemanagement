import React from 'react';
import { Bell, Settings, Search, ChevronRight, User, Menu, Sun, Moon } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import PwaInstallPrompt from '../PwaInstallPrompt';
import NetworkStatus from '../NetworkStatus';

const Header = ({ toggleSidebar, isSidebarOpen }) => {
    const { unreadCount } = useNotifications();
    const location = useLocation();
    const { currentUser } = useAuth();
    const { darkMode, toggleDarkMode } = useTheme();

    // Simple breadcrumb logic
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = pathSegments.length > 0 ? pathSegments : ['Dashboard'];

    return (
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm transition-colors duration-200">

            {/* Left: Breadcrumbs / Title */}
            <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-400">
                <button
                    onClick={toggleSidebar}
                    className="p-2 -ml-2 text-slate-500 dark:text-slate-400 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800 hover:text-slate-800 dark:text-slate-100 dark:hover:text-slate-200 rounded-lg transition-all"
                    title={isSidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
                >
                    <Menu className="w-5 h-5" />
                </button>
                <span className="font-medium text-slate-700 dark:text-slate-200 dark:text-slate-300">App</span>
                {breadcrumbs.map((segment, index) => (
                    <React.Fragment key={index}>
                        <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 dark:text-slate-500" />
                        <span className="capitalize font-medium text-slate-800 dark:text-slate-100 dark:text-slate-200">
                            {segment.replace('-', ' ')}
                        </span>
                    </React.Fragment>
                ))}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-4">
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 dark:text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="pl-9 pr-4 py-1.5 bg-slate-100 dark:bg-slate-800 dark:bg-slate-800 border-none rounded-full text-sm text-slate-800 dark:text-slate-100 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:bg-white dark:bg-slate-900 dark:focus:bg-slate-750 transition-all w-64 hidden sm:block"
                    />
                </div>

                <NetworkStatus />
                <PwaInstallPrompt />

                {/* Theme Toggle Button */}
                <button
                    onClick={toggleDarkMode}
                    className="p-2 text-slate-500 dark:text-slate-400 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800 rounded-full transition-colors"
                    title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                    {darkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
                </button>

                <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-2"></div>

                <Link to="/notifications" className="relative p-2 text-slate-500 dark:text-slate-400 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-900/50 dark:hover:bg-slate-800 rounded-full transition-colors">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                    )}
                </Link>

                <div className="pl-2 flex items-center gap-3">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 dark:text-slate-200 leading-none">{currentUser?.displayName || 'Admin'}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-400 mt-0.5">Manager</p>
                    </div>
                    <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center font-bold border-2 border-white dark:border-slate-800 shadow-sm">
                        {currentUser?.displayName?.[0] || 'A'}
                    </div>
                </div>
            </div>
        </header >
    );
};

export default Header;
