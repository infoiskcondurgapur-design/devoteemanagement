import * as db from '../database.mjs';

export const getAll = async (req, res) => {
    try {
        const result = await db.getSevas();
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const create = async (req, res) => {
    try {
        const result = await db.addSeva(req.body);
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const update = async (req, res) => {
    try {
        const result = await db.updateSeva(req.params.id, req.body);
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const remove = async (req, res) => {
    try {
        const result = await db.deleteSeva(req.params.id);
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
