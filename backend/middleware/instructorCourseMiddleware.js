const {
    getCourseById,
  } = require("../models/courseModel");
  
  const instructorCourseMiddleware = async (
    req,
    res,
    next
  ) => {
    try {
      if (req.user.role !== "INSTRUCTOR") {
        return res.status(403).json({
          success: false,
          message: "Instructor access required",
        });
      }
  
      const courseId = req.params.id;
  
      const course = await getCourseById(courseId);
  
      if (!course) {
        return res.status(404).json({
          success: false,
          message: "Course not found",
        });
      }
  
      if (
        course.instructor_id !== req.user.id
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can only manage your own courses",
        });
      }
  
      req.course = course;
  
      next();
    } catch (error) {
      console.log(error);
  
      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  };
  
  module.exports = instructorCourseMiddleware;