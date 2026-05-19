const mongoose = require("mongoose");

const {
    mysqlPool,
} = require("../congif/mySqlConnection");

const questionSchema =
    new mongoose.Schema({
        type: {
            type: String,
            enum: ["MCQ", "QNA"],
            required: true,
        },

        question: {
            type: String,
            required: true,
        },

        options: [
            {
                type: String,
            },
        ],

        correctAnswer: {
            type: Number,
        },

        answer: {
            type: String,
        },

        marks: {
            type: Number,
            default: 1,
        },
    });

const quizSchema =
    new mongoose.Schema(
        {
            lessonId: {
                type: String,
                required: true,
            },

            courseId: {
                type: String,
                required: true,
            },

            title: {
                type: String,
                required: true,
            },

            description: {
                type: String,
            },

            quizType: {
                type: String,
                enum: [
                    "MCQ",
                    "QNA",
                    "MIXED",
                ],
                default: "MCQ",
            },

            questions: [questionSchema],

            durationInMinutes: {
                type: Number,
                default: 10,
            },

            totalMarks: {
                type: Number,
                default: 0,
            },

            passingMarks: {
                type: Number,
                default: 0,
            },

            isPublished: {
                type: Boolean,
                default: true,
            },

            createdBy: {
                type: String,
                required: true,
            },
        },
        {
            timestamps: true,
        }
    );

const Quiz = mongoose.model(
    "Quiz",
    quizSchema
);

const createQuiz = async ({
    lessonId,
    courseId,
    title,
    description,
    quizType,
    questions,
    durationInMinutes,
    totalMarks,
    passingMarks,
    createdBy,
}) => {
    const quiz = await Quiz.create({
        lessonId,
        courseId,
        title,
        description,
        quizType,
        questions,
        durationInMinutes,
        totalMarks,
        passingMarks,
        createdBy,
    });

    await mysqlPool.execute(
        `
        INSERT INTO course_quizzes
        (
            course_id,
            lesson_id,
            quiz_id
        )
        VALUES (?, ?, ?)
        `,
        [
            courseId,
            lessonId,
            quiz._id.toString(),
        ]
    );

    return quiz;
};

const getQuizById = async (
    quizId
) => {
    console.log("quizId", quizId)
    return await Quiz.findById(
        quizId
    );
};

const getLessonQuizzes =
    async (lessonId) => {
        return await Quiz.find({
            lessonId,
            isPublished: true,
        }).select(
            "title description totalMarks durationInMinutes"
        );
    };

const updateQuiz = async (
    quizId,
    updateData
) => {
    return await Quiz.findByIdAndUpdate(
        quizId,
        updateData,
        {
            new: true,
        }
    );
};

const deleteQuiz = async (
    quizId
) => {
    await Quiz.findByIdAndDelete(
        quizId
    );

    await mysqlPool.execute(
        `
        DELETE FROM course_quizzes
        WHERE quiz_id = ?
        `,
        [quizId]
    );
};

module.exports = Quiz;

module.exports.createQuiz =
    createQuiz;

module.exports.getQuizById =
    getQuizById;

module.exports.getLessonQuizzes =
    getLessonQuizzes;

module.exports.updateQuiz =
    updateQuiz;

module.exports.deleteQuiz =
    deleteQuiz;