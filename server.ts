import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { INITIAL_VENDORS } from './src/data';
import { Vendor } from './src/types';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory vendors store
let vendors: Vendor[] = [...INITIAL_VENDORS];

function server70WeekRiskTrend(targetScore: number): { week: number; dateString: string; riskScore: number }[] {
  const trend = [];
  const currentDate = new Date('2026-05-22');
  const startDev = (Math.random() - 0.5) * 26;
  const startScore = Math.max(10, Math.min(95, Math.round(targetScore + startDev)));
  
  for (let w = 1; w <= 70; w++) {
    const weeksAgo = 70 - w;
    const date = new Date(currentDate.getTime());
    date.setDate(date.getDate() - (weeksAgo * 7));
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    const dateString = `${month} ${day}`;
    
    let score = targetScore;
    if (w < 70) {
      const progress = w / 70;
      const base = startScore + (targetScore - startScore) * progress;
      const walkNoise = (Math.random() - 0.5) * 8;
      score = Math.max(10, Math.min(95, Math.round(base + walkNoise)));
    }
    
    trend.push({
      week: w,
      dateString,
      riskScore: score
    });
  }
  return trend;
}

// Lazy-loaded Gemini AI client helper
let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY is not configured. Please add your GEMINI_API_KEY in the Secrets panel in AI Studio settings.');
  }

  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// 1. API: Get vendors lists
app.get('/api/vendors', (req, res) => {
  res.json({ success: true, vendors });
});

// 2. API: Reset to initial vendor list
app.post('/api/vendors/reset', (req, res) => {
  vendors = [...INITIAL_VENDORS];
  res.json({ success: true, vendors, message: 'Vendor database reset successful.' });
});

// 3. API: Add or assess a new custom vendor
app.post('/api/vendors/add', async (req, res) => {
  const { name, sector, country, backupSupplier } = req.body;
  try {
    if (!name || !sector || !country) {
      return res.status(400).json({ success: false, error: 'Name, sector, and country are required.' });
    }

    // Call Gemini to generate a realistic risk score, buffer days, metrics, actionable insights and summary
    const ai = getAIClient();
    const prompt = `
      You are an expert Supplier Risk Analytics system specialized in Consumer Packaged Goods (CPG).
      Generate a realistic, fully detailed risk profile for a company with the following details:
      - Company Name: "${name}"
      - Sector: "${sector}" (CPG Sub-sector)
      - Country: "${country}"
      - Proposed Backup Supplier: "${backupSupplier || 'Not Specified'}"

      Respond WITH ONLY A RAW JSON OBJECT matching the structure below. Do not wrap it in markdown code blocks.
      Structure:
      {
        "riskScore": number (between 10 and 95, where higher indicates higher risk),
        "riskStatus": "Low" | "Medium" | "High" | "Critical" (Low was score < 35, Medium 35-59, High 60-79, Critical >= 80),
        "metrics": {
          "financialInstability": number (10-100),
          "deliveryDelay": number (10-100),
          "complianceIssues": number (10-100)
        },
        "inventoryLevel": "Optimal" | "Warning" | "Critical",
        "inventoryBufferDays": number (days, e.g. 10 to 90),
        "financialImpactScore": number (10-100 representing importance of this supplier),
        "actionableInsights": [string, string, string] (provide 3 highly specific supply chain recommendations for this sector focusing on financial health, delivery delays, and product/regulatory compliance),
        "summary": "string (a descriptive paragraph, highlighting the major risk factors around financial instability, delivery delays, and compliance issues)",
        "marketSignals": [
          {
            "source": "string (credible CPG trade source)",
            "headline": "string (highly plausible news event affecting this vendor right now)",
            "sentiment": "positive" | "negative" | "neutral",
            "impactArea": "financial" | "logistics" | "production" | "geopolitical",
            "date": "2026-05-22",
            "severity": "low" | "medium" | "high"
          }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const aiText = response.text || '';
    let parsedData;
    try {
      parsedData = JSON.parse(aiText.trim());
    } catch (parseErr) {
      // Fallback in case JSON format was slightly off or wrapped in markdown backticks
      const cleanJson = aiText.replace(/```json/i, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleanJson);
    }

    const newVendor: Vendor = {
      id: `V${String(vendors.length + 1).padStart(3, '0')}`,
      name,
      sector,
      country,
      riskStatus: parsedData.riskStatus || 'Medium',
      riskScore: parsedData.riskScore || 50,
      metrics: parsedData.metrics || { financialInstability: 50, deliveryDelay: 50, complianceIssues: 50 },
      actionableInsights: parsedData.actionableInsights || ['Diversify procurement streams.'],
      marketSignals: parsedData.marketSignals?.map((sig: any, index: number) => ({
        id: `S_NEW_${Date.now()}_${index}`,
        ...sig
      })) || [],
      inventoryLevel: parsedData.inventoryLevel || 'Optimal',
      inventoryBufferDays: parsedData.inventoryBufferDays || 30,
      financialImpactScore: parsedData.financialImpactScore || 50,
      backupSupplier: backupSupplier || parsedData.backupSupplier || 'Not Specified',
      summary: parsedData.summary || 'Custom loaded vendor evaluated under automatic sector metrics.',
      historicalRiskTrend: server70WeekRiskTrend(parsedData.riskScore || 50)
    };

    vendors.push(newVendor);
    res.json({ success: true, vendor: newVendor, vendors });
  } catch (error: any) {
    console.error('Add vendor error:', error);
    
    // Check if error is quota exhausted (429)
    const isQuotaError = error.message && (
      error.message.includes('429') || 
      error.message.includes('quota') || 
      error.message.includes('RESOURCE_EXHAUSTED') ||
      error.status === 'RESOURCE_EXHAUSTED' ||
      error.code === 429
    );

    if (isQuotaError) {
      console.log('Activating Local Vendor Resiliency Modeling Fallback...');
      const hash = name.length + sector.length + country.length;
      const riskScore = 40 + (hash % 45); // deterministic 40 - 85
      const riskStatus = riskScore >= 80 ? 'Critical' : riskScore >= 60 ? 'High' : 'Medium';
      
      const deterministicData = {
        riskScore,
        riskStatus,
        metrics: {
          financialInstability: 30 + (hash % 40),
          deliveryDelay: 30 + ((hash + 5) % 40),
          complianceIssues: 20 + ((hash + 10) % 40)
        },
        inventoryLevel: riskScore > 75 ? 'Critical' : riskScore > 50 ? 'Warning' : 'Optimal',
        inventoryBufferDays: riskScore > 75 ? 15 + (hash % 15) : riskScore > 50 ? 30 + (hash % 20) : 60 + (hash % 30),
        financialImpactScore: 40 + (hash % 50),
        actionableInsights: [
          `Diversify standard procurement of ${sector} across regional boundaries immediately.`,
          `Validate business continuity margins with alternate backers under secondary shipping clauses.`,
          `Implement dual-sourcing pre-qualification with ${backupSupplier || 'Western Reserves Inc.'} to secure pricing hedges.`
        ],
        summary: `Resilient evaluation for ${name} headquartered in ${country} under automated sector assessment rules (Local inference fall-back due to global API rate limitations). Shows relevant industrial exposures.`,
        marketSignals: [
          {
            source: 'Trade Monitor Daily',
            headline: `Sub-sector adjustments reported for ${sector} leading to localized logistics bottlenecks.`,
            sentiment: 'negative',
            impactArea: 'logistics',
            date: '2026-05-22',
            severity: 'medium'
          }
        ]
      };

      const newVendor: Vendor = {
        id: `V${String(vendors.length + 1).padStart(3, '0')}`,
        name,
        sector,
        country,
        riskStatus: deterministicData.riskStatus as any,
        riskScore: deterministicData.riskScore,
        metrics: deterministicData.metrics,
        actionableInsights: deterministicData.actionableInsights,
        marketSignals: deterministicData.marketSignals?.map((sig: any, index: number) => ({
          id: `S_NEW_${Date.now()}_${index}`,
          ...sig
        })) || [],
        inventoryLevel: deterministicData.inventoryLevel as any,
        inventoryBufferDays: deterministicData.inventoryBufferDays,
        financialImpactScore: deterministicData.financialImpactScore,
        backupSupplier: backupSupplier || 'Western Reserves Inc.',
        summary: deterministicData.summary,
        historicalRiskTrend: server70WeekRiskTrend(deterministicData.riskScore)
      };

      vendors.push(newVendor);
      return res.json({ success: true, vendor: newVendor, vendors, fallbackActive: true });
    }

    res.status(500).json({ success: false, error: error.message || 'Failed to analyze and add vendor.' });
  }
});

function isAllowedCategory(msg: string): boolean {
  const m = msg.toLowerCase();
  
  const hasDelivery = m.includes('delivery') || m.includes('buffer') || m.includes('stock') || m.includes('delay') || m.includes('shipping') || m.includes('inventory') || m.includes('logistics') || m.includes('swap') || m.includes('backup') || m.includes('alternative') || m.includes('sourcing');
  const hasFinance = m.includes('financial') || m.includes('instability') || m.includes('finance') || m.includes('stability') || m.includes('cost') || m.includes('money') || m.includes('budget') || m.includes('loss') || m.includes('exposure') || m.includes('impact') || m.includes('pricing') || m.includes('hedging') || m.includes('revenue') || m.includes('profit');
  const hasCompliance = m.includes('compliance') || m.includes('audit') || m.includes('regulation') || m.includes('regulatory') || m.includes('license') || m.includes('legal') || m.includes('rules') || m.includes('customs') || m.includes('certificate') || m.includes('environmental') || m.includes('climate') || m.includes('weather') || m.includes('inspections') || m.includes('certify');
  const hasHistory = m.includes('historical') || m.includes('history') || m.includes('trend') || m.includes('trajectory') || m.includes('weeks') || m.includes('timeline') || m.includes('past') || m.includes('previous') || m.includes('interval') || m.includes('graph') || m.includes('chart') || m.includes('plot');
  const hasSocial = m.includes('social') || m.includes('media') || m.includes('narrative') || m.includes('brand') || m.includes('sentiment') || m.includes('mention') || m.includes('post') || m.includes('feed') || m.includes('public') || m.includes('vibe') || m.includes('reputation') || m.includes('news') || m.includes('headline') || m.includes('feedback');
  const hasGeneralCatalog = m.includes('catalog') || m.includes('list') || m.includes('status') || m.includes('supplier') || m.includes('vendor') || m.includes('overview') || m.includes('summary') || m.includes('profile') || m.includes('action') || m.includes('insight') || m.includes('threat') || m.includes('critical') || m.includes('warning') || m.includes('low') || m.includes('high') || m.includes('score') || m.includes('hello') || m.includes('hi ') || m.includes('hey') || m.includes('help');

  return hasDelivery || hasFinance || hasCompliance || hasHistory || hasSocial || hasGeneralCatalog;
}

// Advanced keyword relevance scorer and RAG context-limiting retriever
function retrieveRelevantVendors(query: string, currentVendors: Vendor[], selectedVendorId: string | null = null, limit = 6): Vendor[] {
  const q = query.toLowerCase();
  
  // Find selected vendor if any
  const selectedVendor = selectedVendorId ? currentVendors.find(v => v.id === selectedVendorId) : null;
  
  const scored = currentVendors.map(v => {
    let score = 0;
    
    // Explicit ID search (e.g. V102 or v102)
    if (q.includes(v.id.toLowerCase())) {
      score += 200;
    }
    
    // Explicit Name matching (best match gets high scores)
    const nameLower = v.name.toLowerCase();
    if (q.includes(nameLower)) {
      score += 150;
    } else {
      const nameParts = nameLower.split(/\s+/);
      for (const part of nameParts) {
        if (part.length > 2 && q.includes(part)) {
          score += 50;
        }
      }
    }
    
    // Country matching
    const countryLower = v.country.toLowerCase();
    if (q.includes(countryLower)) {
      score += 40;
    }
    
    // Sector matching
    const sectorLower = v.sector.toLowerCase();
    if (q.includes(sectorLower)) {
      score += 30;
    } else {
      const sectorParts = sectorLower.split(/\s+/);
      for (const part of sectorParts) {
        if (part.length > 3 && q.includes(part)) {
          score += 15;
        }
      }
    }

    // Risk levels & status
    if (q.includes('critical') && v.riskStatus === 'Critical') score += 15;
    if (q.includes('high') && v.riskStatus === 'High') score += 15;
    if (q.includes('medium') && v.riskStatus === 'Medium') score += 10;
    if (q.includes('low') && v.riskStatus === 'Low') score += 5;
    
    return { vendor: v, score };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Filter only vendors with some relevance score
  const matches = scored.filter(s => s.score > 0).map(s => s.vendor);
  
  // Ensure the selected vendor is matched if it exists and wasn't matched explicitly, placing it near the top
  if (selectedVendor && !matches.some(m => m.id === selectedVendor.id)) {
    matches.unshift(selectedVendor);
  }

  // If we have enough matches, return them up to the limit
  if (matches.length >= limit) {
    return matches.slice(0, limit);
  }

  // Fill up remaining slots with highest-exposure vendors to enrich the analytical background
  const seenIds = new Set(matches.map(m => m.id));
  const remaining = currentVendors
    .filter(v => !seenIds.has(v.id))
    .sort((a, b) => b.riskScore - a.riskScore); // Pick the most vulnerable ones first

  const result = [...matches];
  for (const v of remaining) {
    if (result.length >= limit) break;
    result.push(v);
  }

  return result.slice(0, limit);
}

// Helper function to generate deep, contextual and fully rule-driven resilient responses locally
function getFallbackResponse(message: string, selectedVendorId: string | null, currentVendors: Vendor[]): { text: string; sources?: { title: string; url: string }[] } {
  const msgLower = message.toLowerCase();
  
  if (!isAllowedCategory(message)) {
    return {
      text: `The requested topic falls outside the current context of corporate supply chain risk intelligence. Please query delivery dynamics, financial stability/instability, compliance protocols, historical risk trajectories, or brand social narratives.`
    };
  }

  // Use our smart RAG selector to retrieve the best company candidates matching the user's prompt
  const matched = retrieveRelevantVendors(message, currentVendors, selectedVendorId, 2);
  const primaryMatch = matched[0];

  if (primaryMatch) {
    const v = primaryMatch;
    
    // 1. History / Trajectory / Chart
    if (msgLower.includes('historical') || msgLower.includes('history') || msgLower.includes('trend') || msgLower.includes('trajectory') || msgLower.includes('weeks') || msgLower.includes('chart') || msgLower.includes('trajectory')) {
      const change = (v.riskScore - (v.historicalRiskTrend?.[0]?.riskScore || 50));
      return {
        text: `### 📈 Risk Trajectory: **${v.name}**\n` +
          `* **Week 1 Baseline:** ${v.historicalRiskTrend?.[0]?.riskScore || 50}/100\n` +
          `* **Week 70 Current:** **${v.riskScore}/100** (${v.riskStatus} Risk)\n` +
          `* **Trend Direction:** Over 70 weeks, risk has ${change >= 0 ? `increased by +${change}` : `decreased by -${Math.abs(change)}`} points.\n` +
          `* **Interpretation:** Tracked procuring bottlenecks near standard manufacturing facilities.`
      };
    }

    // 2. Compliance / Regulatory
    if (msgLower.includes('climate') || msgLower.includes('weather') || msgLower.includes('environmental') || msgLower.includes('compliance') || msgLower.includes('license') || msgLower.includes('audit') || msgLower.includes('regulat')) {
      return {
        text: `### 🌍 Compliance Scan: **${v.name}**\n` +
          `* **Compliance Score:** **${v.metrics.complianceIssues}/100** (Base: ${v.country})\n` +
          `* **Threat Level:** ${v.metrics.complianceIssues >= 75 ? 'Critical' : 'Moderate'} risk of custom delay or packaging fine.\n` +
          `* **Tactical Fixes:**\n` +
          `  1. Require quarterly packaging audit files pre-clearance.\n` +
          `  2. Alert backup sourcing provider **${v.backupSupplier}** to standby for routing.`
      };
    }

    // 3. Delivery / Logistics / Inventory
    if (msgLower.includes('inventory') || msgLower.includes('buffer') || msgLower.includes('stock') || msgLower.includes('delay') || msgLower.includes('shipping') || msgLower.includes('delivery') || msgLower.includes('logistic')) {
      return {
        text: `### 📦 Delivery & Stock Hedges: **${v.name}**\n` +
          `* **Inventory Safety Margin:** **${v.inventoryBufferDays} Days** (${v.inventoryLevel})\n` +
          `* **Carrier Delay Score:** **${v.metrics.deliveryDelay}/100**\n` +
          `* **Tactical Fixes:**\n` +
          `  1. Route cargo through secondary regional port pairings.\n` +
          `  2. Re-route 30% of baseline volume to standby backup partner **${v.backupSupplier}** immediately.`
      };
    }

    // 4. Finances / Cost
    if (msgLower.includes('financial') || msgLower.includes('instability') || msgLower.includes('finance') || msgLower.includes('stability') || msgLower.includes('cost') || msgLower.includes('money') || msgLower.includes('budget') || msgLower.includes('loss') || msgLower.includes('exposure') || msgLower.includes('impact') || msgLower.includes('pricing') || msgLower.includes('hedg') || msgLower.includes('revenue') || msgLower.includes('profit')) {
      return {
        text: `### 💸 Finance & Instability: **${v.name}**\n` +
          `* **Financial Stability Index:** **${v.metrics.financialInstability}/100**\n` +
          `* **Portfolio priority (100 Max):** ${v.financialImpactScore}/100\n` +
          `* **Tactical Fixes:**\n` +
          `  1. Enforce bank-backed letters of credit or protected escrows.\n` +
          `  2. Transition commitments to backup partner **${v.backupSupplier}** to lock fixed cost margins.`
      };
    }

    // 5. Social / news / reputation
    if (msgLower.includes('social') || msgLower.includes('media') || msgLower.includes('narrative') || msgLower.includes('brand') || msgLower.includes('sentiment') || msgLower.includes('mention') || msgLower.includes('post') || msgLower.includes('feed') || msgLower.includes('public') || msgLower.includes('reputation') || msgLower.includes('news') || msgLower.includes('headline')) {
      return {
        text: `### 📣 Feed Alerts: **${v.name}**\n` +
          `* **Active Signals:** Forums note localized delays near freight ports in **${v.country}**.\n` +
          `* **Sentiment Check:** Neutral to Slightly Negative. Proactive alternative supplier standby ensures continuous brand support.`
      };
    }

    // Default Profile Analysis
    return {
      text: `### 📊 Profile: **${v.name}**\n` +
        `* **Risk Class:** \`${v.riskStatus}\` (Score: **${v.riskScore}/100** | Sector: ${v.sector})\n` +
        `* **Tactical Fix Directive:** ${v.actionableInsights[0]}\n` +
        `* **Sourcing Backup:** ${v.backupSupplier}`
    };
  }

  // General catalog request or default list
  const criticals = currentVendors.filter(v => v.riskStatus === 'Critical' || v.riskStatus === 'High');
  return {
    text: `### 📋 Priority Supplier Threats\n` +
      criticals.slice(0, 3).map(v => (
        `* **${v.name}** (Score: **${v.riskScore}/100**): Buffer ${v.inventoryBufferDays} days. *Directive: ${v.actionableInsights[0]}*`
      )).join('\n')
  };
}

// 4. API: AI Chat with Google Search Grounding & Memory
app.post('/api/chat', async (req, res) => {
  const { message, history = [], selectedVendorId } = req.body;
  try {
    if (!message) {
      return res.status(400).json({ success: false, error: 'Message content is required.' });
    }

    // Apply strict category gate guardrails
    if (!isAllowedCategory(message)) {
      return res.json({
        success: true,
        text: `The requested topic falls outside the current context of corporate supply chain risk intelligence. Please query delivery dynamics, financial stability/instability, compliance protocols, historical risk trajectories, or brand social narratives.`
      });
    }

    const ai = getAIClient();

    // Prepare context about the current vendors database for the assistant using our custom RAG retriever
    const matchedVendors = retrieveRelevantVendors(message, vendors, selectedVendorId, 6);
    const vendorsContextString = matchedVendors.map(v => (
      `Vendor ID: ${v.id}
       Name: ${v.name}
       Sector: ${v.sector}
       Country: ${v.country}
       Overall Risk Score: ${v.riskScore}/100 (${v.riskStatus} Risk)
       Key Risk Metrics: Financial Instability(${v.metrics.financialInstability}/100), Delivery Delay(${v.metrics.deliveryDelay}/100), Compliance Issues(${v.metrics.complianceIssues}/100)
       Inventory Status: ${v.inventoryLevel} (${v.inventoryBufferDays} days stock)
       Financial Priority Score: ${v.financialImpactScore}/100
       Standard Actionable Insights:
         - ${v.actionableInsights.join('\n         - ')}
       Key Market Signals Tracked:
         - ${v.marketSignals.map(s => `[${s.sentiment.toUpperCase()}] ${s.headline} (${s.source}, ${s.date})`).join('\n         - ')}`
    )).join('\n\n');

    let currentSelectionString = 'None';
    if (selectedVendorId) {
      const selected = vendors.find(v => v.id === selectedVendorId);
      if (selected) {
        currentSelectionString = `User is currently viewing/focusing on: "${selected.name}" (${selected.id})`;
      }
    }

    // Build standard system instruction matching our analyst persona
    const systemInstruction = `
      You are a Lead Supplier Risk Intelligence and Supply Chain Resilience Analyst.
      Your goal is to help companies proactively mitigate supply chain disruptions, maintain raw/material inventory levels, avoid financial losses, and improve vendor visibility.

      You have direct access to a relevant target segment of the evaluated CPG Supplier Catalog (Active RAG Search match segment of top 6):
      ${vendorsContextString}

      Current view context: ${currentSelectionString}

      CRITICAL DIRECTIVE ON TOPIC GUARDRAILS:
      - If the question is NOT about vendor Delivery dynamics (shipping, logistics, delays, buffer, stock, inventory), Financial stability / Instability (finances, costs, budgets, losses, exposures), Compliance (regulations, audits, licenses, custom clearances), Historical data (historical trends, previous risk trajectories, past scores), or Social Media Narratives (sentiments, feedbacks, reputation, posts, news mentions), you MUST immediately reject it with this exact response:
        "The requested topic falls outside the current context of corporate supply chain risk intelligence. Please query delivery dynamics, financial stability/instability, compliance protocols, historical risk trajectories, or brand social narratives."
      
      CRITICAL DIRECTIVE ON PRECISION & SPECIFICITY:
      - While answering allowed topics, NO unnecessary values, conversational fluff, or filler text should be generated.
      - The response MUST be extremely short, concise, and straight to the point (no more than 3 bullet points or 100 words).
      - Any greeting (e.g. "Sure!", "Hello", "I can help with that"), conversational buffer, or generic summary concluding remarks must NOT be generated. 
      - Always answer the user's prompt directly, factually, and with professional precision.
      - When asked about historical data, delivery, finances, compliance, or social media narratives, be extremely vendor-specific, citing their exact risk scores and direct actionable advice verbatim, keeping the structure very concise.

      Core Guidelines:
      1. For questions about specific suppliers in the catalog, reference their real metrics, risk statuses, inventory buffers, and actionable insights with precision.
      2. For questions regarding global supply disruptions, fuel costs, climate events, or raw material prices, USE your Google Search tooling to obtain the latest real-time market signals.
      3. Always translate risk metrics into dynamic operational advice:
         - If inventory levels are 'Warning' or 'Critical', warn about potential stock-outs and suggest increasing buffers.
         - Propose backup suppliers, sourcing diversification, or financial hedging strategies.
         - Address financial losses proactively due to raw materials.
         - Address the user's specific query query in a completely dynamic, rich AI-generated format.
      4. Keep responses structured using markdown: use bullet points for clarity, bold text for key scores, and format insights nicely.
      5. Use the current year (2026) context for all search queries and timeline assessments.
    `;

    // Map conversation history to Gemini schema format
    const contents = [];
    
    // Add past history if present
    for (const h of history) {
      contents.push({
        role: h.sender === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }]
      });
    }

    // Add current user user message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    // Request Gemini with Search Tool enabled using recommended model 'gemini-3.5-flash'
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: contents,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
        temperature: 0.7,
      }
    });

    const responseText = response.text || 'I did not receive a structured response. Could you please rephrase?';

    // Extract grounding-metadata chunks
    const searchChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const groundingSources = searchChunks
      .filter((chunk: any) => chunk.web && chunk.web.uri)
      .map((chunk: any) => ({
        title: chunk.web.title || 'Source',
        url: chunk.web.uri
      }));

    res.json({
      success: true,
      text: responseText,
      groundingSources: groundingSources.length > 0 ? groundingSources : undefined,
    });

  } catch (error: any) {
    console.error('Chat API Error resolved via offline resiliency engine:', error);

    // Any remote exception (quota exhaustion, billing limits, invalid key, or timeout)
    // is instantly bypassed in favor of our high-fidelity, deterministic supply analyst fallback.
    console.log('Bypassing remote API error and activating local analyst reasoning engine...');
    try {
      const fallback = getFallbackResponse(message, selectedVendorId, vendors);
      return res.json({
        success: true,
        text: fallback.text,
        groundingSources: fallback.sources,
        fallbackActive: true
      });
    } catch (fallbackError: any) {
      console.error('Core local fallback failed:', fallbackError);
      return res.status(500).json({
        success: false,
        error: error.message || String(error) || 'Supply risk analysis service offline.'
      });
    }
  }
});

// Serve frontend assets
async function startServer() {
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
    console.log(`Supplier Risk Monitor Server running on http://localhost:${PORT}`);
  });
}

startServer();
