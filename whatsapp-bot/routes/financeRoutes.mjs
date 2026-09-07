import express from 'express';
import * as financeController from '../controllers/financeController.mjs';

const router = express.Router();

// Stats
router.get('/stats', financeController.getStats);

// Donations
router.get('/donations', financeController.getAllDonations);
router.post('/donations', financeController.createDonation);
router.delete('/donations/:id', financeController.removeDonation);

// Expenses
router.get('/expenses', financeController.getAllExpenses);
router.post('/expenses', financeController.createExpense);
router.delete('/expenses/:id', financeController.removeExpense);

// Analytics & Budgets
router.get('/analytics/history', financeController.getHistory);
router.get('/analytics/budget-performance', financeController.getBudgetPerformance);
router.get('/budgets', financeController.getBudgets);
router.post('/budgets', financeController.setBudget);

// Legacy/Root compatibility (defaults to donations for GET/POST)
router.get('/', financeController.getAllDonations);
router.post('/', financeController.createDonation);
router.delete('/:id', financeController.removeDonation);

export default router;
