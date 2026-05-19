const {
    createQuiz,
    updateQuiz,
    deleteQuiz,
    getQuizById,
    getLessonQuizzes,
} = require("../models/quizModel");

const createQuizController =
    async (req, res) => {
        try {
            const { courseId } =
                req.params;

            const {
                lessonId,
                title,
                description,
                quizType,
                questions,
                durationInMinutes,
                totalMarks,
                passingMarks,
            } = req.body;

            const quiz =
                await createQuiz({
                    lessonId,
                    courseId,
                    title,
                    description,
                    quizType,
                    questions,
                    durationInMinutes,
                    totalMarks,
                    passingMarks,
                    createdBy:
                        req.user.id,
                });

            return res.status(201).json({
                success: true,
                message:
                    "Quiz created successfully",
                quiz,
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

const updateQuizController =
    async (req, res) => {
        try {
            const updatedQuiz =
                await updateQuiz(
                    req.params.quizId,
                    req.body
                );

            return res.json({
                success: true,
                message:
                    "Quiz updated successfully",
                updatedQuiz,
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

const deleteQuizController =
    async (req, res) => {
        try {
            await deleteQuiz(
                req.params.quizId
            );

            return res.json({
                success: true,
                message:
                    "Quiz deleted successfully",
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

const getQuizByIdController =
    async (req, res) => {
        try {
            const quiz =
                await getQuizById(
                    req.params.quizId
                );

            console.log("here in the flow")

            if (!quiz) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Quiz not found",
                });
            }

            const safeQuiz =
                quiz.toObject();

            safeQuiz.questions =
                safeQuiz.questions.map(
                    (question) => {
                        delete question.correctAnswer;

                        delete question.answer;

                        return question;
                    }
                );

            console.log("here in the flow")

            return res.json({
                success: true,
                quiz: safeQuiz,
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

const getLessonQuizzesController =
    async (req, res) => {
        try {
            const quizzes =
                await getLessonQuizzes(
                    req.params.lessonId
                );

            return res.json({
                success: true,
                quizzes,
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

const getQuizForManageController =
    async (req, res) => {
        try {
            return res.json({
                success: true,
                quiz: req.quiz,
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
    createQuizController,
    updateQuizController,
    deleteQuizController,
    getQuizByIdController,
    getLessonQuizzesController,
    getQuizForManageController,
};