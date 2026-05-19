const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    content: {
        type: String, // Storing rich text content as a string
        required: true
    },
    courseId: {
        type: String, // Changed to String to store MySQL course ID
        required: true
    },
    thumbnail: {
        type: String,
        default: null
    },
    videoUrl: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update 'updatedAt' field on save
lessonSchema.pre('save', function() {
    this.updatedAt = Date.now();
});

const Lesson = mongoose.model('Lesson', lessonSchema);

module.exports = Lesson;