💳 Backend Ledger System

A production-style backend ledger system built with Node.js, Express, MongoDB, and Mongoose that supports:

User Authentication (JWT + Cookies)
Account Management
Double-entry Ledger System
Idempotent Transactions
MongoDB Transactions (Session-based)
Email Notifications
Protected Routes with Middleware

🏗️ Tech Stack

Node.js
Express.js
MongoDB
Mongoose
JWT Authentication
Nodemailer
BcryptJS
Render (Deployment)

📂 Project Structure
backend-ledger/
│
├── src/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   └── config/
│
├── server.js
├── package.json
└── .env

🔐 Authentication Flow

User registers
Password hashed using bcrypt
JWT token generated
Token stored in cookie or Authorization header
Protected routes use auth middleware

🏦 Features
1️⃣ User Module
Register User
Login User
JWT-based Authentication

2️⃣ Account Module
Create Account
Account Status Management
Account Balance derived from ledger (not stored)

3️⃣ Ledger System (Immutable)
CREDIT entries
DEBIT entries
Ledger entries cannot be updated or deleted
Balance derived using aggregation

4️⃣ Transaction System (10-Step Transfer Flow)
Validate request
Validate idempotency key
Check account status
Derive sender balance
Create transaction (PENDING)
Create DEBIT ledger entry
Create CREDIT ledger entry
Mark transaction COMPLETED
Commit MongoDB session
Send email notification

🔄 Idempotency
Transactions use an idempotencyKey to prevent duplicate transfers.
If the same key is reused:
COMPLETED → returns existing transaction
PENDING → returns processing status
FAILED → allows retry


📡 API Endpoints
🔐 Auth Routes
Register
POST /api/auth/register

Body:
{
  "email": "test@gmail.com",
  "name": "Test User",
  "password": "123456"
}

Login
POST /api/auth/login

🏦 Account Routes
Create Account
POST /api/accounts


(Protected Route)

Header:

Authorization: Bearer <token>

💸 Transaction Routes
Create Transfer
POST /api/transactions


Body:

{
  "fromAccount": "accountId",
  "toAccount": "accountId",
  "amount": 100,
  "idempotencyKey": "unique-key-123"
}

Add Initial Funds (System User Only)
POST /api/transactions/initial-funds

⚙️ Environment Variables

Create a .env file in the root directory:

MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
CLIENT_ID=your_client_ID
CLIENT_SECRET=your_client_Secret
REFRESH_TOKEN=your_refresh_token
EMAIL_USER=gmail.com


⚠ On Render, add these in the Environment Variables section (Render does not use local .env).

🧪 Run Locally
git clone https://github.com/Bhoomi070/backend-ledger.git
cd backend-ledger
npm install
npm run dev


Server runs on:
http://localhost:3000

🚀 Deployment

Deployed using Render Web Service
Start command:
node server.js

🔒 Security Features

Password hashing (bcrypt)
JWT authentication
Cookie-based auth support
Immutable ledger entries
MongoDB session-based atomic transactions
Role-based system user middleware

🧠 Key Learning Concepts

Double-entry bookkeeping system
Derived balance from ledger (not stored directly)
Idempotent API design
MongoDB Transactions
Middleware-based Authorization
Production debugging & deployment
