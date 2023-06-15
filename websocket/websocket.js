import WebSocket, { WebSocketServer } from "ws";
import dotenv from "dotenv";
import Message from "../models/Message.js";
import jwt from "jsonwebtoken";
dotenv.config();

const jwtSecret = process.env.JWT_SECRET;

export const setupWebSocket = (server) => {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (connection, req) => {
    // read username and id from the cookie for this connection
    const cookies = req.headers.cookie;
    if (cookies) {
      const tokenCookieString = cookies
        .split(";")
        .find((str) => str.startsWith("token="));
      if (tokenCookieString) {
        const token = tokenCookieString.split("=")[1];
        if (token) {
          jwt.verify(token, jwtSecret, {}, (err, userData) => {
            if (err) throw err;
            const { userId, username } = userData;
            connection.userId = userId;
            connection.username = username;
            [...wss.clients].forEach((client) => {
              client.send(
                JSON.stringify({
                  online: [...wss.clients].map((c) => ({
                    userId: c.userId,
                    username: c.username,
                  })),
                })
              );
            });
          });
        }
      }
    }
    connection.on("message", async (message, isBinary) => {
      const messageData = JSON.parse(message.toString());
      const { recipient, text } = messageData;
      if (recipient && text) {
        const MessageDoc = await Message.create({
          sender: connection.userId,
          recipient,
          text,
        });
        [...wss.clients]
          .filter((c) => c.userId === recipient)
          .forEach((c) =>
            c.send(
              JSON.stringify({
                text,
                sender: connection.userId,
                recipient,
                _id: MessageDoc._id,
              })
            )
          );
      }
    });
  });
};
