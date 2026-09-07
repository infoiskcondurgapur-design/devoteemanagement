import express from 'express';
import * as courseController from '../controllers/courseController.mjs';

const router = express.Router();

router.get('/', courseController.getAllCourses);
router.get('/:id', courseController.getCourse);
router.post('/', courseController.createCourse);
router.put('/:id', courseController.updateCourse);
router.delete('/:id', courseController.deleteCourse);

router.post('/enroll', courseController.enrollDevotee);
router.put('/enroll/:id', courseController.updateEnrollment);
router.delete('/enroll/:id', courseController.deleteEnrollment);

router.post('/payments', courseController.addPayment);
router.get('/payments/:enrollmentId', courseController.getPayments);

router.get('/:id/attendance', courseController.getCourseAttendance);
router.post('/:id/attendance', courseController.markCourseAttendance);

export default router;
