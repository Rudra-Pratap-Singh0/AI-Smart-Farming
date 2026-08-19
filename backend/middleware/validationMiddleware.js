const validateRegister = (req, res, next) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "Name, email and password are required"
        });
    }

    if (name.trim().length < 2) {
        return res.status(400).json({
            success: false,
            message: "Name must be at least 2 characters long"
        });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: "Please provide a valid email address"
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            message: "Password must be at least 6 characters long"
        });
    }

    next();
};


const validateLogin = (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and password are required"
        });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: "Please provide a valid email address"
        });
    }

    next();
};


const validateChangePassword = (req, res, next) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({
            success: false,
            message: "Current password and new password are required"
        });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({
            success: false,
            message: "New password must be at least 6 characters long"
        });
    }

    next();
};

const validateCourse = (req, res, next) => {
    const {
        title,
        description,
        category,
        level,
        price,
        duration
    } = req.body;

    // Required fields
    if (
        !title ||
        !description ||
        !category ||
        !level ||
        price === undefined ||
        !duration
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Title, description, category, level, price and duration are required"
        });
    }

    // Title validation
    if (typeof title !== "string" || title.trim().length < 3) {
        return res.status(400).json({
            success: false,
            message: "Course title must contain at least 3 characters"
        });
    }

    // Description validation
    if (
        typeof description !== "string" ||
        description.trim().length < 10
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Course description must contain at least 10 characters"
        });
    }

    // Price validation
    if (typeof price !== "number" || price < 0) {
        return res.status(400).json({
            success: false,
            message: "Course price must be a valid positive number"
        });
    }

    // Category validation
    if (typeof category !== "string" || category.trim().length < 2) {
        return res.status(400).json({
            success: false,
            message: "Invalid course category"
        });
    }

    // Level validation
    const allowedLevels = [
        "Beginner",
        "Intermediate",
        "Advanced"
    ];

    if (!allowedLevels.includes(level)) {
        return res.status(400).json({
            success: false,
            message:
                "Level must be Beginner, Intermediate or Advanced"
        });
    }

    next();
};

module.exports = {
    validateRegister,
    validateLogin,
    validateChangePassword,
    validateCourse
};