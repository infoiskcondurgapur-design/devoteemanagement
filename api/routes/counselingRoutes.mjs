import express from 'express';
import * as counselingController from '../controllers/counselingController.mjs';

const router = express.Router();

router.get('/', counselingController.list);
router.post('/', counselingController.create);
router.delete('/:id', counselingController.remove);

export default router;