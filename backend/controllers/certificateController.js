const PDFDocument = require('pdfkit');
const Quiz = require('../models/quizModel');
const QuizSubmission = require('../models/quizSubmissionModel');
const { mysqlPool } = require('../congif/mySqlConnection');
const { getCourseById } = require('../models/courseModel');

const checkEligibilityAndGenerateCertificate = async (req, res) => {
    try {
        const userId = req.user.id;
        const { courseId } = req.params;

        // 1. Check if user is enrolled and if course is completed
        const [enrollmentRows] = await mysqlPool.execute(
            'SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?',
            [userId, courseId]
        );

        if (enrollmentRows.length === 0) {
            return res.status(403).json({ success: false, message: 'User is not enrolled in this course.' });
        }

        const enrollment = enrollmentRows[0];
        if (enrollment.completion_status !== 'completed') {
            return res.status(400).json({ success: false, message: 'Course is not completed yet.' });
        }

        // 2. Check if all quizzes in the course are passed
        const quizzes = await Quiz.find({ courseId });
        const submissions = await QuizSubmission.find({ courseId, studentId: userId });

        let allQuizzesPassed = true;
        for (const quiz of quizzes) {
            const passedSubmission = submissions.find(
                sub => sub.quizId.toString() === quiz._id.toString() && sub.score >= (quiz.passingMarks || 0)
            );

            if (!passedSubmission) {
                allQuizzesPassed = false;
                break;
            }
        }

        if (quizzes.length > 0 && !allQuizzesPassed) {
            return res.status(400).json({ success: false, message: 'All quizzes must be passed to generate the certificate.' });
        }

        // 3. Fetch user and course details for the certificate
        const [userRows] = await mysqlPool.execute('SELECT full_name FROM users WHERE id = ?', [userId]);
        const userName = userRows[0]?.full_name || 'Student';

        const course = await getCourseById(courseId);
        const courseName = course?.title || 'Course';

        // 4. Generate PDF Certificate
        const doc = new PDFDocument({
            layout: 'landscape',
            size: 'A4',
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Certificate_${courseName.replace(/\s+/g, '_')}.pdf`);

        doc.pipe(res);

        // Draw border
        doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke();
        doc.rect(25, 25, doc.page.width - 50, doc.page.height - 50).stroke();

        doc.font('Helvetica-Bold')
            .fontSize(40)
            .text('CERTIFICATE OF COMPLETION', 0, 100, { align: 'center' });

        doc.moveDown();

        doc.font('Helvetica')
            .fontSize(20)
            .text('This is to certify that', { align: 'center' });

        doc.moveDown();

        doc.font('Helvetica-Bold')
            .fontSize(30)
            .text(userName, { align: 'center', underline: true });

        doc.moveDown();

        doc.font('Helvetica')
            .fontSize(20)
            .text('has successfully completed the course', { align: 'center' });

        doc.moveDown();

        doc.font('Helvetica-Bold')
            .fontSize(30)
            .text(courseName, { align: 'center' });

        doc.moveDown(2);

        doc.font('Helvetica-Oblique')
            .fontSize(15)
            .text(`Date of Completion: ${new Date().toLocaleDateString()}`, { align: 'center' });
            
        doc.end();

    } catch (error) {
        console.error('Error generating certificate:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    checkEligibilityAndGenerateCertificate
};
