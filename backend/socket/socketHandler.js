const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { ChatThread, Message } = require("../models/chatModel");

// Simple in-memory map of user IDs to socket IDs. 
// For a multi-server setup, you would use socket.io-redis adapter.
const connectedUsers = new Map();

const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*", // Configure this to frontend URL in production
            methods: ["GET", "POST"]
        }
    });

    // 1. Authentication Middleware for Sockets
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error("Authentication error: No token provided"));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded;
            next();
        } catch (err) {
            next(new Error("Authentication error: Invalid token"));
        }
    });

    io.on("connection", (socket) => {
        const userId = socket.user.id;
        
        // Store socket connection
        connectedUsers.set(userId, socket.id);
        console.log(`User ${userId} connected to Chat (Socket: ${socket.id})`);

        // Join personal room for receiving notifications even if not in thread
        socket.join(`user_${userId}`);

        // Join specific chat thread room
        socket.on("join_thread", (threadId) => {
            socket.join(`thread_${threadId}`);
            console.log(`User ${userId} joined thread ${threadId}`);
        });

        // 2. Handle incoming messages (including @course context and replies)
        socket.on("send_message", async (data, callback) => {
            try {
                const { threadId, text, courseContext, replyTo } = data;
                
                const thread = await ChatThread.findById(threadId);
                if (!thread) {
                    if (typeof callback === 'function') callback({ success: false, message: "Thread not found" });
                    return;
                }

                // Ensure user is authorized for this thread
                if (thread.studentId !== userId && thread.instructorId !== userId) {
                    if (typeof callback === 'function') callback({ success: false, message: "Not authorized for this thread" });
                    return;
                }

                // 3. Save message and optional course context to DB
                const newMessage = new Message({
                    threadId,
                    senderId: userId,
                    text,
                    courseContext: courseContext || null,
                    replyTo: replyTo || null
                });

                // Populate replyTo text for client convenience
                await newMessage.save();
                if (replyTo) {
                    await newMessage.populate('replyTo', 'text senderId');
                }

                thread.lastMessageAt = Date.now();
                await thread.save();

                // 4. Emit message to everyone actively looking at the thread
                io.to(`thread_${threadId}`).emit("receive_message", newMessage);

                // Optional: Emit a push notification to the other user if they are online but not looking at the thread
                const receiverId = thread.studentId === userId ? thread.instructorId : thread.studentId;
                io.to(`user_${receiverId}`).emit("new_message_notification", { 
                    threadId, 
                    text, 
                    senderId: userId,
                    courseContext
                });

                if (typeof callback === 'function') callback({ success: true, message: newMessage });
            } catch (error) {
                console.error("Socket send_message error:", error);
                if (typeof callback === 'function') callback({ success: false, message: "Server error" });
            }
        });

        // 5. Handle message reactions
        socket.on("add_reaction", async (data, callback) => {
            try {
                const { messageId, threadId, emoji } = data;
                
                const message = await Message.findById(messageId);
                if (!message) {
                    if (typeof callback === 'function') callback({ success: false, message: "Message not found" });
                    return;
                }

                // Check if user already reacted with this emoji
                const existingReactionIndex = message.reactions.findIndex(r => r.emoji === emoji && r.userId === userId);
                
                if (existingReactionIndex >= 0) {
                    // Toggle off if already exists
                    message.reactions.splice(existingReactionIndex, 1);
                } else {
                    // Add new reaction
                    message.reactions.push({ emoji, userId });
                }

                await message.save();

                io.to(`thread_${threadId}`).emit("message_reacted", { 
                    messageId, 
                    reactions: message.reactions 
                });

                if (typeof callback === 'function') callback({ success: true });
            } catch (error) {
                console.error("Socket add_reaction error:", error);
                if (typeof callback === 'function') callback({ success: false, message: "Server error" });
            }
        });

        socket.on("disconnect", () => {
            connectedUsers.delete(userId);
            console.log(`User ${userId} disconnected from Chat`);
        });
    });

    return io;
};

module.exports = initializeSocket;
