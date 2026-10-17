import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as db from '../whatsapp-bot/database.mjs';

describe('Cancel & Refund Database Operations', () => {
    it('creates a tour, enrolls participant, records payment, and performs partial refund', async () => {
        // 1. Create a test tour
        const tourRes = await db.createTour({
            name: 'Test Refund Pilgrimage',
            destination: 'Vrindavan',
            startDate: '2026-11-01',
            endDate: '2026-11-05',
            status: 'Upcoming',
            fees: 6000,
            organizer: 'Testing Dept'
        });
        const tourId = tourRes.id;
        assert.ok(tourId, 'Tour should be created with an ID');

        // 2. Enroll a guest participant
        const enrollRes = await db.enrollInTour({
            tourId,
            guestName: 'Refund Test Devotee',
            guestContact: '9876543210',
            status: 'Confirmed'
        });
        const enrollmentId = enrollRes.id;
        assert.ok(enrollmentId, 'Enrollment should be created');

        // 3. Add initial payment of 6000
        const payRes1 = await db.addTourPayment({
            enrollmentId,
            amount: 6000,
            paymentMode: 'UPI',
            reference: 'TXN-INITIAL-6000'
        });
        assert.strictEqual(payRes1.newTotal, 6000);
        assert.strictEqual(payRes1.paymentStatus, 'Completed');

        // 4. Update status to Cancelled
        await db.updateTourEnrollment(enrollmentId, { status: 'Cancelled' });

        // 5. Add partial refund of 4500 (1500 retained as cancellation fee)
        const refundRes = await db.addTourPayment({
            enrollmentId,
            amount: -4500,
            paymentMode: 'Refund (UPI)',
            reference: 'Cancellation refund processed'
        });
        assert.strictEqual(refundRes.newTotal, 1500);
        assert.strictEqual(refundRes.paymentStatus, 'Partial Refund');

        // 6. Check enrollment records
        const enrollments = await db.getTourEnrollments(tourId);
        const en = enrollments.find(e => e.id === enrollmentId);
        assert.ok(en, 'Enrollment should exist');
        assert.strictEqual(en.status, 'Cancelled');
        assert.strictEqual(Number(en.totalPaid), 1500);
        assert.strictEqual(Number(en.totalRefunded), 4500);
        assert.strictEqual(Number(en.totalReceived), 6000);

        // 7. Process remaining refund of 1500
        const fullRefundRes = await db.addTourPayment({
            enrollmentId,
            amount: -1500,
            paymentMode: 'Refund (Cash)',
            reference: 'Full settlement'
        });
        assert.strictEqual(fullRefundRes.newTotal, 0);
        assert.strictEqual(fullRefundRes.paymentStatus, 'Refunded');

        const enrollmentsFinal = await db.getTourEnrollments(tourId);
        const enFinal = enrollmentsFinal.find(e => e.id === enrollmentId);
        assert.strictEqual(Number(enFinal.totalPaid), 0);
        assert.strictEqual(Number(enFinal.totalRefunded), 6000);
        assert.strictEqual(Number(enFinal.totalReceived), 6000);
        assert.strictEqual(enFinal.paymentStatus, 'Refunded');

        // Cleanup
        await db.deleteTour(tourId);
    });

    it('creates a course, enrolls participant, records payment, and performs full refund', async () => {
        // 1. Create a test course
        const courseRes = await db.createCourse({
            name: 'Test Refund Gita Course',
            description: 'Course testing refund',
            startDate: '2026-11-01',
            endDate: '2026-11-30',
            fees: 2000,
            instructor: 'Testing Prabhu',
            status: 'Upcoming'
        });
        const courseId = courseRes.id;
        assert.ok(courseId, 'Course should be created');

        // Add dummy devotee if needed or use existing
        const dynamicContact = `99${Date.now().toString().slice(-8)}`;
        const testDev = await db.addDevotee({
            name: `Refund Devotee ${Date.now()}`,
            contact: dynamicContact
        });
        const devoteeId = testDev.id;

        // 2. Enroll devotee
        const enrollRes = await db.enrollDevotee({
            courseId,
            devoteeId,
            enrollmentDate: '2026-11-01'
        });
        const enrollmentId = enrollRes.id;

        // 3. Add payment of 2000
        const payRes = await db.addCoursePayment({
            enrollmentId,
            amount: 2000,
            paymentMode: 'Cash'
        });
        assert.strictEqual(payRes.newTotal, 2000);
        assert.strictEqual(payRes.paymentStatus, 'Completed');

        // 4. Mark status Dropped and issue full refund of 2000
        await db.updateEnrollment(enrollmentId, { status: 'Dropped' });
        const refundRes = await db.addCoursePayment({
            enrollmentId,
            amount: -2000,
            paymentMode: 'Refund (Cash)',
            reference: 'Dropped student full refund'
        });
        assert.strictEqual(refundRes.newTotal, 0);
        assert.strictEqual(refundRes.paymentStatus, 'Refunded');

        const enrollments = await db.getCourseEnrollments(courseId);
        const en = enrollments.find(e => e.id === enrollmentId);
        assert.strictEqual(en.status, 'Dropped');
        assert.strictEqual(Number(en.totalPaid), 0);
        assert.strictEqual(Number(en.totalRefunded), 2000);
        assert.strictEqual(Number(en.totalReceived), 2000);
        assert.strictEqual(en.paymentStatus, 'Refunded');

        // Cleanup
        await db.deleteCourse(courseId);
        await db.deleteDevotee(devoteeId);
    });
});
