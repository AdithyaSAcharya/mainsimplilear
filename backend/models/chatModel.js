const mongoose = require("mongoose");

const chatThreadSchema = new mongoose.Schema({
    studentId: { type: Number, required: true },
    instructorId: { type: Number, required: true },
    lastMessageAt: { type: Date, default: Date.now },
});

chatThreadSchema.index({ studentId: 1, instructorId: 1 }, { unique: true });

const messageSchema = new mongoose.Schema({
    threadId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatThread', required: true },
    senderId: { type: Number, required: true },
    text: { type: String, required: true },
    courseContext: {
        courseId: { type: Number, default: null },
        courseTitle: { type: String, default: null }
    },
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
    reactions: [{
        emoji: { type: String, required: true },
        userId: { type: Number, required: true }
    }],
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const ChatThread = mongoose.model("ChatThread", chatThreadSchema);
const Message = mongoose.model("Message", messageSchema);

module.exports = { ChatThread, Message };
