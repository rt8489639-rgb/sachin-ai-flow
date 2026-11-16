import "dotenv/config";
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
app.use(express.json({ limit: "30mb" }));
app.use(express.static(path.join(__dirname, "public")));
const ai = () => {
  if (!process.env.GEMINI_API_KEY) throw new Error("Add GEMINI_API_KEY to your .env file, then restart SACHIN AI FLOW.");
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
};

app.get("/api/status", (_req, res) => res.json({ configured: !!process.env.GEMINI_API_KEY, app: "SACHIN AI FLOW" }));

app.post("/api/video", upload.single("image"), async (req, res) => {
  try {
    const prompt = String(req.body.prompt || "").trim();
    if (!prompt) return res.status(400).json({ error: "Please enter a video prompt." });
    const ratio = req.body.ratio === "16:9" ? "16:9" : "9:16";
    const input = [];
    if (req.file) input.push({ type: "image", data: req.file.buffer.toString("base64"), mime_type: req.file.mimetype });
    input.push({ type: "text", text: prompt });
    const interaction = await ai().interactions.create({
      model: "gemini-omni-1.1-flash",
      input: req.file ? input : prompt,
      response_format: { type: "video", aspect_ratio: ratio },
      ...(req.file ? { generation_config: { video_config: { task: "image_to_video" } } } : {})
    });
    res.json({ id: interaction.id, status: interaction.status || "submitted", output_video: interaction.output_video || null });
  } catch (e) { res.status(500).json({ error: e.message || "Video generation failed." }); }
});

app.post("/api/image-edit", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Upload a photo first." });
    const prompt = String(req.body.prompt || "Improve this image naturally.").trim();
    const response = await ai().models.generateContent({
      model: "gemini-3.1-flash-image",
      contents: [{ role: "user", parts: [
        { inlineData: { mimeType: req.file.mimetype, data: req.file.buffer.toString("base64") } },
        { text: prompt }
      ] }],
      config: { responseModalities: ["TEXT", "IMAGE"] }
    });
    const parts = response.candidates?.[0]?.content?.parts || [];
    const img = parts.find(p => p.inlineData?.data);
    if (!img) throw new Error("The image model returned no image. Try another prompt.");
    res.json({ image: `data:${img.inlineData.mimeType || "image/png"};base64,${img.inlineData.data}` });
  } catch (e) { res.status(500).json({ error: e.message || "Image editing failed." }); }
});

app.post("/api/tts", async (req, res) => {
  // Browser Hindi speech is available in the UI. This endpoint is reserved for a future
  // server-side speech provider; no fake audio is returned.
  res.status(501).json({ error: "Server TTS is not configured. Use the Hindi Voice button in your browser/device." });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`SACHIN AI FLOW running at http://localhost:${port}`));
