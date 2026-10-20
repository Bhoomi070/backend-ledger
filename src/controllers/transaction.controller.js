const transactionModel = require("../Models/transaction.model");
const ledgerModel = require("../Models/ledger.model");
const accountModel = require("../Models/account.model");
const emailService = require("../services/email.service");
const mongoose = require("mongoose");

/**
 * - Create a new transaction
 * THE PRODUCTION 10-STEP DOUBLE-ENTRY TRANSFER FLOW:
 * 1. Validate request parameters
 * 2. Prevent self-transfers
 * 3. Verify ownership (BOLA prevention)
 * 4. Verify recipient and account statuses (ACTIVE)
 * 5. Check Idempotency Key (Return cached response if already COMPLETED)
 * 6. Start MongoDB Session & Transaction
 * 7. Derive sender balance INSIDE transaction session snapshot
 * 8. Create PENDING transaction record
 * 9. Atomically write DEBIT and CREDIT ledger entries
 * 10. Mark COMPLETED, commit session, and fire async notifications
 */
async function createTransaction(req, res) {
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

    // 1. Validate request parameters
    if (!fromAccount || !toAccount || amount === undefined || !idempotencyKey) {
        return res.status(400).json({
            message: "fromAccount, toAccount, amount, and idempotencyKey are required"
        });
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({
            message: "Amount must be a positive number"
        });
    }

    // 2. Prevent self-transfer
    if (fromAccount.toString() === toAccount.toString()) {
        return res.status(400).json({
            message: "Cannot transfer funds to the exact same account"
        });
    }

    // 3. Verify source account ownership (Fixes BOLA security vulnerability)
    const fromUserAccount = await accountModel.findOne({
        _id: fromAccount,
        user: req.user._id
    });

    if (!fromUserAccount) {
        return res.status(403).json({
            message: "Unauthorized: Source account does not exist or does not belong to you"
        });
    }

    // 4. Verify destination account
    const toUserAccount = await accountModel.findOne({
        _id: toAccount
    });

    if (!toUserAccount) {
        return res.status(400).json({
            message: "Recipient account not found"
        });
    }

    // Check account statuses
    if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
        return res.status(400).json({
            message: "Both fromAccount and toAccount must be in ACTIVE status"
        });
    }

    // Check currency compatibility
    if (fromUserAccount.currency !== toUserAccount.currency) {
        return res.status(400).json({
            message: `Currency mismatch: ${fromUserAccount.currency} cannot be directly transferred to ${toUserAccount.currency}`
        });
    }

    // 5. Validate idempotency key
    const existingTransaction = await transactionModel.findOne({
        idempotencyKey: idempotencyKey
    });

    if (existingTransaction) {
        if (existingTransaction.status === "COMPLETED") {
            return res.status(200).json({
                message: "Transaction already processed (Idempotent Replay)",
                transaction: existingTransaction,
                isIdempotentReplay: true
            });
        }

        if (existingTransaction.status === "PENDING") {
            return res.status(409).json({
                message: "A transaction with this idempotency key is currently processing. Please wait.",
                transactionId: existingTransaction._id
            });
        }

        if (existingTransaction.status === "FAILED" || existingTransaction.status === "REVERSED") {
            return res.status(400).json({
                message: `Previous transaction with this idempotency key ${existingTransaction.status.toLowerCase()}. Please use a new idempotencyKey to retry.`,
                status: existingTransaction.status
            });
        }
    }

    // 6. Start ACID Transaction Session
    let session;
    try {
        session = await mongoose.startSession();
        session.startTransaction();

        // 7. Derive sender balance INSIDE session snapshot to prevent TOCTOU race conditions
        const balance = await fromUserAccount.getBalance(session);

        if (balance < parsedAmount) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                message: `Insufficient funds. Current derived balance is ${balance}, requested transfer is ${parsedAmount}`
            });
        }

        // 8. Create PENDING transaction
        const [transaction] = await transactionModel.create([{
            fromAccount,
            toAccount,
            amount: parsedAmount,
            idempotencyKey,
            status: "PENDING"
        }], { session });

        // 9. Create immutable DEBIT and CREDIT ledger entries
        await ledgerModel.create([{
            account: fromAccount,
            amount: parsedAmount,
            transaction: transaction._id,
            type: "DEBIT"
        }], { session });

        await ledgerModel.create([{
            account: toAccount,
            amount: parsedAmount,
            transaction: transaction._id,
            type: "CREDIT"
        }], { session });

        // 10. Mark transaction COMPLETED and commit
        transaction.status = "COMPLETED";
        await transaction.save({ session });

        await session.commitTransaction();
        session.endSession();

        // Fire asynchronous, non-blocking notification
        emailService.sendTransactionEmail(req.user.email, req.user.name, parsedAmount, toAccount).catch(err => {
            console.error("Non-critical: Email dispatch error:", err.message);
        });

        return res.status(201).json({
            message: "Transaction completed successfully",
            transaction: transaction
        });

    } catch (error) {
        if (session && session.inTransaction()) {
            try {
                await session.abortTransaction();
            } catch (abortErr) {
                console.error("Error during transaction abort:", abortErr.message);
            }
        }
        if (session) {
            session.endSession();
        }

        return res.status(500).json({
            message: "Transaction processing failed and was rolled back",
            error: error.message
        });
    }
}

/**
 * - System Initial Funds Transaction
 * - POST /api/transactions/system/initial-funds
 */
async function createInitialFundsTransaction(req, res) {
    const { toAccount, amount, idempotencyKey } = req.body;

    if (!toAccount || amount === undefined || !idempotencyKey) {
        return res.status(400).json({
            message: "toAccount, amount, and idempotencyKey are required"
        });
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({
            message: "Amount must be a positive number"
        });
    }

    const toUserAccount = await accountModel.findOne({ _id: toAccount });
    if (!toUserAccount) {
        return res.status(400).json({ message: "Invalid toAccount" });
    }

    const fromUserAccount = await accountModel.findOne({ user: req.user._id });
    if (!fromUserAccount) {
        return res.status(400).json({ message: "System user settlement account not found" });
    }

    let session;
    try {
        session = await mongoose.startSession();
        session.startTransaction();

        const [transaction] = await transactionModel.create([{
            fromAccount: fromUserAccount._id,
            toAccount,
            amount: parsedAmount,
            idempotencyKey,
            status: "PENDING"
        }], { session });

        await ledgerModel.create([{
            account: fromUserAccount._id,
            amount: parsedAmount,
            transaction: transaction._id,
            type: "DEBIT"
        }], { session });

        await ledgerModel.create([{
            account: toAccount,
            amount: parsedAmount,
            transaction: transaction._id,
            type: "CREDIT"
        }], { session });

        transaction.status = "COMPLETED";
        await transaction.save({ session });

        await session.commitTransaction();
        session.endSession();

        return res.status(201).json({
            message: "Initial funds transaction completed successfully",
            transaction: transaction
        });
    } catch (error) {
        if (session && session.inTransaction()) {
            await session.abortTransaction().catch(() => {});
        }
        if (session) session.endSession();

        return res.status(500).json({
            message: "Initial funds transaction failed",
            error: error.message
        });
    }
}

/**
 * - System-wide Ledger Reconciliation Check
 * - GET /api/transactions/reconciliation
 * - Verifies mathematical accounting invariant: sum(CREDIT) == sum(DEBIT)
 */
async function getReconciliationController(req, res) {
    try {
        const stats = await ledgerModel.aggregate([
            {
                $group: {
                    _id: "$type",
                    totalAmount: { $sum: "$amount" },
                    entryCount: { $sum: 1 }
                }
            }
        ]);

        let totalCredits = 0;
        let totalDebits = 0;
        let creditCount = 0;
        let debitCount = 0;

        stats.forEach(item => {
            if (item._id === "CREDIT") {
                totalCredits = item.totalAmount;
                creditCount = item.entryCount;
            } else if (item._id === "DEBIT") {
                totalDebits = item.totalAmount;
                debitCount = item.entryCount;
            }
        });

        const discrepancy = Number((totalCredits - totalDebits).toFixed(4));
        const isReconciled = discrepancy === 0;

        const totalTransactions = await transactionModel.countDocuments();

        return res.status(200).json({
            isReconciled,
            accountingEquation: "Sum(Credits) - Sum(Debits) == 0",
            totalCredits,
            totalDebits,
            discrepancy,
            entryMetrics: {
                creditEntries: creditCount,
                debitEntries: debitCount,
                totalLedgerEntries: creditCount + debitCount
            },
            totalTransactions,
            verifiedAt: new Date().toISOString()
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to calculate reconciliation report",
            error: error.message
        });
    }
}

/**
 * - Get Recent Transactions for User
 * - GET /api/transactions/recent
 */
async function getRecentTransactionsController(req, res) {
    try {
        const userAccounts = await accountModel.find({ user: req.user._id }).select("_id");
        const accountIds = userAccounts.map(a => a._id);

        const transactions = await transactionModel.find({
            $or: [
                { fromAccount: { $in: accountIds } },
                { toAccount: { $in: accountIds } }
            ]
        })
        .populate("fromAccount", "currency status user")
        .populate("toAccount", "currency status user")
        .sort({ createdAt: -1 })
        .limit(20);

        return res.status(200).json({
            count: transactions.length,
            transactions
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch recent transactions",
            error: error.message
        });
    }
}

module.exports = {
    createTransaction,
    createInitialFundsTransaction,
    getReconciliationController,
    getRecentTransactionsController
};
