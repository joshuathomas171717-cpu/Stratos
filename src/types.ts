export interface CandlePoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sma20?: number;
  rsi?: number;
}

export interface FactorBreakdown {
  sharpeRatio: number;
  sectorZScore: number;
  sectorAveragePE: number;
  valuationScore: number;
  momentumScore: number;
  qualityScore: number;
  growthScore?: number;
  riskScore?: number;
  sectorName: string;
}

export interface AtrRiskManagement {
  atr14: number;
  atrPercent: number;
  stopLoss: number;
  trailingStop: number;
  takeProfit1: number;
  takeProfit2: number;
  riskRewardRatio: string;
  maxRecommendedShares: number;
}

export interface StockMetrics {
  ticker: string;
  name: string;
  price: number;
  currency: string;
  trailingPE: number | null;
  forwardPE: number | null;
  rsi14: number;
  sma20: number;
  volatility: number;
  quantScore: number;
  compositeScore?: number;
  dataConfidence?: 'high' | 'medium' | 'low';
  missingPillars?: string[];
  pillars?: {
    valuation?: { score: number | null; factors: Record<string, any> };
    quality?: { score: number | null; factors: Record<string, any> };
    growth_revisions?: { score: number | null; factors: Record<string, any> };
    momentum?: { score: number | null; factors: Record<string, any> };
    risk?: { score: number | null; factors: Record<string, any> };
  };
  profile?: string;
  week52High: number;
  week52Low: number;
  marketCap: string;
  headlines: string[];
  history: CandlePoint[];
  updatedAt: string;
  dataSource?: 'live' | 'simulated';
  score2D?: Score2DResult;
  factorBreakdown?: FactorBreakdown;
  atrRisk?: AtrRiskManagement;
}

export type QuadrantTier =
  | 'Core Holding'
  | 'Speculative Growth'
  | 'Value / Contrarian Watch'
  | 'Avoid'
  | 'Insufficient Data';

export interface GraduatedMetricScore {
  name: string;
  category: 'risk_anchor' | 'quality';
  rawValue: number | null;
  displayValue: string;
  pointsEarned: number;
  maxPoints: number;
  formulaDescription: string;
  flags: string[];
}

export interface RiskAnchorBreakdown {
  score: number; // 0 - 10
  isSolvent: boolean; // score >= 7.0
  netDebtEbitda: GraduatedMetricScore;
  interestCoverage: GraduatedMetricScore;
  positiveOcfYears: GraduatedMetricScore;
  beta: GraduatedMetricScore;
  marginStability: GraduatedMetricScore;
}

export interface QualityScoreBreakdown {
  score: number; // 0 - 10
  isHighQuality: boolean; // score >= 7.0
  grossMargin: GraduatedMetricScore;
  roic: GraduatedMetricScore;
  fcfToNetIncome: GraduatedMetricScore;
  pegRatio: GraduatedMetricScore;
  revenueCagr3Yr: GraduatedMetricScore;
}

export interface Score2DResult {
  ticker: string;
  quality: number; // 0 - 10
  riskAnchor: number; // 0 - 10
  positionTier: QuadrantTier;
  verdictLabel: string;
  tierColor: string;
  tierBg: string;
  tierBorder: string;
  tierDescription: string;
  isSpeculativeFlag: boolean;
  missingMetricCount?: number;
  flags: string[];
  riskAnchorBreakdown: RiskAnchorBreakdown;
  qualityBreakdown: QualityScoreBreakdown;
  calculatedAt: string;
}

export interface AgentDebate {
  bullThesis: string;
  bearCritic: string;
  generatedAt: string;
}

export interface VerifiedAsset {
  ticker: string;
  name: string;
  price: number;
  score: number;
  pe: string;
  weightPercent: number;
  allocationDollars: number;
  sharesToBuy: number;
}

export interface VerificationResult {
  verifiedAssets: VerifiedAsset[];
  rejectedAssets: Record<string, string>;
  totalBudget: number;
  aiAuditReport: string;
  generatedAt: string;
}

export interface PeerStock {
  ticker: string;
  name: string;
  price: number;
  quantScore: number;
  pe: string;
  forwardPe: string;
  rsi: number;
  scoreAdvantage: number;
  comparisonAdvantage: string;
}

export interface PeerComparisonData {
  targetTicker: string;
  targetScore: number;
  targetPrice: number;
  targetPe: string;
  peersWithHigherRatings: PeerStock[];
  summaryNote: string;
}

export interface RatedStockPreference {
  ticker: string;
  name: string;
  price: number;
  quantScore: number;
  pe: string;
  rsi: number;
  sectorName: string;
  ratingBadge: string;
  sharpeRatio?: number;
}

export interface SimilarStockRecommendation {
  ticker: string;
  name: string;
  price: number;
  quantScore: number;
  pe: string;
  reason: string;
  sectorName?: string;
}

export interface AiStockInsightResponse {
  ticker: string;
  answer: string;
  currentStockGrowth: string;
  futureProjection: string;
  similarStocks: SimilarStockRecommendation[];
  isGeneralQuery?: boolean;
  generatedAt: string;
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  ticker?: string;
  insightResponse?: AiStockInsightResponse;
  timestamp: string;
}

export interface WorkspaceSession {
  id: string;
  name: string;
  timestamp: string;
  basket: Record<string, {
    name: string;
    price: number;
    score: number;
    pe: string;
    forwardPe: string;
    rsi: number;
  }>;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    tickerTarget?: string;
    metrics?: StockMetrics;
    debate?: AgentDebate;
    timestamp: string;
  }>;
}

export interface TopRegionalAsset {
  ticker: string;
  name: string;
  price: number;
  currencySymbol: string;
  currencyCode: string;
  changePercent: number;
  changeAmount: number;
  quantScore: number;
  volume: string;
  marketCapOrOpenInterest: string;
  region: 'USA' | 'EUROPE' | 'INDIA' | 'CRYPTO' | 'FUTURES';
  sectorOrType: string;
  dayHigh: number;
  dayLow: number;
  rsi: number;
  pe?: string;
  badge?: string;
}
