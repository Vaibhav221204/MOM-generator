require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const axios = require("axios");
const GROQ_API_KEY = process.env.GROQ_API_KEY;


const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname))); // Serve frontend files

const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/mp3uploads";
const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;

// ✅ MongoDB setup
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

// ✅ File upload config
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ✅ Whisper transcription
async function transcribeAudio(filePath) {
  return new Promise((resolve, reject) => {
    console.log(`⏳ Transcription started for: ${filePath}`);

    const process = spawn("whisper", [filePath, "--model", "base", "--output_dir", "uploads"]);

    process.stdout.on("data", (data) => {
      console.log("🟡 Whisper log:", data.toString());
    });

    process.stderr.on("data", (error) => {
      console.error("⚠️ Whisper Error:", error.toString());
    });

    process.on("close", (code) => {
      if (code === 0) {
        const baseName = path.basename(filePath, path.extname(filePath));
        const txtPath = path.join("uploads", baseName + ".txt");

        fs.readFile(txtPath, "utf8", (err, transcription) => {
          if (err) {
            console.error("⚠️ Error reading transcription file:", err);
            return reject("Transcription read failed.");
          }
          resolve(transcription);
        });
      } else {
        reject("❌ Whisper transcription failed.");
      }
    });
  });
}

// ✅ LLaMA 3.3 summarization
async function summarizeText(text) {
  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant. Extract only the key points from the meeting transcript and respond in bullet points."
          },
          { role: "user", content: text }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("❌ Groq API Error:", error.response?.data || error.message);
    return "Summarization failed.";
  }
}


// ✅ POST /upload
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

    res.status(201).json({
      message: "File uploaded successfully",
      transcription,
      summary,
      filename: req.file.filename // ✅ send filename for frontend fetch
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.toString() });
  }
});

// ✅ GET /summary/:filename
app.get("/summary/:filename", async (req, res) => {
  try {
    const file = await File.findOne({ filename: req.params.filename });
    if (!file) return res.status(404).json({ message: "File not found" });

    res.status(200).json({ transcription: file.transcription, summary: file.summary });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});





















