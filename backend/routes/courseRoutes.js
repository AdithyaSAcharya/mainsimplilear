const express = require("express");

const router = express.Router();

const authMiddleware = require(
  "../middleware/authMiddleware"
);

const instructorCourseMiddleware =
  require(
    "../middleware/instructorCourseMiddleware"
  );

const {
  createCourseController,
  getAllCoursesController,
  getCourseByIdController,
  updateCourseController,
  deleteCourseController,
} = require(
  "../controllers/courseController"
);

router.post(
  "/",
  authMiddleware,
  createCourseController
);

router.get(
  "/",
  getAllCoursesController
);

router.get(
  "/:id",
  getCourseByIdController
);

router.put(
  "/:id",
  authMiddleware,
  instructorCourseMiddleware,
  updateCourseController
);

router.delete(
  "/:id",
  authMiddleware,
  instructorCourseMiddleware,
  deleteCourseController
);

module.exports = router;