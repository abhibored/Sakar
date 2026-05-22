import { Vendor, MarketSignal } from './types';

// Let's create a list of CPG-focused countries, sectors, and namings
const COUNTRIES = [
  'USA', 'Chile', 'Germany', 'India', 'Japan', 'Canada', 'Mexico', 'UK', 
  'Brazil', 'France', 'South Korea', 'Vietnam', 'Australia', 'Switzerland', 
  'South Africa', 'Indonesia', 'Thailand', 'Netherlands', 'Italy', 'Malaysia'
];

const SECTORS = [
  'Packaged Foods & Snacks',
  'Beverage Bottling & Brewing',
  'Cosmetics & Personal Care',
  'Household Cleaning & Hygiene',
  'Sustainable CPG Packaging',
  'Agricultural Materials & Oils',
  'CPG Cold-Chain Logistics',
  'Apparel & Consumer Linens'
];

const PREFIXES = [
  'Sol', 'Nature', 'Apex', 'Global', 'Bio', 'Eco', 'Pure', 'Fresh', 'Orga', 'Clear',
  'Prime', 'Green', 'Summit', 'Pacific', 'Valley', 'Vita', 'Nova', 'Terra', 'Hydro', 'Aura',
  'Crown', 'Alpine', 'Horizon', 'True', 'Sun', 'Vast', 'Royal', 'Silk', 'Urban', 'Velvet'
];

const SUFFIXES = [
  'Foods', 'Beverages', 'Packaging', 'Organics', 'Clean', 'Nutrition', 'Essentials', 'Bottlers',
  'Cosmetics', 'Grains', 'Farms', 'Naturals', 'Logistics', 'Millers', 'Can & Glass', 'Care',
  'Soapworks', 'Hedges', 'Laboratories', 'Pack', 'Industries', 'Supplies', 'Sources'
];

function pseudoRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function generate70WeekRiskTrend(targetScore: number, seed: number): { week: number; dateString: string; riskScore: number }[] {
  const trend: { week: number; dateString: string; riskScore: number }[] = [];
  
  // Starting point for a random walk, slightly deviated
  const startDev = (pseudoRandom(seed + 15) - 0.5) * 26;
  const startScore = Math.max(10, Math.min(95, Math.round(targetScore + startDev)));
  
  const currentDate = new Date('2026-05-22');
  
  for (let w = 1; w <= 70; w++) {
    const weeksAgo = 70 - w;
    const date = new Date(currentDate.getTime());
    date.setDate(date.getDate() - (weeksAgo * 7));
    
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    const dateString = `${month} ${day}`;
    
    let score = targetScore;
    if (w < 70) {
      // Lerp starting to target plus fine-tuned walk noise
      const progress = w / 70;
      const base = startScore + (targetScore - startScore) * progress;
      const walkNoise = (pseudoRandom(seed + w) - 0.5) * 8;
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

function generateCPGVendors(): Vendor[] {
  const list: Vendor[] = [];

  for (let i = 1; i <= 200; i++) {
    const seed = i * 17 + 5;
    
    // Choose sector and country deterministically based on seed
    const sector = SECTORS[Math.floor(pseudoRandom(seed) * SECTORS.length)];
    const country = COUNTRIES[Math.floor(pseudoRandom(seed + 1) * COUNTRIES.length)];
    
    // Build unique company names
    const pref = PREFIXES[Math.floor(pseudoRandom(seed + 2) * PREFIXES.length)];
    const suff = SUFFIXES[Math.floor(pseudoRandom(seed + 3) * SUFFIXES.length)];
    const name = `${pref}${suff} ${i % 3 === 0 ? 'Ltd.' : i % 2 === 0 ? 'Corp.' : 'S.A.'}`;

    // Generate factors
    const financialInstability = Math.round(15 + pseudoRandom(seed + 4) * 80); // 15 to 95
    const deliveryDelay = Math.round(10 + pseudoRandom(seed + 5) * 85);       // 10 to 95
    const complianceIssues = Math.round(5 + pseudoRandom(seed + 6) * 90);       // 5 to 95

    // Overall score as weighted average
    const riskScore = Math.round((financialInstability * 0.4) + (deliveryDelay * 0.4) + (complianceIssues * 0.2));
    
    let riskStatus: Vendor['riskStatus'] = 'Low';
    if (riskScore >= 80) riskStatus = 'Critical';
    else if (riskScore >= 60) riskStatus = 'High';
    else if (riskScore >= 35) riskStatus = 'Medium';

    const inventoryLevel: Vendor['inventoryLevel'] = 
      deliveryDelay > 75 ? 'Critical' : 
      deliveryDelay > 50 ? 'Warning' : 'Optimal';
      
    const inventoryBufferDays = Math.round(
      inventoryLevel === 'Critical' ? 7 + pseudoRandom(seed + 7) * 12 :
      inventoryLevel === 'Warning' ? 20 + pseudoRandom(seed + 8) * 15 :
      45 + pseudoRandom(seed + 9) * 40
    );

    const financialImpactScore = Math.round(20 + pseudoRandom(seed + 10) * 75);

    // Dynamic Backup selection
    const backupName = `${pref === 'Sol' ? 'Apex' : 'Sol'}${suff === 'Foods' ? 'Essentials' : 'Foods'} backup Logistics`;
    const backupSupplier = `${backupName} (${country === 'USA' ? 'Canada' : 'USA'})`;

    // Actionable insights specific to CPG and the three factors
    const actionableInsights = [
      `Mitigate financial instability by establishing letters of credit and negotiating short-term supply hedging contracts.`,
      `Reduce delivery delay exposure by diversifying carriers and building local safety stock buffer up to ${Math.round(inventoryBufferDays * 1.5)} days.`,
      `Enforce rigorous quality and compliance audits to prevent contamination, label mismarks, and environmental regulatory holds.`
    ];

    // Market Signals based on factors
    const marketSignals: MarketSignal[] = [
      {
        id: `S_${i}_1`,
        source: 'CPG Materials Intelligence',
        headline: `${name} credit rating revised downward due to mounting short-term debt margins.`,
        sentiment: 'negative',
        impactArea: 'financial',
        date: '2026-05-18',
        severity: financialInstability > 60 ? 'high' : 'medium'
      },
      {
        id: `S_${i}_2`,
        source: 'Global Maritime Trade',
        headline: `Bottleneck delays at main port hub expected to delay shipments of ${sector.toLowerCase()} from this supplier by 10-14 days.`,
        sentiment: 'negative',
        impactArea: 'logistics',
        date: '2026-05-21',
        severity: deliveryDelay > 60 ? 'high' : 'medium'
      }
    ];

    const summary = i === 1 
      ? `A primary supplier of ${sector.toLowerCase()} located in ${country}. Currently under intensive scrutiny for shipping bottlenecks, contributing to a high delivery delay status. This is paired with elevated financial instability indices, posing moderate disruption threats to upstream retail channels.`
      : `${name} is a key producer of ${sector.toLowerCase()} based in ${country}. The organization maintains an inventory buffer of ${inventoryBufferDays} days. Comprehensive auditing reveals a cumulative risk score of ${riskScore}/100, driven by primary indicators in financial parameters, delivery delay vulnerability, and regulatory compliance rules.`;

    const historicalRiskTrend = generate70WeekRiskTrend(riskScore, seed);

    list.push({
      id: `V${String(i).padStart(3, '0')}`,
      name,
      sector,
      country,
      riskStatus,
      riskScore,
      metrics: {
        financialInstability,
        deliveryDelay,
        complianceIssues
      },
      actionableInsights,
      marketSignals,
      inventoryLevel,
      inventoryBufferDays,
      financialImpactScore,
      backupSupplier,
      summary,
      historicalRiskTrend
    });
  }

  return list;
}

export const INITIAL_VENDORS = generateCPGVendors();
