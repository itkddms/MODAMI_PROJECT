import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());

/**************************************
 * 1. GPT 텍스트 요약 / 자서전 생성
 **************************************/
app.post("/api/gpt", async (req, res) => {
  const { query } = req.body;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: query }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.json(data);
});

/**************************************
 * 2. 이미지 생성 (DALL·E)
 **************************************/
app.post("/api/image", async (req, res) => {
  const { prompt } = req.body;

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt,
      size: "1024x1024",
    }),
  });

  const data = await response.json();
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.json(data);
});

/**************************************
 * 3. Google TTS (Text-to-Speech)
 **************************************/
app.post("/api/tts", async (req, res) => {
  const { text } = req.body;

  const response = await fetch(`https://texttospeech.googleapis.com/v1beta1/text:synthesize?key=${process.env.GOOGLE_TTS_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: "ko-KR", name: "ko-KR-Chirp3-HD-Zephyr" },
      audioConfig: { audioEncoding: "MP3", speakingRate: 1.02 },
    }),
  });

  const data = await response.json();
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.json(data);
});

app.listen(3000, () => console.log("✅ Server running on port 3000"));
