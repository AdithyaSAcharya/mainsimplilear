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

router.post(
    "/course/:courseId",
    authMiddleware,
    instructorMiddleware,
    instructorCourseMiddleware,
    createQuizController
);

router.put(
    "/:quizId",
    authMiddleware,
    instructorMiddleware,
    quizOwnershipMiddleware,
    updateQuizController
);

router.delete(
    "/:quizId",
    authMiddleware,
    instructorMiddleware,
    quizOwnershipMiddleware,
    deleteQuizController
);

router.get(
    "/lesson/:lessonId",
    authMiddleware,
    getLessonQuizzesController
);

router.get(
    "/:quizId/manage",
    authMiddleware,
    instructorMiddleware,
    quizOwnershipMiddleware,
    getQuizForManageController
);

router.get(
    "/:quizId",
    authMiddleware,
    studentEnrollmentMiddleware,
    getQuizByIdController
);

router.post(
    "/:quizId/submit",
    authMiddleware,
    studentEnrollmentMiddleware,
    submitQuizController
);

router.get(
    "/:quizId/submissions",
    authMiddleware,
    instructorMiddleware,
    quizOwnershipMiddleware,
    getQuizSubmissionsController
);

router.get(
    "/:quizId/result",
    authMiddleware,
    studentEnrollmentMiddleware,
    getStudentQuizResultController
);

router.get(
    "/my-attempts",
    authMiddleware,
    getMyQuizAttemptsController
);

router.patch(
    "/submissions/:submissionId/review",
    authMiddleware,
    instructorMiddleware,
    reviewSubmissionController
);



module.exports = router;