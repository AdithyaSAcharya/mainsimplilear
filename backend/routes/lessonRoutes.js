const express = require('express');
const router = express.Router();
const lessonController = require('../controllers/lessonController');
const authMiddleware = require('../middleware/authMiddleware');
const instructorMiddleware = require('../middleware/instructorMiddleware');

// Create a new lesson
router.post('/', authMiddleware, instructorMiddleware, lessonController.createLesson);

// Get a lesson by ID
router.get('/:id', lessonController.getLessonById);

// Update a lesson by ID
router.put('/:id', lessonController.updateLesson);

// Delete a lesson by ID
router.delete('/:id', lessonController.deleteLesson);

// Get all lessons for a specific course ID
router.get('/course/:courseId', lessonController.getLessonsByCourseId);

module.exports = router;
