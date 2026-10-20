const { Router } = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const transactionController = require("../controllers/transaction.controller");

const transactionRoutes = Router();

/**
 * - GET /api/transactions/reconciliation
 * - System-wide double-entry ledger balance check (Sum Credits == Sum Debits)
 */
transactionRoutes.get("/reconciliation", transactionController.getReconciliationController);

/**
 * - GET /api/transactions/recent
 * - Get recent transactions for the logged-in user
 */
transactionRoutes.get("/recent", authMiddleware.authMiddleware, transactionController.getRecentTransactionsController);

/**
 * - POST /api/transactions/
 * - Create a new transaction with ACID & Idempotency
 */
transactionRoutes.post("/", authMiddleware.authMiddleware, transactionController.createTransaction);

/**
 * - POST /api/transactions/system/initial-funds
 * - Create initial funds transaction from system user
 */
transactionRoutes.post("/system/initial-funds", authMiddleware.authSystemUserMiddleware, transactionController.createInitialFundsTransaction);

module.exports = transactionRoutes;
