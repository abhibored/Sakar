export interface RiskMetrics {
  financialInstability: number; // 0-100
  deliveryDelay: number; // 0-100
  complianceIssues: number; // 0-100
}

export interface HistoricalTrendPoint {
  week: number;
  dateString: string;
  riskScore: number;
}

export interface MarketSignal {
  id: string;
  source: string;
  headline: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  impactArea: 'financial' | 'logistics' | 'production' | 'geopolitical' | 'environmental';
  date: string;
  severity: 'low' | 'medium' | 'high';
}

export interface Vendor {
  id: string;
  name: string;
  sector: string;
  country: string;
  riskStatus: 'Low' | 'Medium' | 'High' | 'Critical';
  riskScore: number; // 0-100 (higher means more risk)
  metrics: RiskMetrics;
  actionableInsights: string[];
  marketSignals: MarketSignal[];
  inventoryLevel: 'Optimal' | 'Warning' | 'Critical';
  inventoryBufferDays: number;
  financialImpactScore: number; // 0-100
  backupSupplier: string;
  summary: string;
  historicalRiskTrend: HistoricalTrendPoint[];
}

export interface GroundingSource {
  title: string;
  url: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  groundingSources?: GroundingSource[];
  isRiskAssessment?: boolean;
  assessmentData?: {
    vendorId?: string;
    riskScore?: number;
    mitigationSteps?: string[];
  };
}
