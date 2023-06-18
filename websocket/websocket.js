import WebSocket, { WebSocketServer } from "ws";
import dotenv from "dotenv";
import Message from "../models/Message.js";
import jwt from "jsonwebtoken";
import fs from "fs";
import { fileURLToPath } from "url";
dotenv.config();

const jwtSecret = process.env.JWT_SECRET;

export const setupWebSocket = (server) => {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (connection, req) => {
    function notifyAboutOnlinePeople() {
      [...wss.clients].forEach((client) => {
        client.send(
          JSON.stringify({
            online: [...wss.clients].map((c) => ({
              userId: c.userId,
              username: c.username,
              avatar: c.avatar,
            })),
          })
        );
      });
    }

    connection.isAlive = true;

    connection.timer = setInterval(() => {
      connection.ping();
      connection.deathTimer = setTimeout(() => {
        connection.isAlive = false;
        clearInterval(connection.timer);
        connection.terminate();
        notifyAboutOnlinePeople();
        console.log("dead");
      }, 1000);
    }, 5000);

    connection.on("pong", () => {
      clearTimeout(connection.deathTimer);
    });

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
            console.log(userData);
            if (err) throw err;
            const { userId, username, avatar } = userData;
            connection.userId = userId;
            connection.username = username;
            connection.avatar = avatar;
            [...wss.clients].forEach((client) => {
              client.send(
                JSON.stringify({
                  online: [...wss.clients].map((c) => ({
                    userId: c.userId,
                    username: c.username,
                    avatar: c.avatar,
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
      const { recipient, text, file } = messageData;
      let filename = null;
      if (file) {
        console.log("size", file.data.length);
        const parts = file.name.split(".");
        const ext = parts[parts.length - 1];
        filename = Date.now() + "." + ext;
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = fileURLToPath(new URL("..", import.meta.url));
        const path = __dirname + "/public/uploads/" + filename;
        const bufferData = Buffer.from(file.data.split(",")[1], "base64");
        fs.writeFile(path, bufferData, () => {
          console.log("file saved:" + path);
        });
      }
      if (recipient && (text || file)) {
        const MessageDoc = await Message.create({
          sender: connection.userId,
          recipient,
          text,
          file: file ? filename : null,
        });
        [...wss.clients]
          .filter((c) => c.userId === recipient)
          .forEach((c) =>
            c.send(
              JSON.stringify({
                text,
                sender: connection.userId,
                recipient,
                file: file ? filename : null,
                _id: MessageDoc._id,
              })
            )
          );
      }
    });
    notifyAboutOnlinePeople();
  });

  wss.on("close", (data) => {
    console.log("data");
  });
};
