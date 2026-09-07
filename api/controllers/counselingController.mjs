import { addCounselingSession, getCounselingSessions, deleteCounselingSession } from '../database.mjs';

export const list = async (req, res) => {
    try {
        const sessions = await getCounselingSessions(req.query.devoteeId);
        res.json({ success: true, data: sessions });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const create = async (req, res) => {
    try {
        const result = await addCounselingSession(req.body);
        res.json({ success: true, id: result.id });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const remove = async (req, res) => {
    try {
        await deleteCounselingSession(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};