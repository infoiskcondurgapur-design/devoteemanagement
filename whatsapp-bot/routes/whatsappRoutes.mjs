import express from 'express';
import * as whatsappController from '../controllers/whatsappController.mjs';

const router = express.Router();

router.get('/status', whatsappController.getStatus);
router.get('/messages', whatsappController.getMessages);
router.get('/qr', whatsappController.getQR);
router.post('/send', whatsappController.sendMessage);
router.post('/broadcast', whatsappController.broadcast);
router.post('/logout', whatsappController.logout);
router.post('/restart', whatsappController.restart);
router.get('/stream', whatsappController.streamUpdates);

export default router;
