import * as db from '../database.mjs';

// --- Donations ---
export const getAllDonations = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 200;
        const result = await db.getDonations(limit);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const createDonation = async (req, res) => {
    try {
        const result = await db.addDonation(req.body);
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const removeDonation = async (req, res) => {
    try {
        const result = await db.deleteDonation(req.params.id);
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// --- Expenses ---
export const getAllExpenses = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 200;
        const result = await db.getExpenses(limit);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const createExpense = async (req, res) => {
    try {
        const result = await db.addExpense(req.body);
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const removeExpense = async (req, res) => {
    try {
        const result = await db.deleteExpense(req.params.id);
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// --- Expense Categories (Dynamic from Tours & Courses) ---
export const getExpenseCategories = async (req, res) => {
    try {
        const [tours, courses] = await Promise.all([
            db.getTours(false),
            db.getCourses(false)
        ]);

        const seenTours = new Set();
        const uniqueTours = [];
        for (const t of (tours || [])) {
            const name = (t.name || '').trim();
            if (name && !seenTours.has(name.toLowerCase())) {
                seenTours.add(name.toLowerCase());
                uniqueTours.push({ id: t.id, name });
            }
        }

        const seenCourses = new Set();
        const uniqueCourses = [];
        for (const c of (courses || [])) {
            const name = (c.name || '').trim();
            if (name && !seenCourses.has(name.toLowerCase())) {
                seenCourses.add(name.toLowerCase());
                uniqueCourses.push({ id: c.id, name });
            }
        }

        res.json({
            success: true,
            data: {
                tours: uniqueTours,
                courses: uniqueCourses
            }
        });
    } catch (error) {
        console.error('[FinanceController] getExpenseCategories error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// --- General Finance ---
export const getStats = async (req, res) => {
    try {
        const result = await db.getFinanceStats();
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getHistory = async (req, res) => {
    try {
        const limit = parseInt(req.query.months) || 12;
        const result = await db.getFinancialHistory(limit);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getBudgets = async (req, res) => {
    try {
        const { month, year } = req.query;
        const result = await db.getBudgets(parseInt(month), parseInt(year));
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const setBudget = async (req, res) => {
    try {
        const result = await db.setBudget(req.body);
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getBudgetPerformance = async (req, res) => {
    try {
        const { month, year } = req.query;
        const result = await db.getBudgetPerformance(parseInt(month), parseInt(year));
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
