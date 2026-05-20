const express = require("express");

const router = express.Router();

const authMiddleware = require(
  "../middleware/authMiddleware"
);

const optionalAuthMiddleware = require("../middleware/optionalAuthMiddleware");

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
  addLessonToCourseController,
  removeLessonFromCourseController,
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
  optionalAuthMiddleware,
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
  optionalAuthMiddleware,
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

/**
 * @swagger
 * /api/courses/{courseId}/lessons:
 *   post:
 *     summary: Add a lesson to a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
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
 *             required:
 *               - lessonId
 *             properties:
 *               lessonId:
 *                 type: string
 *                 example: 60d5ec49f8c7a1001c8e4d5a
 *     responses:
 *       200:
 *         description: Lesson added to course
 *       400:
 *         description: Lesson ID is required
 *       500:
 *         description: Server error
 */
router.post(
  "/:courseId/lessons",
  authMiddleware,
  instructorCourseMiddleware,
  addLessonToCourseController
);

/**
 * @swagger
 * /api/courses/{courseId}/lessons:
 *   delete:
 *     summary: Remove a lesson from a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
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
 *             required:
 *               - lessonId
 *             properties:
 *               lessonId:
 *                 type: string
 *                 example: 60d5ec49f8c7a1001c8e4d5a
 *     responses:
 *       200:
 *         description: Lesson removed from course
 *       400:
 *         description: Lesson ID is required
 *       500:
 *         description: Server error
 */
router.delete(
  "/:courseId/lessons",
  authMiddleware,
  instructorCourseMiddleware,
  removeLessonFromCourseController
);

module.exports = router;