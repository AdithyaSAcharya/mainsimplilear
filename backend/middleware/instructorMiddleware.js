const instructorMiddleware = (req, res, next) => {
    if (req.user.role !== "INSTRUCTOR") {
      return res.status(403).json({
        success: false,
        message: "Instructor access required",
      });
    }
    next();
  };
  
  module.exports = instructorMiddleware;