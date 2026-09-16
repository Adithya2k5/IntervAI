const mongoose = require("mongoose");

const DEFAULT_LOCAL_MONGO_URI = "mongodb://127.0.0.1:27017/interview-master";

async function connectToDB() {
    const mongoUri = process.env.MONGO_URI || DEFAULT_LOCAL_MONGO_URI;

    try {
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 1500,
            retryWrites: false,
        });

        console.log("connected to database");
    } catch (err) {
        console.warn(
            "MongoDB connection failed. Continuing to start the server with the database disabled.",
            err?.message || err
        );
    }
}

module.exports = connectToDB;