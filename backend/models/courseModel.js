const { mysqlPool } = require("../congif/mySqlConnection");
const Lesson = require('./lessonModel'); // Import the Lesson model

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
      mongo_course_content_id,
      lessons
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const [result] = await mysqlPool.execute(query, [
    title,
    shortDescription,
    thumbnail,
    instructorId,
    mongoCourseContentId,
    JSON.stringify([]) // Initialize lessons as an empty JSON array
  ]);

  return result;
};

const getAllCourses = async (userId = null, role = null, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  let baseWhere = `WHERE c.is_published = 1`;
  let params = [];

  if (role === 'INSTRUCTOR' && userId) {
    baseWhere = `WHERE (c.is_published = 1 OR c.instructor_id = ?)`;
    params.push(userId);
  } else if (role === 'SUPER_ADMIN') {
    baseWhere = ``;
  }

  const joinClause = `FROM courses c LEFT JOIN users u ON c.instructor_id = u.id`;

  // COUNT query (no LIMIT/OFFSET)
  const countQuery = `SELECT COUNT(*) as total ${joinClause} ${baseWhere}`;
  const [[{ total }]] = await mysqlPool.execute(countQuery, params);

  // Data query with pagination
  const dataQuery = `
    SELECT c.*, u.full_name as instructor_name
    ${joinClause}
    ${baseWhere}
    ORDER BY c.created_at DESC
    LIMIT ${Number(limit)} OFFSET ${Number(offset)}
  `;
  const [rows] = await mysqlPool.execute(dataQuery, params);

  return { rows, total };
};


const getCourseById = async (courseId) => {
  const query = `
    SELECT c.*, u.full_name as instructor_name 
    FROM courses c
    LEFT JOIN users u ON c.instructor_id = u.id
    WHERE c.id = ?
  `;

  const [rows] = await mysqlPool.execute(query, [
    courseId,
  ]);

  let course = rows[0];

  if (course && course.lessons) {
    try {
      const lessonIds = typeof course.lessons === 'string' ? JSON.parse(course.lessons) : course.lessons;
      if (lessonIds.length > 0) {
        const lessons = await Promise.all(
          lessonIds.map(async (lessonId) => {
            try {
              return await Lesson.findById(lessonId);
            } catch (mongoError) {
              console.error(`Error fetching lesson ${lessonId} from MongoDB:`, mongoError);
              return null; // Return null for lessons that couldn't be fetched
            }
          })
        );
        course.lessons = lessons
          .filter((lesson) => lesson !== null)
          .map((lesson) =>
            lesson.toObject ? lesson.toObject() : lesson
          );
      } else {
        course.lessons = [];
      }
    } catch (parseError) {
      console.error("Error parsing lessons JSON from course:", parseError);
      course.lessons = []; // Default to empty array if parsing fails
    }
  } else if (course) {
    course.lessons = []; // Ensure lessons array exists even if column is null/empty
  }

  return course;
};

const updateCourse = async (
  title,
  shortDescription,
  thumbnail,
  is_published,
  courseId
) => {
  
  const query = `
    UPDATE courses
    SET
      title = ?,
      short_description = ?,
      thumbnail = ?,
      is_published = ?
    WHERE id = ?
  `;


  const [result] = await mysqlPool.execute(query, [
    title,
    shortDescription,
    thumbnail,
    is_published,
    courseId
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

async function addLessonToCourse(courseId, lessonId) {
  const [rows] = await mysqlPool.execute('SELECT lessons FROM courses WHERE id = ?', [courseId]);
  let lessons = rows[0].lessons ? (typeof rows[0].lessons === 'string' ? JSON.parse(rows[0].lessons) : rows[0].lessons) : [];

  if (!lessons.includes(lessonId)) {
    lessons.push(lessonId);
    const query = `
      UPDATE courses
      SET lessons = ?
      WHERE id = ?
    `;
    await mysqlPool.execute(query, [JSON.stringify(lessons), courseId]);
  }
  return lessons;
}

async function removeLessonFromCourse(courseId, lessonId) {
  const [rows] = await mysqlPool.execute('SELECT lessons FROM courses WHERE id = ?', [courseId]);
  let lessons = rows[0].lessons ? (typeof rows[0].lessons === 'string' ? JSON.parse(rows[0].lessons) : rows[0].lessons) : [];

  const initialLength = lessons.length;
  lessons = lessons.filter(id => id !== lessonId);

  if (lessons.length < initialLength) { // Only update if a lesson was actually removed
    const query = `
      UPDATE courses
      SET lessons = ?
      WHERE id = ?
    `;
    await mysqlPool.execute(query, [JSON.stringify(lessons), courseId]);
  }
  return lessons;
}

const getInstructorCourses = async (instructorId) => {
  const query = `
    SELECT * FROM courses
    WHERE instructor_id = ?
  `;

  const [rows] = await mysqlPool.execute(query, [
    instructorId,
  ]);

  return rows;
};

module.exports = {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  addLessonToCourse,
  removeLessonFromCourse,
  getInstructorCourses,
};