import express from 'express';
import {
    createChangeRequest,
    getPendingRequests,
    getRequestsByUserId,
    getAllRequests,
    approveChangeRequest,
    rejectChangeRequest
} from '../database.mjs';
import { requireAuth, requireAdmin } from '../services/authService.mjs';

const router = express.Router();

// All change request routes require authentication
router.use(requireAuth);

// Submit a change request
router.post('/', async (req, res) => {
    try {
        const { devoteeId, changes, reason } = req.body;
        if (!devoteeId || !changes || typeof changes !== 'object') {
            return res.status(400).json({ success: false, error: 'devoteeId and changes (object) are required' });
        }
        const result = await createChangeRequest({
            devoteeId,
            userId: String(req.user.id),
            requestedBy: req.user.username,
            changes,
            reason
        });
        res.json({ success: true, id: result.id });
    } catch (err) {
        console.error('[ChangeRequest] Create error:', err.message);
        res.status(500).json({ success: false, error: 'Failed to submit change request' });
    }
});

// Get pending requests (admin only)
router.get('/pending', requireAdmin, async (req, res) => {
    try {
        const requests = await getPendingRequests();
        res.json({ success: true, data: requests });
    } catch (err) {
        console.error('[ChangeRequest] Pending error:', err.message);
        res.status(500).json({ success: false, error: 'Failed to fetch pending requests' });
    }
});

// Approve a change request (admin only)
router.put('/:id/approve', requireAdmin, async (req, res) => {
    try {
        const result = await approveChangeRequest(req.params.id, req.user.username);
        if (result.success) {
            res.json({ success: true });
        } else {
            res.status(404).json({ success: false, error: result.error });
        }
    } catch (err) {
        console.error('[ChangeRequest] Approve error:', err.message);
        res.status(500).json({ success: false, error: 'Failed to approve request' });
    }
});

// Reject a change request (admin only)
router.put('/:id/reject', requireAdmin, async (req, res) => {
    try {
        await rejectChangeRequest(req.params.id, req.user.username);
        res.json({ success: true });
    } catch (err) {
        console.error('[ChangeRequest] Reject error:', err.message);
        res.status(500).json({ success: false, error: 'Failed to reject request' });
    }
});

// Get my requests (self)
router.get('/mine', async (req, res) => {
    try {
        const requests = await getRequestsByUserId(String(req.user.id));
        res.json({ success: true, data: requests });
    } catch (err) {
        console.error('[ChangeRequest] Mine error:', err.message);
        res.status(500).json({ success: false, error: 'Failed to fetch requests' });
    }
});

// Get history (admin sees all, self sees own)
router.get('/history', requireAuth, async (req, res) => {
    try {
        const requests = req.user.role === 'admin'
            ? await getAllRequests()
            : await getRequestsByUserId(String(req.user.id));
        res.json({ success: true, data: requests });
    } catch (err) {
        console.error('[ChangeRequest] History error:', err.message);
        res.status(500).json({ success: false, error: 'Failed to fetch history' });
    }
});

export default router;
