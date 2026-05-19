const {
    getSubmissionById,
} = require(
    "../models/quizSubmissionModel"
);

const reviewSubmissionController =
    async (req, res) => {
        try {
            const {
                submissionId,
            } = req.params;

            const {
                answers,
            } = req.body;

            const submission =
                await getSubmissionById(
                    submissionId
                );

            if (!submission) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Submission not found",
                });
            }

            let updatedScore = 0;

            submission.answers =
                submission.answers.map(
                    (
                        existingAnswer
                    ) => {
                        const reviewedAnswer =
                            answers.find(
                                (a) =>
                                    a.questionId ===
                                    existingAnswer.questionId
                            );

                        if (
                            reviewedAnswer
                        ) {
                            existingAnswer.obtainedMarks =
                                reviewedAnswer.obtainedMarks;

                            existingAnswer.feedback =
                                reviewedAnswer.feedback ||
                                "";

                            existingAnswer.reviewedByInstructor =
                                true;
                        }

                        updatedScore +=
                            existingAnswer.obtainedMarks || 0;

                        return existingAnswer;
                    }
                );

            submission.score =
                updatedScore;

            submission.status =
                "REVIEWED";

            await submission.save();

            return res.json({
                success: true,
                message:
                    "Submission reviewed successfully",
                submission,
            });
        } catch (error) {
            console.log(error);

            return res.status(500).json({
                success: false,
                message:
                    "Server error",
            });
        }
    };

module.exports = {
    reviewSubmissionController,
};