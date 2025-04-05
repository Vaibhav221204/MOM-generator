require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/mp3uploads";

// ✅ Connect to MongoDB (Fixed deprecation warnings)
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB: mp3uploads"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ✅ Define Schema
const fileSchema = new mongoose.Schema({
  filename: String,
  contentType: String,
  data: Buffer,
});

const File = mongoose.model("File", fileSchema);

// ✅ Multer Storage Config
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// ✅ Upload Route (MP3 & MP4 files)
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const newFile = new File({
      filename: req.file.originalname,
      contentType: req.file.mimetype,
      data: req.file.buffer,
    });

    await newFile.save();
    res.status(201).json({ message: "File uploaded successfully", file: newFile });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// ✅ Get All Files Route
app.get("/files", async (req, res) => {
  try {
    const files = await File.find({}, "filename contentType");
    res.status(200).json(files);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// ✅ Download File Route
app.get("/files/:id", async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    res.set("Content-Type", file.contentType);
    res.send(file.data);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// ✅ Handle Port Already in Use Error
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
}).on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} is already in use. Try a different port.`);
    process.exit(1);
  } else {
    console.error("❌ Server error:", err);
  }
});





