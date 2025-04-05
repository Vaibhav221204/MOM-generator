require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const axios = require("axios");

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/mp3uploads";
const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB: mp3uploads"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

const fileSchema = new mongoose.Schema({
  filename: String,
  contentType: String,
  transcription: String,
  summary: String,
});

const File = mongoose.model("File", fileSchema);

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

async function transcribeAudio(filePath) {
  return new Promise((resolve, reject) => {
    console.log(`⏳ Transcription started for: ${filePath}`);

    const process = spawn("whisper", [filePath, "--model", "base"]);

    process.stdout.on("data", (data) => {
      console.log(data.toString());
    });

    process.stderr.on("data", (error) => {
      console.error("⚠️ Whisper Error:", error.toString());
    });

    process.on("close", (code) => {
      if (code === 0) {
        console.log(`✅ Transcription completed for: ${filePath}`);
        fs.readFile(`${filePath}.txt`, "utf8", (err, transcription) => {
          if (err) {
            console.error("⚠️ Error reading transcription file:", err);
            return reject("Transcription failed.");
          }
          resolve(transcription);
        });
      } else {
        reject("❌ Whisper transcription failed.");
      }
    });
  });
}

async function summarizeText(text) {
  try {
    const response = await axios.post(
      "https://api.together.ai/v1/chat/completions",
      {
        model: "mistral-7b",
        messages: [
          { role: "system", content: "Summarize the following meeting transcript:" },
          { role: "user", content: text }
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${TOGETHER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("❌ Together AI API Error:", error.response ? error.response.data : error.message);
    return "Summarization failed.";
  }
}

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const transcription = await transcribeAudio(req.file.path);
    const summary = await summarizeText(transcription);

    const newFile = new File({
      filename: req.file.filename,
      contentType: req.file.mimetype,
      transcription,
      summary,
    });

    await newFile.save();
    res.status(201).json({ message: "File uploaded successfully", transcription, summary });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

app.get("/summary/:filename", async (req, res) => {
  try {
    const file = await File.findOne({ filename: req.params.filename });
    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }
    res.status(200).json({ transcription: file.transcription, summary: file.summary });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
}).on("error", (err) => {
  console.error("❌ Server error:", err);
});

















