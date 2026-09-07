import express from 'express';
import * as eventController from '../controllers/eventController.mjs';

const router = express.Router();

router.get('/', eventController.getAllEvents);
router.post('/', eventController.create);
router.post('/bulk', eventController.createBulk);
router.put('/:id', eventController.update);
router.delete('/:id', eventController.remove);

export default router;
