import mongoose from "mongoose";

const connect = () => {
  try {
    mongoose.connect(process.env.MONGO_URL);
  } catch (error) {
    console.log(error);
  }
};

export default connect;
