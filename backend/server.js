require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");

const connectMongo = require("./congif/mongoConnection");

const {
  connectMySQL,
} = require("./congif/mySqlConnection");

const {
  connectRedis,
} = require("./congif/redisConnection");

const swaggerDocs = require("./congif/swagger");

const app = express();
const server = http.createServer(app);

app.use(express.json());

swaggerDocs(app);

connectMongo();
connectMySQL();
connectRedis();

const authRoutes = require("./routes/authRoutes")

const instructorRoutes = require("./routes/instructorRoutes");

const courseRoutes = require("./routes/courseRoutes");
const lessonRoutes = require("./routes/lessonRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");
const lessonTrackRoutes = require("./routes/lessonTrackRoutes");
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const quizRoutes = require('./routes/quizRoutes');
const chatRoutes = require('./routes/chatRoutes');
const certificateRoutes = require('./routes/certificateRoutes');

app.use(cors())

app.use("/api/auth", authRoutes);

app.use("/api/instructors", instructorRoutes);

app.use("/api/courses", courseRoutes);

app.use("/api/lessons", lessonRoutes);

app.use("/api/enrollments", enrollmentRoutes);

app.use("/api/lesson-tracks", lessonTrackRoutes);

app.use("/api/admin", adminRoutes);

app.use("/api/uploads", uploadRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/certificates", certificateRoutes);

const initializeSocket = require("./socket/socketHandler");
initializeSocket(server);

server.listen(3000, () => {
  console.log("Server is running on port 3000 with WebSockets enabled");
});