const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { uploadCourseImage, uploadLessonImage } = require('../congif/cloudinary');
const { mysqlPool } = require('../congif/mySqlConnection');
const Lesson = require('../models/lessonModel');
const mongoose = require('mongoose');

/**
 * @swagger
 * tags:
 *   name: Uploads
 *   description: Image upload APIs (Cloudinary)
 */

/**
 * POST /api/uploads/course/:courseId/thumbnail
 * Upload a thumbnail image for a course
 */
router.post(
  '/course/:courseId/thumbnail',
  authMiddleware,
  uploadCourseImage.single('image'),
  async (req, res) => {
    try {
      const { courseId } = req.params;
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No image file provided.' });
      }

      const imageUrl = req.file.path; // Cloudinary URL

      await mysqlPool.execute(
        'UPDATE courses SET thumbnail = ? WHERE id = ?',
        [imageUrl, courseId]
      );

      return res.status(200).json({
        success: true,
        message: 'Course thumbnail updated successfully.',
        url: imageUrl,
      });
    } catch (error) {
      console.error('Error uploading course thumbnail:', error);
      return res.status(500).json({ success: false, message: 'Server error during upload.' });
    }
  }
);

/**
 * POST /api/uploads/lesson/:lessonId/thumbnail
 * Upload a thumbnail image for a lesson
 */
router.post(
  '/lesson/:lessonId/thumbnail',
  authMiddleware,
  uploadLessonImage.single('image'),
  async (req, res) => {
    try {
      const { lessonId } = req.params;
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No image file provided.' });
      }
      if (!mongoose.Types.ObjectId.isValid(lessonId)) {
        return res.status(400).json({ success: false, message: 'Invalid lesson ID.' });
      }

      const imageUrl = req.file.path; // Cloudinary URL

      await Lesson.findByIdAndUpdate(lessonId, { thumbnail: imageUrl, updatedAt: Date.now() });

      return res.status(200).json({
        success: true,
        message: 'Lesson thumbnail updated successfully.',
        url: imageUrl,
      });
    } catch (error) {
      console.error('Error uploading lesson thumbnail:', error);
      return res.status(500).json({ success: false, message: 'Server error during upload.' });
    }
  }
);

module.exports = router;
