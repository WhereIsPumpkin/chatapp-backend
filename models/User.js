import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    email: { type: Schema.Types.String, required: true, unique: true },
    username: { type: Schema.Types.String, required: true, unique: true },
    password: { type: Schema.Types.String, required: true },
    avatar: { type: Schema.Types.String, required: false },
    verified: { type: Schema.Types.Boolean, required: false },
  },
  { timestamps: true }
);

export const userModel = model("User", userSchema);
