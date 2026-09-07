import {
    getDevotees, getDevoteeStats, getDevoteeByPhone, getDevoteeById,
    addDevotee, updateDevotee, deleteDevotee, getFilterOptions
} from '../database.mjs';
import { uploadImageToCloudinary } from '../cloudinary-service.mjs';

export const getAllDevotees = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const offset = parseInt(req.query.offset) || 0;
        const search = req.query.search || '';

        const filters = {
            status: req.query.status || '',
            gender: req.query.gender || '',
            counselor: req.query.counselor || '',
            spiritualStatus: req.query.spiritualStatus || '',
            district: req.query.district || ''
        };

        const result = await getDevotees(limit, offset, search, filters);
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getFilterOptionsController = async (req, res) => {
    try {
        const options = await getFilterOptions();
        res.json({ success: true, ...options });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getStats = async (req, res) => {
    try {
        const stats = await getDevoteeStats();
        res.json({ success: true, ...stats });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const searchByPhone = async (req, res) => {
    try {
        const phone = req.query.phone;
        if (!phone) return res.status(400).json({ success: false, error: 'Phone query parameter required' });
        const devotee = await getDevoteeByPhone(phone);
        res.json({ success: true, data: devotee });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getById = async (req, res) => {
    try {
        const devotee = await getDevoteeById(req.params.id);
        if (!devotee) return res.status(404).json({ success: false, error: 'Devotee not found' });
        res.json({ success: true, data: devotee });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const create = async (req, res) => {
    try {
        const devoteeBody = req.body;
        if (devoteeBody.photo && devoteeBody.photo.startsWith('data:image/')) {
            devoteeBody.photo = await uploadImageToCloudinary(devoteeBody.photo);
        }
        const result = await addDevotee(devoteeBody);
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const update = async (req, res) => {
    try {
        const devoteeBody = req.body;
        if (devoteeBody.photo && devoteeBody.photo.startsWith('data:image/')) {
            devoteeBody.photo = await uploadImageToCloudinary(devoteeBody.photo);
        }
        const result = await updateDevotee(req.params.id, devoteeBody);
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const remove = async (req, res) => {
    try {
        const result = await deleteDevotee(req.params.id);
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
