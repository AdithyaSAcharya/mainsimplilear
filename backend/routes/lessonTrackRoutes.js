const express = require('express');
const router = express.Router();
const lessonTrackController = require('../controllers/lessonTrackController');
const authMiddleware = require('../middleware/authMiddleware'); // Assuming authMiddleware is needed for user identification

/**
 * @swagger
 * tags:
 *   name: Lesson Tracks
 *   description: Lesson Progress Tracking APIs
 */

/**
 * @swagger
 * /api/lesson-tracks:
 *   post:
 *     summary: Create or update a lesson track entry
 *     tags: [Lesson Tracks]
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
 *               - lessonId
 *             properties:
 *               courseId:
 *                 type: integer
 *                 example: 1
 *               lessonId:
 *                 type: string
 *                 example: 60d5ec49f8c7a1001c8e4d5a
 *     responses:
 *       201:
 *         description: Lesson track created/updated successfully
 *       400:
 *         description: Course ID and Lesson ID are required
 *       500:
 *         description: Server error
 */
router.post('/', authMiddleware, lessonTrackController.createLessonTrackController);

/**
 * @swagger
 * /api/lesson-tracks/{courseId}/{lessonId}/status:
 *   put:
 *     summary: Update the status of a specific lesson for a user
 *     tags: [Lesson Tracks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *         example: 60d5ec49f8c7a1001c8e4d5a
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
 *                 enum: [not_started, in_progress, completed]
 *                 example: completed
 *     responses:
 *       200:
 *         description: Lesson status updated successfully
 *       400:
 *         description: Invalid status provided
 *       500:
 *         description: Server error
 */
router.put('/:courseId/:lessonId/status', authMiddleware, lessonTrackController.updateLessonStatusController);

/**
 * @swagger
 * /api/lesson-tracks/{courseId}/{lessonId}:
 *   get:
 *     summary: Get the status of a specific lesson for a user
 *     tags: [Lesson Tracks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *         example: 60d5ec49f8c7a1001c8e4d5a
 *     responses:
 *       200:
 *         description: Lesson status fetched successfully
 *       404:
 *         description: Lesson track not found
 *       500:
 *         description: Server error
 */
router.get('/:courseId/:lessonId', authMiddleware, lessonTrackController.getUserLessonStatusController);

/**
 * @swagger
 * /api/lesson-tracks/course/{courseId}/progress:
 *   get:
 *     summary: Get a user's progress in a course
 *     tags: [Lesson Tracks]
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
 *         description: User's course progress fetched successfully
 *       500:
 *         description: Server error
 */
router.get('/course/:courseId/progress', authMiddleware, lessonTrackController.getCourseProgressController);

module.exports = router;
