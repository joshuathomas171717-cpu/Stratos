import {
  StockMetrics,
  AgentDebate,
  VerificationResult,
  PeerComparisonData,
  RatedStockPreference,
  AiStockInsightResponse,
} from '../types';

export async function getMarketTicker(symbol: string): Promise<StockMetrics> {
  const response = await fetch(`/api/market/ticker/${encodeURIComponent(symbol)}`);
  const json = await response.json();
  if (!json.success) {
    throw new Error(json.error || `Failed to fetch ticker data for ${symbol}`);
  }
  return json.data;
}

export const fetchStockTelemetry = getMarketTicker;

export async function getBatchMarketTickers(tickers: string[]): Promise<Record<string, StockMetrics>> {
  const response = await fetch('/api/market/batch-tickers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tickers }),
  });
  const json = await response.json();
  if (!json.success) {
    throw new Error(json.error || 'Failed to fetch batch ticker data');
  }
  return json.data;
}

export async function getAgentDebate(metrics: StockMetrics): Promise<AgentDebate> {
  const response = await fetch('/api/stratos/agent-debate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ metrics }),
  });
  const json = await response.json();
  if (!json.success) {
    throw new Error(json.error || 'Failed to trigger agent debate corridor');
  }
  return json.debate;
}

export const generateAgentDebate = async (ticker: string, metrics: StockMetrics): Promise<AgentDebate> => {
  return getAgentDebate(metrics);
};

export async function verifyPortfolio(
  basket: Record<string, any>,
  totalBudget: number
): Promise<VerificationResult> {
  const response = await fetch('/api/stratos/verify-portfolio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ basket, totalBudget }),
  });
  const json = await response.json();
  if (!json.success) {
    throw new Error(json.error || 'Failed to execute portfolio verification matrix');
  }
  return json.verification;
}

export const runPortfolioVerification = verifyPortfolio;

export async function getPeerComparison(metrics: StockMetrics): Promise<PeerComparisonData> {
  const response = await fetch('/api/stratos/peer-comparison', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ metrics }),
  });
  const json = await response.json();
  if (!json.success) {
    throw new Error(json.error || 'Failed to fetch peer stock comparison');
  }
  return json.comparison;
}

export const fetchPeerComparison = getPeerComparison;

export async function getRefreshStockPreferences(excludeTickers: string[] = []): Promise<RatedStockPreference[]> {
  const response = await fetch('/api/stratos/stock-preferences', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ excludeTickers }),
  });
  const json = await response.json();
  if (!json.success) {
    throw new Error(json.error || 'Failed to refresh stock preferences');
  }
  return json.preferences;
}

export async function getAiStockChatbotInsight(
  ticker: string,
  message?: string,
  chatHistory?: any[]
): Promise<AiStockInsightResponse> {
  const response = await fetch('/api/ai-insight/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticker, message, chatHistory }),
  });
  const json = await response.json();
  if (!json.success) {
    throw new Error(json.error || 'Failed to fetch AI stock insight');
  }
  return json.insight;
}
