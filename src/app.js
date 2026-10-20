const express = require('express');
const cookieParser = require('cookie-parser');

const app = express();

/**
 * Routers
 */
const authRouter = require('./routes/auth.routes');
const accountRouter = require('./routes/account.routes');
const transactionRoutes = require('./routes/transaction.routes');

/**
 * Core Middlewares
 */
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * CORS Configuration for Next.js & REST clients
 */
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

/**
 * Health & API Root
 */
app.get('/', (req, res) => {
    res.status(200).json({
        service: 'Institutional Double-Entry Ledger Core API',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        endpoints: {
            auth: '/api/auth',
            accounts: '/api/accounts',
            transactions: '/api/transactions',
            reconciliation: '/api/transactions/reconciliation'
        }
    });
});

/**
 * API Routes
 */
app.use('/api/auth', authRouter);
app.use('/api/accounts', accountRouter);
app.use('/api/transactions', transactionRoutes);

/**
 * 404 Route Handler
 */
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Endpoint ${req.method} ${req.path} does not exist.`
    });
});

/**
 * Global Error Handler
 */
app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err);
    res.status(err.status || 500).json({
        error: 'Internal Server Error',
        message: err.message || 'An unexpected error occurred.'
    });
});

module.exports = app;
