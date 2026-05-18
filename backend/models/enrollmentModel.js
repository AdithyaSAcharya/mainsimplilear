const { mysqlPool } = require("../congif/mySqlConnection");

const enrollUserInCourse = async (userId, courseId) => {
    const query = `
        INSERT INTO enrollments (user_id, course_id)
        VALUES (?, ?)
    `;
    const [result] = await mysqlPool.execute(query, [userId, courseId]);
    return result;
};

const getUserEnrollments = async (userId) => {
    const query = `
        SELECT e.*, c.title as course_title, c.short_description as course_short_description, c.thumbnail as course_thumbnail
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        WHERE e.user_id = ?
    `;
    const [rows] = await mysqlPool.execute(query, [userId]);
    return rows;
};

const getCourseEnrollments = async (courseId) => {
    const query = `
        SELECT e.*, u.full_name, u.email
        FROM enrollments e
        JOIN users u ON e.user_id = u.id
        WHERE e.course_id = ?
    `;
    const [rows] = await mysqlPool.execute(query, [courseId]);
    return rows;
};

const updateEnrollmentStatus = async (enrollmentId, status) => {
    const query = `
        UPDATE enrollments
        SET completion_status = ?
        WHERE id = ?
    `;
    const [result] = await mysqlPool.execute(query, [status, enrollmentId]);
    return result;
};

const checkUserEnrollment = async (userId, courseId) => {
    const query = `
        SELECT id FROM enrollments
        WHERE user_id = ? AND course_id = ?
    `;
    const [rows] = await mysqlPool.execute(query, [userId, courseId]);
    return rows.length > 0;
};

module.exports = {
    enrollUserInCourse,
    getUserEnrollments,
    getCourseEnrollments,
    updateEnrollmentStatus,
    checkUserEnrollment,
};
