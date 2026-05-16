const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');
const authMiddleware = require('../middleware/authMiddleware'); // Assuming authMiddleware is needed for user identification

/**
 * @swagger
 * tags:
 *   name: Enrollments
 *   description: Course Enrollment Management APIs
 */

/**
 * @swagger
 * /api/enrollments:
 *   post:
 *     summary: Enroll a user in a course
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseId
 *             properties:
 *               courseId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: User enrolled in course successfully
 *       400:
 *         description: Course ID is required
 *       500:
 *         description: Server error
 */
router.post('/', authMiddleware, enrollmentController.enrollUserInCourseController);

/**
 * @swagger
 * /api/enrollments/user:
 *   get:
 *     summary: Get all courses a user is enrolled in
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's enrollments
 *       500:
 *         description: Server error
 */
router.get('/user', authMiddleware, enrollmentController.getUserEnrollmentsController);

/**
 * @swagger
 * /api/enrollments/course/{courseId}:
 *   get:
 *     summary: Get all users enrolled in a specific course
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: List of enrollments for the course
 *       500:
 *         description: Server error
 */
router.get('/course/:courseId', authMiddleware, enrollmentController.getCourseEnrollmentsController);

/**
 * @swagger
 * /api/enrollments/{enrollmentId}/status:
 *   put:
 *     summary: Update the status of an enrollment
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: enrollmentId
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [in_progress, completed]
 *                 example: completed
 *     responses:
 *       200:
 *         description: Enrollment status updated successfully
 *       400:
 *         description: Invalid status provided
 *       500:
 *         description: Server error
 */
router.put('/:enrollmentId/status', authMiddleware, enrollmentController.updateEnrollmentStatusController);

module.exports = router;
