import "dotenv/config";
import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import { fal } from "@fal-ai/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
app.use(express.json({ limit: "30mb" }));
app.use(express.static(path.join(__dirname, "public")));

const gemini = () => {
  if (!process.env.GEMINI_API_KEY) throw new Error("Photo editing is not configured. Add GEMINI_API_KEY in Render Environment.");
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
};

app.get("/api/status", (_req, res) => res.json({
  configured: Boolean(process.env.FAL_KEY),
  wanConfigured: Boolean(process.env.FAL_KEY),
  imageEditConfigured: Boolean(process.env.GEMINI_API_KEY),
  videoEngine: "Wan 2.2 via fal.ai",
  app: "SACHIN AI FLOW"
}));

// Server-side Wan integration. FAL_KEY is never exposed to the browser.
app.post("/api/video", upload.single("image"), async (req, res) => {
  try {
    const prompt = String(req.body.prompt || "").trim();
    if (!prompt) return res.status(400).json({ error: "Please enter a video prompt." });
    if (!process.env.FAL_KEY) return res.status(503).json({
      error: "Wan is not connected. Add FAL_KEY privately in Render → sachin-ai-flow → Environment. Hosted Wan generation may require paid credits."
    });
    fal.config({ credentials: process.env.FAL_KEY });
    const ratio = ["9:16", "16:9"].includes(req.body.ratio) ? req.body.ratio : "9:16";
    const input = { prompt, aspect_ratio: ratio };
    let endpoint = "fal-ai/wan/v2.2-5b/text-to-video";
    if (req.file) {
      endpoint = "fal-ai/wan/v2.2-5b/image-to-video";
      input.image_url = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    }
    const result = await fal.subscribe(endpoint, {
      input, logs: false, headers: { "X-Fal-Store-IO": "0" }
    });
    const videoUrl = result?.data?.video?.url || result?.data?.video_url || result?.data?.output?.url;
    if (!videoUrl) throw new Error("Wan provider returned no video URL. Check Render logs and provider response.");
    res.json({ status: "completed", output_video: { uri: videoUrl }, provider: "Wan 2.2" });
  } catch (e) {
    console.error("Wan generation error:", e);
    res.status(500).json({ error: e?.message || "Wan video generation failed." });
  }
});

app.post("/api/image-edit", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Upload a photo first." });
    const prompt = String(req.body.prompt || "Improve this image naturally.").trim();
    const response = await gemini().models.generateContent({
      model: "gemini-3.1-flash-image",
      contents: [{ role: "user", parts: [
        { inlineData: { mimeType: req.file.mimetype, data: req.file.buffer.toString("base64") } },
        { text: prompt }
      ] }],
      config: { responseModalities: ["TEXT", "IMAGE"] }
    });
    const parts = response.candidates?.[0]?.content?.parts || [];
    const img = parts.find(p => p.inlineData?.data);
    if (!img) throw new Error("The image model returned no image. Check Gemini API access/quota.");
    res.json({ image: `data:${img.inlineData.mimeType || "image/png"};base64,${img.inlineData.data}` });
  } catch (e) { res.status(500).json({ error: e.message || "Image editing failed." }); }
});

app.get("/api/health", (_req, res) => res.json({ ok: true, app: "SACHIN AI FLOW" }));
const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => console.log(`SACHIN AI FLOW running on port ${port}`));
