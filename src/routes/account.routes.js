const express = require('express');
const authMiddleware = require("../middleware/auth.middleware");
const accountController = require("../controllers/account.controller");

const router = express.Router();

/**
 * - POST /api/accounts/
 * - Create a new account
 * - Protected Route
 */
router.post("/", authMiddleware.authMiddleware, accountController.createAccountController);

/**
 * - GET /api/accounts/
 * - GET all accounts of the logged-in user
 * - Protected Route
 */
router.get("/", authMiddleware.authMiddleware, accountController.getUserAccountsController);

/**
 * - GET /api/accounts/balance/:accountId
 * - GET account balance
 */
router.get("/balance/:accountId", authMiddleware.authMiddleware, accountController.getAccountBalanceController);

/**
 * - GET /api/accounts/:accountId/statement
 * - GET immutable ledger statement and transaction history
 */
router.get("/:accountId/statement", authMiddleware.authMiddleware, accountController.getAccountStatementController);

/**
 * - POST /api/accounts/faucet
 * - Demo deposit faucet preserving double-entry ledger balance
 */
router.post("/faucet", authMiddleware.authMiddleware, accountController.depositFaucetController);

module.exports = router;
