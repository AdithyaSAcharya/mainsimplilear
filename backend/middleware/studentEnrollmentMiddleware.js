const {
    mysqlPool,
} = require("../congif/mySqlConnection");

const Quiz = require(
    "../models/quizModel"
);

const studentEnrollmentMiddleware =
    async (req, res, next) => {
        try {
            const quiz =
                await Quiz.findById(
                    req.params.quizId
                );

            if (!quiz) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Quiz not found",
                });
            }

            const [rows] =
                await mysqlPool.execute(
                    `
                    SELECT *
                    FROM enrollments
                    WHERE user_id = ?
                    AND course_id = ?
                    `,
                    [
                        req.user.id,
                        quiz.courseId,
                    ]
                );

            if (
                rows.length === 0
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        "You are not enrolled in this course",
                });
            }

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
    studentEnrollmentMiddleware;