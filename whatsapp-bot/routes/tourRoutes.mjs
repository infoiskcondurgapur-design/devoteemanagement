import express from 'express';
import * as tourController from '../controllers/tourController.mjs';

const router = express.Router();

// Tour routes
router.get('/', tourController.getAllTours);
router.post('/', tourController.createTour);
router.get('/:id', tourController.getTour);
router.put('/:id', tourController.updateTour);
router.delete('/:id', tourController.deleteTour);

// Enrollment routes
router.post('/enroll', tourController.enrollDevotee);
router.put('/enroll/:id', tourController.updateEnrollment);
router.delete('/enroll/:id', tourController.deleteEnrollment);

// Payment routes
router.post('/payments', tourController.addPayment);
router.get('/enroll/:enrollmentId/payments', tourController.getPayments);

export default router;
