const {
    enrollUserInCourse,
    getUserEnrollments,
    getCourseEnrollments,
    updateEnrollmentStatus,
    checkUserEnrollment,
} = require("../models/enrollmentModel");

const { redisClient } = require("../congif/redisConnection");
const { mysqlPool } = require("../congif/mySqlConnection");

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
            await redisClient.del('admin:dashboard'); // Bust admin cache so new enrollment is visible
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

// an api which gives the status of the course of a user.
// all the lessions should be complete
// all the quizes should be complete. 
// then it should return true else false .


// solution 
// get the id of the course 
// get all the lessions from the coursr and also all the quizes
// if all the lessons are complete and quizes are passed then 
// return true else false.

const isTheCourseComplete = async (req, res) => {
    try {
        const body = req.body || {};
        const params = req.params || {};
        const query = req.query || {};

        const courseId = body.course_id || body.courseId || params.courseId || query.course_id || query.courseId;
        const studentId = body.student_id || body.studentId || params.studentId || query.student_id || query.studentId || body.userId || body.user_id || query.userId || query.user_id || (req.user ? req.user.id : null);
        const enrollmentId = body.enrollment_id || body.enrollmentId || params.enrollmentId || query.enrollment_id || query.enrollmentId;

        if (!courseId) {
            return res.status(400).json({ success: false, message: "Course ID is required." });
        }
        if (!studentId) {
            return res.status(400).json({ success: false, message: "Student/User ID is required." });
        }

        // 1. Verify and retrieve enrollment
        let enrollment = null;
        if (enrollmentId) {
            const [enrollmentRows] = await mysqlPool.execute(
                'SELECT * FROM enrollments WHERE id = ?',
                [enrollmentId]
            );
            if (enrollmentRows.length === 0) {
                return res.status(404).json({ success: false, message: "Enrollment not found." });
            }
            enrollment = enrollmentRows[0];
            if (String(enrollment.user_id) !== String(studentId) || String(enrollment.course_id) !== String(courseId)) {
                return res.status(400).json({ success: false, message: "Enrollment student or course ID mismatch." });
            }
        } else {
            const [enrollmentRows] = await mysqlPool.execute(
                'SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?',
                [studentId, courseId]
            );
            if (enrollmentRows.length === 0) {
                return res.status(404).json({ success: false, message: "Enrollment not found for this student and course." });
            }
            enrollment = enrollmentRows[0];
        }

        // 2. Fetch course and its lessons list
        const [courseRows] = await mysqlPool.execute(
            'SELECT title, lessons FROM courses WHERE id = ?',
            [courseId]
        );
        if (courseRows.length === 0) {
            return res.status(404).json({ success: false, message: "Course not found." });
        }

        const courseTitle = courseRows[0].title;
        const rawLessons = courseRows[0].lessons;
        const lessonIds = rawLessons
            ? (typeof rawLessons === 'string' ? JSON.parse(rawLessons) : rawLessons)
            : [];

        const lessonStatusDetails = [];
        let allLessonsCompleted = true;

        const Quiz = require("../models/quizModel");
        const QuizSubmission = require("../models/quizSubmissionModel");
        const Lesson = require("../models/lessonModel");

        // 3. For each lesson, check track status and quiz completion
        for (const lessonId of lessonIds) {
            // Get lesson details from MongoDB
            let lessonTitle = "Unknown Lesson";
            let lesson = null;
            try {
                lesson = await Lesson.findById(lessonId).select("title").lean();
                if (lesson) {
                    lessonTitle = lesson.title;
                }
            } catch (err) {
                console.error(`Error fetching lesson ${lessonId} details:`, err);
            }

            if (!lesson) {
                continue;
            }

            // Check lesson completion status in MySQL
            const [trackRows] = await mysqlPool.execute(
                `SELECT status FROM lesson_tracks
                 WHERE user_id = ? AND course_id = ? AND lesson_id = ?`,
                [studentId, courseId, lessonId]
            );
            const lessonTrackStatus = trackRows.length > 0 ? trackRows[0].status : 'not_started';
            const isTrackCompleted = (lessonTrackStatus === 'completed');

            // Check MongoDB for quizzes under this lesson
            let quizzes = [];
            try {
                quizzes = await Quiz.find({ lessonId: lessonId.toString(), isPublished: true }).lean();
            } catch (err) {
                console.error(`Error fetching quizzes for lesson ${lessonId}:`, err);
            }

            const quizStatusDetails = [];
            let allQuizzesPassed = true;

            for (const quiz of quizzes) {
                const passingMarks = quiz.passingMarks || 0;
                
                // Fetch student's highest score submission for this quiz
                let bestSubmission = null;
                try {
                    bestSubmission = await QuizSubmission.findOne({
                        quizId: quiz._id.toString(),
                        studentId: studentId.toString()
                    }).sort({ score: -1 }).lean();
                } catch (err) {
                    console.error(`Error fetching quiz submission for quiz ${quiz._id}:`, err);
                }

                const score = bestSubmission ? bestSubmission.score : null;
                const isPassed = bestSubmission ? (score >= passingMarks) : false;

                if (!isPassed) {
                    allQuizzesPassed = false;
                }

                quizStatusDetails.push({
                    quizId: quiz._id.toString(),
                    title: quiz.title,
                    passingMarks,
                    score,
                    isPassed
                });
            }

            // A lesson is complete if the lesson track status is completed AND all quizzes associated with it are passed
            const isLessonCompleted = isTrackCompleted && allQuizzesPassed;
            if (!isLessonCompleted) {
                allLessonsCompleted = false;
            }

            lessonStatusDetails.push({
                lessonId: lessonId.toString(),
                title: lessonTitle,
                trackStatus: lessonTrackStatus,
                hasQuiz: quizzes.length > 0,
                quizzes: quizStatusDetails,
                allQuizzesPassed: quizzes.length > 0 ? allQuizzesPassed : true,
                isCompleted: isLessonCompleted
            });
        }

        const isCourseComplete = lessonStatusDetails.length > 0 ? allLessonsCompleted : true;

        // 4. Update enrollment completion status in database if completed
        if (isCourseComplete && enrollment.completion_status !== 'completed') {
            await mysqlPool.execute(
                `UPDATE enrollments SET completion_status = 'completed'
                 WHERE id = ?`,
                [enrollment.id]
            );
            enrollment.completion_status = 'completed';

            // Clear cache
            if (redisClient.isReady) {
                await redisClient.del(`user:${studentId}:enrollments`);
                await redisClient.del(`course:${courseId}:enrollments`);
                await redisClient.del('admin:dashboard'); // Bust admin cache on completion
            }
        }

        return res.status(200).json({
            success: true,
            isCompleted: isCourseComplete,
            completionStatus: enrollment.completion_status,
            courseTitle,
            studentId,
            courseId,
            enrollmentId: enrollment.id,
            lessons: lessonStatusDetails
        });

    } catch (error) {
        console.error("Error checking course completion status:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while checking course completion status."
        });
    }
};

module.exports = {
    enrollUserInCourseController,
    getUserEnrollmentsController,
    getCourseEnrollmentsController,
    updateEnrollmentStatusController,
    isTheCourseComplete,
};
