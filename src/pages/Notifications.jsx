import React from 'react';
import { Bell, Info, AlertCircle, CheckCircle, Trash2, CheckSquare } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

const Notifications = () => {
    const { notifications, markAsRead, deleteNotification, clearAll, markAllAsRead } = useNotifications();

    const getIcon = (type) => {
        switch (type) {
            case 'success': return CheckCircle;
            case 'alert': return AlertCircle;
            default: return Info;
        }
    };

    const getColor = (type) => {
        switch (type) {
            case 'success': return 'text-green-600 bg-green-50';
            case 'alert': return 'text-orange-600 bg-orange-50';
            default: return 'text-blue-600 bg-blue-50';
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Stay updated with system activities.</p>
                </div>
                <div className="flex gap-3">
                    {notifications.length > 0 && (
                        <>
                            <button
                                onClick={markAllAsRead}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:bg-slate-900/50"
                            >
                                <CheckSquare size={16} /> Mark all read
                            </button>
                            <button
                                onClick={clearAll}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border border-transparent"
                            >
                                <Trash2 size={16} /> Clear all
                            </button>
                        </>
                    )}
                </div>
            </div>

            {notifications.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 border-dashed">
                    <Bell className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                    <h3 className="text-slate-900 font-medium">No new notifications</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">You are all caught up!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notifications.map((notification) => {
                        const Icon = getIcon(notification.type);
                        const colorClass = getColor(notification.type);

                        return (
                            <div
                                key={notification.id}
                                className={`
                                    relative p-4 rounded-xl border transition-all duration-200 flex gap-4
                                    ${notification.read ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800' : 'bg-blue-50/50 border-blue-100 shadow-sm'}
                                `}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass} flex-shrink-0`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h3 className={`font-semibold text-sm md:text-base ${notification.read ? 'text-slate-700 dark:text-slate-200' : 'text-slate-900'}`}>
                                            {notification.title}
                                        </h3>
                                        <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap ml-2">
                                            {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className={`text-sm mt-1 mb-2 ${notification.read ? 'text-slate-500 dark:text-slate-400' : 'text-slate-700 dark:text-slate-200 font-medium'}`}>
                                        {notification.message}
                                    </p>

                                    <div className="flex gap-4">
                                        {!notification.read && (
                                            <button
                                                onClick={() => markAsRead(notification.id)}
                                                className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                                            >
                                                Mark as read
                                            </button>
                                        )}
                                        <button
                                            onClick={() => deleteNotification(notification.id)}
                                            className="text-xs font-medium text-slate-400 dark:text-slate-500 hover:text-red-500 hover:underline"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                                {!notification.read && (
                                    <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500"></div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Notifications;
