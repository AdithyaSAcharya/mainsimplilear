const {
    createCourse,
    getAllCourses,
    getCourseById,
    updateCourse,
    deleteCourse,
    addLessonToCourse,
    removeLessonFromCourse,
  } = require("../models/courseModel");
  
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
        const courses =
          await getAllCourses();
  
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
        const course =
          await getCourseById(
            req.params.id
          );
  
        return res.status(200).json({
          success: true,
          course,
        });
      } catch (error) {
        console.log(error);
  
        return res.status(500).json({
          success: false,
          message: "Server error",
        });
      }
    };
  
  const updateCourseController =
    async (req, res) => {
      try {
        const {
          title,
          shortDescription,
          thumbnail,
          is_published
        } = req.body;
        
        await updateCourse(
          title,
          shortDescription,
          thumbnail,
          is_published,
          req.params.id
        );
  
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