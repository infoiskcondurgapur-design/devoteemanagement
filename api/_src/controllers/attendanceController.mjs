import {
    markAttendance, removeAttendance, getAttendanceByEvent,
    getAttendanceSummary, getRecentAttendanceEvents
} from '../database.mjs';

export const list = async (req, res) => {
    try {
        const { eventName, eventDate, summary } = req.query;

        let data;
        if (summary === 'true') {
            data = await getAttendanceSummary();
        } else if (eventName && eventDate) {
            data = await getAttendanceByEvent(eventName, eventDate);
        } else {
            data = await getRecentAttendanceEvents(30);
        }

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const save = async (req, res) => {
    try {
        const { devoteeIds, devoteeId, eventName, eventDate } = req.body;
        if (!eventName || !eventDate) {
            return res.status(400).json({ success: false, error: 'eventName and eventDate are required' });
        }

        if (Array.isArray(devoteeIds)) {
            const current = await getAttendanceByEvent(eventName, eventDate);
            const currentIds = new Set(current.map(x => x.devoteeId));
            const desiredIds = new Set(devoteeIds);

            for (const id of currentIds) {
                if (!desiredIds.has(id)) {
                    await removeAttendance({ devoteeId: id, eventName, eventDate });
                }
            }
            for (const id of desiredIds) {
                await markAttendance({ devoteeId: id, eventName, eventDate });
            }
            res.json({ success: true, count: devoteeIds.length });
        } else if (devoteeId) {
            await markAttendance({ devoteeId, eventName, eventDate });
            res.json({ success: true });
        } else {
            res.status(400).json({ success: false, error: 'devoteeIds or devoteeId is required' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};