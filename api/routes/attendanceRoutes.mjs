import express from 'express';
import * as attendanceController from '../controllers/attendanceController.mjs';

const router = express.Router();

router.get('/', attendanceController.list);
router.post('/', attendanceController.save);

export default router;