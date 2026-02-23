const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";
const API_KEY = process.env.GEMINI_API_KEY;

app.post("/api/generate", async (req, res) => {
  try {
    const { prompt } = req.body;
    console.log("[DEBUG] Received prompt:", prompt);

    if (!prompt) return res.status(400).json({ error: "Missing prompt" });

    // ✅ Correct Gemini request body
    const body = {
      contents: [
        {
          parts: [
            { text: prompt }
          ]
        }
      ]
    };

    console.log("[DEBUG] Sending request to Gemini API:", JSON.stringify(body, null, 2));

    const { data } = await axios.post(GEMINI_URL, body, {
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": API_KEY
      }
    });

    console.log("[DEBUG] Received response from Gemini API:", JSON.stringify(data, null, 2));

    res.json(data);
  } catch (err) {
    console.error("[ERROR] Gemini API error:", err.response?.data || err);
    res.status(500).json({ error: err.response?.data || String(err) });
  }
});

app.listen(4000, () => console.log("Server running on http://localhost:4000"));
