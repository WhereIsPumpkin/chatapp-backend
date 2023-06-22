import express from "express";
import {
  registerUser,
  getProfile,
  loginUser,
  recoverPass,
  updatePass,
  getAllUser,
  logOut,
} from "./controllers/user-controller.js";
import { updateMessage } from "./controllers/messages-controller.js";
import connect from "./database/mongo.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import multer from "multer";
import { setupWebSocket } from "./websocket/websocket.js";
import swaggerMiddleware from "./swagger-middleware.js";

connect();

let corsOptions = {
  origin: "https://chatapp-backend-production-9079.up.railway.app,
  credentials: true,
};

const app = express();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/avatars");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));
app.use("/uploads", express.static("./public/uploads"));
app.use("/avatars", express.static("./public/avatars"));

app.post("/login", loginUser);
app.post(
  "/register",
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("avatar"),
  registerUser
);
app.post("/logout", logOut);

app.post("/recover-password", recoverPass);
app.post("/reset-password", updatePass);

app.get("/profile", getProfile);
app.get("/messages/:userId", updateMessage);
app.get("/people", getAllUser);

app.use("/", ...swaggerMiddleware);

const port = process.env.PORT || 5050;
const server = app.listen(port, "0.0.0.0", function () {
  console.log(`Server is running on ${port}`);
});

setupWebSocket(server);
