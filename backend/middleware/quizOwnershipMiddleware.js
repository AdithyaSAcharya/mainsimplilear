const Quiz = require("../models/quizModel");

const quizOwnershipMiddleware = async (
    req,
    res,
    next
) => {
    try {
        const { quizId } = req.params;

        const quiz = await Quiz.findById(
            quizId
        );

        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: "Quiz not found",
            });
        }

        if (
            quiz.createdBy.toString() !==
            req.user.id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You can only manage your own quizzes",
            });
        }

        req.quiz = quiz;

        next();
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

module.exports =
    quizOwnershipMiddleware;