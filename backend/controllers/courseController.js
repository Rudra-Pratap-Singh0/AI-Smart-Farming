const Course = require("../models/Course");


// =========================
// CREATE COURSE
// =========================

const createCourse = async (req, res, next) => {
    try {
        const {
            title,
            description,
            category,
            level,
            price,
            thumbnail,
            duration
        } = req.body;

        const course = await Course.create({
            title: title.trim(),
            description: description.trim(),
            instructor: req.user.userId,
            category: category.trim(),
            level,
            price: Number(price),
            thumbnail,
            duration
        });

        const populatedCourse = await Course.findById(course._id)
            .populate("instructor", "name email");

        return res.status(201).json({
            success: true,
            message: "Course created successfully",
            course: populatedCourse
        });

    } catch (error) {
        console.error("Create Course Error:", error.message);
        next(error);
    }
};


// =========================
// GET ALL COURSES
// SEARCH + FILTER + SORT + PAGINATION
// =========================

const getAllCourses = async (req, res, next) => {
    try {
        const {
            search,
            category,
            level,
            minPrice,
            maxPrice,
            sort,
            page = 1,
            limit = 10
        } = req.query;

        const query = {};

        // Search
        if (search) {
            query.$or = [
                {
                    title: {
                        $regex: search,
                        $options: "i"
                    }
                },
                {
                    description: {
                        $regex: search,
                        $options: "i"
                    }
                }
            ];
        }

        // Category
        if (category) {
            query.category = {
                $regex: `^${category}$`,
                $options: "i"
            };
        }

        // Level
        if (level) {
            query.level = level;
        }

        // Price range
        if (minPrice !== undefined || maxPrice !== undefined) {
            query.price = {};

            if (minPrice !== undefined) {
                query.price.$gte = Number(minPrice);
            }

            if (maxPrice !== undefined) {
                query.price.$lte = Number(maxPrice);
            }
        }

        // Pagination
        const currentPage = Math.max(
            parseInt(page) || 1,
            1
        );

        const currentLimit = Math.min(
            Math.max(parseInt(limit) || 10, 1),
            100
        );

        const skip = (currentPage - 1) * currentLimit;

        // Sorting
        let sortOption = {
            createdAt: -1
        };

        switch (sort) {
            case "price_asc":
                sortOption = { price: 1 };
                break;

            case "price_desc":
                sortOption = { price: -1 };
                break;

            case "name_asc":
                sortOption = { title: 1 };
                break;

            case "name_desc":
                sortOption = { title: -1 };
                break;

            case "latest":
                sortOption = { createdAt: -1 };
                break;

            case "oldest":
                sortOption = { createdAt: 1 };
                break;
        }

        const totalCourses = await Course.countDocuments(query);

        const courses = await Course.find(query)
            .populate("instructor", "name email")
            .sort(sortOption)
            .skip(skip)
            .limit(currentLimit);

        return res.status(200).json({
            success: true,
            count: courses.length,
            totalCourses,
            currentPage,
            totalPages: Math.ceil(
                totalCourses / currentLimit
            ),
            courses
        });

    } catch (error) {
        console.error("Get Courses Error:", error.message);
        next(error);
    }
};


// =========================
// GET COURSE BY ID
// =========================

const getCourseById = async (req, res, next) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate("instructor", "name email");

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        return res.status(200).json({
            success: true,
            course
        });

    } catch (error) {
        console.error("Get Course Error:", error.message);
        next(error);
    }
};


// =========================
// UPDATE COURSE
// =========================

const updateCourse = async (req, res, next) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        const userRole = String(
            req.user.role || ""
        ).toLowerCase();

        const isAdmin = userRole === "admin";

        const isInstructor =
            course.instructor.toString() ===
            req.user.userId;

        if (!isInstructor && !isAdmin) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not authorized to update this course"
            });
        }

        // Prevent changing instructor through body
        const updateData = {
            ...req.body
        };

        delete updateData.instructor;

        const updatedCourse =
            await Course.findByIdAndUpdate(
                req.params.id,
                updateData,
                {
                    new: true,
                    runValidators: true
                }
            ).populate(
                "instructor",
                "name email"
            );

        return res.status(200).json({
            success: true,
            message: "Course updated successfully",
            course: updatedCourse
        });

    } catch (error) {
        console.error("Update Course Error:", error.message);
        next(error);
    }
};


// =========================
// DELETE COURSE
// =========================

const deleteCourse = async (req, res, next) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        const userRole = String(
            req.user.role || ""
        ).toLowerCase();

        const isAdmin = userRole === "admin";

        const isInstructor =
            course.instructor.toString() ===
            req.user.userId;

        if (!isInstructor && !isAdmin) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not authorized to delete this course"
            });
        }

        await course.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Course deleted successfully"
        });

    } catch (error) {
        console.error("Delete Course Error:", error.message);
        next(error);
    }
};


// =========================
// EXPORT
// =========================

module.exports = {
    createCourse,
    getAllCourses,
    getCourseById,
    updateCourse,
    deleteCourse
};