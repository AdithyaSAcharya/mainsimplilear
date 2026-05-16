const express = require("express");

const router = express.Router();

const authMiddleware = require(
  "../middleware/authMiddleware"
);

const adminMiddleware = require(
  "../middleware/adminMiddleware"
);

const {
  createInstructor,
  getInstructorCoursesController,
} = require(
  "../controllers/instructorController"
);

/**
 * @swagger
 * tags:
 *   name: Instructors
 *   description: Instructor Management APIs
 */

/**
 * @swagger
 * /api/instructors/create:
 *   post:
 *     summary: Create a new instructor
 *     tags: [Instructors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - password
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: john@gmail.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       201:
 *         description: Instructor created successfully
 *       400:
 *         description: User already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.post(
  "/create",
  authMiddleware,
  adminMiddleware,
  createInstructor
);

/**
 * @swagger
 * /api/instructors/courses:
 *   get:
 *     summary: Get all courses created by the authenticated instructor
 *     tags: [Instructors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of instructor's courses
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  "/courses",
  authMiddleware,
  getInstructorCoursesController
);

module.exports = router;