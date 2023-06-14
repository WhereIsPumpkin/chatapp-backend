import express from "express";
import {
  registerUser,
  getProfile,
  loginUser,
  recoverPass,
  updatePass,
} from "./controllers/user-controller.js";
import connect from "./database/mongo.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { setupWebSocket } from "./websocket/websocket.js";

connect();

let corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
};

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));

app.post("/login", loginUser);
app.post("/register", registerUser);

app.post("/recover-password", recoverPass);
app.post("/reset-password", updatePass);

app.get("/profile", getProfile);

const server = app.listen(5050);

setupWebSocket(server);
