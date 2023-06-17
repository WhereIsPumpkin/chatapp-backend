import { userModel as User } from "../models/User.js";
import EmailToken from "../models/EmailToken.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import bycript from "bcryptjs";
dotenv.config();

const jwtSecret = process.env.JWT_SECRET;
const bycriptSalt = bycript.genSaltSync(10);
let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_PASSWORD,
  },
});

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
  try {
    const { username, password, email } = req.body;
    const { file } = req;
    console.log(file);

    const hashedPassowrd = bycript.hashSync(password, bycriptSalt);

    const createdUser = await User.create({
      username,
      email,
      password: hashedPassowrd,
      verified: false,
      avatar: "avatars/" + file.originalname,
    });

    const avatar = createdUser.avatar;

    jwt.sign(
      { userId: createdUser._id, username, avatar },
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

export async function recoverPass(req, res) {
  try {
    const { email } = req.body;

    const token = crypto.randomBytes(20).toString("hex");

    const newEmailToken = new EmailToken({
      email,
      token,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    await newEmailToken.save();

    const resetUrl = `${process.env.WEB_LINK}/password-update?token=${token}`;

    await transporter.sendMail({
      from: "youremail@gmail.com",
      to: email,
      subject: "Reset Password Notification",
      html: `
        <!doctype html>
        <html lang="en-US">

        <head>
            <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
            <title>Reset Password Email Template</title>
            <meta name="description" content="Reset Password Email Template.">
            <style type="text/css">
                a:hover {text-decoration: underline !important;}
            </style>
        </head>

        <body marginheight="0" topmargin="0" marginwidth="0" style="margin: 0px; background-color: #f2f3f8;" leftmargin="0">
            <!--100% body table-->
            <table cellspacing="0" border="0" cellpadding="0" width="100%" bgcolor="#f2f3f8"
                style="@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); font-family: 'Open Sans', sans-serif;">
                <tr>
                    <td>
                        <table style="background-color: #f2f3f8; max-width:670px;  margin:0 auto;" width="100%" border="0"
                            align="center" cellpadding="0" cellspacing="0">
                            <tr>
                                <td style="height:80px;">&nbsp;</td>
                            </tr>
                            <tr>
                                <td style="text-align:center;">
                                  <a href="#" title="logo" target="_blank">
                                    <img width="60" src="https://i.ibb.co/FW4HfY4/logo.png" title="logo" alt="logo">
                                  </a>
                                </td>
                            </tr>
                            <tr>
                                <td style="height:20px;">&nbsp;</td>
                            </tr>
                            <tr>
                                <td>
                                    <table width="95%" border="0" align="center" cellpadding="0" cellspacing="0"
                                        style="max-width:670px;background:#fff; border-radius:3px; text-align:center;-webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow:0 6px 18px 0 rgba(0,0,0,.06);">
                                        <tr>
                                            <td style="height:40px;">&nbsp;</td>
                                        </tr>
                                        <tr>
                                            <td style="padding:0 35px;">
                                                <h1 style="color:#1e1e2d; font-weight:500; margin:0;font-size:32px;font-family:'Rubik',sans-serif;">You have
                                                    requested to reset your password</h1>
                                                <span
                                                    style="display:inline-block; vertical-align:middle; margin:29px 0 26px; border-bottom:1px solid #cecece; width:100px;"></span>
                                                <p style="color:#455056; font-size:15px;line-height:24px; margin:0;">
                                                    We cannot simply send you your old password. A unique link to reset your
                                                    password has been generated for you. To reset your password, click the
                                                    following link and follow the instructions.
                                                </p>
                                                <a href="${resetUrl}"
                                                    style="background:#6D3BEF;text-decoration:none !important; font-weight:500; margin-top:35px; color:#fff;text-transform:uppercase; font-size:14px;padding:10px 24px;display:inline-block;border-radius:50px;">Reset
                                                    Password</a>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="height:40px;">&nbsp;</td>
                                        </tr>
                                    </table>
                                </td>
                            <tr>
                                <td style="height:20px;">&nbsp;</td>
                            </tr>
                            <tr>
                                <td style="text-align:center;">
                                    <p style="font-size:14px; color:rgba(69, 80, 86, 0.7411764705882353); line-height:18px; margin:0 0 0;">&copy; <strong>Saba Gogrichiani</strong></p>
                                </td>
                            </tr>
                            <tr>
                                <td style="height:80px;">&nbsp;</td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
            <!--/100% body table-->
        </body>

        </html>
      `,
    });
    res.status(200).json({ message: "Email sent. Please check your inbox." });
  } catch (err) {
    if (err) throw err;
  }
}

export async function updatePass(req, res) {
  try {
    const { password, token } = req.body;

    const emailToken = await EmailToken.findOne({ token });

    if (!emailToken || Date.now() > emailToken.expiresAt) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const hashedPassword = await bycript.hash(password, 10);

    await User.findOneAndUpdate(
      { email: emailToken.email },
      { password: hashedPassword }
    );

    await EmailToken.deleteOne({ token });

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    if (err) throw err;
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

export async function getAllUser(req, res) {
  const users = await User.find({}, { _id: 1, username: 1 });
  res.json(users);
}

export async function logOut(req, res) {
  res.cookie("token", "", { sameSite: "none", secure: true }).json("ok");
}
