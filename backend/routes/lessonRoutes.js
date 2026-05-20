const express = require('express');
const router = express.Router();
const lessonController = require('../controllers/lessonController');
const authMiddleware = require('../middleware/authMiddleware');
const instructorMiddleware = require('../middleware/instructorMiddleware');

/**
 * @swagger
 * tags:
 *   name: Lessons
 *   description: Lesson content creation and management APIs
 */

/**
 * @swagger
 * /api/lessons:
 *   post:
 *     summary: Create a new lesson
 *     tags: [Lessons]
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
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *                 example: Introduction to Express
 *               description:
 *                 type: string
 *                 example: In this lesson, we will learn about Express.js basics.
 *               content:
 *                 type: string
 *                 example: "<p>Rich text content here...</p>"
 *     responses:
 *       201:
 *         description: Lesson created successfully
 *       400:
 *         description: Invalid input or missing fields
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Instructor access required
 *       500:
 *         description: Server error
 */
router.post('/', authMiddleware, instructorMiddleware, lessonController.createLesson);

/**
 * @swagger
 * /api/lessons/{id}:
 *   get:
 *     summary: Get a lesson by ID
 *     tags: [Lessons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 60d5ec49f8c7a1001c8e4d5a
 *     responses:
 *       200:
 *         description: Lesson retrieved successfully
 *       404:
 *         description: Lesson not found
 *       500:
 *         description: Server error
 */
router.get('/:id', lessonController.getLessonById);

/**
 * @swagger
 * /api/lessons/{id}:
 *   put:
 *     summary: Update a lesson by ID
 *     tags: [Lessons]
 *     parameters:
 *       - in: path
 *         name: id
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
 *             properties:
 *               title:
 *                 type: string
 *                 example: Updated Express Basics
 *               description:
 *                 type: string
 *                 example: Updated description.
 *               content:
 *                 type: string
 *                 example: "<p>Updated rich text...</p>"
 *     responses:
 *       200:
 *         description: Lesson updated successfully
 *       404:
 *         description: Lesson not found
 *       500:
 *         description: Server error
 */
router.put('/:id', lessonController.updateLesson);

/**
 * @swagger
 * /api/lessons/{id}:
 *   delete:
 *     summary: Delete a lesson by ID
 *     tags: [Lessons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 60d5ec49f8c7a1001c8e4d5a
 *     responses:
 *       200:
 *         description: Lesson deleted successfully
 *       404:
 *         description: Lesson not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', lessonController.deleteLesson);

/**
 * @swagger
 * /api/lessons/course/{courseId}:
 *   get:
 *     summary: Get all lessons for a specific course ID
 *     tags: [Lessons]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Lessons retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/course/:courseId', lessonController.getLessonsByCourseId);

module.exports = router;
