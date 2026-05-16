require("dotenv").config();

const express = require("express");

const cors = require("cors")

const connectMongo = require("./congif/mongoConnection");

const {
  connectMySQL,
} = require("./congif/mySqlConnection");

const {
  connectRedis,
} = require("./congif/redisConnection");

const swaggerDocs = require("./congif/swagger");

const app = new express()

app.use(express.json())

swaggerDocs(app);

connectMongo();
connectMySQL();
connectRedis();

const authRoutes = require("./routes/authRoutes")

const instructorRoutes = require("./routes/instructorRoutes");

const courseRoutes = require("./routes/courseRoutes");

app.use(cors())

app.use("/api/auth", authRoutes);

app.use("/api/instructors",instructorRoutes);

app.use("/api/courses",courseRoutes);

app.listen(3000,()=>{
    console.log("app is running on port 3000")
})