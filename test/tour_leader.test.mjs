import test from 'node:test';
import assert from 'node:assert';
import * as db from '../whatsapp-bot/database.mjs';

test('Tour Enrollment Leader Column Feature (without data loss)', async (t) => {
    // 1. Check existing tours
    const tours = await db.getTours(false);
    assert.ok(Array.isArray(tours), 'getTours should return an array');
    assert.ok(tours.length > 0, 'Should have at least 1 tour in database');

    const testTourId = tours[0].id;
    console.log(`Testing with Tour ID: ${testTourId} ("${tours[0].name}")`);

    // 2. Fetch existing enrollments
    const existingEnrollments = await db.getTourEnrollments(testTourId);
    assert.ok(Array.isArray(existingEnrollments), 'getTourEnrollments should return array');
    console.log(`Tour has ${existingEnrollments.length} existing enrollments.`);

    // 3. Enroll a new test participant with a Leader and DOB
    const testLeaderName = 'HG Radheshyam Das';
    const testDob = '1992-05-15';
    const testGuestName = `Test Participant ${Date.now()}`;
    const testEnrollRes = await db.enrollInTour({
        tourId: testTourId,
        guestName: testGuestName,
        guestContact: '9876543210',
        bookingDate: '2026-10-20',
        leader: testLeaderName,
        dob: testDob
    });

    assert.ok(testEnrollRes.id, 'Enrollment should return an ID');
    const newEnrollmentId = testEnrollRes.id;
    console.log(`Created test enrollment ID: ${newEnrollmentId}`);

    // 4. Fetch enrollments and verify leader and dob fields
    const updatedEnrollments = await db.getTourEnrollments(testTourId);
    const created = updatedEnrollments.find(e => e.id === newEnrollmentId);
    assert.ok(created, 'Newly created enrollment should exist');
    assert.strictEqual(created.leader, testLeaderName, 'Leader should match the assigned value');
    assert.strictEqual(created.dob, testDob, 'DOB should match the assigned value');
    assert.strictEqual(created.guestName, testGuestName, 'Guest name should match');
    console.log(`Verified leader field: "${created.leader}", dob: "${created.dob}"`);

    // 5. Update leader and dob for this enrollment
    const updatedLeaderName = 'HG Chaitanya Charan Das';
    const updatedDob = '1995-10-24';
    await db.updateTourEnrollment(newEnrollmentId, { leader: updatedLeaderName, dob: updatedDob });

    const afterUpdateEnrollments = await db.getTourEnrollments(testTourId);
    const afterUpdate = afterUpdateEnrollments.find(e => e.id === newEnrollmentId);
    assert.strictEqual(afterUpdate.leader, updatedLeaderName, 'Leader should be updated successfully');
    assert.strictEqual(afterUpdate.dob, updatedDob, 'DOB should be updated successfully');
    console.log(`Verified updated leader field: "${afterUpdate.leader}", dob: "${afterUpdate.dob}"`);

    // 6. Clean up test record
    await db.deleteTourEnrollment(newEnrollmentId);
    const finalEnrollments = await db.getTourEnrollments(testTourId);
    assert.strictEqual(finalEnrollments.some(e => e.id === newEnrollmentId), false, 'Test enrollment should be deleted');
    console.log('Test record cleaned up cleanly.');
});
