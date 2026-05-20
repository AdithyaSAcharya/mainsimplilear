const express = require("express");
const { getOrCreateThread, getThreadMessages, getSharedCourses, getUserThreads } = require("../controllers/chatController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: Real-time messaging and communication APIs
 */

/**
 * @swagger
 * /api/chat/threads:
 *   get:
 *     summary: Get all active chat threads for the logged-in user
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active chat threads successfully retrieved
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/threads", getUserThreads);

/**
 * @swagger
 * /api/chat/thread/{otherUserId}:
 *   get:
 *     summary: Get or create a unified chat thread with another user
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: otherUserId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 3
 *     responses:
 *       200:
 *         description: Chat thread retrieved or created successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/thread/:otherUserId", getOrCreateThread);

/**
 * @swagger
 * /api/chat/messages/{threadId}:
 *   get:
 *     summary: Get chat history for a thread
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: threadId
 *         required: true
 *         schema:
 *           type: string
 *         example: "thread123"
 *     responses:
 *       200:
 *         description: Chat history messages retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/messages/:threadId", getThreadMessages);

/**
 * @swagger
 * /api/chat/shared-courses/{otherUserId}:
 *   get:
 *     summary: Get list of shared courses with another user
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: otherUserId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 3
 *     responses:
 *       200:
 *         description: Shared courses retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/shared-courses/:otherUserId", getSharedCourses);

module.exports = router;
