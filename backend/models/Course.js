const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Course title is required"],
            trim: true
        },

        description: {
            type: String,
            required: [true, "Course description is required"],
            trim: true
        },

        instructor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Instructor is required"]
        },

        category: {
            type: String,
            required: [true, "Course category is required"],
            trim: true
        },

        level: {
            type: String,
            enum: ["Beginner", "Intermediate", "Advanced"],
            default: "Beginner"
        },

        price: {
            type: Number,
            default: 0,
            min: 0
        },

        thumbnail: {
            type: String,
            default: ""
        },

        duration: {
            type: String,
            default: ""
        },

        isPublished: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Course", courseSchema);