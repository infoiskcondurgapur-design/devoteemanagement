import React from 'react';
import { Bell, Search, ChevronRight, Menu, Sun, Moon, LogOut, Glasses } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import clsx from 'clsx';
import PwaInstallPrompt from '../PwaInstallPrompt';
import NetworkStatus from '../NetworkStatus';
import HeaderSearch from './HeaderSearch';

const Header = ({ toggleSidebar, isSidebarOpen }) => {
    const { unreadCount } = useNotifications();
    const location = useLocation();
    const { currentUser, logout } = useAuth();
    const { darkMode, toggleDarkMode, eyeProtectMode, toggleEyeProtect } = useTheme();

    // Simple breadcrumb logic
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = pathSegments.length > 0 ? pathSegments : ['Dashboard'];

    return (
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm transition-colors duration-200">

            {/* Left: Breadcrumbs / Title */}
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <button
                    onClick={toggleSidebar}
                    className="p-2 -ml-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-all"
                    title={isSidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
                >
                    <Menu className="w-5 h-5" />
                </button>
                <span className="font-medium text-foreground/80">App</span>
                {breadcrumbs.map((segment, index) => (
                    <React.Fragment key={index}>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
                        <span className="capitalize font-medium text-foreground">
                            {segment.replace('-', ' ')}
                        </span>
                    </React.Fragment>
                ))}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3 sm:gap-4">
                <HeaderSearch />

                <NetworkStatus />
                <PwaInstallPrompt />

                {/* Eye Comfort Mode Toggle */}
                <button
                    onClick={toggleEyeProtect}
                    className={clsx(
                        "p-2 rounded-full transition-all relative flex items-center justify-center",
                        eyeProtectMode
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 ring-2 ring-amber-400/40 shadow-sm"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                    title={eyeProtectMode ? "চোখের সুরক্ষা সক্রিয় (Eye Comfort ON - Click to disable)" : "চোখের সুরক্ষা অন করুন (Enable Eye Comfort Mode)"}
                    aria-label="Toggle Eye Comfort Mode"
                >
                    <Glasses className="w-5 h-5" />
                    {eyeProtectMode && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                    )}
                </button>

                {/* Dark / Light Theme Toggle Button */}
                <button
                    onClick={toggleDarkMode}
                    className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-full transition-colors"
                    title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                    {darkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
                </button>

                <div className="h-8 w-px bg-border mx-1 sm:mx-2"></div>

                <Link to="/notifications" className="relative p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-card"></span>
                    )}
                </Link>

                <div className="pl-1 sm:pl-2 flex items-center gap-3">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-semibold text-foreground leading-none">
                            {currentUser?.fullName || currentUser?.displayName || currentUser?.name || currentUser?.username || 'Devotee'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                            {currentUser?.role ? `${currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}` : 'Devotee'}
                        </p>
                    </div>
                    <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center font-bold border-2 border-card shadow-sm">
                        {(currentUser?.fullName || currentUser?.displayName || currentUser?.name || currentUser?.username || 'D').charAt(0).toUpperCase()}
                    </div>
                </div>

                {/* Sign out */}
                <button
                    onClick={logout}
                    className="p-2 text-muted-foreground hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-full transition-colors"
                    title="Sign Out"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
};

export default Header;
