# Online Learning Platform

An online learning platform developed as a team project for managing courses, users, enrollments, authentication and real-time communication.

---

## Project Overview

The Online Learning Platform allows users to register and login, browse courses, search and filter courses, manage their profiles and enroll in courses.

The backend provides secure REST APIs using Node.js, Express.js and MongoDB.

---

## Features

### Authentication
- User Registration
- User Login
- JWT Authentication
- Password Hashing using bcrypt
- Protected Routes
- Role-Based Authorization
- Change Password
- Update Profile
- Get User Profile

### Course Management
- Create Course
- Get All Courses
- Get Course by ID
- Update Course
- Delete Course
- Course Search
- Course Category Filter
- Course Level Filter
- Price Filter
- Course Sorting
- Course Pagination

### Real-Time Communication
- Socket.IO integration
- Real-time communication structure
- Chat module structure

### Security
- JWT authentication
- bcrypt password hashing
- Protected APIs
- Role-based access control
- Input validation
- Global error handling

---

## Tech Stack

### Frontend
- React.js
- React Router
- Axios
- HTML
- CSS
- JavaScript

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcryptjs
- Socket.IO
- CORS
- dotenv

### Tools
- Visual Studio Code
- Postman
- MongoDB Atlas
- Git
- GitHub

---

## Backend Folder Structure

```text
backend/
│
├── config/
│   └── db.js
│
├── controllers/
│   ├── authController.js
│   └── courseController.js
│
├── middleware/
│   ├── authMiddleware.js
│   ├── errorMiddleware.js
│   ├── roleMiddleware.js
│   └── validationMiddleware.js
│
├── models/
│   ├── User.js
│   └── Course.js
│
├── routes/
│   ├── authRoutes.js
│   ├── courseRoutes.js
│   └── healthRoutes.js
│
├── socket/
│   └── socketHandler.js
│
├── .env
├── package.json
└── server.js