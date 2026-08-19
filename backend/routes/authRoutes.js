const express = require("express");

const {
    registerUser,
    loginUser,
    getProfile,
    updateProfile,
    changePassword
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");

const authorize = require("../middleware/roleMiddleware");

const {
    validateRegister,
    validateLogin,
    validateChangePassword
} = require("../middleware/validationMiddleware");

const router = express.Router();


// =========================
// AUTHENTICATION ROUTES
// =========================

// Register
router.post(
    "/register",
    validateRegister,
    registerUser
);

// Login
router.post(
    "/login",
    validateLogin,
    loginUser
);


// =========================
// USER PROFILE ROUTES
// =========================

// Get Profile
router.get(
    "/profile",
    protect,
    getProfile
);

// Update Profile
router.put(
    "/profile",
    protect,
    updateProfile
);

// Change Password
router.put(
    "/change-password",
    protect,
    validateChangePassword,
    changePassword
);


// =========================
// ROLE AUTHORIZATION TEST
// =========================

router.get(
    "/student-test",
    protect,
    authorize("student"),
    (req, res) => {
        res.status(200).json({
            success: true,
            message: "Student access granted"
        });
    }
);


router.get(
    "/instructor-test",
    protect,
    authorize("instructor"),
    (req, res) => {
        res.status(200).json({
            success: true,
            message: "Instructor access granted"
        });
    }
);


router.get(
    "/admin-test",
    protect,
    authorize("admin"),
    (req, res) => {
        res.status(200).json({
            success: true,
            message: "Admin access granted"
        });
    }
);


module.exports = router;