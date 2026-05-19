const {
  createUser,
  getUserByEmail,
} = require("../models/userModel");
const bcrypt = require("bcryptjs");

const {
  getInstructorCourses,
} = require("../models/courseModel");

const { redisClient } = require("../congif/redisConnection");

const createInstructor = async (
  req,
  res
) => {
  try {
    const {
      fullName,
      email,
      password,
    } = req.body;

    const existingUser =
      await getUserByEmail(email);

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    await createUser(
      fullName,
      email,
      hashedPassword,
      "INSTRUCTOR"
    );

    return res.status(201).json({
      success: true,
      message: "Instructor created",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getInstructorCoursesController = async (req, res) => {
  try {
    const instructorId = req.user.id;

    if (redisClient.isReady) {
        const cachedCourses = await redisClient.get(`instructor:${instructorId}:courses`);
        if (cachedCourses) {
            return res.status(200).json({ success: true, courses: JSON.parse(cachedCourses), source: "cache" });
        }
    }

    const courses = await getInstructorCourses(instructorId);

    if (redisClient.isReady) {
        await redisClient.setEx(`instructor:${instructorId}:courses`, 3600, JSON.stringify(courses)); // 1 hour TTL
    }

    return res.status(200).json({ success: true, courses });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  createInstructor,
  getInstructorCoursesController,
};