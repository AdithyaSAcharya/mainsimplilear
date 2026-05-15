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

const app = new express()

app.use(express.json())

connectMongo();
connectMySQL();
connectRedis();

const authRoutes = require("./routes/authRoutes")

app.use(cors())

app.use("/api/auth", authRoutes);


app.listen(3000,()=>{
    console.log("app is running on port 3000")
})