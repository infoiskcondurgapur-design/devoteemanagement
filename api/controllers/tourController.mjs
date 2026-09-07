import * as db from '../database.mjs';

export const getAllTours = async (req, res) => {
    try {
        const { upcoming } = req.query;
        const tours = await db.getTours(upcoming === 'true');
        res.json({ success: true, data: tours });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getTour = async (req, res) => {
    try {
        const tour = await db.getTourById(req.params.id);
        if (!tour) return res.status(404).json({ success: false, error: 'Tour not found' });

        const enrollments = await db.getTourEnrollments(req.params.id);
        res.json({ success: true, data: { ...tour, enrollments } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const createTour = async (req, res) => {
    try {
        const result = await db.createTour(req.body);
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const updateTour = async (req, res) => {
    try {
        await db.updateTour(req.params.id, req.body);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const deleteTour = async (req, res) => {
    try {
        await db.deleteTour(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const enrollDevotee = async (req, res) => {
    try {
        const result = await db.enrollInTour(req.body);
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const updateEnrollment = async (req, res) => {
    try {
        await db.updateTourEnrollment(req.params.id, req.body);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const deleteEnrollment = async (req, res) => {
    try {
        await db.deleteTourEnrollment(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const addPayment = async (req, res) => {
    try {
        const result = await db.addTourPayment(req.body);
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getPayments = async (req, res) => {
    try {
        const payments = await db.getTourPayments(req.params.enrollmentId);
        res.json({ success: true, data: payments });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
