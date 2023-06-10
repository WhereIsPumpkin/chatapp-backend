import express from "express";
import { registerUser, getProfile } from "./controllers/user-controller.js";
import connect from "./database/mongo.js";
import cookieParser from "cookie-parser";
import cors from "cors";

connect();

let corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
};

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));

app.post("/register", registerUser);
app.get("/profile", getProfile);

app.listen(4040);
