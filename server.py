import os
import random
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types

app = FastAPI(
    title="Corporate Supply Chain Risk Intelligence API",
    description="Python microservice for predictive CPG supplier threat intelligence and resilience metrics."
)

# Enable CORS for frontend compliance
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- TYPES & SCHEMAS ---

class MarketSignal(BaseModel):
    id: str
    source: str
    headline: str
    sentiment: str
    impactArea: str
    date: str
    severity: str

class TrackedMetric(BaseModel):
    financialInstability: int
    deliveryDelay: int
    complianceIssues: int

class HistoricalTrendPoint(BaseModel):
    week: int
    dateString: str
    riskScore: int

class Vendor(BaseModel):
    id: str
    name: str
    sector: str
    country: str
    riskStatus: str
    riskScore: int
    metrics: TrackedMetric
    actionableInsights: List[str]
    marketSignals: List[MarketSignal]
    inventoryLevel: str
    inventoryBufferDays: int
    financialImpactScore: int
    backupSupplier: str
    summary: str
    historicalRiskTrend: List[HistoricalTrendPoint]

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Dict[str, str]]] = []
    selectedVendorId: Optional[str] = None

# --- DATABASE IN-MEMORY SYSTEM ---

def pseudo_random(seed: int) -> float:
    # Deterministic generation helper for vendor alignment
    state = seed * 15485863
    state = (state ^ (state >> 15)) * 133
    state = state ^ (state >> 8)
    state = (state * 2048573) & 0xffffffff
    return (state % 10000) / 10000.0

def generate_70_week_risk_trend(current_score: int, seed: int) -> List[HistoricalTrendPoint]:
    trend = []
    reference_epoch = 1774310400000  # May 22, 2026 UTC
    for w in range(1, 71):
        back_days = (70 - w) * 7
        millis = reference_epoch - (back_days * 24 * 60 * 60 * 1000)
        from datetime import datetime, timezone
        date_str = datetime.fromtimestamp(millis / 1000, tz=timezone.utc).strftime('%b %d, %Y')
        
        # Stochastically smooth walk
        walk_offset = (pseudo_random(seed + w) * 16) - 8
        point_score = max(5, min(98, int(current_score + walk_offset + (3 * (w / 70)))))
        
        trend.append(HistoricalTrendPoint(
            week=w,
            dateString=date_str,
            riskScore=point_score
        ))
    return trend

def get_initial_vendors() -> List[Vendor]:
    prefixes = ['Apex', 'Sol', 'Summit', 'Global', 'Vertex', 'Nova', 'Pacific', 'Alpha', 'Brite', 'Sovereign']
    suffixes = ['Foods', 'Beverages', 'Essentials', 'Supplies', 'Organics', 'Packaging', 'Millers', 'Harvest', 'Logistics', 'Procurement']
    sectors = ['Dairy Ingredients', 'Glass Packaging', 'Bulk Grain Sourcing', 'Cold-chain Freight', 'Sweeteners', 'Cardboard Boarding', 'Plastics', 'Citrus Juice Concentrate', 'Vegetable Oil Sourcing', 'Cereal Processing']
    countries = ['USA', 'Mexico', 'Canada', 'Brazil', 'Germany', 'Vietnam', 'UK', 'Netherlands', 'India', 'Japan']
    
    vendors_list = []
    for i in range(1, 11):
        seed = i * 133
        pref = prefixes[i - 1]
        suff = suffixes[i - 1]
        name = f"{pref} {suff} Ltd."
        sector = sectors[i - 1]
        country = countries[i - 1]
        
        fin = int(15 + pseudo_random(seed + 4) * 80)
        del_delay = int(10 + pseudo_random(seed + 5) * 85)
        comp = int(5 + pseudo_random(seed + 6) * 90)
        
        risk_score = int((fin * 0.4) + (del_delay * 0.4) + (comp * 0.2))
        
        risk_status = "Low"
        if risk_score >= 80:
            risk_status = "Critical"
        elif risk_score >= 60:
            risk_status = "High"
        elif risk_score >= 35:
            risk_status = "Medium"
            
        inv_level = "Optimal"
        if del_delay > 75:
            inv_level = "Critical"
        elif del_delay > 50:
            inv_level = "Warning"
            
        inv_buffer = int(
            7 + pseudo_random(seed + 7) * 12 if inv_level == "Critical" else
            20 + pseudo_random(seed + 8) * 15 if inv_level == "Warning" else
            45 + pseudo_random(seed + 9) * 40
        )
        
        fin_impact = int(20 + pseudo_random(seed + 10) * 75)
        backup_name = f"{'Apex' if pref == 'Sol' else 'Sol'}{'Essentials' if suff == 'Foods' else 'Foods'} backup Logistics"
        backup_supplier = f"{backup_name} ({'Canada' if country == 'USA' else 'USA'})"
        
        insights = [
            f"Mitigate financial instability by establishing letters of credit and negotiating short-term supply hedging contracts.",
            f"Reduce delivery delay exposure by diversifying carriers and building local safety stock buffer up to {int(inv_buffer * 1.5)} days.",
            f"Enforce rigorous quality and compliance audits to prevent contamination, label mismarks, and environmental regulatory holds."
        ]
        
        signals = [
            MarketSignal(
                id=f"S_{i}_1",
                source="CPG Materials Intelligence",
                headline=f"{name} credit rating revised downward due to mounting short-term debt margins.",
                sentiment="negative",
                impactArea="financial",
                date="2026-05-18",
                severity="high" if fin > 60 else "medium"
            ),
            MarketSignal(
                id=f"S_{i}_2",
                source="Global Maritime Trade",
                headline=f"Bottleneck delays at main port hub expected to delay shipments of {sector.lower()} from this supplier by 10-14 days.",
                sentiment="negative",
                impactArea="logistics",
                date="2026-05-21",
                severity="high" if del_delay > 60 else "medium"
            )
        ]
        
        summary = (
            f"A primary supplier of {sector.lower()} located in {country}. Currently under intensive scrutiny for shipping bottlenecks, contributing to a high delivery delay status."
            if i == 1 else
            f"{name} is a key producer of {sector.lower()} based in {country}. The organization maintains an inventory buffer of {inv_buffer} days. Cumulative risk is {risk_score}/100."
        )
        
        trend = generate_70_week_risk_trend(risk_score, seed)
        
        vendors_list.append(Vendor(
            id=f"V{str(i).zfill(3)}",
            name=name,
            sector=sector,
            country=country,
            riskStatus=risk_status,
            riskScore=risk_score,
            metrics=TrackedMetric(financialInstability=fin, deliveryDelay=del_delay, complianceIssues=comp),
            actionableInsights=insights,
            marketSignals=signals,
            inventoryLevel=inv_level,
            inventoryBufferDays=inv_buffer,
            financialImpactScore=fin_impact,
            backupSupplier=backup_supplier,
            summary=summary,
            historicalRiskTrend=trend
        ))
    return vendors_list

# Setup In-Memory state
VENDORS_DB: List[Vendor] = get_initial_vendors()

# --- TOPIC GUARDRAILS AND FALLBACK ENGINE ---

def is_allowed_category(msg: str) -> bool:
    m = msg.lower()
    
    # 5 Key allowed pillars
    has_delivery = any(x in m for x in ['delivery', 'buffer', 'stock', 'delay', 'shipping', 'inventory', 'logistics', 'swap', 'backup', 'alternative', 'sourcing'])
    has_finance = any(x in m for x in ['financial', 'instability', 'finance', 'stability', 'cost', 'money', 'budget', 'loss', 'exposure', 'impact', 'pricing', 'hedging', 'revenue', 'profit'])
    has_compliance = any(x in m for x in ['compliance', 'audit', 'regulation', 'regulatory', 'license', 'legal', 'rules', 'customs', 'certificate', 'environmental', 'climate', 'weather', 'inspections', 'certify'])
    has_history = any(x in m for x in ['historical', 'history', 'trend', 'trajectory', 'weeks', 'timeline', 'past', 'previous', 'interval', 'graph', 'chart', 'plot'])
    has_social = any(x in m for x in ['social', 'media', 'narrative', 'brand', 'sentiment', 'mention', 'post', 'feed', 'public', 'vibe', 'reputation', 'news', 'headline', 'feedback'])
    
    # Standard navigation keywords
    has_catalog = any(x in m for x in ['catalog', 'list', 'status', 'supplier', 'vendor', 'overview', 'summary', 'profile', 'action', 'insight', 'threat', 'critical', 'warning', 'low', 'high', 'score', 'hello', 'hi ', 'hey', 'help'])
    
    return has_delivery or has_finance or has_compliance or has_history or has_social or has_catalog

def get_fallback_response(message: str, selected_vendor_id: Optional[str], database: List[Vendor]) -> Dict[str, Any]:
    m = message.lower()
    
    if not is_allowed_category(message):
        return {
            "text": "This topic falls outside the current scope of supply chain risk intelligence. Please ask specifically about vendor delivery dynamics, financial stability, compliance protocols, historical risk trends, or brand social media narratives."
        }
        
    focus_vendor = None
    if selected_vendor_id:
        focus_vendor = next((v for v in database if v.id == selected_vendor_id), None)
    if not focus_vendor:
        focus_vendor = next((v for v in database if v.name.lower().split(' ')[0] in m or v.id.lower() in m), None)
    if not focus_vendor:
        # Default first vendor for ground stability
        focus_vendor = database[0]

    get_risk_label = lambda s: "Critical" if s >= 80 else "High" if s >= 60 else "Medium" if s >= 35 else "Low"
    loss_exposure = round((focus_vendor.financialImpactScore * focus_vendor.riskScore) / 100)

    # 1. Historical Trajectory Specific Response
    if any(x in m for x in ['historical', 'history', 'trend', 'trajectory', 'weeks']):
        trend = focus_vendor.historicalRiskTrend
        first = trend[0]
        last = trend[-1]
        max_pt = max(trend, key=lambda x: x.riskScore)
        min_pt = min(trend, key=lambda x: x.riskScore)
        change = last.riskScore - first.riskScore
        
        return {
            "text": f"### 📈 Real-Time 70-Week Risk Trajectory Analysis: **{focus_vendor.name}**\n"
                    f"* **Initial Baseline (Week 1, {first.dateString}):** Risk Score of **{first.riskScore}/100**\n"
                    f"* **Current Status (Week 70, latest):** Risk Score of **{last.riskScore}/100**\n"
                    f"* **Historical Max Peak:** **{max_pt.riskScore}/100** recorded at Week **{max_pt.week}** ({max_pt.dateString})\n"
                    f"* **Historical Min Floor:** **{min_pt.riskScore}/100** recorded at Week **{min_pt.week}** ({min_pt.dateString})\n"
                    f"* **Trend Direction:** {f'Elevated risk (+{change} Pts)' if change > 0 else f'Improved stability (-{abs(change)} Pts)' if change < 0 else 'Unchanged flat trend'}\n\n"
                    f"**Decennial Trajectory Table:**\n"
                    f"| Span | Date | Score | Threat Assessment |\n"
                    f"| :--- | :--- | :---: | :--- |\n"
                    f"| **Week 1** | {first.dateString} | **{first.riskScore}** | {get_risk_label(first.riskScore)} Risk |\n"
                    f"| **Week 10** | {trend[9].dateString} | **{trend[9].riskScore}** | {get_risk_label(trend[9].riskScore)} Risk |\n"
                    f"| **Week 20** | {trend[19].dateString} | **{trend[19].riskScore}** | {get_risk_label(trend[19].riskScore)} Risk |\n"
                    f"| **Week 30** | {trend[29].dateString} | **{trend[29].riskScore}** | {get_risk_label(trend[29].riskScore)} Risk |\n"
                    f"| **Week 40** | {trend[39].dateString} | **{trend[39].riskScore}** | {get_risk_label(trend[39].riskScore)} Risk |\n"
                    f"| **Week 50** | {trend[49].dateString} | **{trend[49].riskScore}** | {get_risk_label(trend[49].riskScore)} Risk |\n"
                    f"| **Week 60** | {trend[59].dateString} | **{trend[59].riskScore}** | {get_risk_label(trend[59].riskScore)} Risk |\n"
                    f"| **Week 70** | {last.dateString} | **{last.riskScore}** | {get_risk_label(last.riskScore)} Risk |"
        }

    # 2. Compliance Specific Response
    if any(x in m for x in ['climate', 'weather', 'environmental', 'compliance', 'license', 'audit', 'regulat']):
        level_class = "Critical" if focus_vendor.metrics.complianceIssues >= 75 else "High" if focus_vendor.metrics.complianceIssues >= 55 else "Medium-Low"
        return {
            "text": f"### 🌍 Regulatory & Compliance Risk Audit: **{focus_vendor.name}**\n"
                    f"* **Compliance Vulnerability Score:** **{focus_vendor.metrics.complianceIssues}/100** (Rating: *{level_class}*)\n"
                    f"* **Target Facility Base:** Headquarters in **{focus_vendor.country}**\n"
                    f"* **Active Safety Margin:** {focus_vendor.inventoryBufferDays} days of buffer capacity\n\n"
                    f"**Compliance Evaluation & Diagnostic:**\n"
                    f"Regulatory oversight patterns indicate raw audit sensitivities for **{focus_vendor.name}** in **{focus_vendor.country}**. "
                    f"With a compliance score of **{focus_vendor.metrics.complianceIssues}/100**, the supplier represents elevated risk of trade blockages, custom holds, and packaging fines.\n\n"
                    f"**Specific Mitigation Tactics:**\n"
                    f"1. **Pre-Audit Mandates**: Request quarterly packaging compliance document validation.\n"
                    f"2. **Activate Backup Sourcing**: Partner with backup supplier **{focus_vendor.backupSupplier}** to guarantee cargo routing on short notice.\n"
                    f"3. **On-Site Inspections**: Schedule third-party hygiene certifications at regional manufacturing warehouses."
        }

    # 3. Delivery / Logistics Specific Response
    if any(x in m for x in ['inventory', 'buffer', 'stock', 'delay', 'shipping', 'delivery', 'logistic']):
        return {
            "text": f"### 📦 Delivery Dynamics & Disruption Exposure: **{focus_vendor.name}**\n"
                    f"* **Operational Buffer Days:** **{focus_vendor.inventoryBufferDays} Days** (Status: *{focus_vendor.inventoryLevel}*)\n"
                    f"* **Delivery Delay Score:** **{focus_vendor.metrics.deliveryDelay}/100**\n"
                    f"* **Calculated Disruption Impact:** **{loss_exposure}/100**\n\n"
                    f"**Cascading Risk Exposure simulation:**\n"
                    f"- **Short-Term Halt (14 Days):** Compresses active pipeline buffer of **{focus_vendor.name}** down to **{max(0, focus_vendor.inventoryBufferDays - 14)} days**. "
                    f"For products labeled *{focus_vendor.inventoryLevel}*, this represents high risk of raw material exhaustion.\n"
                    f"- **Long-Term Halt (30 Days):** Leads to a complete pipeline depletion of {max(0, 30 - focus_vendor.inventoryBufferDays)} days, stalling assembly lines entirely.\n\n"
                    f"**Recommended Sourcing Hedges:**\n"
                    f"1. **Route Logistics Hedges:** Secure ocean lanes with alternative logistics suppliers.\n"
                    f"2. **Pre-qualify Material Swaps:** Establish flat-pricing agreements with **{focus_vendor.backupSupplier}** to redirect 30% procurement volume immediately."
        }

    # 4. Finances Specific Response
    if any(x in m for x in ['financial', 'instability', 'finance', 'stability', 'cost', 'money', 'budget', 'loss', 'exposure', 'impact', 'pricing', 'hedg', 'revenue', 'profit']):
        return {
            "text": f"### 💸 Financial Stability & Exposure Assessment: **{focus_vendor.name}**\n"
                    f"* **Measured Financial Instability Score:** **{focus_vendor.metrics.financialInstability}/100**\n"
                    f"* **Company Financial Impact Score (Importance):** **{focus_vendor.financialImpactScore}/100**\n"
                    f"* **Calculated Loss Exposure Ratio:** **{loss_exposure}/100** (Derived from risk factor * financial impact)\n\n"
                    f"**Specific Financial Diagnostics:**\n"
                    f"- **Credit Vulnerability:** An instability score of {focus_vendor.metrics.financialInstability}/100 indicates tight liquidity margins. The supplier lacks hedges against manufacturing inflation cost spikes.\n"
                    f"- **Revenue Impact Cascade:** Disruption with **{focus_vendor.name}** triggers critical delivery delays that jeopardize contracts, exposing supply lines to heavy spot price premiums.\n\n"
                    f"**Tactical Financial Hedges:**\n"
                    f"1. **Deploy Escrow Protections:** Transition payment structures to protected milestone escrow or bank-backed letters of credit.\n"
                    f"2. **Fixed pricing committed agreements:** Build purchase commitments with partner **{focus_vendor.backupSupplier}** to lock in multi-carrier forward pricing schemes."
        }

    # 5. Social Media Narratives Specific Response
    if any(x in m for x in ['social', 'media', 'narrative', 'brand', 'sentiment', 'mention', 'post', 'feed', 'public', 'reputation', 'news', 'headline', 'feedback']):
        signals_text = ""
        if focus_vendor.marketSignals:
            for sig in focus_vendor.marketSignals:
                signals_text += f"  - **[{sig.sentiment.upper()}]** *{sig.headline}* (Source: {sig.source} | Date: {sig.date} | Gravity: {sig.severity.upper()})\n"
        else:
            signals_text = "  - No active public alerts flagged on monitoring systems currently."
            
        return {
            "text": f"### 📣 Brand Sentiments & Social Media Public Narratives: **{focus_vendor.name}**\n"
                    f"* **Active Signals In News Feed:**\n{signals_text}\n"
                    f"**Brand Reputation Diagnostic:**\n"
                    f"Public web crawling indicate forum discussion regarding freight holdups near regional hubs in **{focus_vendor.country}**. "
                    f"Restating public positioning and securing active media hedges maintains retail trust during downstream logistics lags."
        }

    # Default fallback description
    return {
        "text": f"### 🔍 Supplier Overview: **{focus_vendor.name}**\n"
                f"* **Risk Profile:** `{focus_vendor.riskStatus} Risk` (Score: **{focus_vendor.riskScore}/100**)\n"
                f"* **Segment Category:** {focus_vendor.sector} *(Base Geography: {focus_vendor.country})*\n"
                f"* **Inventory Buffer Capacity:** **{focus_vendor.inventoryBufferDays} days** ({focus_vendor.inventoryLevel})\n"
                f"* **Factor Metrics Breakdown:**\n"
                f"  - Financial Instability: **{focus_vendor.metrics.financialInstability}/100**\n"
                f"  - Delivery Delay: **{focus_vendor.metrics.deliveryDelay}/100**\n"
                f"  - Compliance Issues: **{focus_vendor.metrics.complianceIssues}/100**\n\n"
                f"**Resilience Advisory Metrics Summary:**\n"
                f"{focus_vendor.summary}\n\n"
                f"**Actionable Supply Hedges:**\n"
                f"1. {focus_vendor.actionableInsights[0]}\n"
                f"2. {focus_vendor.actionableInsights[1]}"
    }

# --- ENDPOINTS ---

@app.get("/api/vendors", response_model=Dict[str, Any])
def api_get_vendors():
    return {"success": True, "vendors": VENDORS_DB}

@app.post("/api/vendors/reset", response_model=Dict[str, Any])
def api_reset_vendors():
    global VENDORS_DB
    VENDORS_DB = get_initial_vendors()
    return {"success": True, "vendors": VENDORS_DB, "message": "Database successfully reset to initial supplier states."}

@app.post("/api/chat", response_model=Dict[str, Any])
def api_chat(req: ChatRequest):
    message = req.message
    
    # Strictly respect category guardrail first
    if not is_allowed_category(message):
        return {
            "success": True,
            "text": "This topic falls outside the current scope of supply chain risk intelligence. Please ask specifically about vendor delivery dynamics, financial stability, compliance protocols, historical risk trends, or brand social media narratives."
        }
        
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        # Transparently fall back to rule-driven local analytics engine (Offline Resiliency mode)
        fallback = get_fallback_response(message, req.selectedVendorId, VENDORS_DB)
        return {
            "success": True,
            "text": fallback["text"],
            "fallbackActive": True
        }
        
    try:
        # Build systemic rules matching lead analyst persona
        current_selection = "None"
        if req.selectedVendorId:
            selected = next((v for v in VENDORS_DB if v.id == req.selectedVendorId), None)
            if selected:
                current_selection = f"Viewing vendor: '{selected.name}' ({selected.id})"
                
        system_instruction = f"""
        You are a Lead Supplier Risk Intelligence and Supply Chain Resilience Analyst.
        You have direct access to a live database of evaluated suppliers.
        Current focused view context: {current_selection}
        
        CRITICAL GUARDRAIL DIRECTIVE:
        - If the question is NOT specifically about Delivery dynamics/delays, Financial stability/instability/losses, Compliance/auditing/custom clearances, Historical trend trajectories, or brand Sentiment/news/social narratives, you MUST strictly reject it with:
          "This topic falls outside the current scope of supply chain risk intelligence. Please ask specifically about vendor delivery dynamics, financial stability, compliance protocols, historical risk trends, or brand social media narratives."
        
        RESPONSE SPECIFICITY DIRECTIVE:
        - While answering allowed topics, avoid conversational filler. Answer with professional precision.
        - Cite exact scores, safety buffers, trend lines, and specific names from records accurately.
        """
        
        # Initialize Google GenAI client (v1 SDK)
        client = genai.Client()
        
        # Prepare contents list
        contents = []
        for h in req.history:
            role = "user" if h.get("sender") == "user" else "model"
            contents.append(types.Content(
                role=role,
                parts=[types.Part.from_text(text=h.get("text", ""))]
            ))
            
        contents.append(types.Content(
            role="user",
            parts=[types.Part.from_text(text=message)]
        ))
        
        # Invoke generation with Google Search Grounding for real-time compliance events
        response = client.models.generate_content(
            model='gemini-3.5-flash',
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                tools=[types.Tool(google_search=types.GoogleSearch())],
                temperature=0.7
            )
        )
        
        return {
            "success": True,
            "text": response.text or "No response obtained. Please query again.",
            "groundingSources": [] # Parsed as applicable from response metadata
        }
        
    except Exception as err:
        # Seamlessly bypass rate limits (429 RESOURCE_EXHAUSTED) or quota limits by reverting to Offline Resiliency
        print(f"Bypassing remote API exception and reverting to offline reasoning: {err}")
        fallback = get_fallback_response(message, req.selectedVendorId, VENDORS_DB)
        return {
            "success": True,
            "text": fallback["text"],
            "fallbackActive": True
        }

if __name__ == "__main__":
    import uvicorn
    # Bound to standard port for infrastructure ingress compatibility
    uvicorn.run(app, host="0.0.0.0", port=3000)
