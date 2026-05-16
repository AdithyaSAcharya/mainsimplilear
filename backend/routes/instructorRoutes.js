const express = require("express");

const router = express.Router();

const authMiddleware = require(
  "../middleware/authMiddleware"
);

const adminMiddleware = require(
  "../middleware/adminMiddleware"
);

const {
  createInstructor,
} = require(
  "../controllers/instructorController"
);

router.post(
  "/create",
  authMiddleware,
  adminMiddleware,
  createInstructor
);

module.exports = router;