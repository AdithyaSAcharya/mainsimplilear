const {
    createCourse,
    getAllCourses,
    getCourseById,
    updateCourse,
    deleteCourse,
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
  
      await createCourse(
        title,
        shortDescription,
        thumbnail,
        req.user.id,
        mongoCourseContentId
      );
  
      return res.status(201).json({
        success: true,
        message: "Course created",
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
        } = req.body;
  
        await updateCourse(
          title,
          shortDescription,
          thumbnail,
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
  
  module.exports = {
    createCourseController,
    getAllCoursesController,
    getCourseByIdController,
    updateCourseController,
    deleteCourseController,
  };