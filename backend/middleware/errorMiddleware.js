const mongoose = require("mongoose");

const errorHandler = (err, req, res, next) => {
    console.error("========== ERROR ==========");
    console.error("Message:", err.message);
    console.error("Path:", req.originalUrl);
    console.error("Method:", req.method);
    console.error("===========================");

    let statusCode = res.statusCode !== 200 ? res.statusCode : 500;
    let message = err.message || "Internal Server Error";

    // =========================
    // MONGOOSE VALIDATION ERROR
    // =========================

    if (err.name === "ValidationError") {
        statusCode = 400;

        const errors = Object.values(err.errors).map(
            (error) => error.message
        );

        return res.status(statusCode).json({
            success: false,
            message: "Validation failed",
            errors
        });
    }

    // =========================
    // MONGOOSE INVALID OBJECT ID
    // =========================

    if (err.name === "CastError") {
        statusCode = 400;

        return res.status(statusCode).json({
            success: false,
            message: "Invalid resource ID"
        });
    }

    // =========================
    // MONGOOSE DUPLICATE KEY
    // =========================

    if (err.code === 11000) {
        statusCode = 409;

        const duplicateField = Object.keys(
            err.keyValue || {}
        )[0];

        return res.status(statusCode).json({
            success: false,
            message: duplicateField
                ? `${duplicateField} already exists`
                : "Duplicate data already exists"
        });
    }

    // =========================
    // JWT INVALID TOKEN
    // =========================

    if (err.name === "JsonWebTokenError") {
        statusCode = 401;

        return res.status(statusCode).json({
            success: false,
            message: "Invalid authentication token"
        });
    }

    // =========================
    // JWT EXPIRED TOKEN
    // =========================

    if (err.name === "TokenExpiredError") {
        statusCode = 401;

        return res.status(statusCode).json({
            success: false,
            message: "Authentication token has expired"
        });
    }

    // =========================
    // MONGOOSE VERSION ERROR
    // =========================

    if (err instanceof mongoose.Error.VersionError) {
        statusCode = 409;

        return res.status(statusCode).json({
            success: false,
            message: "Data was modified by another request"
        });
    }

    // =========================
    // DEFAULT ERROR
    // =========================

    return res.status(statusCode).json({
        success: false,
        message
    });
};

module.exports = errorHandler;