const adminMiddleware = (
    req,
    res,
    next
  ) => {
    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }
  
    next();
  };
  
  module.exports = adminMiddleware;