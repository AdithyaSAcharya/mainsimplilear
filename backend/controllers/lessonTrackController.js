const {
    createLessonTrack,
    updateLessonStatus,
    getUserLessonStatus,
    getCourseProgress,
} = require("../models/lessonTrackModel");

const { redisClient } = require("../congif/redisConnection");

const createLessonTrackController = async (req, res) => {
    try {
        const { courseId, lessonId } = req.body;
        const userId = req.user.id; // Assuming user ID is available from authentication middleware

        if (!courseId || !lessonId) {
            return res.status(400).json({ success: false, message: "Course ID and Lesson ID are required." });
        }

        await createLessonTrack(userId, courseId, lessonId);

        if (redisClient.isReady) {
            await redisClient.del(`user:${userId}:course:${courseId}:progress`);
            await redisClient.del(`user:${userId}:course:${courseId}:lesson:${lessonId}:status`);
        }

        return res.status(201).json({ success: true, message: "Lesson track created/updated successfully." });
    } catch (error) {
        console.error("Error creating/updating lesson track:", error);
        return res.status(500).json({ success: false, message: "Server error while creating/updating lesson track." });
    }
};

const updateLessonStatusController = async (req, res) => {
    try {
        const { courseId, lessonId } = req.params;
        const { status } = req.body; // 'not_started', 'in_progress', 'completed'
        const userId = req.user.id;

        if (!status || !['not_started', 'in_progress', 'completed'].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status provided. Must be 'not_started', 'in_progress', or 'completed'." });
        }

        await updateLessonStatus(userId, courseId, lessonId, status);
        
        if (status === 'completed') {
            const { checkCourseCompletion } = require("../models/lessonTrackModel");
            await checkCourseCompletion(userId, courseId);
        }

        if (redisClient.isReady) {
            await redisClient.del(`user:${userId}:course:${courseId}:progress`);
            await redisClient.del(`user:${userId}:course:${courseId}:lesson:${lessonId}:status`);
        }

        return res.status(200).json({ success: true, message: "Lesson status updated successfully." });
    } catch (error) {
        console.error("Error updating lesson status:", error);
        return res.status(500).json({ success: false, message: "Server error while updating lesson status." });
    }
};

const getUserLessonStatusController = async (req, res) => {
    try {
        const { courseId, lessonId } = req.params;
        const userId = req.user.id;

        if (redisClient.isReady) {
            const cachedStatus = await redisClient.get(`user:${userId}:course:${courseId}:lesson:${lessonId}:status`);
            if (cachedStatus) {
                return res.status(200).json({ success: true, status: JSON.parse(cachedStatus), source: "cache" });
            }
        }

        const status = await getUserLessonStatus(userId, courseId, lessonId);
        if (!status) {
            return res.status(404).json({ success: false, message: "Lesson track not found for this user and lesson." });
        }

        if (redisClient.isReady) {
            await redisClient.setEx(`user:${userId}:course:${courseId}:lesson:${lessonId}:status`, 86400, JSON.stringify(status));
        }

        return res.status(200).json({ success: true, status });
    } catch (error) {
        console.error("Error fetching user lesson status:", error);
        return res.status(500).json({ success: false, message: "Server error while fetching user lesson status." });
    }
};

const getCourseProgressController = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user.id;

        if (redisClient.isReady) {
            const cachedProgress = await redisClient.get(`user:${userId}:course:${courseId}:progress`);
            if (cachedProgress) {
                return res.status(200).json({ success: true, progress: JSON.parse(cachedProgress), source: "cache" });
            }
        }

        const progress = await getCourseProgress(userId, courseId);

        if (redisClient.isReady) {
            await redisClient.setEx(`user:${userId}:course:${courseId}:progress`, 3600, JSON.stringify(progress));
        }

        return res.status(200).json({ success: true, progress });
    } catch (error) {
        console.error("Error fetching course progress:", error);
        return res.status(500).json({ success: false, message: "Server error while fetching course progress." });
    }
};

module.exports = {
    createLessonTrackController,
    updateLessonStatusController,
    getUserLessonStatusController,
    getCourseProgressController,
};
