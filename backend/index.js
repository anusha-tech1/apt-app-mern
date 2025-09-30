import express from "express";
import dotenv from "dotenv";
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';

import userRoute from "./routes/user.route.js"
import analyticsRoute from "./routes/analytics.route.js"

const app = express()
dotenv.config()

const port = process.env.PORT;
const MONOGO_URL=process.env.MONGO_URI;
// console.log(MONOGO_URL);

//middleware
app.use(express.json());
app.use(cookieParser());


try {
    mongoose.connect(MONOGO_URL);
    console.log("Connected to MongoDB");
} catch (error) {
    console.log(error);
}

//defining routes
app.use("/api/users", userRoute);
app.use("/api/analytics", analyticsRoute);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
