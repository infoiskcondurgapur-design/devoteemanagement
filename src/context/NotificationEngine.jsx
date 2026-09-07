import React, { useEffect, useRef } from 'react';
import { useNotifications } from './NotificationContext';
import { useDevotees } from './DevoteeContext';
import { useToast } from '../components/Toast';

export const NotificationEngine = () => {
    const { addNotification, notifications } = useNotifications();
    const { devotees } = useDevotees();
    const toast = useToast();
    
    // Track processed notifications in this session to avoid infinite loops 
    // if the notification state updates faster than the effect can react
    const processedRef = useRef(new Set());

    useEffect(() => {
        if (!devotees || devotees.length === 0) return;

        const today = new Date();
        const todayDateStr = today.toISOString().slice(0, 10);
        const mm = today.getMonth() + 1;
        const dd = today.getDate();

        // 1. Birthdays Today
        const birthdaysToday = devotees.filter(d => {
            if (!d.dob) return false;
            const parts = d.dob.split('-');
            return parts.length === 3 && parseInt(parts[1]) === mm && parseInt(parts[2]) === dd;
        });

        if (birthdaysToday.length > 0) {
            const names = birthdaysToday.map(d => d.initiatedName || d.name).join(', ');
            const notificationKey = `birthday-${todayDateStr}-${names}`;
            
            const alreadyNotified = notifications.some(
                n => n.type === 'birthday' && n.createdAt.slice(0, 10) === todayDateStr
            );

            if (!alreadyNotified && !processedRef.current.has(notificationKey)) {
                processedRef.current.add(notificationKey);
                addNotification(
                    '🎉 Birthdays Today!',
                    `${names} have their birthday today. Open Communication hub to send wishes.`,
                    'birthday'
                );
                toast.info(`🎉 It's ${names}'s birthday today!`);
            }
        }

        // 2. Anniversaries Today
        const anniversariesToday = devotees.filter(d => {
            if (!d.anniversary) return false;
            const parts = d.anniversary.split('-');
            return parts.length === 3 && parseInt(parts[1]) === mm && parseInt(parts[2]) === dd;
        });

        if (anniversariesToday.length > 0) {
            const names = anniversariesToday.map(d => d.initiatedName || d.name).join(', ');
            const notificationKey = `anniversary-${todayDateStr}-${names}`;

            const alreadyNotified = notifications.some(
                n => n.type === 'anniversary' && n.createdAt.slice(0, 10) === todayDateStr
            );

            if (!alreadyNotified && !processedRef.current.has(notificationKey)) {
                processedRef.current.add(notificationKey);
                addNotification(
                    '💐 Anniversaries Today!',
                    `Wish ${names} a happy anniversary from the Communication hub.`,
                    'anniversary'
                );
                toast.info(`💐 It's ${names}'s anniversary today!`);
            }
        }

        // 3. Activity Reminder (once per day)
        const checkedInactive = localStorage.getItem('dms_inactive_checked');
        if (checkedInactive !== todayDateStr) {
            addNotification(
                '⚠️ Activity Reminder',
                `Check Devotee Profiles to ensure sadhana logs are up to date. Devotees inactive for 30+ days need attention.`,
                'warning'
            );
            localStorage.setItem('dms_inactive_checked', todayDateStr);
        }

    }, [devotees, notifications, addNotification, toast]); // notifications included to fix stale closure, processedRef ensures no loops

    return null;
};
