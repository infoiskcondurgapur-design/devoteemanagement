import { 
    getSadhana, addSadhanaEntry, deleteSadhanaEntry 
} from '../database.mjs';
import { broadcast } from '../services/wsService.mjs';

export const getByDevotee = async (req, res) => {
    try {
        const entries = await getSadhana(req.params.devoteeId);
        res.json({ success: true, data: entries });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const create = async (req, res) => {
    try {
        const result = await addSadhanaEntry(req.body);
        broadcast('DATA_MUTATED');
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const remove = async (req, res) => {
    try {
        const result = await deleteSadhanaEntry(req.params.id);
        broadcast('DATA_MUTATED');
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
