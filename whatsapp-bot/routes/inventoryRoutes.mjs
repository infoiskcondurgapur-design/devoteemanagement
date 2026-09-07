import express from 'express';
import * as db from '../database.mjs';

const router = express.Router();

// Categories
router.get('/categories', async (req, res) => {
    try {
        const data = await db.getInventoryCategories();
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/categories', async (req, res) => {
    try {
        const result = await db.addInventoryCategory(req.body);
        res.json({ success: true, id: result.id });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.put('/categories/:id', async (req, res) => {
    try {
        await db.updateInventoryCategory(req.params.id, req.body);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.delete('/categories/:id', async (req, res) => {
    try {
        await db.deleteInventoryCategory(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Items
router.get('/items', async (req, res) => {
    try {
        const { categoryId } = req.query;
        const data = await db.getInventoryItems(categoryId);
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/items/:id', async (req, res) => {
    try {
        const data = await db.getInventoryItemById(req.params.id);
        if (!data) return res.status(404).json({ success: false, error: 'Item not found' });
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/items', async (req, res) => {
    try {
        const result = await db.addInventoryItem(req.body);
        res.json({ success: true, id: result.id });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.put('/items/:id', async (req, res) => {
    try {
        await db.updateInventoryItem(req.params.id, req.body);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.delete('/items/:id', async (req, res) => {
    try {
        await db.deleteInventoryItem(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Transactions
router.get('/transactions', async (req, res) => {
    try {
        const { itemId, limit } = req.query;
        const data = await db.getInventoryTransactions(itemId, limit ? parseInt(limit) : 50);
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/transactions', async (req, res) => {
    try {
        const result = await db.addInventoryTransaction(req.body);
        res.json({ success: true, id: result.id });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
