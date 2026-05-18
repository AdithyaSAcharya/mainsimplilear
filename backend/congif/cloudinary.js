const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

const courseImageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'learnstack/courses',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1280, height: 720, crop: 'fill' }],
  },
});

const lessonImageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'learnstack/lessons',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1280, height: 720, crop: 'limit' }],
  },
});

const uploadCourseImage = multer({ storage: courseImageStorage });
const uploadLessonImage = multer({ storage: lessonImageStorage });

module.exports = { cloudinary, uploadCourseImage, uploadLessonImage };
