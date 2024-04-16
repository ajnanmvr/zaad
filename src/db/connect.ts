import mongoose from "mongoose";

const connect = async () => {
  try {
    mongoose.connect(process.env.MONGO_URI!);
    const connection = mongoose.connection;

    connection.on("connected", () => {
      console.log("Connected to MongoDB");
    });
    connection.on("error", (error) => {
      console.log({
        message: "Error conneting database, Make sure MongoDB is running",
        error,
      });
      process.exit();
    });
  } catch (error) {
    console.log({ message: "Something went wrong", error });
  }
};

export default connect;
