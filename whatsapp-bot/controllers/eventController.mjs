import { 
    createEvent, createEventsBulk, getEvents, deleteEvent, updateEvent 
} from '../database.mjs';
import { broadcast } from '../services/wsService.mjs';

export const getAllEvents = async (req, res) => {
    try {
        const events = await getEvents();
        res.json({ success: true, data: events });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const create = async (req, res) => {
    try {
        const result = await createEvent(req.body);
        broadcast('DATA_MUTATED');
        res.json({ success: true, id: result.id });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const update = async (req, res) => {
    try {
        await updateEvent(req.params.id, req.body);
        broadcast('DATA_MUTATED');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const remove = async (req, res) => {
    try {
        await deleteEvent(req.params.id);
        broadcast('DATA_MUTATED');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const createBulk = async (req, res) => {
    try {
        const events = req.body;
        if (!Array.isArray(events)) return res.status(400).json({ success: false, error: 'Expected an array of events' });
        const result = await createEventsBulk(events);
        broadcast('DATA_MUTATED');
        res.json({ success: true, count: result.count });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
