import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Modality } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
app.use(express.json({ limit: "10mb" }));

const PORT = 3000;

// Get GoogleGenAI client (uses custom key if provided, else falls back to server key).
function getAi(customApiKey?: string): GoogleGenAI {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Kunci API Gemini (GEMINI_API_KEY) tidak ditemukan. Silakan masukkan API Key Anda di kolom yang tersedia.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// API Routes
// 1. Text to Speech API using gemini-3.1-flash-tts-preview
app.post("/api/tts", async (req, res) => {
  try {
    const { text, voice, emotion, customApiKey } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Teks tidak boleh kosong." });
    }

    const voiceName = voice || "Kore"; // Puck, Charon, Kore, Fenrir, Zephyr
    const clientApiKey = customApiKey || req.headers["x-gemini-api-key"]?.toString();
    const ai = getAi(clientApiKey);

    // Construct instruction for the voice tone
    let promptContent = text;
    if (emotion && emotion !== "normal") {
      promptContent = `Say in a ${emotion} tone: ${text}`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: promptContent }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    const base64Audio = inlineData?.data;
    const modelMimeType = inlineData?.mimeType || "audio/pcm";

    console.log("Gemini TTS Native MimeType:", modelMimeType, "Base64 Length:", base64Audio?.length);

    if (!base64Audio) {
      return res.status(500).json({ error: "Gagal menghasilkan audio dari model AI." });
    }

    let finalAudioBase64 = base64Audio;
    let finalMimeType = modelMimeType;

    // Convert raw PCM to browser-playable WAV if needed
    if (
      modelMimeType.includes("pcm") ||
      modelMimeType.includes("raw") ||
      modelMimeType.includes("l16") ||
      modelMimeType === "audio/pcm"
    ) {
      const rawPcm = Buffer.from(base64Audio, "base64");
      
      // Parse sample rate from mimeType if available (e.g. rate=24000)
      const rateMatch = modelMimeType.match(/rate=(\d+)/);
      const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;

      // Parse channels from mimeType if available (e.g. channels=1)
      const channelsMatch = modelMimeType.match(/channels=(\d+)/);
      const numChannels = channelsMatch ? parseInt(channelsMatch[1], 10) : 1;

      const bitsPerSample = 16;
      const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
      const blockAlign = numChannels * (bitsPerSample / 8);
      const dataSize = rawPcm.length;
      const chunkSize = 36 + dataSize;

      const header = Buffer.alloc(44);
      header.write("RIFF", 0);
      header.writeUInt32LE(chunkSize, 4);
      header.write("WAVE", 8);
      header.write("fmt ", 12);
      header.writeUInt32LE(16, 16);
      header.writeUInt16LE(1, 20); // raw PCM format
      header.writeUInt16LE(numChannels, 22);
      header.writeUInt32LE(sampleRate, 24);
      header.writeUInt32LE(byteRate, 28);
      header.writeUInt16LE(blockAlign, 32);
      header.writeUInt16LE(bitsPerSample, 34);
      header.write("data", 36);
      header.writeUInt32LE(dataSize, 40);

      const wavBuffer = Buffer.concat([header, rawPcm]);
      finalAudioBase64 = wavBuffer.toString("base64");
      finalMimeType = "audio/wav";
    }

    return res.json({ success: true, audio: finalAudioBase64, mimeType: finalMimeType });
  } catch (error: any) {
    console.error("TTS Error:", error);
    return res.status(500).json({ error: error.message || "Terjadi kesalahan pada server." });
  }
});

// 2. Text Enhancer API using gemini-3.5-flash
app.post("/api/enhance", async (req, res) => {
  try {
    const { text, mode, customApiKey } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Teks tidak boleh kosong." });
    }

    const clientApiKey = customApiKey || req.headers["x-gemini-api-key"]?.toString();
    const ai = getAi(clientApiKey);
    
    let instruction = "";
    if (mode === "formal") {
      instruction = "Perbaiki ejaan, tata bahasa, dan buat teks ini menjadi sangat formal, profesional, sopan, dan jelas dalam bahasa Indonesia (atau bahasa Inggris jika teks aslinya bahasa Inggris).";
    } else if (mode === "poetic") {
      instruction = "Ubah teks ini menjadi puitis, penuh emosi, indah, dan mendalam. Sangat cocok untuk dideklamasikan.";
    } else if (mode === "casual") {
      instruction = "Ubah teks ini menjadi santai, hangat, kekinian, ramah, dan bernada percakapan sehari-hari yang natural.";
    } else if (mode === "storytelling") {
      instruction = "Ubah teks ini seperti sedang membawakan cerita anak-anak, dongeng yang seru, ekspresif, dan menarik dengan intonasi bernyawa.";
    } else {
      instruction = "Perbaiki tata bahasa, tanda baca, ejaan, dan buat tulisan ini menjadi mengalir dengan lebih alami dan indah didengar.";
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Berikut adalah teks aslinya:\n"${text}"\n\nTugas Anda:\n${instruction}\n\nBerikan hasil perbaikan/penyempurnaan teks langsung, tanpa kata pengantar atau penutup apa pun, agar dapat langsung disalin ke Text-to-Speech secara bersih.`,
    });

    const enhancedText = response.text?.trim() || text;
    return res.json({ success: true, enhancedText });
  } catch (error: any) {
    console.error("Enhance Error:", error);
    return res.status(500).json({ error: error.message || "Terjadi kesalahan saat menyempurnakan teks." });
  }
});

// 3. API Key Validation
app.post("/api/validate-key", async (req, res) => {
  try {
    const { customApiKey } = req.body;
    const clientApiKey = customApiKey || req.headers["x-gemini-api-key"]?.toString();
    if (!clientApiKey) {
      return res.status(400).json({ error: "Kunci API tidak boleh kosong." });
    }
    const ai = getAi(clientApiKey);
    // Simple verification with a lightweight call to check if the key is valid
    await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "ping",
      config: { maxOutputTokens: 1 },
    });
    return res.json({ success: true, message: "Kunci API valid dan aktif!" });
  } catch (error: any) {
    console.error("Validation Error:", error);
    return res.status(400).json({ error: error.message || "Kunci API tidak valid atau tidak dapat digunakan." });
  }
});

// Serve static elements
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

if (!process.env.VERCEL) {
  setupServer();
}

export default app;
