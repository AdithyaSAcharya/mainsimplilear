const {
    createCourse,
    getAllCourses,
    getCourseById,
    updateCourse,
    deleteCourse,
    addLessonToCourse,
    removeLessonFromCourse,
  } = require("../models/courseModel");
  
  const { checkUserEnrollment } = require("../models/enrollmentModel");
  const { redisClient } = require("../congif/redisConnection");
  
  const createCourseController = async (
    req,
    res
  ) => {
    try {
      const {
        title,
        shortDescription,
        thumbnail,
        mongoCourseContentId,
      } = req.body;
  
      const result = await createCourse(
        title,
        shortDescription,
        thumbnail || null,
        req.user.id,
        mongoCourseContentId || null
      );
  
      if (redisClient.isReady) {
        await redisClient.del("courses:all");
      }

      return res.status(201).json({
        success: true,
        message: "Course created",
        courseId: result.insertId
      });
    } catch (error) {
      console.log(error);
  
      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  };
  
  const getAllCoursesController =
    async (req, res) => {
      try {
        if (redisClient.isReady) {
          const cachedCourses = await redisClient.get("courses:all");
          if (cachedCourses) {
            return res.status(200).json({
              success: true,
              courses: JSON.parse(cachedCourses),
              source: "cache"
            });
          }
        }

        const courses =
          await getAllCourses();

        if (redisClient.isReady) {
          await redisClient.setEx("courses:all", 86400, JSON.stringify(courses)); // 24 hours TTL
        }

        return res.status(200).json({
          success: true,
          courses,
        });
      } catch (error) {
        console.log(error);
  
        return res.status(500).json({
          success: false,
          message: "Server error",
        });
      }
    };
  
  const getCourseByIdController =
    async (req, res) => {
      try {
        let course = null;
        if (redisClient.isReady) {
          const cachedCourse = await redisClient.get(`course:${req.params.id}:details`);
          if (cachedCourse) {
            course = JSON.parse(cachedCourse);
          }
        }

        if (!course) {
          course = await getCourseById(req.params.id);
          if (course && redisClient.isReady) {
            await redisClient.setEx(`course:${req.params.id}:details`, 86400, JSON.stringify(course));
          }
        }

        if (!course) {
           return res.status(404).json({ success: false, message: "Course not found" });
        }

        // Deep copy to prevent mutating the cached reference if it's an object in memory
        let courseObj = typeof course.toObject === 'function' ? course.toObject() : JSON.parse(JSON.stringify(course));

        let canViewContent = false;
        if (req.user) {
            if (courseObj.instructor_id === req.user.id || req.user.role === 'SUPER_ADMIN') {
                canViewContent = true;
            } else {
                canViewContent = await checkUserEnrollment(req.user.id, req.params.id);
            }
        }
        
        if (!canViewContent && courseObj && courseObj.lessons) {
            // Strip content for non-enrolled users
            courseObj.lessons = courseObj.lessons.map(lesson => {
                const lessonItem = lesson.toObject ? lesson.toObject() : lesson;
                delete lessonItem.content;
                return lessonItem;
            });
        }
  
        return res.status(200).json({
          success: true,
          course: courseObj,
        });
      } catch (error) {
        console.log(error);
  
        return res.status(500).json({
          success: false,
          message: "Server error",
        });
      }
    };
  
  const updateCourseController = async (req, res) => {
    try {
      const existingCourse = await getCourseById(req.params.id);
      if (!existingCourse) {
        return res.status(404).json({ success: false, message: "Course not found" });
      }

      const title = req.body.title !== undefined ? req.body.title : existingCourse.title;
      const shortDescription = req.body.shortDescription !== undefined ? req.body.shortDescription : existingCourse.short_description;
      const thumbnail = req.body.thumbnail !== undefined ? req.body.thumbnail : existingCourse.thumbnail;
      const is_published = req.body.is_published !== undefined ? req.body.is_published : existingCourse.is_published;
      
      await updateCourse(
        title,
        shortDescription,
        thumbnail,
        is_published,
        req.params.id
      );

      if (redisClient.isReady) {
        await redisClient.del("courses:all");
        await redisClient.del(`course:${req.params.id}:details`);
      }

      return res.status(200).json({
        success: true,
        message: "Course updated",
      });
      } catch (error) {
        console.log(error);
  
        return res.status(500).json({
          success: false,
          message: "Server error",
        });
      }
    };
  
  const deleteCourseController =
    async (req, res) => {
      try {
        await deleteCourse(req.params.id);
  
        if (redisClient.isReady) {
          await redisClient.del("courses:all");
          await redisClient.del(`course:${req.params.id}:details`);
        }

        return res.status(200).json({
          success: true,
          message: "Course deleted",
        });
      } catch (error) {
        console.log(error);
  
        return res.status(500).json({
          success: false,
          message: "Server error",
        });
      }
    };

  const addLessonToCourseController = async (req, res) => {
    try {
      const { courseId } = req.params;
      const { lessonId } = req.body;

      if (!lessonId) {
        return res.status(400).json({ success: false, message: "Lesson ID is required." });
      }

      await addLessonToCourse(courseId, lessonId);

      if (redisClient.isReady) {
        await redisClient.del(`course:${courseId}:details`);
      }

      return res.status(200).json({ success: true, message: "Lesson added to course." });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, message: "Server error." });
    }
  };

  const removeLessonFromCourseController = async (req, res) => {
    try {
      const { courseId } = req.params;
      const { lessonId } = req.body;

      if (!lessonId) {
        return res.status(400).json({ success: false, message: "Lesson ID is required." });
      }

      await removeLessonFromCourse(courseId, lessonId);

      if (redisClient.isReady) {
        await redisClient.del(`course:${courseId}:details`);
      }

      return res.status(200).json({ success: true, message: "Lesson removed from course." });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, message: "Server error." });
    }
  };
  
  module.exports = {
    createCourseController,
    getAllCoursesController,
    getCourseByIdController,
    updateCourseController,
    deleteCourseController,
    addLessonToCourseController,
    removeLessonFromCourseController,
  };