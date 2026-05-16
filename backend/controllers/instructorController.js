const {
  createUser,
  getUserByEmail,
} = require("../models/userModel");

const {
  getInstructorCourses,
} = require("../models/courseModel");

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
    const courses = await getInstructorCourses(instructorId);
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