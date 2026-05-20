const { ChatThread, Message } = require("../models/chatModel");
const { mysqlPool } = require("../congif/mySqlConnection");

const checkEnrollment = async (studentId, instructorId) => {
    // Check if student is enrolled in ANY course taught by the instructor
    const [rows] = await mysqlPool.execute(`
        SELECT e.user_id 
        FROM enrollments e 
        JOIN courses c ON e.course_id = c.id 
        WHERE e.user_id = ? AND c.instructor_id = ?
        LIMIT 1
    `, [studentId, instructorId]);
    return rows.length > 0;
};

const getOrCreateThread = async (req, res) => {
    try {
        const studentId = req.user.role === 'STUDENT' ? req.user.id : req.params.otherUserId;
        const instructorId = req.user.role === 'INSTRUCTOR' ? req.user.id : req.params.otherUserId;

        if (!studentId || !instructorId) {
            return res.status(400).json({ success: false, message: "Missing user IDs" });
        }

        // Verify enrollment
        const isEnrolled = await checkEnrollment(studentId, instructorId);
        if (!isEnrolled) {
            return res.status(403).json({ success: false, message: "Not authorized. Student must be enrolled in a course by this instructor." });
        }

        let thread = await ChatThread.findOne({ studentId, instructorId }).lean();
        if (!thread) {
            const newThread = await ChatThread.create({ studentId, instructorId });
            thread = newThread.toObject();
        }

        // Fetch other user name
        const otherId = req.user.role === 'STUDENT' ? instructorId : studentId;
        const [users] = await mysqlPool.execute('SELECT full_name, role FROM users WHERE id = ?', [otherId]);
        const otherUser = users.length > 0 ? { name: users[0].full_name, role: users[0].role } : { name: 'Unknown User', role: 'UNKNOWN' };

        return res.status(200).json({ success: true, thread: { ...thread, otherUser } });
    } catch (error) {
        console.error("Error in getOrCreateThread:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

const getThreadMessages = async (req, res) => {
    try {
        const { threadId } = req.params;
        const messages = await Message.find({ threadId }).sort({ createdAt: 1 });
        return res.status(200).json({ success: true, messages });
    } catch (error) {
        console.error("Error in getThreadMessages:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

const getSharedCourses = async (req, res) => {
    try {
        // Find courses taught by the instructor that the student is enrolled in
        const studentId = req.user.role === 'STUDENT' ? req.user.id : req.params.otherUserId;
        const instructorId = req.user.role === 'INSTRUCTOR' ? req.user.id : req.params.otherUserId;

        const [courses] = await mysqlPool.execute(`
            SELECT c.id, c.title 
            FROM courses c
            JOIN enrollments e ON c.id = e.course_id
            WHERE e.user_id = ? AND c.instructor_id = ?
        `, [studentId, instructorId]);

        return res.status(200).json({ success: true, courses });
    } catch (error) {
        console.error("Error in getSharedCourses:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

const getUserThreads = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role; // 'STUDENT' or 'INSTRUCTOR'
        
        // Find all threads for this user
        const query = role === 'STUDENT' ? { studentId: userId } : { instructorId: userId };
        const threads = await ChatThread.find(query).sort({ lastMessageAt: -1 }).lean();

        if (threads.length === 0) {
            return res.status(200).json({ success: true, threads: [] });
        }

        // We need to get the names of the *other* users from MySQL
        const otherUserIds = threads.map(t => role === 'STUDENT' ? t.instructorId : t.studentId);
        
        // Remove duplicates and query MySQL
        const uniqueIds = [...new Set(otherUserIds)];
        const placeholders = uniqueIds.map(() => '?').join(',');
        
        const [users] = await mysqlPool.execute(`
            SELECT id, full_name, role 
            FROM users 
            WHERE id IN (${placeholders})
        `, uniqueIds);

        const userMap = users.reduce((acc, user) => {
            acc[user.id] = { name: user.full_name, role: user.role };
            return acc;
        }, {});

        // Attach the other user's info to each thread
        const enrichedThreads = threads.map(thread => {
            const otherId = role === 'STUDENT' ? thread.instructorId : thread.studentId;
            return {
                ...thread,
                otherUser: userMap[otherId] || { name: 'Unknown User', role: 'UNKNOWN' }
            };
        });

        return res.status(200).json({ success: true, threads: enrichedThreads });
    } catch (error) {
        console.error("Error in getUserThreads:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = {
    getOrCreateThread,
    getThreadMessages,
    getSharedCourses,
    checkEnrollment,
    getUserThreads
};
