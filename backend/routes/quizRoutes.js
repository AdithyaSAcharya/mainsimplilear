const express = require("express");

const router = express.Router();

const authMiddleware = require(
    "../middleware/authMiddleware"
);

const instructorMiddleware = require(
    "../middleware/instructorMiddleware"
);

const instructorCourseMiddleware = require(
    "../middleware/instructorCourseMiddleware"
);

const quizOwnershipMiddleware = require(
    "../middleware/quizOwnershipMiddleware"
);

const studentEnrollmentMiddleware = require(
    "../middleware/studentEnrollmentMiddleware"
);


const {
    reviewSubmissionController,
} = require(
    "../controllers/quizReviewController"
);

const {
    createQuizController,
    updateQuizController,
    deleteQuizController,
    getQuizByIdController,
    getLessonQuizzesController,
    getQuizForManageController,
} = require(
    "../controllers/quizController"
);

const {
    submitQuizController,
    getQuizSubmissionsController,
    getStudentQuizResultController,
    getMyQuizAttemptsController,
} = require(
    "../controllers/quizSubmissionController"
);

/**
 * @swagger
 * tags:
 *   name: Quizzes
 *   description: Quiz creation, submission, evaluation, and management APIs
 */

/**
 * @swagger
 * /api/quizzes/course/{courseId}:
 *   post:
 *     summary: Create a new quiz for a course
 *     tags: [Quizzes]
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
 *               - title
 *               - questions
 *             properties:
 *               title:
 *                 type: string
 *                 example: Node.js Basics Quiz
 *               description:
 *                 type: string
 *                 example: Test your knowledge on core Node.js concepts
 *               durationInMinutes:
 *                 type: integer
 *                 example: 15
 *               passingMarks:
 *                 type: integer
 *                 example: 5
 *               totalMarks:
 *                 type: integer
 *                 example: 10
 *               lessonId:
 *                 type: string
 *                 example: 60d5ec49f8c7a1001c8e4d5a
 *               questions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - text
 *                     - type
 *                   properties:
 *                     text:
 *                       type: string
 *                       example: What is Node.js?
 *                     type:
 *                       type: string
 *                       enum: [MCQ, QNA]
 *                       example: MCQ
 *                     options:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["A runtime environment", "A programming language", "A framework", "A database"]
 *                     correctOption:
 *                       type: integer
 *                       example: 0
 *                     marks:
 *                       type: integer
 *                       example: 2
 *     responses:
 *       201:
 *         description: Quiz created successfully
 *       400:
 *         description: Invalid parameters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Instructor access required
 *       500:
 *         description: Server error
 */
router.post(
    "/course/:courseId",
    authMiddleware,
    instructorMiddleware,
    instructorCourseMiddleware,
    createQuizController
);

/**
 * @swagger
 * /api/quizzes/{quizId}:
 *   put:
 *     summary: Update an existing quiz
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: quizId
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
 *                 example: Updated Quiz Title
 *               description:
 *                 type: string
 *                 example: Updated description
 *     responses:
 *       200:
 *         description: Quiz updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Quiz owner access required
 *       500:
 *         description: Server error
 */
router.put(
    "/:quizId",
    authMiddleware,
    instructorMiddleware,
    quizOwnershipMiddleware,
    updateQuizController
);

/**
 * @swagger
 * /api/quizzes/{quizId}:
 *   delete:
 *     summary: Delete a quiz
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *         example: 60d5ec49f8c7a1001c8e4d5a
 *     responses:
 *       200:
 *         description: Quiz deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.delete(
    "/:quizId",
    authMiddleware,
    instructorMiddleware,
    quizOwnershipMiddleware,
    deleteQuizController
);

/**
 * @swagger
 * /api/quizzes/lesson/{lessonId}:
 *   get:
 *     summary: Get all quizzes associated with a specific lesson ID
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *         example: 60d5ec49f8c7a1001c8e4d5a
 *     responses:
 *       200:
 *         description: List of quizzes retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
    "/lesson/:lessonId",
    authMiddleware,
    getLessonQuizzesController
);

/**
 * @swagger
 * /api/quizzes/{quizId}/manage:
 *   get:
 *     summary: Get quiz configuration details for management (Instructor view)
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *         example: 60d5ec49f8c7a1001c8e4d5a
 *     responses:
 *       200:
 *         description: Quiz data retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get(
    "/:quizId/manage",
    authMiddleware,
    instructorMiddleware,
    quizOwnershipMiddleware,
    getQuizForManageController
);

/**
 * @swagger
 * /api/quizzes/{quizId}:
 *   get:
 *     summary: Get a quiz details by ID (Student view)
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *         example: 60d5ec49f8c7a1001c8e4d5a
 *     responses:
 *       200:
 *         description: Quiz retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Must be enrolled
 *       500:
 *         description: Server error
 */
router.get(
    "/:quizId",
    authMiddleware,
    studentEnrollmentMiddleware,
    getQuizByIdController
);

/**
 * @swagger
 * /api/quizzes/{quizId}/submit:
 *   post:
 *     summary: Submit a quiz attempt
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: quizId
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
 *               - answers
 *             properties:
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - questionId
 *                   properties:
 *                     questionId:
 *                       type: string
 *                       example: 60d5ec49f8c7a1001c8e4d5b
 *                     selectedOption:
 *                       type: integer
 *                       example: 0
 *                     answerText:
 *                       type: string
 *                       example: "Sample written response."
 *     responses:
 *       200:
 *         description: Quiz submitted and graded (for MCQs) successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post(
    "/:quizId/submit",
    authMiddleware,
    studentEnrollmentMiddleware,
    submitQuizController
);

/**
 * @swagger
 * /api/quizzes/{quizId}/submissions:
 *   get:
 *     summary: Get all student submissions for a specific quiz
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *         example: 60d5ec49f8c7a1001c8e4d5a
 *     responses:
 *       200:
 *         description: List of student submissions retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get(
    "/:quizId/submissions",
    authMiddleware,
    instructorMiddleware,
    quizOwnershipMiddleware,
    getQuizSubmissionsController
);

/**
 * @swagger
 * /api/quizzes/{quizId}/result:
 *   get:
 *     summary: Get a student's personal quiz result for a quiz ID
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *         example: 60d5ec49f8c7a1001c8e4d5a
 *     responses:
 *       200:
 *         description: Quiz result retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Submission not found
 *       500:
 *         description: Server error
 */
router.get(
    "/:quizId/result",
    authMiddleware,
    studentEnrollmentMiddleware,
    getStudentQuizResultController
);

/**
 * @swagger
 * /api/quizzes/my-attempts:
 *   get:
 *     summary: Get all quiz attempts by the authenticated student
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of attempts retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
    "/my-attempts",
    authMiddleware,
    getMyQuizAttemptsController
);

/**
 * @swagger
 * /api/quizzes/submissions/{submissionId}/review:
 *   patch:
 *     summary: Review and grade a student's QNA quiz submission
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: string
 *         example: 60d5ec49f8c7a1001c8e4d5c
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - grades
 *             properties:
 *               grades:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - questionId
 *                     - obtainedMarks
 *                   properties:
 *                     questionId:
 *                       type: string
 *                       example: 60d5ec49f8c7a1001c8e4d5b
 *                     obtainedMarks:
 *                       type: number
 *                       example: 2
 *                     feedback:
 *                       type: string
 *                       example: Good job!
 *     responses:
 *       200:
 *         description: Submission reviewed and updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.patch(
    "/submissions/:submissionId/review",
    authMiddleware,
    instructorMiddleware,
    reviewSubmissionController
);

module.exports = router;