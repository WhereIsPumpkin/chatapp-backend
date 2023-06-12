import { Schema, model } from "mongoose";

const emailTokenSchema = new Schema({
  token: {
    type: Schema.Types.String,
    required: true,
  },
  email: {
    type: Schema.Types.String,
    required: true,
  },
  expiresAt: { type: Date, index: { expires: 0 } },
});

const EmailToken = model("EmailToken", emailTokenSchema);

export default EmailToken;
