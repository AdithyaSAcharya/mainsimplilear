const { mysqlPool } = require("../congif/mySqlConnection");

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
        UPDATE lesson_tracks
        SET status = ?, completion_date = CASE WHEN ? = 'completed' THEN NOW() ELSE NULL END
        WHERE user_id = ? AND course_id = ? AND lesson_id = ?
    `;
    const [result] = await mysqlPool.execute(query, [status, status, userId, courseId, lessonId]);
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
    // Get total lessons for course
    const [courseRows] = await mysqlPool.execute('SELECT lessons FROM courses WHERE id = ?', [courseId]);
    if (courseRows.length === 0) return;
    
    let lessons = courseRows[0].lessons ? (typeof courseRows[0].lessons === 'string' ? JSON.parse(courseRows[0].lessons) : courseRows[0].lessons) : [];
    const totalLessons = lessons.length;
    if (totalLessons === 0) return;

    // Get completed lessons count
    const [trackRows] = await mysqlPool.execute('SELECT COUNT(*) as count FROM lesson_tracks WHERE user_id = ? AND course_id = ? AND status = "completed"', [userId, courseId]);
    const completedLessons = trackRows[0].count;

    // Update enrollment if all completed
    if (completedLessons >= totalLessons) {
        await mysqlPool.execute('UPDATE enrollments SET completion_status = "completed" WHERE user_id = ? AND course_id = ?', [userId, courseId]);
    }
};

module.exports = {
    createLessonTrack,
    updateLessonStatus,
    getUserLessonStatus,
    getCourseProgress,
    checkCourseCompletion,
};
