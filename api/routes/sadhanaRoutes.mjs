import express from 'express';
import * as sadhanaController from '../controllers/sadhanaController.mjs';

const router = express.Router();

router.get('/:devoteeId', sadhanaController.getByDevotee);
router.post('/', sadhanaController.create);
router.delete('/:id', sadhanaController.remove);

export default router;
