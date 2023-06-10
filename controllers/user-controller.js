import { userModel as User } from "../models/User.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bycript from "bcryptjs";
dotenv.config();

const jwtSecret = process.env.JWT_SECRET;
const bycriptSalt = bycript.genSaltSync(10);

export async function loginUser(req, res) {
  const { username, password } = req.body;
  const foundUser = await User.findOne({ username });
  if (foundUser) {
    const passOk = bycript.compareSync(password, foundUser.password);
    if (passOk) {
      jwt.sign(
        { userId: foundUser._id, username },
        jwtSecret,
        {},
        (err, token) => {
          res.cookie("token", token, { sameSite: "none", secure: true }).json({
            id: foundUser._id,
          });
        }
      );
    }
  }
}

export async function registerUser(req, res) {
  const { username, password } = req.body;

  try {
    const hashedPassowrd = bycript.hashSync(password, bycriptSalt);

    const createdUser = await User.create({
      username,
      password: hashedPassowrd,
    });
    jwt.sign(
      { userId: createdUser._id, username },
      jwtSecret,
      {},
      (err, token) => {
        if (err) throw err;
        res
          .cookie("token", token, { sameSite: "none", secure: true })
          .status(201)
          .json({
            id: createdUser._id,
          });
      }
    );
  } catch (err) {
    if (err) throw err;
    res.status(500).json("error");
  }
}

export async function getProfile(req, res) {
  const token = req.cookies?.token;
  if (token) {
    jwt.verify(token, jwtSecret, {}, (err, userData) => {
      if (err) throw err;
      res.json(userData);
    });
  } else {
    res.status(401).json("no token");
  }
}
