const express = require("express");

const router = express.Router();

const authMiddleware = require(
  "../middleware/authMiddleware"
);

const instructorCourseMiddleware =
  require(
    "../middleware/instructorCourseMiddleware"
  );

const {
  createCourseController,
  getAllCoursesController,
  getCourseByIdController,
  updateCourseController,
  deleteCourseController,
} = require(
  "../controllers/courseController"
);

/**
 * @swagger
 * tags:
 *   name: Courses
 *   description: Course Management APIs
 */

/**
 * @swagger
 * /api/courses:
 *   post:
 *     summary: Create a new course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - shortDescription
 *             properties:
 *               title:
 *                 type: string
 *                 example: Complete Node.js Bootcamp
 *               shortDescription:
 *                 type: string
 *                 example: Learn Node.js from basics to advanced
 *               thumbnail:
 *                 type: string
 *                 example: https://image-url.com/course.png
 *               mongoCourseContentId:
 *                 type: string
 *                 example: 665ab12345efgh6789
 *     responses:
 *       201:
 *         description: Course created
 *       500:
 *         description: Server error
 */
router.post(
  "/",
  authMiddleware,
  createCourseController
);

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: Get all published courses
 *     tags: [Courses]
 *     responses:
 *       200:
 *         description: List of courses
 *       500:
 *         description: Server error
 */
router.get(
  "/",
  getAllCoursesController
);

/**
 * @swagger
 * /api/courses/{id}:
 *   get:
 *     summary: Get course by ID
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Course fetched successfully
 *       500:
 *         description: Server error
 */
router.get(
  "/:id",
  getCourseByIdController
);

/**
 * @swagger
 * /api/courses/{id}:
 *   put:
 *     summary: Update a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Updated Node.js Course
 *               shortDescription:
 *                 type: string
 *                 example: Updated description
 *               thumbnail:
 *                 type: string
 *                 example: https://image-url.com/new-image.png
 *     responses:
 *       200:
 *         description: Course updated
 *       500:
 *         description: Server error
 */
router.put(
  "/:id",
  authMiddleware,
  instructorCourseMiddleware,
  updateCourseController
);

/**
 * @swagger
 * /api/courses/{id}:
 *   delete:
 *     summary: Delete a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Course deleted
 *       500:
 *         description: Server error
 */
router.delete(
  "/:id",
  authMiddleware,
  instructorCourseMiddleware,
  deleteCourseController
);

module.exports = router;