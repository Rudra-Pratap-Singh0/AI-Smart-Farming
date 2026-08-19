const authorize = (...allowedRoles) => {
    return (req, res, next) => {

        // =========================
        // CHECK AUTHENTICATION
        // =========================

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        // =========================
        // CHECK USER ROLE
        // =========================

        if (!req.user.role) {
            return res.status(403).json({
                success: false,
                message: "User role is not available"
            });
        }

        // Normalize roles
        const userRole = String(req.user.role).toLowerCase();

        const normalizedAllowedRoles = allowedRoles.map(
            (role) => String(role).toLowerCase()
        );

        // =========================
        // AUTHORIZATION CHECK
        // =========================

        if (!normalizedAllowedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to access this resource"
            });
        }

        next();
    };
};

module.exports = authorize;