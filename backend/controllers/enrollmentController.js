const {
    enrollUserInCourse,
    getUserEnrollments,
    getCourseEnrollments,
    updateEnrollmentStatus,
    checkUserEnrollment,
} = require("../models/enrollmentModel");

const { redisClient } = require("../congif/redisConnection");

const enrollUserInCourseController = async (req, res) => {
    try {
        const { courseId } = req.body;
        const userId = req.user.id; // Assuming user ID is available from authentication middleware

        if (!courseId) {
            return res.status(400).json({ success: false, message: "Course ID is required." });
        }

        const isAlreadyEnrolled = await checkUserEnrollment(userId, courseId);
        if (isAlreadyEnrolled) {
            return res.status(400).json({ success: false, message: "User is already enrolled in this course." });
        }

        const result = await enrollUserInCourse(userId, courseId);

        if (redisClient.isReady) {
            await redisClient.del(`user:${userId}:enrollments`);
            await redisClient.del(`course:${courseId}:enrollments`);
        }

        return res.status(201).json({ success: true, message: "User enrolled in course successfully.", enrollmentId: result.insertId });
    } catch (error) {
        console.error("Error enrolling user in course:", error);
        return res.status(500).json({ success: false, message: "Server error while enrolling user." });
    }
};

const getUserEnrollmentsController = async (req, res) => {
    try {
        const userId = req.user.id; // Assuming user ID is available from authentication middleware

        if (redisClient.isReady) {
            const cachedEnrollments = await redisClient.get(`user:${userId}:enrollments`);
            if (cachedEnrollments) {
                return res.status(200).json({ success: true, enrollments: JSON.parse(cachedEnrollments), source: "cache" });
            }
        }

        const enrollments = await getUserEnrollments(userId);

        if (redisClient.isReady) {
            await redisClient.setEx(`user:${userId}:enrollments`, 86400, JSON.stringify(enrollments)); // 24 hours TTL
        }

        return res.status(200).json({ success: true, enrollments });
    } catch (error) {
        console.error("Error fetching user enrollments:", error);
        return res.status(500).json({ success: false, message: "Server error while fetching enrollments." });
    }
};

const getCourseEnrollmentsController = async (req, res) => {
    try {
        const { courseId } = req.params;

        if (redisClient.isReady) {
            const cachedEnrollments = await redisClient.get(`course:${courseId}:enrollments`);
            if (cachedEnrollments) {
                return res.status(200).json({ success: true, enrollments: JSON.parse(cachedEnrollments), source: "cache" });
            }
        }

        const enrollments = await getCourseEnrollments(courseId);

        if (redisClient.isReady) {
            await redisClient.setEx(`course:${courseId}:enrollments`, 86400, JSON.stringify(enrollments)); // 24 hours TTL
        }

        return res.status(200).json({ success: true, enrollments });
    } catch (error) {
        console.error("Error fetching course enrollments:", error);
        return res.status(500).json({ success: false, message: "Server error while fetching course enrollments." });
    }
};

const updateEnrollmentStatusController = async (req, res) => {
    try {
        const { enrollmentId } = req.params;
        const { status } = req.body; // 'in_progress' or 'completed'

        if (!status || !['in_progress', 'completed'].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status provided. Must be 'in_progress' or 'completed'." });
        }

        await updateEnrollmentStatus(enrollmentId, status);
        return res.status(200).json({ success: true, message: "Enrollment status updated successfully." });
    } catch (error) {
        console.error("Error updating enrollment status:", error);
        return res.status(500).json({ success: false, message: "Server error while updating enrollment status." });
    }
};

module.exports = {
    enrollUserInCourseController,
    getUserEnrollmentsController,
    getCourseEnrollmentsController,
    updateEnrollmentStatusController,
};
