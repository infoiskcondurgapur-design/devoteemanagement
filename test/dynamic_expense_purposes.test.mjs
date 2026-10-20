import test from 'node:test';
import assert from 'node:assert';
import * as db from '../whatsapp-bot/database.mjs';
import * as financeController from '../whatsapp-bot/controllers/financeController.mjs';

test('Dynamic Expense Categories from Tours and Courses', async (t) => {
    // Helper to mock express res
    const mockRes = () => {
        const res = {};
        res.status = (code) => {
            res.statusCode = code;
            return res;
        };
        res.json = (data) => {
            res.body = data;
            return res;
        };
        return res;
    };

    // 1. Initial retrieval
    const res1 = mockRes();
    await financeController.getExpenseCategories({}, res1);

    assert.ok(res1.body, 'Response body should exist');
    assert.strictEqual(res1.body.success, true, 'Response should indicate success');
    assert.ok(Array.isArray(res1.body.data.tours), 'Tours should be an array');
    assert.ok(Array.isArray(res1.body.data.courses), 'Courses should be an array');

    const initialToursCount = res1.body.data.tours.length;
    const initialCoursesCount = res1.body.data.courses.length;
    console.log(`Initial Expense Categories: ${initialToursCount} tours, ${initialCoursesCount} courses`);

    // Verify none of the old static categories are returned as keys
    const oldStaticCategories = [
        'Temple Construction', 'Deity Worship', 'Kitchen & Feast', 
        'Book Distribution', 'Festival Fund', 'Maintenance', 'Staff Salary'
    ];
    for (const oldCat of oldStaticCategories) {
        assert.ok(
            !res1.body.data.tours.some(t => t.name === oldCat) &&
            !res1.body.data.courses.some(c => c.name === oldCat),
            `Old category "${oldCat}" should not be statically present`
        );
    }

    // 2. Add a new Tour dynamically
    const testTourName = `Special Vrindavan Parikrama ${Date.now()}`;
    const newTour = await db.createTour({
        name: testTourName,
        destination: 'Vrindavan',
        startDate: '2026-11-01',
        endDate: '2026-11-07',
        status: 'Upcoming',
        fees: 8500
    });
    assert.ok(newTour.id, 'New tour should have an ID');

    // 3. Add a new Course dynamically
    const testCourseName = `Srimad Bhagavatam Deep Study ${Date.now()}`;
    const newCourse = await db.createCourse({
        name: testCourseName,
        description: 'Comprehensive study',
        startDate: '2026-12-01',
        endDate: '2027-01-01',
        status: 'Upcoming',
        fees: 2500,
        instructor: 'HG Test Prabhu'
    });
    assert.ok(newCourse.id, 'New course should have an ID');

    // 4. Query getExpenseCategories again - new tour and course MUST appear immediately!
    const res2 = mockRes();
    await financeController.getExpenseCategories({}, res2);

    const foundTour = res2.body.data.tours.find(t => t.name === testTourName);
    const foundCourse = res2.body.data.courses.find(c => c.name === testCourseName);

    assert.ok(foundTour, `New tour "${testTourName}" should be present in expense categories`);
    assert.ok(foundCourse, `New course "${testCourseName}" should be present in expense categories`);
    console.log(`Verified new tour and course dynamically present in categories!`);

    // 5. Test recording an expense with the new category
    const testExpenseCategory = `Tour: ${testTourName}`;
    const expenseRes = await db.addExpense({
        title: 'Advance Bus Booking for Vrindavan Tour',
        category: testExpenseCategory,
        amount: 15000,
        date: '2026-10-21',
        mode: 'UPI',
        reference: 'UPI-VRN-12345',
        notes: 'Test expense for dynamic category'
    });
    assert.ok(expenseRes.id, 'Expense should be created successfully');

    const expenses = await db.getExpenses(10);
    const createdExpense = expenses.find(e => e.id === expenseRes.id);
    assert.ok(createdExpense, 'Created expense should be found in database');
    assert.strictEqual(createdExpense.category, testExpenseCategory, 'Expense category should match Tour category');
    console.log(`Verified expense created with category: "${createdExpense.category}"`);

    // 6. Cleanup test data
    await db.deleteExpense(expenseRes.id);
    await db.deleteTour(newTour.id);
    await db.deleteCourse(newCourse.id);

    // Verify cleanup
    const res3 = mockRes();
    await financeController.getExpenseCategories({}, res3);
    assert.ok(!res3.body.data.tours.some(t => t.id === newTour.id), 'Cleaned up tour should not be present');
    assert.ok(!res3.body.data.courses.some(c => c.id === newCourse.id), 'Cleaned up course should not be present');
    console.log('Cleanup completed successfully.');
});
