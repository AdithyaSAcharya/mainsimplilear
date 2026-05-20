const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { checkEligibilityAndGenerateCertificate } = require('../controllers/certificateController');

/**
 * @swagger
 * /api/certificates/{courseId}:
 *   get:
 *     summary: Generate a course completion certificate
 *     tags: [Certificates]
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
 *         description: PDF certificate file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Course or quizzes not completed
 *       403:
 *         description: User not enrolled
 *       500:
 *         description: Server error
 */
router.get('/:courseId', authMiddleware, checkEligibilityAndGenerateCertificate);

module.exports = router;
