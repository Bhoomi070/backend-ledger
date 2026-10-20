const accountModel = require("../Models/account.model");
const ledgerModel = require("../Models/ledger.model");
const transactionModel = require("../Models/transaction.model");
const userModel = require("../Models/user.model");
const mongoose = require("mongoose");
const crypto = require("crypto");

/**
 * - Create a new account
 * - POST /api/accounts/
 */
async function createAccountController(req, res) {
    try {
        const user = req.user;
        const currency = req.body.currency || "INR";

        const account = await accountModel.create({
            user: user._id,
            currency: currency.toUpperCase()
        });

        res.status(201).json({
            account: {
                ...account.toObject(),
                balance: 0
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to create account",
            error: error.message
        });
    }
}

/**
 * - Get all accounts of the logged-in user with derived balances
 * - GET /api/accounts/
 */
async function getUserAccountsController(req, res) {
    try {
        const accounts = await accountModel.find({ user: req.user._id }).sort({ createdAt: -1 });

        const accountsWithBalance = await Promise.all(
            accounts.map(async (acc) => {
                const balance = await acc.getBalance();
                return {
                    ...acc.toObject(),
                    balance
                };
            })
        );

        res.status(200).json({
            accounts: accountsWithBalance
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch accounts",
            error: error.message
        });
    }
}

/**
 * - Get Account Balance
 * - GET /api/accounts/balance/:accountId
 */
async function getAccountBalanceController(req, res) {
    try {
        const { accountId } = req.params;

        const account = await accountModel.findOne({
            _id: accountId,
            user: req.user._id
        });

        if (!account) {
            return res.status(404).json({
                message: "Account not found or access denied"
            });
        }

        const balance = await account.getBalance();

        res.status(200).json({
            accountId: account._id,
            currency: account.currency,
            status: account.status,
            balance: balance
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch balance",
            error: error.message
        });
    }
}

/**
 * - Get Account Statement (Audit trail of all ledger entries for this account)
 * - GET /api/accounts/:accountId/statement
 */
async function getAccountStatementController(req, res) {
    try {
        const { accountId } = req.params;

        const account = await accountModel.findOne({
            _id: accountId,
            user: req.user._id
        });

        if (!account) {
            return res.status(404).json({
                message: "Account not found or access denied"
            });
        }

        const entries = await ledgerModel.find({ account: accountId })
            .populate({
                path: "transaction",
                select: "fromAccount toAccount amount status idempotencyKey createdAt"
            })
            .sort({ createdAt: -1 });

        const currentBalance = await account.getBalance();

        res.status(200).json({
            account: {
                _id: account._id,
                currency: account.currency,
                status: account.status,
                currentBalance
            },
            entriesCount: entries.length,
            entries
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch account statement",
            error: error.message
        });
    }
}

/**
 * - Deposit Demo Funds (Test Faucet preserving Double-Entry symmetry)
 * - POST /api/accounts/faucet
 * - Debits System Settlement Account -> Credits Target User Account
 */
async function depositFaucetController(req, res) {
    const { accountId, amount } = req.body;

    const parsedAmount = Number(amount);
    if (!accountId || isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({
            message: "Valid accountId and positive amount are required"
        });
    }

    // Verify user owns the account
    const targetAccount = await accountModel.findOne({
        _id: accountId,
        user: req.user._id
    });

    if (!targetAccount) {
        return res.status(404).json({
            message: "Target account not found or access denied"
        });
    }

    if (targetAccount.status !== "ACTIVE") {
        return res.status(400).json({
            message: "Target account is not ACTIVE"
        });
    }

    // Find or create System Reserves Account to preserve double-entry balance
    let systemUser = await userModel.findOne({ systemUser: true });
    if (!systemUser) {
        systemUser = await userModel.create({
            email: "system.settlement@internal.ledger",
            name: "Central Settlement Engine",
            password: crypto.randomBytes(16).toString("hex"),
            systemUser: true
        });
    }

    let systemAccount = await accountModel.findOne({ user: systemUser._id });
    if (!systemAccount) {
        systemAccount = await accountModel.create({
            user: systemUser._id,
            currency: targetAccount.currency,
            status: "ACTIVE"
        });
    }

    const idempotencyKey = `faucet_${accountId}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const [transaction] = await transactionModel.create([{
            fromAccount: systemAccount._id,
            toAccount: targetAccount._id,
            amount: parsedAmount,
            idempotencyKey,
            status: "PENDING"
        }], { session });

        await ledgerModel.create([{
            account: systemAccount._id,
            amount: parsedAmount,
            transaction: transaction._id,
            type: "DEBIT"
        }], { session });

        await ledgerModel.create([{
            account: targetAccount._id,
            amount: parsedAmount,
            transaction: transaction._id,
            type: "CREDIT"
        }], { session });

        transaction.status = "COMPLETED";
        await transaction.save({ session });

        await session.commitTransaction();
        session.endSession();

        const updatedBalance = await targetAccount.getBalance();

        return res.status(201).json({
            message: `Successfully deposited ${parsedAmount} into account`,
            transactionId: transaction._id,
            newBalance: updatedBalance
        });
    } catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        session.endSession();
        return res.status(500).json({
            message: "Faucet deposit failed",
            error: error.message
        });
    }
}

module.exports = {
    createAccountController,
    getUserAccountsController,
    getAccountBalanceController,
    getAccountStatementController,
    depositFaucetController
};
