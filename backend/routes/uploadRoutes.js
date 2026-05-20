const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  uploadCourseImage,
  uploadLessonImage,
  uploadLessonVideo,
} = require('../congif/cloudinary');
const { mysqlPool } = require('../congif/mySqlConnection');
const Lesson = require('../models/lessonModel');
const mongoose = require('mongoose');

/**
 * @swagger
 * tags:
 *   name: Uploads
 *   description: Image and video upload APIs (Cloudinary)
 */

/**
 * @swagger
 * /api/uploads/course/{courseId}/thumbnail:
 *   post:
 *     summary: Upload a thumbnail image for a course
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Course thumbnail updated successfully.
 *       400:
 *         description: No image file provided.
 *       500:
 *         description: Server error during upload.
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

      const imageUrl = req.file.path;

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
 * @swagger
 * /api/uploads/lesson/{lessonId}/thumbnail:
 *   post:
 *     summary: Upload a thumbnail image for a lesson
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *         example: 60d5ec49f8c7a1001c8e4d5a
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Lesson thumbnail updated successfully.
 *       400:
 *         description: No image file provided or invalid lesson ID.
 *       500:
 *         description: Server error during upload.
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

      const imageUrl =
        req.file.path || req.file.secure_url || req.file.url;

      if (!imageUrl) {
        return res.status(500).json({
          success: false,
          message: 'Upload succeeded but no image URL was returned.',
        });
      }

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

/**
 * @swagger
 * /api/uploads/lesson/{lessonId}/video:
 *   post:
 *     summary: Upload a lesson video to Cloudinary
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *         example: 60d5ec49f8c7a1001c8e4d5a
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - video
 *             properties:
 *               video:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Lesson video uploaded successfully.
 *       400:
 *         description: No video file provided or invalid lesson ID.
 *       500:
 *         description: Server error during video upload.
 */
router.post(
  '/lesson/:lessonId/video',
  authMiddleware,
  uploadLessonVideo.single('video'),
  async (req, res) => {
    try {
      const { lessonId } = req.params;
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No video file provided.' });
      }
      if (!mongoose.Types.ObjectId.isValid(lessonId)) {
        return res.status(400).json({ success: false, message: 'Invalid lesson ID.' });
      }

      const videoUrl =
        req.file.path || req.file.secure_url || req.file.url;

      if (!videoUrl) {
        return res.status(500).json({
          success: false,
          message: 'Upload succeeded but no video URL was returned.',
        });
      }

      await Lesson.findByIdAndUpdate(lessonId, {
        videoUrl,
        updatedAt: Date.now(),
      });

      return res.status(200).json({
        success: true,
        message: 'Lesson video uploaded successfully.',
        url: videoUrl,
      });
    } catch (error) {
      console.error('Error uploading lesson video:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Server error during video upload.',
      });
    }
  }
);

/**
 * @swagger
 * /api/uploads/lesson/{lessonId}/video:
 *   delete:
 *     summary: Remove lesson video reference from MongoDB
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *         example: 60d5ec49f8c7a1001c8e4d5a
 *     responses:
 *       200:
 *         description: Lesson video removed successfully.
 *       404:
 *         description: Lesson not found.
 *       500:
 *         description: Failed to remove video.
 */
router.delete(
  '/lesson/:lessonId/video',
  authMiddleware,
  async (req, res) => {
    try {
      const { lessonId } = req.params;
      const lesson = await Lesson.findById(lessonId);

      if (!lesson) {
        return res.status(404).json({ success: false, message: 'Lesson not found.' });
      }

      await Lesson.findByIdAndUpdate(lessonId, {
        videoUrl: null,
        updatedAt: Date.now(),
      });

      return res.status(200).json({
        success: true,
        message: 'Lesson video removed.',
      });
    } catch (error) {
      console.error('Error deleting lesson video:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to remove video.',
      });
    }
  }
);

module.exports = router;
