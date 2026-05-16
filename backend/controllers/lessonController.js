const Lesson = require('../models/lessonModel');
const mongoose = require('mongoose');

// Create a new lesson
const createLesson = async (req, res) => {
    const { title, description, content, courseId } = req.body;

    // Basic validation
    if (!title || !description || !content || !courseId) {
        return res.status(400).json({ message: 'All fields (title, description, content, courseId) are required.' });
    }

    try {
        const newLesson = new Lesson({
            title,
            description,
            content,
            courseId // Added courseId back
        });

        const savedLesson = await newLesson.save();
        res.status(201).json(savedLesson);
    } catch (error) {
        console.error('Error creating lesson:', error);
        res.status(500).json({ message: 'Server error while creating lesson.' });
    }
};

// Get a lesson by ID
const getLessonById = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid lesson ID format.' });
    }

    try {
        const lesson = await Lesson.findById(id);
        if (!lesson) {
            return res.status(404).json({ message: 'Lesson not found.' });
        }
        res.status(200).json(lesson);
    } catch (error) {
        console.error('Error fetching lesson by ID:', error);
        res.status(500).json({ message: 'Server error while fetching lesson.' });
    }
};

// Update a lesson
const updateLesson = async (req, res) => {
    const { id } = req.params;
    const { title, description, content, courseId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid lesson ID format.' });
    }

    try {
        const updatedLesson = await Lesson.findByIdAndUpdate(
            id,
            { title, description, content, courseId, updatedAt: Date.now() },
            { new: true, runValidators: true } // Return the updated document and run schema validators
        );

        if (!updatedLesson) {
            return res.status(404).json({ message: 'Lesson not found.' });
        }
        res.status(200).json(updatedLesson);
    } catch (error) {
        console.error('Error updating lesson:', error);
        res.status(500).json({ message: 'Server error while updating lesson.' });
    }
};

// Delete a lesson
const deleteLesson = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid lesson ID format.' });
    }

    try {
        const deletedLesson = await Lesson.findByIdAndDelete(id);
        if (!deletedLesson) {
            return res.status(404).json({ message: 'Lesson not found.' });
        }
        res.status(200).json({ message: 'Lesson deleted successfully.' });
    } catch (error) {
        console.error('Error deleting lesson:', error);
        res.status(500).json({ message: 'Server error while deleting lesson.' });
    }
};

// Get all lessons for a specific course ID
const getLessonsByCourseId = async (req, res) => {
    const { courseId } = req.params;

    try {
        const lessons = await Lesson.find({ courseId: courseId }).sort({ createdAt: 1 }); // Sort by creation date
        res.status(200).json(lessons);
    } catch (error) {
        console.error('Error fetching lessons by course ID:', error);
        res.status(500).json({ message: 'Server error while fetching lessons.' });
    }
};

module.exports = {
    createLesson,
    getLessonById,
    updateLesson,
    deleteLesson,
    getLessonsByCourseId
};
