const { mysqlPool } = require("../congif/mySqlConnection");

const createCourse = async (
  title,
  shortDescription,
  thumbnail,
  instructorId,
  mongoCourseContentId
) => {
  const query = `
    INSERT INTO courses
    (
      title,
      short_description,
      thumbnail,
      instructor_id,
      mongo_course_content_id
    )
    VALUES (?, ?, ?, ?, ?)
  `;

  const [result] = await mysqlPool.execute(query, [
    title,
    shortDescription,
    thumbnail,
    instructorId,
    mongoCourseContentId,
  ]);

  return result;
};

const getAllCourses = async () => {
  const query = `
    SELECT * FROM courses
    WHERE is_published = 1
  `;

  const [rows] = await mysqlPool.execute(query);

  return rows;
};

const getCourseById = async (courseId) => {
  const query = `
    SELECT * FROM courses
    WHERE id = ?
  `;

  const [rows] = await mysqlPool.execute(query, [
    courseId,
  ]);

  return rows[0];
};

const updateCourse = async (
  title,
  shortDescription,
  thumbnail,
  courseId
) => {
  const query = `
    UPDATE courses
    SET
      title = ?,
      short_description = ?,
      thumbnail = ?
    WHERE id = ?
  `;

  const [result] = await mysqlPool.execute(query, [
    title,
    shortDescription,
    thumbnail,
    courseId,
  ]);

  return result;
};

const deleteCourse = async (courseId) => {
  const query = `
    DELETE FROM courses
    WHERE id = ?
  `;

  const [result] = await mysqlPool.execute(query, [
    courseId,
  ]);

  return result;
};

module.exports = {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
};