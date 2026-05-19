const QuizSubmission = require(
    "../models/quizSubmissionModel"
);

const Quiz = require(
    "../models/quizModel"
);

const submissionOwnershipMiddleware =
    async (req, res, next) => {
        try {
            const submission =
                await QuizSubmission.findById(
                    req.params.submissionId
                );

            if (!submission) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Submission not found",
                });
            }

            const quiz =
                await Quiz.findById(
                    submission.quizId
                );

            if (!quiz) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Quiz not found",
                });
            }

            if (
                quiz.createdBy.toString() !==
                req.user.id.toString()
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        "Unauthorized access",
                });
            }

            req.submission =
                submission;

            req.quiz = quiz;

            next();
        } catch (error) {
            console.log(error);

            return res.status(500).json({
                success: false,
                message:
                    "Server error",
            });
        }
    };

module.exports =
    submissionOwnershipMiddleware;