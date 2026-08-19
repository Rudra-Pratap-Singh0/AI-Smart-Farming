const express = require("express");

const {
    createCourse,
    getAllCourses,
    getCourseById,
    updateCourse,
    deleteCourse
} = require("../controllers/courseController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
    validateCourse
} = require("../middleware/validationMiddleware");

const router = express.Router();


// =========================
// COURSE LIST
// =========================

router.get("/", getAllCourses);


// =========================
// COURSE DETAILS
// =========================

router.get("/:id", getCourseById);


// =========================
// CREATE COURSE
// =========================

router.post(
    "/",
    protect,
    authorize("instructor", "admin"),
    validateCourse,
    createCourse
);


// =========================
// UPDATE COURSE
// =========================

router.put(
    "/:id",
    protect,
    authorize("instructor", "admin"),
    validateCourse,
    updateCourse
);


// =========================
// DELETE COURSE
// =========================

router.delete(
    "/:id",
    protect,
    authorize("instructor", "admin"),
    deleteCourse
);


module.exports = router;