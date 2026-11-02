import React, { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState(() => {
        const saved = localStorage.getItem('notifications');
        return saved ? JSON.parse(saved) : [];
    });
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        localStorage.setItem('notifications', JSON.stringify(notifications));
        setUnreadCount(notifications.filter(n => !n.read).length);
    }, [notifications]);

    // Auto-clear read notifications older than 30 days
    useEffect(() => {
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        const now = new Date().getTime();
        const cleaned = notifications.filter(n => {
            const created = new Date(n.createdAt).getTime();
            return now - created < thirtyDays || !n.read;
        });
        if (cleaned.length !== notifications.length) {
            setNotifications(cleaned);
        }
    }, [notifications]);

    const addNotification = async (title, message, type = 'info', options = {}) => {
        const newNotif = {
            id: crypto.randomUUID(),
            title,
            message,
            type, // 'info' | 'success' | 'warning' | 'error' | 'sync' | 'backup'
            read: false,
            createdAt: new Date().toISOString(),
            ...options
        };
        setNotifications(prev => [newNotif, ...prev]);
        // Auto-remove after 5 seconds for non-critical notifications
        if (type !== 'error' && !options.persistent) {
            setTimeout(() => {
                deleteNotification(newNotif.id);
            }, 5000);
        }
    };

    const markAsRead = async (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const deleteNotification = async (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const clearAll = async () => {
        setNotifications([]);
    };

    const markAllAsRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            addNotification,
            markAsRead,
            deleteNotification,
            clearAll,
            markAllAsRead
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
