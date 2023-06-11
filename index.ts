import express, { Express, request, response } from "express";
import mongoose, { connection } from "mongoose";
import userRoutes from "./routes/userRoute";
import postRoutes from "./routes/postRoute";
import dotenv from "dotenv";
import cors from "cors";
import connectDb from "./config/db";

const app: Express = express();

app.use(express.json());
app.use(
  cors({
    origin: ["https://social-media-backend-lfod.vercel.app", "http://localhost:3000"],
  })
);

app.use(express.urlencoded({ extended: true }));
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/images", express.static("public/images"));
connectDb();
app.get("/", (request, response) => {
  response.send("Hello world");
});
app.get("/ip", (request, response) => response.send(request.ip));
app.set("trust proxy", 1);

dotenv.config();

const PORT = 8000;
const MONGO_URL: any = process.env.MONGO_URL;

app.listen(PORT, () => {
  mongoose.connect(MONGO_URL, () => {
    console.log("Connected", PORT);
  });
});
