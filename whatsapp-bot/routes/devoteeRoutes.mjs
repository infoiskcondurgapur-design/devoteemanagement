import express from 'express';
import * as devoteeController from '../controllers/devoteeController.mjs';

const router = express.Router();

router.get('/', devoteeController.getAllDevotees);
router.get('/stats', devoteeController.getStats);
router.get('/search', devoteeController.searchByPhone);
router.get('/filter-options', devoteeController.getFilterOptionsController);
router.get('/:id', devoteeController.getById);
router.post('/', devoteeController.create);
router.put('/:id', devoteeController.update);
router.delete('/:id', devoteeController.remove);

export default router;
