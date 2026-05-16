const jwt = require("jsonwebtoken");

const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    }
  } catch (error) {
    // Ignore invalid tokens for optional auth
  }
  next();
};

module.exports = optionalAuthMiddleware;
