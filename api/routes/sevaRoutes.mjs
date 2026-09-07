import express from 'express';
import * as db from '../database.mjs';
import * as sevaController from '../controllers/sevaController.mjs';

const router = express.Router();

router.get('/', sevaController.getAll);
router.post('/', sevaController.create);
router.put('/:id', sevaController.update);
router.delete('/:id', sevaController.remove);

router.get('/shifts', async (req, res) => {
    try {
        const { date, department } = req.query;
        const data = await db.getSevaShifts(date, department);
        res.json({ success: true, data });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

router.post('/shifts', async (req, res) => {
    try {
        const result = await db.createSevaShift(req.body);
        res.json({ success: true, id: result.id });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

router.put('/shifts/:id', async (req, res) => {
    try {
        await db.updateSevaShift(req.params.id, req.body);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

router.delete('/shifts/:id', async (req, res) => {
    try {
        await db.deleteSevaShift(req.params.id);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

router.get('/shifts/:id/assignments', async (req, res) => {
    try {
        const data = await db.getShiftAssignments(req.params.id);
        res.json({ success: true, data });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

router.post('/shifts/assign', async (req, res) => {
    try {
        const result = await db.assignToShift(req.body);
        res.json({ success: true, id: result.id });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

router.delete('/assignments/:id', async (req, res) => {
    try {
        await db.removeShiftAssignment(req.params.id);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

router.get('/schedule', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const data = await db.getSevaSchedule(startDate, endDate);
        res.json({ success: true, data });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

export default router;
