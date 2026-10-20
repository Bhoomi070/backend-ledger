const userModel = require("../Models/user.model");
const tokenBlackListModel = require("../Models/blackList.model");
const jwt = require("jsonwebtoken");
const emailService = require("../services/email.service");

/** 
 * - User register controller
 * - POST /api/auth/register
 */
async function userRegisterController(req, res) {
    try {
        const { email, name, password } = req.body;

        if (!email || !name || !password) {
            return res.status(400).json({
                message: "Email, name, and password are required",
                status: "failed"
            });
        }

        const isExists = await userModel.findOne({ email });

        if (isExists) {
            return res.status(422).json({
                message: "User already exists with this email",
                status: "failed"
            });
        }

        const user = await userModel.create({
            email,
            password,
            name
        });
        
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || "default_jwt_secret", {
            expiresIn: "3d"
        });

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 3 * 24 * 60 * 60 * 1000
        });

        res.status(201).json({
            user: {
                _id: user._id,
                email: user.email,
                name: user.name
            },
            token
        });

        // Non-blocking email attempt
        emailService.sendRegistrationEmail(user.email, user.name).catch(err => {
            console.error("Non-critical: Failed to send welcome email:", err.message);
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to register user",
            error: error.message
        });
    }
}

/** 
 * - User Login controller
 * - POST /api/auth/login
 */
async function userLoginController(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const user = await userModel.findOne({ email }).select("+password +systemUser");

        if (!user) {
            return res.status(401).json({
                message: "Email or password is invalid"
            });
        }

        const isValidPassword = await user.comparePassword(password);

        if (!isValidPassword) {
            return res.status(401).json({
                message: "Email or password is invalid"
            });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || "default_jwt_secret", {
            expiresIn: "3d"
        });

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 3 * 24 * 60 * 60 * 1000
        });

        res.status(200).json({
            user: {
                _id: user._id,
                email: user.email,
                name: user.name,
                systemUser: user.systemUser
            },
            token
        });
    } catch (error) {
        return res.status(500).json({
            message: "Login failed",
            error: error.message
        });
    }
}

/**
 * - User Logout Controller
 * - POST /api/auth/logout
 */
async function userLogoutController(req, res) {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

        if (token) {
            await tokenBlackListModel.create({
                token: token
            }).catch(() => {}); // ignore duplicate token blacklist errors
        }

        res.clearCookie("token");

        return res.status(200).json({
            message: "User logged out successfully"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to logout",
            error: error.message
        });
    }
}

/**
 * - Get Current Authenticated User
 * - GET /api/auth/me
 */
async function getMeController(req, res) {
    if (!req.user) {
        return res.status(401).json({
            message: "Not authenticated"
        });
    }

    return res.status(200).json({
        user: {
            _id: req.user._id,
            email: req.user.email,
            name: req.user.name,
            systemUser: req.user.systemUser
        }
    });
}

module.exports = {
    userRegisterController,
    userLoginController,
    userLogoutController,
    getMeController
};
