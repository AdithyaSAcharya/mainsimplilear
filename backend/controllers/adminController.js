const { mysqlPool } = require("../congif/mySqlConnection");
const { redisClient } = require("../congif/redisConnection");

const getAdminDashboardData = async (req, res) => {
    try {
        if (redisClient.isReady) {
            const cachedData = await redisClient.get("admin:dashboard");
            if (cachedData) {
                return res.status(200).json({ success: true, ...JSON.parse(cachedData), source: "cache" });
            }
        }

        const [[{ totalUsers }]] = await mysqlPool.execute('SELECT COUNT(*) as totalUsers FROM users WHERE role = "STUDENT"');
        const [[{ totalInstructors }]] = await mysqlPool.execute('SELECT COUNT(*) as totalInstructors FROM users WHERE role = "INSTRUCTOR"');
        const [[{ totalCourses }]] = await mysqlPool.execute('SELECT COUNT(*) as totalCourses FROM courses');
        
        const [courses] = await mysqlPool.execute('SELECT id, title, short_description, is_published, instructor_id, created_at FROM courses ORDER BY created_at DESC');

        const [usersList] = await mysqlPool.execute('SELECT id, full_name, email FROM users WHERE role = "STUDENT" ORDER BY created_at DESC');
        const [instructorsList] = await mysqlPool.execute('SELECT id, full_name, email FROM users WHERE role = "INSTRUCTOR" ORDER BY created_at DESC');
        
        const [enrollments] = await mysqlPool.execute('SELECT e.user_id, e.course_id, c.title as course_title, e.completion_status FROM enrollments e JOIN courses c ON e.course_id = c.id');
        const [instructorCoursesList] = await mysqlPool.execute('SELECT instructor_id, id as course_id, title FROM courses');

        const responseData = {
            totalUsers,
            totalInstructors,
            totalCourses,
            courses,
            usersList,
            instructorsList,
            enrollments,
            instructorCoursesList
        };

        if (redisClient.isReady) {
            await redisClient.setEx("admin:dashboard", 3600, JSON.stringify(responseData)); // 1 hour TTL
        }

        return res.status(200).json({
            success: true,
            ...responseData
        });
    } catch (error) {
        console.error("Admin dashboard error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = { getAdminDashboardData };
