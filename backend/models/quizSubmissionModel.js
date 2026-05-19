const mongoose = require("mongoose");

const {
    mysqlPool,
} = require("../congif/mySqlConnection");

const answerSchema =
    new mongoose.Schema({
        questionId: String,

        type: {
            type: String,
            enum: ["MCQ", "QNA"],
        },

        selectedOption: Number,

        answerText: String,

        isCorrect: Boolean,

        obtainedMarks: {
            type: Number,
            default: 0,
        },

        reviewedByInstructor: {
            type: Boolean,
            default: false,
        },

        feedback: {
            type: String,
            default: "",
        },
    });

const quizSubmissionSchema =
    new mongoose.Schema(
        {
            quizId: {
                type: String,
                required: true,
            },

            studentId: {
                type: String,
                required: true,
            },

            lessonId: {
                type: String,
                required: true,
            },

            courseId: {
                type: String,
                required: true,
            },

            answers: [answerSchema],

            score: {
                type: Number,
                default: 0,
            },

            totalMarks: {
                type: Number,
                default: 0,
            },

            submittedAt: {
                type: Date,
                default: Date.now,
            },

            status: {
                type: String,
                enum: [
                    "SUBMITTED",
                    "REVIEWED",
                ],
                default: "SUBMITTED",
            },
        },
        {
            timestamps: true,
        }
    );

const QuizSubmission =
    mongoose.model(
        "QuizSubmission",
        quizSubmissionSchema
    );

const createQuizSubmission =
    async ({
        quizId,
        studentId,
        lessonId,
        courseId,
        answers,
        score,
        totalMarks,
    }) => {
        const submission =
            await QuizSubmission.create({
                quizId,
                studentId,
                lessonId,
                courseId,
                answers,
                score,
                totalMarks,
            });

        await mysqlPool.execute(
            `
            INSERT INTO quiz_attempts
            (
                student_id,
                course_id,
                lesson_id,
                quiz_id,
                submission_id,
                score,
                status,
                submitted_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
            `,
            [
                studentId,
                courseId,
                lessonId,
                quizId,
                submission._id.toString(),
                score,
                "SUBMITTED",
            ]
        );

        return submission;
    };

const getQuizSubmissions =
    async (quizId) => {
        return await QuizSubmission.find({
            quizId,
        }).sort({
            createdAt: -1,
        });
    };

const getStudentQuizResult =
    async (quizId, studentId) => {
        return await QuizSubmission.findOne(
            {
                quizId,
                studentId,
            }
        );
    };

const getMyQuizAttempts =
    async (studentId) => {
        return await QuizSubmission.find({
            studentId,
        }).sort({
            createdAt: -1,
        });
    };

const getSubmissionById =
    async (submissionId) => {
        return await QuizSubmission.findById(
            submissionId
        );
    };

module.exports = QuizSubmission;

module.exports.createQuizSubmission =
    createQuizSubmission;

module.exports.getQuizSubmissions =
    getQuizSubmissions;

module.exports.getStudentQuizResult =
    getStudentQuizResult;

module.exports.getMyQuizAttempts =
    getMyQuizAttempts;

module.exports.getSubmissionById =
    getSubmissionById;