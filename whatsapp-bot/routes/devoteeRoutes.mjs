import express from 'express';
import * as devoteeController from '../controllers/devoteeController.mjs';
import { requireAdmin } from '../services/authService.mjs';

const router = express.Router();

router.get('/', devoteeController.getAllDevotees);
router.get('/stats', devoteeController.getStats);
router.get('/search', devoteeController.searchByPhone);
router.get('/filter-options', devoteeController.getFilterOptionsController);
router.get('/:id', devoteeController.getById);
router.post('/bulk', requireAdmin, devoteeController.bulkCreate);
router.post('/', requireAdmin, devoteeController.create);
router.put('/:id', requireAdmin, devoteeController.update);
router.delete('/:id', requireAdmin, devoteeController.remove);

export default router;
