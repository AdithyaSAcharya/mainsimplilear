const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const validator = require("validator");

const {
    createUser,
    getUserByEmail,
  } = require("../models/userModel");

  const signup = async (req, res) => {
    try {
      const {
        fullName,
        email,
        password,
      } = req.body;
  
      if (!fullName || !email || !password) {
        return res.status(400).json({
          success: false,
          message: "All fields are required",
        });
      }
  
      if (!validator.isEmail(email)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email",
        });
      }
  
      const existingUser = await getUserByEmail(email);
  
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
        "STUDENT"
      );
  
      return res.status(201).json({
        success: true,
        message: "User created successfully",
      });
    } catch (error) {
      console.log(error);
  
      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  };

  const signin = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      const user = await getUserByEmail(email);
  
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Invalid credentials",
        });
      }
  
      const isPasswordMatched =
        await bcrypt.compare(
          password,
          user.password
        );
  
      if (!isPasswordMatched) {
        return res.status(400).json({
          success: false,
          message: "Invalid credentials",
        });
      }
  
      const token = jwt.sign(
        {
          id: user.id,
          role: user.role,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "7d",
        }
      );
  
      return res.status(200).json({
        success: true,
        token,
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.log(error);
  
      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  };
  
  const signout = async (req, res) => {
    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  };
  
  module.exports = {
    signup,
    signin,
    signout,
  };


