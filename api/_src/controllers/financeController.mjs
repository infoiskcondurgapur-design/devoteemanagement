import * as db from '../database.mjs';

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
