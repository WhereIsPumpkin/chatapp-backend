import dotenv from "dotenv";
import Message from "../models/Message.js";
import jwt from "jsonwebtoken";
dotenv.config();
const jwtSecret = process.env.JWT_SECRET;

async function getUserDataFromRequest(req) {
  return new Promise((resolve, reject) => {
    const token = req.cookies?.token;
    if (token) {
      jwt.verify(token, jwtSecret, {}, (err, userData) => {
        if (err) reject(err); // reject instead of throw
        else resolve(userData);
      });
    } else {
      reject(new Error("No token in request."));
    }
  });
}

export async function updateMessage(req, res) {
  const { userId } = req.params;
  try {
    const userData = await getUserDataFromRequest(req);
    const ourUserId = userData.userId;
    const messages = await Message.find({
      sender: { $in: [userId, ourUserId] },
      recipient: { $in: [userId, ourUserId] },
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
}
