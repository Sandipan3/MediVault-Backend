import express from "express";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./utils/connectDB.js";
import authRouter from "./routes/authRoutes.js";
import documentRouter from "./routes/documentRoutes.js";
import accessControlRouter from "./routes/accessControlRoutes.js";
dotenv.config();

const app = express();

app.use(morgan("dev"));
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use("/api/auth", authRouter);
app.use("/api/document", documentRouter);
app.use("/api/access", accessControlRouter);

connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running at port : ${PORT}`);
});
