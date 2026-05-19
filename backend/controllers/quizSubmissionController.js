const {
    getQuizById,
} = require("../models/quizModel");

const {
    createQuizSubmission,
    getQuizSubmissions,
    getStudentQuizResult,
    getMyQuizAttempts,
} = require("../models/quizSubmissionModel");

const submitQuizController =
    async (req, res) => {
        try {
            const { quizId } =
                req.params;

            const { answers } =
                req.body;

            const quiz =
                await getQuizById(
                    quizId
                );

            if (!quiz) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Quiz not found",
                });
            }

            let score = 0;

            const evaluatedAnswers =
                answers.map(
                    (
                        submittedAnswer
                    ) => {
                        const originalQuestion =
                            quiz.questions.find(
                                (q) =>
                                    q._id.toString() ===
                                    submittedAnswer.questionId
                            );

                        if (
                            !originalQuestion
                        ) {
                            return submittedAnswer;
                        }

                        if (
                            originalQuestion.type ===
                            "MCQ"
                        ) {
                            const isCorrect =
                                originalQuestion.correctAnswer ===
                                submittedAnswer.selectedOption;

                            const obtainedMarks =
                                isCorrect
                                    ? originalQuestion.marks
                                    : 0;

                            score +=
                                obtainedMarks;

                            return {
                                ...submittedAnswer,
                                isCorrect,
                                obtainedMarks,
                            };
                        }

                        return {
                            ...submittedAnswer,
                            obtainedMarks: 0,
                            reviewedByInstructor: false,
                        };
                    }
                );

            const submission =
                await createQuizSubmission(
                    {
                        quizId,
                        studentId:
                            req.user.id,
                        lessonId:
                            quiz.lessonId,
                        courseId:
                            quiz.courseId,
                        answers:
                            evaluatedAnswers,
                        score,
                        totalMarks:
                            quiz.totalMarks,
                    }
                );

            return res.json({
                success: true,
                message:
                    "Quiz submitted successfully",
                score,
                submission,
            });
        } catch (error) {
            console.log(error);

            return res.status(500).json({
                success: false,
                message:
                    "Server error",
            });
        }
    };

const getQuizSubmissionsController =
    async (req, res) => {
        try {
            const submissions =
                await getQuizSubmissions(
                    req.params.quizId
                );

            return res.json({
                success: true,
                total:
                    submissions.length,
                submissions,
            });
        } catch (error) {
            console.log(error);

            return res.status(500).json({
                success: false,
                message:
                    "Server error",
            });
        }
    };

const getStudentQuizResultController =
    async (req, res) => {
        try {
            const submission =
                await getStudentQuizResult(
                    req.params.quizId,
                    req.user.id
                );

            if (!submission) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Quiz result not found",
                });
            }

            return res.json({
                success: true,
                submission,
            });
        } catch (error) {
            console.log(error);

            return res.status(500).json({
                success: false,
                message:
                    "Server error",
            });
        }
    };

const getMyQuizAttemptsController =
    async (req, res) => {
        try {
            const submissions =
                await getMyQuizAttempts(
                    req.user.id
                );

            return res.json({
                success: true,
                submissions,
            });
        } catch (error) {
            console.log(error);

            return res.status(500).json({
                success: false,
                message:
                    "Server error",
            });
        }
    };

module.exports = {
    submitQuizController,
    getQuizSubmissionsController,
    getStudentQuizResultController,
    getMyQuizAttemptsController,
};