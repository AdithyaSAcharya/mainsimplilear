const { mysqlPool } = require("../congif/mySqlConnection");
const Quiz = require("./quizModel");
const QuizSubmission = require("./quizSubmissionModel");

const createLessonTrack = async (userId, courseId, lessonId) => {
    const query = `
        INSERT INTO lesson_tracks (user_id, course_id, lesson_id, status)
        VALUES (?, ?, ?, 'not_started')
        ON DUPLICATE KEY UPDATE status = VALUES(status)
    `;
    const [result] = await mysqlPool.execute(query, [userId, courseId, lessonId]);
    return result;
};

const updateLessonStatus = async (userId, courseId, lessonId, status) => {
    const query = `
        INSERT INTO lesson_tracks (user_id, course_id, lesson_id, status, completion_date)
        VALUES (?, ?, ?, ?, CASE WHEN ? = 'completed' THEN NOW() ELSE NULL END)
        ON DUPLICATE KEY UPDATE 
            status = VALUES(status), 
            completion_date = VALUES(completion_date)
    `;
    const [result] = await mysqlPool.execute(query, [userId, courseId, lessonId, status, status]);
    return result;
};

const getUserLessonStatus = async (userId, courseId, lessonId) => {
    const query = `
        SELECT * FROM lesson_tracks
        WHERE user_id = ? AND course_id = ? AND lesson_id = ?
    `;
    const [rows] = await mysqlPool.execute(query, [userId, courseId, lessonId]);
    return rows[0];
};

const getCourseProgress = async (userId, courseId) => {
    // This function will need to compare completed lessons against total lessons for a course.
    // It will require fetching lesson IDs from the courses table (MySQL) and then checking lesson_tracks.
    // For now, let's just get all tracked lessons for a user in a course.
    const query = `
        SELECT lesson_id, status FROM lesson_tracks
        WHERE user_id = ? AND course_id = ?
    `;
    const [rows] = await mysqlPool.execute(query, [userId, courseId]);
    return rows;
};

const checkCourseCompletion = async (userId, courseId) => {
    // ── Step 1: Verify all lessons are completed ──────────────────────────────
    const [courseRows] = await mysqlPool.execute(
        'SELECT lessons FROM courses WHERE id = ?',
        [courseId]
    );
    if (courseRows.length === 0) return;

    const rawLessons = courseRows[0].lessons;
    const lessonIds = rawLessons
        ? (typeof rawLessons === 'string' ? JSON.parse(rawLessons) : rawLessons)
        : [];

    const totalLessons = lessonIds.length;
    if (totalLessons === 0) return; // No lessons → nothing to complete

    const [trackRows] = await mysqlPool.execute(
        `SELECT COUNT(*) as count FROM lesson_tracks
         WHERE user_id = ? AND course_id = ? AND status = 'completed'`,
        [userId, courseId]
    );
    const completedLessons = trackRows[0].count;

    if (completedLessons < totalLessons) return; // Lessons not all done yet

    // ── Step 2: Verify all quizzes are passed ─────────────────────────────────
    // Fetch quiz IDs registered for this course (stored in MySQL course_quizzes)
    const [quizRows] = await mysqlPool.execute(
        'SELECT quiz_id FROM course_quizzes WHERE course_id = ?',
        [courseId]
    );

    if (quizRows.length > 0) {
        const quizIds = quizRows.map(r => r.quiz_id);

        for (const quizId of quizIds) {
            // Get the quiz details (passingMarks) from MongoDB
            const quiz = await Quiz.findById(quizId).select('passingMarks').lean();
            if (!quiz) continue; // Quiz deleted — skip it

            const passingMarks = quiz.passingMarks || 0;

            // Find the student's best submission for this quiz
            const bestSubmission = await QuizSubmission.findOne({
                quizId: quizId.toString(),
                studentId: userId.toString(),
                score: { $gte: passingMarks },
            });

            if (!bestSubmission) {
                // This quiz hasn't been passed → course not complete yet
                console.log(`User ${userId} has not passed quiz ${quizId} for course ${courseId}. Completion blocked.`);
                return;
            }
        }
    }

    // ── Step 3: All lessons done + all quizzes passed → mark as completed ─────
    await mysqlPool.execute(
        `UPDATE enrollments SET completion_status = 'completed'
         WHERE user_id = ? AND course_id = ?`,
        [userId, courseId]
    );

    console.log(`✅ User ${userId} has completed course ${courseId}`);
};

module.exports = {
    createLessonTrack,
    updateLessonStatus,
    getUserLessonStatus,
    getCourseProgress,
    checkCourseCompletion,
};
