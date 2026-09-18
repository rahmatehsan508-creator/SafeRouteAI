import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'SafeRoute AI' });
  });

  // Proxy Geocoding endpoint to avoid client-side CORS and rate-limit blocks
  app.get('/api/geocode', async (req, res) => {
    const q = req.query.q as string;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Query parameter q required' });
    }

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q.trim())}&limit=5&addressdetails=1`;
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SafeRoute-AI-Navigation/1.0 (urban-mobility-safety-assistant)'
        }
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: 'Upstream geocoder failed' });
      }

      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      console.error('[Server Geocode Proxy Error]:', err?.message);
      res.status(500).json({ error: 'Geocoding proxy error' });
    }
  });

  // Gemini AI Route Explanation endpoint
  app.post('/api/gemini/explain-route', async (req, res) => {
    const { selectedRoute, alternativesCount, travelMode, preference } = req.body;

    if (!selectedRoute) {
      return res.status(400).json({ error: 'Missing selectedRoute payload' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Fallback if no key configured
      return res.json({
        summary: `${selectedRoute.name} offers an estimated Safety Score of ${selectedRoute.safetyScore}/100 for ${travelMode} under ${preference} preference.`,
        safetyBreakdown: `Lighting is estimated at ${selectedRoute.safetyFactors?.lighting}/100, Public Presence at ${selectedRoute.safetyFactors?.publicPresence}/100, and Road Condition at ${selectedRoute.safetyFactors?.roadCondition}/100.`,
        timeContext: selectedRoute.safetyFactors?.timeOfDayMultiplier < 1
          ? 'Off-peak multiplier applied due to diminished ambient light.'
          : 'Daytime travel window benefits from standard urban activity.',
        recommendations: [
          ...(selectedRoute.keyPositives || []).map((p: string) => `Advantage: ${p}`),
          ...(selectedRoute.keyConcerns || []).map((c: string) => `Advisory: ${c}`)
        ]
      });
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `
You are the Safety Reasoning Engine for SafeRoute AI, a professional urban mobility navigation platform.
Analyze the following structured route safety data and generate a clear, objective, professional assessment.

STRICT CONSTRAINTS:
1. Do NOT invent crime statistics, fake police stations, hospitals, coordinates, road conditions, community reports, real-time incidents, or real-time traffic.
2. Present safety as an ESTIMATED Safety Score out of 100, NEVER as a guarantee or percentage (e.g. say "Safety Score: ${selectedRoute.safetyScore}/100", never "safe guarantee").
3. Strictly adhere to the provided structured data.
4. Output strictly valid JSON with keys:
   - "summary": (2 concise sentences explaining why this route received this score and its fit for ${travelMode} with ${preference} preference)
   - "safetyBreakdown": (1-2 sentences highlighting lighting, public presence, isolation, and road conditions)
   - "timeContext": (1 sentence discussing time-of-day dynamics based on the timeOfDayMultiplier)
   - "recommendations": (array of 2 to 3 short bullet advisories/advantages)

DATA:
- Route Name: ${selectedRoute.name}
- Distance: ${selectedRoute.distanceKm} km
- Duration: ${selectedRoute.durationFormatted}
- Travel Mode: ${travelMode}
- User Preference: ${preference}
- Estimated Safety Score: ${selectedRoute.safetyScore}/100
- Factor Scores:
  * Lighting: ${selectedRoute.safetyFactors?.lighting}/100
  * Incident Risk Index: ${selectedRoute.safetyFactors?.incidentRisk}/100
  * Public Presence: ${selectedRoute.safetyFactors?.publicPresence}/100
  * Road Condition: ${selectedRoute.safetyFactors?.roadCondition}/100
  * Isolation Score: ${selectedRoute.safetyFactors?.isolation}/100
  * Emergency Accessibility: ${selectedRoute.safetyFactors?.emergencyAccessibility}/100
  * Community Penalty: ${selectedRoute.safetyFactors?.communityReportPenalty}
  * Time Multiplier: ${selectedRoute.safetyFactors?.timeOfDayMultiplier}
- Known Positives: ${(selectedRoute.keyPositives || []).join(', ')}
- Known Concerns: ${(selectedRoute.keyConcerns || []).join(', ')}
`;

      // Resilient model tiering: prefer high-availability models with automatic fallback on 503
      const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
      let parsed: any = null;

      for (const modelName of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.2
            }
          });

          const responseText = response.text || '{}';
          parsed = JSON.parse(responseText);
          if (parsed && parsed.summary) {
            break;
          }
        } catch (upstreamError: any) {
          // Check if transient 503 (high demand) or 429 (rate limit)
          const isTransient = upstreamError?.status === 503 || upstreamError?.message?.includes('503') || upstreamError?.message?.includes('high demand');
          if (!isTransient) {
            // If it's a non-503 issue, log subtle info and continue to next model
            console.log(`[Gemini Server] Attempt with ${modelName} encountered: ${upstreamError?.message || 'unknown'}`);
          }
        }
      }

      if (parsed && parsed.summary) {
        return res.json({
          summary: parsed.summary,
          safetyBreakdown: parsed.safetyBreakdown || '',
          timeContext: parsed.timeContext || '',
          recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : []
        });
      }

      // If upstream models experienced high demand (503), gracefully supply accurate deterministic breakdown
      return res.json({
        summary: `${selectedRoute.name} provides an estimated Safety Score of ${selectedRoute.safetyScore}/100 for ${travelMode} under ${preference} preference.`,
        safetyBreakdown: `Estimated lighting is ${selectedRoute.safetyFactors?.lighting}/100 and public presence is ${selectedRoute.safetyFactors?.publicPresence}/100.`,
        timeContext: selectedRoute.safetyFactors?.timeOfDayMultiplier < 1
          ? 'Nighttime travel conditions reflect reduced ambient lighting and lower street activity.'
          : 'Daytime travel benefits from standard visibility and normal pedestrian traffic.',
        recommendations: [
          ...(selectedRoute.keyPositives || []).map((p: string) => `Advantage: ${p}`),
          ...(selectedRoute.keyConcerns || []).map((c: string) => `Advisory: ${c}`)
        ]
      });
    } catch {
      // Graceful fallback without throwing unhandled exceptions
      return res.json({
        summary: `${selectedRoute.name} provides an estimated Safety Score of ${selectedRoute.safetyScore}/100 for ${travelMode} under ${preference} preference.`,
        safetyBreakdown: `Estimated lighting is ${selectedRoute.safetyFactors?.lighting}/100 and public presence is ${selectedRoute.safetyFactors?.publicPresence}/100.`,
        timeContext: selectedRoute.safetyFactors?.timeOfDayMultiplier < 1
          ? 'Nighttime travel conditions reflect reduced visibility.'
          : 'Daytime travel benefits from regular urban density.',
        recommendations: [
          ...(selectedRoute.keyPositives || []).map((p: string) => `Advantage: ${p}`),
          ...(selectedRoute.keyConcerns || []).map((c: string) => `Advisory: ${c}`)
        ]
      });
    }
  });

  // Vite middleware in dev; static in prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SafeRoute AI] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
