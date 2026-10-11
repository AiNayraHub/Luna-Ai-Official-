import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;

// Lazy initialization of GoogleGenAI
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
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

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // API Health
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Chat completion endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const {
        messages = [],
        modelId = "gemini-2.5-flash",
        systemInstruction = "You are Luna AI, a helpful, brilliant, empathetic, and exceptionally capable AI assistant. Answer with precision, high-quality markdown, clean code snippets with language tags, and clear thinking.",
        enableSearch = false,
        temperature = 0.7,
        topP = 0.95,
      } = req.body;

      const ai = getGenAI();
      if (!ai) {
        // Return helpful message if API key is not yet set
        return res.json({
          text: "I am Luna AI. To connect me to live intelligence, please configure your Gemini API Key in the Settings > Secrets panel.",
          groundingSources: [],
        });
      }

      // Map incoming messages to Gemini contents format
      const contents: any[] = [];

      for (const msg of messages) {
        const parts: any[] = [];

        // Check for attached images (multimodal vision input)
        if (msg.attachments && msg.attachments.length > 0) {
          for (const att of msg.attachments) {
            if (att.dataUrl && att.dataUrl.includes(",")) {
              const [header, base64] = att.dataUrl.split(",");
              const mimeMatch = header.match(/data:(.*?);base64/);
              const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
              parts.push({
                inlineData: {
                  mimeType,
                  data: base64,
                },
              });
            }
          }
        }

        if (msg.content) {
          parts.push({ text: msg.content });
        }

        if (parts.length > 0) {
          contents.push({
            role: msg.role === "assistant" ? "model" : "user",
            parts,
          });
        }
      }

      if (contents.length === 0) {
        return res.status(400).json({ error: "No message contents provided" });
      }

      // Prepare config
      const config: any = {
        systemInstruction,
        temperature,
        topP,
      };

      // Add tools if search is enabled
      if (enableSearch) {
        config.tools = [{ googleSearch: {} }];
      }

      // Choose model
      const targetModel = modelId || "gemini-2.5-flash";

      const response = await ai.models.generateContent({
        model: targetModel,
        contents,
        config,
      });

      const responseText = response.text || "";

      // Extract search grounding sources if available
      const groundingSources: any[] = [];
      const candidate = response.candidates?.[0];
      const groundingMetadata = candidate?.groundingMetadata;

      if (groundingMetadata?.groundingChunks) {
        for (const chunk of groundingMetadata.groundingChunks) {
          if (chunk.web?.uri && chunk.web?.title) {
            groundingSources.push({
              title: chunk.web.title,
              url: chunk.web.uri,
            });
          }
        }
      }

      res.json({
        text: responseText,
        groundingSources,
      });
    } catch (error: any) {
      console.error("Chat error:", error);
      res.status(500).json({
        error: error.message || "Failed to process chat with Luna AI",
      });
    }
  });

  // Structured JSON schema extraction endpoint
  app.post("/api/extract-json", async (req, res) => {
    try {
      const { text, schemaDescription, presetName } = req.body;
      const ai = getGenAI();
      if (!ai) {
        return res.status(500).json({ error: "Gemini API key is not configured" });
      }

      const prompt = `You are a precision JSON extraction engine. Extract all relevant structured information from the source text according to the requested schema or description.
Preset: ${presetName || "Custom"}
Schema requirement: ${schemaDescription || "Extract clean structured key-value data with proper data types"}

Source Text:
${text}

Return ONLY valid JSON matching the schema, with no markdown fences, no explanatory text.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const jsonStr = response.text || "{}";
      res.json({ result: JSON.parse(jsonStr) });
    } catch (error: any) {
      console.error("JSON extraction error:", error);
      res.status(500).json({ error: error.message || "Failed to extract JSON" });
    }
  });

  // Practice Partner session evaluation
  app.post("/api/practice-evaluation", async (req, res) => {
    try {
      const { scenarioTitle, scenarioRole, transcript } = req.body;
      const ai = getGenAI();
      if (!ai) {
        return res.status(500).json({ error: "Gemini API key is not configured" });
      }

      const prompt = `You are an expert evaluator assessing a simulation roleplay session.
Scenario: ${scenarioTitle}
User was practicing with role: ${scenarioRole}

Transcript of the session:
${JSON.stringify(transcript, null, 2)}

Provide a detailed constructive evaluation in JSON format with:
- overallScore (number 1-100)
- performanceSummary (2-3 sentences)
- keyStrengths (array of 3 strings)
- areasForImprovement (array of 3 strings)
- nextActionRecommendations (array of 2 actionable drills)
- highlights (array of objects with { quote: string, feedback: string })`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const jsonStr = response.text || "{}";
      res.json({ evaluation: JSON.parse(jsonStr) });
    } catch (error: any) {
      console.error("Practice evaluation error:", error);
      res.status(500).json({ error: error.message || "Failed to evaluate session" });
    }
  });

  // TTS endpoint via Gemini TTS
  app.post("/api/tts", async (req, res) => {
    try {
      const { text, voice = "Kore" } = req.body;
      const ai = getGenAI();
      if (!ai) {
        return res.status(500).json({ error: "Gemini API key is not configured" });
      }

      // Truncate to reasonable TTS length if needed
      const cleanText = (text || "").slice(0, 800);

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: cleanText }] }],
        config: {
          responseModalities: ["AUDIO" as any],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice || "Kore" },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (base64Audio) {
        res.json({ audioBase64: base64Audio });
      } else {
        res.status(404).json({ error: "No audio generated" });
      }
    } catch (error: any) {
      console.error("TTS error:", error);
      res.status(500).json({ error: error.message || "TTS service unavailable" });
    }
  });

  // Vite integration for dev vs production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Luna AI Official Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
