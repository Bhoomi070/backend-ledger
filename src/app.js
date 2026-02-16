const express = require('express');
const cookieParser = require("cookie-parser")

const app = express();

/**
 * Routes required
 */
const authRouter = require("./routes/auth.routes")
const accountRouter = require("./routes/account.routes")
const transactionRouter = require("./routes/transaction.routes");
const transactionRoutes = require('./routes/transaction.routes');

/**
 * Middleware
 */
app.use(cookieParser())
app.use(express.json())


/**
 * Use routes
 */
app.use("/api/auth", authRouter)
app.use("/api/accounts", accountRouter)
app.use("/api/transactions", transactionRoutes)


module.exports = app;
