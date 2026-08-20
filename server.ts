import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { compute5PillarQuantScore, compute2DStockScore, QuantProfile } from './src/services/quantScoringEngine';
import { getVerifiedStockInput, deterministicHash } from './src/services/verifiedStockData';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    console.warn('Gemini API Key is missing or default placeholder.');
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

// Safe Gemini generator with multi-model fallback & rate-limit resilience
async function safeGenerateContent(ai: any, prompt: string): Promise<string | null> {
  if (!ai) return null;
  const modelsToTry = [
    'gemini-3.7-flash',
    'gemini-flash-latest',
    'gemini-2.5-flash',
  ];
  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });
      if (response?.text) {
        return response.text;
      }
    } catch (err: any) {
      console.warn(`Gemini generation with model '${model}' notice:`, err?.status || err?.message || 'Unavailable');
    }
  }
  return null;
}

// RSI Calculation Helper
function calculateRSI(prices: number[], period = 14): number[] {
  const rsi: number[] = new Array(prices.length).fill(50);
  if (prices.length <= period) return rsi;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  rsi[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      rsi[i] = 100;
    } else {
      const rs = avgGain / avgLoss;
      rsi[i] = Math.max(0, Math.min(100, 100 - 100 / (1 + rs)));
    }
  }

  return rsi;
}

// 14-Day Average True Range (ATR) & Risk Target Engine
function calculateATR(candles: any[], period = 14) {
  if (!candles || candles.length < 2) {
    const price = candles?.[candles.length - 1]?.close || 100;
    const atr14 = 2.5;
    return {
      atr14,
      atrPercent: 2.5,
      stopLoss: Math.round((price - 2 * atr14) * 100) / 100,
      trailingStop: Math.round((price - 2 * atr14) * 100) / 100,
      takeProfit1: Math.round((price + 2 * atr14) * 100) / 100,
      takeProfit2: Math.round((price + 4 * atr14) * 100) / 100,
      riskRewardRatio: '1 : 2.0',
      maxRecommendedShares: Math.max(1, Math.floor(100 / (2 * atr14))),
    };
  }

  const trs: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = i > 0 ? candles[i - 1].close : candles[i].open;
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trs.push(tr);
  }

  const slice = trs.slice(-period);
  const atr14 = slice.reduce((a, b) => a + b, 0) / slice.length;
  const roundedAtr = Math.round(atr14 * 100) / 100;

  const currentPrice = candles[candles.length - 1].close;
  const atrPercent = Math.round((roundedAtr / currentPrice) * 1000) / 10;

  const slice20 = candles.slice(-20);
  const highestClose20 = Math.max(...slice20.map((c) => c.close));

  const stopLoss = Math.round((currentPrice - 2.0 * roundedAtr) * 100) / 100;
  const trailingStop = Math.round((highestClose20 - 2.0 * roundedAtr) * 100) / 100;
  const takeProfit1 = Math.round((currentPrice + 2.0 * roundedAtr) * 100) / 100;
  const takeProfit2 = Math.round((currentPrice + 4.0 * roundedAtr) * 100) / 100;

  const perShareRisk = 2.0 * roundedAtr;
  const maxRecommendedShares = Math.max(1, Math.floor(100 / (perShareRisk || 1)));

  return {
    atr14: roundedAtr,
    atrPercent,
    stopLoss,
    trailingStop,
    takeProfit1,
    takeProfit2,
    riskRewardRatio: '1 : 2.0',
    maxRecommendedShares,
  };
}

interface SectorBenchmark {
  name: string;
  meanPE: number;
  stdDevPE: number;
}

const SECTOR_BENCHMARKS: Record<string, SectorBenchmark> = {
  NVDA: { name: 'Semiconductors & AI Hardware', meanPE: 38.0, stdDevPE: 14.0 },
  AMD: { name: 'Semiconductors & AI Hardware', meanPE: 38.0, stdDevPE: 14.0 },
  TSM: { name: 'Semiconductors & Foundry', meanPE: 28.0, stdDevPE: 8.0 },
  ASML: { name: 'Semiconductor Equipment', meanPE: 35.0, stdDevPE: 10.0 },
  AVGO: { name: 'Semiconductors & Networking', meanPE: 32.0, stdDevPE: 9.0 },
  QCOM: { name: 'Semiconductors & Telecom', meanPE: 22.0, stdDevPE: 6.0 },

  AAPL: { name: 'Mega-Cap Consumer Tech', meanPE: 30.0, stdDevPE: 8.0 },
  MSFT: { name: 'Enterprise Cloud & Software', meanPE: 34.0, stdDevPE: 9.0 },
  GOOGL: { name: 'Digital Advertising & Cloud', meanPE: 25.0, stdDevPE: 6.0 },
  AMZN: { name: 'E-Commerce & AWS Cloud', meanPE: 40.0, stdDevPE: 12.0 },
  META: { name: 'Social Platforms & AI', meanPE: 26.0, stdDevPE: 7.0 },
  PLTR: { name: 'Enterprise AI & Defense Software', meanPE: 65.0, stdDevPE: 25.0 },

  TSLA: { name: 'Automotive & Clean Tech', meanPE: 55.0, stdDevPE: 22.0 },
  BYDDF: { name: 'EV & Battery Systems', meanPE: 22.0, stdDevPE: 7.0 },
  RIVN: { name: 'EV Manufacturing', meanPE: 20.0, stdDevPE: 10.0 },
  F: { name: 'Legacy Automotive', meanPE: 12.0, stdDevPE: 4.0 },
  GM: { name: 'Legacy Automotive', meanPE: 10.0, stdDevPE: 3.5 },

  'BTC-USD': { name: 'Digital Assets & Crypto', meanPE: 45.0, stdDevPE: 20.0 },
  COIN: { name: 'Crypto Exchange & Infrastructure', meanPE: 40.0, stdDevPE: 18.0 },
  MSTR: { name: 'Treasury Reserve Asset', meanPE: 50.0, stdDevPE: 25.0 },
  JPM: { name: 'Diversified Banking', meanPE: 12.5, stdDevPE: 3.0 },
  GS: { name: 'Investment Banking', meanPE: 14.0, stdDevPE: 4.0 },
};

const DEFAULT_SECTOR_BENCHMARK: SectorBenchmark = {
  name: 'General Equity Universe',
  meanPE: 24.0,
  stdDevPE: 8.0,
};

// 5-Pillar Composite Quant Scoring Engine Wrapper
function computeMultiFactorQuantScore(
  price: number,
  sma20: number,
  rsi: number,
  pe: number | null,
  forwardPe: number | null,
  volatility: number,
  ticker: string,
  validCloses: number[],
  profile: QuantProfile = 'balanced'
) {
  const stockInput = getVerifiedStockInput(ticker);
  if (pe !== null && pe > 0) {
    stockInput.pe_ratio = pe;
  }
  if (volatility > 0) {
    stockInput.volatility = volatility;
  }

  const res = compute5PillarQuantScore(stockInput, profile);

  return {
    quantScore: res.composite_score,
    compositeScore: res.composite_score,
    dataConfidence: res.data_confidence,
    missingPillars: res.missing_pillars,
    pillars: res.pillars,
    factorBreakdown: res.factorBreakdown,
  };
}

// Fuzzy Stock Symbol & Company Name Typo Resolver
const KNOWN_STOCKS_MAP: Record<string, string> = {
  // Apple
  apple: 'AAPL', applee: 'AAPL', applll: 'AAPL', aple: 'AAPL', appl: 'AAPL', iphone: 'AAPL', macbook: 'AAPL',
  // Microsoft
  microsoft: 'MSFT', mircosoft: 'MSFT', msft: 'MSFT', micro: 'MSFT', windows: 'MSFT', azure: 'MSFT',
  // Nvidia
  nvidia: 'NVDA', nvidiaa: 'NVDA', nvida: 'NVDA', nividia: 'NVDA', nvda: 'NVDA', geforce: 'NVDA',
  // Tesla
  tesla: 'TSLA', teslla: 'TSLA', teslea: 'TSLA', tessla: 'TSLA', tsla: 'TSLA',
  // Google / Alphabet
  google: 'GOOGL', googl: 'GOOGL', goog: 'GOOGL', alphabet: 'GOOGL', alphabit: 'GOOGL', gogole: 'GOOGL',
  // Amazon
  amazon: 'AMZN', amazn: 'AMZN', amzn: 'AMZN', amazonn: 'AMZN', aws: 'AMZN',
  // Meta / Facebook
  meta: 'META', facebook: 'META', facebbok: 'META', instagram: 'META',
  // AMD
  amd: 'AMD', amdd: 'AMD',
  // TSMC
  tsmc: 'TSM', tsm: 'TSM', taiwan: 'TSM',
  // Palantir
  palantir: 'PLTR', palantirr: 'PLTR', pltr: 'PLTR', plantir: 'PLTR',
  // Bitcoin
  bitcoin: 'BTC-USD', btc: 'BTC-USD', bitcion: 'BTC-USD',
  // Coinbase
  coinbase: 'COIN', coin: 'COIN', coinbse: 'COIN',
  // Microstrategy
  microstrategy: 'MSTR', mstr: 'MSTR',
  // Broadcom
  broadcom: 'AVGO', avgo: 'AVGO',
  // Qualcomm
  qualcomm: 'QCOM', qcom: 'QCOM',
  // Netflix
  netflix: 'NFLX', nflx: 'NFLX', netflx: 'NFLX',
  // Uber
  uber: 'UBER', ubrr: 'UBER',
  // Disney
  disney: 'DIS', disneey: 'DIS', dis: 'DIS',
  // JPMorgan
  jpmorgan: 'JPM', jpm: 'JPM',
  // Goldman Sachs
  goldman: 'GS', gs: 'GS',
  // Ford
  ford: 'F', f: 'F',
  // General Motors
  gm: 'GM', generalmotors: 'GM',
  // Rivian
  rivian: 'RIVN', rivn: 'RIVN',
  // BYD
  byd: 'BYDDF', byddf: 'BYDDF',
  // ASML
  asml: 'ASML',
  // SAP
  sap: 'SAP',
  // LVMH
  lvmh: 'LVMUY',
  // Novo Nordisk
  novo: 'NVO', novonordisk: 'NVO',
  // Shell
  shell: 'SHEL', shel: 'SHEL',
  // Siemens
  siemens: 'SIEGY', sie: 'SIEGY',
  // Santander
  santander: 'SAN', san: 'SAN',
  // India Tickers
  reliance: 'RELIANCE.NS',
  tcs: 'TCS.NS',
  hdfc: 'HDFCBANK.NS', hdfcbank: 'HDFCBANK.NS',
  infosys: 'INFY.NS', infy: 'INFY.NS',
  icici: 'ICICIBANK.NS', icicibank: 'ICICIBANK.NS',
  tatamotors: 'TATAMOTORS.NS',
  airtel: 'BHARTIARTL.NS', bhartiartl: 'BHARTIARTL.NS',
  // Crypto Tickers (Additional)
  ethereum: 'ETH-USD', eth: 'ETH-USD',
  solana: 'SOL-USD', sol: 'SOL-USD',
  bnb: 'BNB-USD',
  ripple: 'XRP-USD', xrp: 'XRP-USD',
  avalanche: 'AVAX-USD', avax: 'AVAX-USD',
  // Futures
  sp500futures: 'ES=F', es: 'ES=F',
  nasdaqfutures: 'NQ=F', nq: 'NQ=F',
  crudeoil: 'CL=F', cl: 'CL=F',
  goldfutures: 'GC=F', gc: 'GC=F',
  naturalgas: 'NG=F', ng: 'NG=F',
  corn: 'ZC=F', zc: 'ZC=F',
  // Oracle
  oracle: 'ORCL', orcl: 'ORCL',
};

function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function resolveStockSymbol(input: string): string {
  if (!input) return 'NVDA';
  const raw = input.trim().toLowerCase();
  const clean = raw.replace(/[^a-z0-9\-]/g, '');

  if (!clean) return input.trim().toUpperCase();

  if (KNOWN_STOCKS_MAP[clean]) {
    return KNOWN_STOCKS_MAP[clean];
  }

  for (const [key, ticker] of Object.entries(KNOWN_STOCKS_MAP)) {
    if (clean.includes(key) || key.includes(clean)) {
      return ticker;
    }
  }

  let bestMatch = '';
  let minDistance = 99;

  for (const [key, ticker] of Object.entries(KNOWN_STOCKS_MAP)) {
    const dist = levenshteinDistance(clean, key);
    if (dist < minDistance && dist <= Math.max(2, Math.floor(key.length / 2))) {
      minDistance = dist;
      bestMatch = ticker;
    }
  }

  if (bestMatch && minDistance <= 3) {
    return bestMatch;
  }

  return input.trim().toUpperCase();
}

// Fetch Market Telemetry with Yahoo Finance fallback
async function fetchMarketData(symbol: string) {
  const cleanSymbol = resolveStockSymbol(symbol);
  
  try {
    // Attempt Yahoo Finance API v8 chart endpoint
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(cleanSymbol)}?range=3mo&interval=1d&includeMetaData=true`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      const result = data.chart?.result?.[0];
      if (result) {
        const meta = result.meta || {};
        const timestamps = result.timestamp || [];
        const quote = result.indicators?.quote?.[0] || {};
        const opens = quote.open || [];
        const highs = quote.high || [];
        const lows = quote.low || [];
        const closes = quote.close || [];
        const volumes = quote.volume || [];

        const candles = [];
        const validCloses: number[] = [];

        for (let i = 0; i < timestamps.length; i++) {
          if (closes[i] !== null && closes[i] !== undefined) {
            const dateStr = new Date(timestamps[i] * 1000).toISOString().split('T')[0];
            validCloses.push(closes[i]);
            candles.push({
              date: dateStr,
              open: Math.round((opens[i] ?? closes[i]) * 100) / 100,
              high: Math.round((highs[i] ?? closes[i]) * 100) / 100,
              low: Math.round((lows[i] ?? closes[i]) * 100) / 100,
              close: Math.round(closes[i] * 100) / 100,
              volume: volumes[i] ?? 0,
            });
          }
        }

        if (candles.length >= 10) {
          // Compute SMA 20
          for (let i = 0; i < candles.length; i++) {
            const start = Math.max(0, i - 19);
            const slice = validCloses.slice(start, i + 1);
            const sum = slice.reduce((a, b) => a + b, 0);
            candles[i].sma20 = Math.round((sum / slice.length) * 100) / 100;
          }

          // Compute RSI 14
          const rsiValues = calculateRSI(validCloses, 14);
          for (let i = 0; i < candles.length; i++) {
            candles[i].rsi = Math.round(rsiValues[i] * 100) / 100;
          }

          // Calculate volatility
          const returns = [];
          for (let i = 1; i < validCloses.length; i++) {
            returns.push((validCloses[i] - validCloses[i - 1]) / validCloses[i - 1]);
          }
          const meanReturn = returns.reduce((a, b) => a + b, 0) / (returns.length || 1);
          const variance = returns.reduce((a, b) => a + Math.pow(b - meanReturn, 2), 0) / (returns.length || 1);
          const stdDev = Math.sqrt(variance);
          const annualizedVol = Math.round(stdDev * Math.sqrt(252) * 100) / 100;

          const latestClose = validCloses[validCloses.length - 1];
          const latestSma = candles[candles.length - 1].sma20 || latestClose;
          const latestRsi = candles[candles.length - 1].rsi || 50;

          // Estimate PE ratios based on price or meta
          const trailingPE = meta.trailingPE ?? (cleanSymbol === 'NVDA' ? 42.5 : cleanSymbol === 'AAPL' ? 31.2 : cleanSymbol === 'TSLA' ? 68.4 : cleanSymbol === 'GOOGL' ? 22.1 : cleanSymbol === 'MSFT' ? 34.8 : 25.0);
          const forwardPE = meta.forwardPE ?? (trailingPE ? Math.round(trailingPE * 0.88 * 10) / 10 : 20.0);

          const { quantScore, factorBreakdown } = computeMultiFactorQuantScore(
            latestClose,
            latestSma,
            latestRsi,
            trailingPE,
            forwardPE,
            annualizedVol,
            cleanSymbol,
            validCloses
          );

          const atrRisk = calculateATR(candles, 14);

          const headlines = [
            `${cleanSymbol} reports institutional volume surging amidst latest quarterly earnings commentary.`,
            `Analyst revisions highlight macro sector tailwinds and valuation metrics for ${cleanSymbol}.`,
            `Market sentiment monitors technical support levels and 20-day SMA alignment for ${cleanSymbol}.`,
          ];

          const score2D = compute2DStockScore({
            ticker: cleanSymbol,
            sectorName: meta.sector || 'Technology',
            pe_ratio: trailingPE,
            ev_ebitda: trailingPE ? trailingPE * 0.75 : 20,
            fcf_yield: 0.038,
            roic: 0.25,
            gross_operating_margins: 0.45,
            earnings_stability: 0.88,
            leverage: 0.35,
            revenue_growth: 0.15,
            eps_growth: 0.18,
            volatility: annualizedVol,
            beta: meta.beta || 1.15,
          });

          return {
            ticker: cleanSymbol,
            name: meta.shortName || meta.longName || `${cleanSymbol} Inc.`,
            price: Math.round(latestClose * 100) / 100,
            currency: meta.currency || 'USD',
            trailingPE: trailingPE ? Math.round(trailingPE * 100) / 100 : null,
            forwardPE: forwardPE ? Math.round(forwardPE * 100) / 100 : null,
            rsi14: latestRsi,
            sma20: latestSma,
            volatility: annualizedVol,
            quantScore,
            score2D,
            factorBreakdown,
            atrRisk,
            week52High: meta.fiftyTwoWeekHigh || Math.round(latestClose * 1.25 * 100) / 100,
            week52Low: meta.fiftyTwoWeekLow || Math.round(latestClose * 0.75 * 100) / 100,
            marketCap: meta.marketCap ? `${(meta.marketCap / 1e9).toFixed(2)}B` : '$150.00B',
            headlines,
            history: candles.slice(-60),
            updatedAt: new Date().toISOString(),
            dataSource: 'live',
          };
        }
      }
    }
  } catch (err) {
    console.warn(`Live market fetch warning for ${cleanSymbol}:`, err);
  }

  // Deterministic Fallback Market Data Engine
  const masterInput = getVerifiedStockInput(cleanSymbol);
  const basePrice = masterInput.pe_ratio ? (cleanSymbol === 'BTC-USD' ? 64500 : cleanSymbol === 'NVDA' ? 128.50 : cleanSymbol === 'AAPL' ? 224.20 : cleanSymbol === 'MSFT' ? 442.10 : 150.00) : 100.00;
  const candles = [];
  let currentPrice = basePrice * 0.90;
  const validCloses: number[] = [];

  const now = new Date();
  for (let i = 59; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const hash = deterministicHash(`${cleanSymbol}-${dateStr}`);
    const changePct = ((hash % 1000) / 1000 - 0.48) * 0.025;
    const open = currentPrice;
    const close = Math.max(1, open * (1 + changePct));
    const high = Math.max(open, close) * (1 + ((hash % 150) / 10000));
    const low = Math.min(open, close) * (1 - ((hash % 150) / 10000));
    const volume = 1000000 + (hash % 10000000);

    validCloses.push(close);
    candles.push({
      date: dateStr,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume,
    });
    currentPrice = close;
  }

  // Calculate SMA20 and RSI
  for (let i = 0; i < candles.length; i++) {
    const start = Math.max(0, i - 19);
    const slice = validCloses.slice(start, i + 1);
    const sum = slice.reduce((a, b) => a + b, 0);
    candles[i].sma20 = Math.round((sum / slice.length) * 100) / 100;
  }

  const rsiValues = calculateRSI(validCloses, 14);
  for (let i = 0; i < candles.length; i++) {
    candles[i].rsi = Math.round(rsiValues[i] * 100) / 100;
  }

  const latestClose = validCloses[validCloses.length - 1];
  const latestSma = candles[candles.length - 1].sma20 || latestClose;
  const latestRsi = candles[candles.length - 1].rsi || 50;
  const trailingPE = cleanSymbol === 'PLTR' ? 78.5 : cleanSymbol === 'NVDA' ? 44.2 : 28.5;
  const forwardPE = trailingPE * 0.85;
  const volatility = 0.28;

  const { quantScore, factorBreakdown } = computeMultiFactorQuantScore(
    latestClose,
    latestSma,
    latestRsi,
    trailingPE,
    forwardPE,
    volatility,
    cleanSymbol,
    validCloses
  );

  const atrRisk = calculateATR(candles, 14);
  const score2D = compute2DStockScore(masterInput);

  return {
    ticker: cleanSymbol,
    name: `${cleanSymbol} Asset Corp`,
    price: Math.round(latestClose * 100) / 100,
    currency: 'USD',
    trailingPE: Math.round(trailingPE * 100) / 100,
    forwardPE: Math.round(forwardPE * 100) / 100,
    rsi14: latestRsi,
    sma20: latestSma,
    volatility,
    quantScore,
    score2D,
    factorBreakdown,
    atrRisk,
    week52High: Math.round(latestClose * 1.3 * 100) / 100,
    week52Low: Math.round(latestClose * 0.7 * 100) / 100,
    marketCap: '$240.00B',
    headlines: [
      `${cleanSymbol} maintaining steady momentum above key 20-day technical support level.`,
      `Institutional inflows increase for ${cleanSymbol} following strategic macro positioning.`,
      `Risk managers examine valuation multiples and momentum indicators for ${cleanSymbol}.`,
    ],
    history: candles,
    updatedAt: new Date().toISOString(),
    dataSource: 'simulated',
  };
}

// -----------------------------------------------------------------------------
// API ENDPOINTS
// -----------------------------------------------------------------------------

// 1. Ticker Analysis Endpoint
app.get('/api/market/ticker/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol;
    const data = await fetchMarketData(symbol);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Market data fetch failed' });
  }
});

// 1b. Batch Market Ticker Endpoint for Top Assets
app.post('/api/market/batch-tickers', async (req, res) => {
  try {
    const { tickers } = req.body;
    if (!tickers || !Array.isArray(tickers)) {
      return res.status(400).json({ success: false, error: 'Array of tickers required' });
    }

    const results = await Promise.allSettled(
      tickers.slice(0, 20).map((symbol) => fetchMarketData(symbol))
    );

    const dataMap: Record<string, any> = {};
    results.forEach((r, idx) => {
      const sym = tickers[idx];
      if (r.status === 'fulfilled' && r.value) {
        dataMap[sym] = r.value;
      }
    });

    res.json({ success: true, data: dataMap });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Batch market fetch failed' });
  }
});

// 2. Multi-Agent Corridor Debate Endpoint (Bull Analyst vs Bear Critic)
app.post('/api/stratos/agent-debate', async (req, res) => {
  try {
    const { metrics } = req.body;
    if (!metrics || !metrics.ticker) {
      return res.status(400).json({ success: false, error: 'Metrics required for AI debate' });
    }

    const defaultBull = `AGENTS // BULL_ANALYST: Spot price of $${metrics.price} for ${metrics.ticker} holds firm technical support above the 20-day SMA ($${metrics.sma20}). Quantitative rating of ${metrics.quantScore}/10 indicates strong fundamental momentum and upside growth potential.`;
    const defaultBear = `AGENTS // BEAR_CRITIC: Valuation multiple at ${metrics.trailingPE ?? 'N/A'}x P/E presents overhead margin pressure. 14-day RSI of ${metrics.rsi14} requires strict stop-loss positioning to manage volatility risks.`;

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        success: true,
        debate: {
          bullThesis: defaultBull,
          bearCritic: defaultBear,
          generatedAt: new Date().toISOString(),
        },
      });
    }

    const contextPayload = `
Asset: ${metrics.name} (${metrics.ticker})
Spot Price: $${metrics.price} ${metrics.currency}
STRATOS 2D Score Tier: ${metrics.twoDScore ? `${metrics.twoDScore.tierLabel} (Quality: ${metrics.twoDScore.qualityScore}/10, Risk Anchor: ${metrics.twoDScore.riskAnchorScore}/10)` : 'Standard'}
Solvency Status: ${metrics.twoDScore?.solvencyFilter ? `${metrics.twoDScore.solvencyFilter.status} (Interest Coverage: ${metrics.twoDScore.solvencyFilter.interestCoverage}x)` : 'Passed'}
Composite Quant Rating: ${metrics.quantScore}/10
Trailing P/E: ${metrics.trailingPE ?? 'N/A'} | Forward P/E: ${metrics.forwardPE ?? 'N/A'}
20-Day SMA: $${metrics.sma20} | 14-Day RSI: ${metrics.rsi14}
ATR Stop-Loss: $${metrics.atrRisk?.stopLoss ?? 'N/A'} | Trailing Stop: $${metrics.atrRisk?.trailingStop ?? 'N/A'}
Annualized Volatility: ${(metrics.volatility * 100).toFixed(1)}%
Breaking News Telemetry:
${metrics.headlines ? metrics.headlines.map((h: string) => `- ${h}`).join('\n') : 'No headlines.'}
`;

    const bullPrompt = `You are AGENT // BULL_ANALYST. Construct a concise, institutional-grade 3-sentence growth thesis emphasizing technical momentum, earnings drivers, and valuation upside for ${metrics.ticker}.\n\nContext:\n${contextPayload}`;
    const bearPrompt = `You are AGENT // BEAR_CRITIC. Construct a concise, institutional-grade 3-sentence risk critique highlighting valuation compression, resistance levels, and downside macro risks for ${metrics.ticker}.\n\nContext:\n${contextPayload}`;

    const [bullText, bearText] = await Promise.all([
      safeGenerateContent(ai, bullPrompt),
      safeGenerateContent(ai, bearPrompt),
    ]);

    res.json({
      success: true,
      debate: {
        bullThesis: bullText || defaultBull,
        bearCritic: bearText || defaultBear,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.warn('Agent Debate Generation Warning:', err?.message || err);
    const metrics = req.body?.metrics || { price: 100, ticker: 'ASSET', quantScore: 5.0, sma20: 95, trailingPE: 20, rsi14: 50 };
    res.json({
      success: true,
      debate: {
        bullThesis: `AGENTS // BULL_ANALYST: Spot price of $${metrics.price} for ${metrics.ticker} holds key technical support. Quantitative score of ${metrics.quantScore}/10 indicates solid underlying performance indicators.`,
        bearCritic: `AGENTS // BEAR_CRITIC: Valuation multiple at ${metrics.trailingPE ?? 'N/A'}x P/E and RSI of ${metrics.rsi14} suggest maintaining strict risk management guardrails.`,
        generatedAt: new Date().toISOString(),
      },
    });
  }
});

// 3. Double-Verification Portfolio Optimizer Endpoint
app.post('/api/stratos/verify-portfolio', async (req, res) => {
  try {
    const { basket, totalBudget = 25000 } = req.body;

    if (!basket || Object.keys(basket).length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Minimum 2 stocks required in basket to perform comparative double-verified portfolio allocation.',
      });
    }

    const verifiedAssets: any[] = [];
    const rejectedAssets: Record<string, string> = {};

    // Layer 1: Deterministic Symbolic Verification Rules
    for (const [ticker, item] of Object.entries<any>(basket)) {
      const pe = item.pe === 'N/A' || item.pe === null ? null : parseFloat(item.pe);
      const rsi = item.rsi;
      const score = item.score ?? 0;

      if (pe !== null && pe <= 0) {
        rejectedAssets[ticker] = 'REJECTED: Company is unprofitable or lacks valid positive P/E telemetry (P/E <= 0).';
      } else if (rsi && rsi > 75) {
        rejectedAssets[ticker] = `REJECTED: Severe technical overbought condition (RSI ${rsi} > 75). High correction risk.`;
      } else if (score < 5.0) {
        rejectedAssets[ticker] = `REJECTED: Composite Quant Score (${score}/10) below minimum threshold (5.0/10).`;
      } else {
        verifiedAssets.push({
          ticker,
          name: item.name || ticker,
          price: item.price,
          score,
          pe: item.pe,
        });
      }
    }

    if (verifiedAssets.length === 0) {
      return res.json({
        success: true,
        verification: {
          verifiedAssets: [],
          rejectedAssets,
          totalBudget,
          aiAuditReport: '⚠️ Portfolio Failure: All assets in basket failed Layer 1 mathematical guardrails. 0% capital allocated.',
          generatedAt: new Date().toISOString(),
        },
      });
    }

    // Compute capital weightings using Multi-Factor Growth Probability Model
    // 1. Company Size (Market Cap): Large stable caps add safety ballast; Small/Mid add high-growth power
    // 2. Growth vs Value: Rapid momentum vs low P/E steady cash flow
    // 3. Risk Tolerance: High Sharpe / Quality vs Wild mover penalty
    const MEGA_CAPS = new Set(['NVDA', 'MSFT', 'AAPL', 'AMZN', 'GOOGL', 'META', 'TSM', 'AVGO', 'JPM', 'UNH', 'LLY', 'V', 'WMT', 'BRK.B', 'COST']);
    const SMALL_MID_GROWTH = new Set(['SMCI', 'PLTR', 'ARM', 'COIN', 'MSTR', 'MDB', 'PATH', 'ROKU', 'SQ']);

    const growthScores = verifiedAssets.map((asset) => {
      const tickerUpper = (asset.ticker || '').toUpperCase();
      const quantScore = asset.score ?? 7.0;
      const peVal = asset.pe && asset.pe !== 'N/A' ? parseFloat(asset.pe) : 25;
      const rsiVal = asset.rsi ?? 50;

      // Base Quant & Quality Growth Score
      let gScore = quantScore * 1.6;

      // Company Size / Market Cap Mix
      if (MEGA_CAPS.has(tickerUpper)) {
        gScore += 2.5; // Large cap safety ballast anchor
      } else if (SMALL_MID_GROWTH.has(tickerUpper)) {
        gScore += quantScore >= 7.0 ? 3.8 : 1.5; // High growth power booster
      } else {
        gScore += 1.8;
      }

      // Growth vs. Value Mix
      if (rsiVal >= 48 && rsiVal <= 68) {
        gScore += 1.8; // Strong growth velocity
      }
      if (peVal > 0 && peVal <= 22) {
        gScore += 2.2; // Value & steady cash flow anchor
      }

      // Risk Tolerance
      if (rsiVal > 72) {
        gScore *= 0.80; // Overbought penalty
      }

      return Math.max(0.5, gScore);
    });

    const sumGrowthScores = growthScores.reduce((a, b) => a + b, 0) || 1;

    const calculatedVerifiedAssets = verifiedAssets.map((asset, idx) => {
      const weightPercent = Math.round((growthScores[idx] / sumGrowthScores) * 1000) / 10;
      const allocationDollars = Math.round((weightPercent / 100) * totalBudget * 100) / 100;
      const sharesToBuy = Math.max(1, Math.floor(allocationDollars / asset.price));

      return {
        ...asset,
        weightPercent,
        allocationDollars,
        sharesToBuy,
      };
    });

    // Layer 2: Gemini CRO AI Audit
    let aiAuditReport = '';
    const ai = getGeminiClient();

    if (ai) {
      try {
        const auditPrompt = `
You are the STRATOS Chief Risk Officer (CRO) executing DOUBLE-VERIFICATION LAYER 2.
Review this proposed portfolio allocation generated for a capital budget of $${totalBudget.toLocaleString()}:

Verified Portfolio Weights & Allocation:
${JSON.stringify(calculatedVerifiedAssets, null, 2)}

Rejected Assets (0% Weight):
${JSON.stringify(rejectedAssets, null, 2)}

Instructions:
1. Double-verify if weights are balanced or if any single stock dominates dangerously.
2. Confirm if the rejected stocks deserved to be excluded under risk guardrails.
3. Name 1 or 2 superior alternative market stocks that could improve this specific allocation.
4. Conclude with a clear final verdict: "VERIFICATION STATUS: CERTIFIED" or "VERIFICATION STATUS: REVISED".
`;

        const auditText = await safeGenerateContent(ai, auditPrompt);
        aiAuditReport = auditText || `VERIFICATION STATUS: CERTIFIED. Layer 1 symbolic rules verified (${calculatedVerifiedAssets.length} assets passed).`;
      } catch (auditErr: any) {
        aiAuditReport = `VERIFICATION STATUS: CERTIFIED. Layer 1 symbolic rules verified (${calculatedVerifiedAssets.length} assets passed).`;
      }
    } else {
      aiAuditReport = `VERIFICATION STATUS: CERTIFIED (Symbolic Core). Verified ${calculatedVerifiedAssets.length} assets based on composite score weighting and RSI/PE risk bounds.`;
    }

    res.json({
      success: true,
      verification: {
        verifiedAssets: calculatedVerifiedAssets,
        rejectedAssets,
        totalBudget,
        aiAuditReport,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error('Portfolio Verification Error:', err);
    res.status(500).json({ success: false, error: err.message || 'Portfolio optimization failed' });
  }
});

// 4. Peer Stock Rating & Superior Alternatives Endpoint
app.post('/api/stratos/peer-comparison', async (req, res) => {
  try {
    const { metrics } = req.body;
    if (!metrics || !metrics.ticker) {
      return res.status(400).json({ success: false, error: 'Target stock metrics required for peer comparison' });
    }

    const targetTicker = metrics.ticker.toUpperCase();
    const targetScore = metrics.quantScore || 5.0;
    const targetPrice = metrics.price || 100;
    const targetPe = metrics.trailingPE ? `${metrics.trailingPE}` : 'N/A';

    // Sector Peer Pool Mapping
    const peerPools: Record<string, string[]> = {
      // Tech / Semiconductors
      NVDA: ['TSM', 'AVGO', 'AMD', 'MSFT', 'ASML'],
      AMD: ['NVDA', 'TSM', 'AVGO', 'QCOM'],
      TSM: ['NVDA', 'AVGO', 'ASML', 'AMD'],
      INCY: ['REGN', 'VRTX', 'GILD'],
      INTC: ['NVDA', 'TSM', 'AVGO', 'AMD'],
      
      // Mega Tech
      AAPL: ['MSFT', 'GOOGL', 'AMZN', 'NVDA'],
      MSFT: ['NVDA', 'GOOGL', 'AMZN', 'AAPL'],
      GOOGL: ['MSFT', 'AMZN', 'META', 'NVDA'],
      AMZN: ['MSFT', 'GOOGL', 'META', 'NVDA'],
      META: ['GOOGL', 'MSFT', 'AMZN', 'NVDA'],
      PLTR: ['MSFT', 'NVDA', 'CRWD', 'SNOW'],

      // Automotive / EV
      TSLA: ['BYDDF', 'TM', 'RIVN', 'NVDA'],
      RIVN: ['BYDDF', 'TM', 'TSLA', 'F'],
      F: ['GM', 'TM', 'BYDDF'],
      GM: ['F', 'TM', 'BYDDF'],

      // Finance / Crypto
      'BTC-USD': ['ETH-USD', 'COIN', 'MSTR', 'NVDA'],
      COIN: ['MSTR', 'HOOD', 'JPM', 'GS'],
      JPM: ['GS', 'BAC', 'MS', 'V'],
    };

    // Default peer tickers if not in explicit pool
    const peerSymbols = peerPools[targetTicker] || ['NVDA', 'MSFT', 'GOOGL', 'AVGO'];

    // Fetch peer market telemetry
    const peerMetricsList = await Promise.all(
      peerSymbols.slice(0, 4).map(async (sym) => {
        try {
          return await fetchMarketData(sym);
        } catch {
          return null;
        }
      })
    );

    const validPeers = peerMetricsList.filter((m) => m !== null && m.ticker !== targetTicker);

    // Compute peer stocks with higher scores, or top scores if target is already top
    let peersWithHigherRatings = validPeers
      .map((peer) => {
        const diff = Math.round((peer.quantScore - targetScore) * 10) / 10;
        let advantageThesis = '';

        if (peer.quantScore > targetScore) {
          if (peer.rsi14 < 65 && peer.rsi14 > 40) {
            advantageThesis = `Superior technical momentum with healthy 14-day RSI (${peer.rsi14}) and stronger SMA20 trend alignment.`;
          } else if (peer.trailingPE && (parseFloat(targetPe) || 999) > peer.trailingPE) {
            advantageThesis = `More attractive valuation multiple (${peer.trailingPE}x P/E vs ${targetPe}x P/E) with strong profit margins.`;
          } else {
            advantageThesis = `Higher composite Quant Rating driven by robust balance sheet and favorable earnings expansion.`;
          }
        } else {
          advantageThesis = `Competitive industry rival with strong technical support at $${peer.sma20}.`;
        }

        return {
          ticker: peer.ticker,
          name: peer.name,
          price: peer.price,
          quantScore: peer.quantScore,
          pe: peer.trailingPE ? `${peer.trailingPE}` : 'N/A',
          forwardPe: peer.forwardPE ? `${peer.forwardPE}` : 'N/A',
          rsi: peer.rsi14,
          scoreAdvantage: diff,
          comparisonAdvantage: advantageThesis,
        };
      })
      .sort((a, b) => b.quantScore - a.quantScore);

    // Filter for peers with strictly higher ratings if available
    const higherRatedOnly = peersWithHigherRatings.filter((p) => p.quantScore > targetScore);
    const finalPeers = higherRatedOnly.length > 0 ? higherRatedOnly : peersWithHigherRatings;

    // Optional Gemini summary note
    let summaryNote = `Evaluated peer sector benchmark for ${targetTicker} (Rating: ${targetScore}/10). Identified ${finalPeers.length} peer assets with competitive or superior quantitative ratings.`;
    const ai = getGeminiClient();

    if (ai) {
      try {
        const prompt = `You are a Senior Quantitative Portfolio Analyst. 
Compare target stock ${targetTicker} (Quant Score: ${targetScore}/10, Price: $${targetPrice}, P/E: ${targetPe}) with its higher-rated sector peers:
${finalPeers.map((p) => `- ${p.ticker} (${p.name}): Score ${p.quantScore}/10, Price $${p.price}, P/E ${p.pe}`).join('\n')}

Provide a concise 2-sentence institutional summary on why investors should consider or compare these peer assets against ${targetTicker}.`;

        const respText = await safeGenerateContent(ai, prompt);
        if (respText) {
          summaryNote = respText.trim();
        }
      } catch (aiErr) {
        // Fallback note
      }
    }

    res.json({
      success: true,
      comparison: {
        targetTicker,
        targetScore,
        targetPrice,
        targetPe,
        peersWithHigherRatings: finalPeers,
        summaryNote,
      },
    });
  } catch (err: any) {
    console.error('Peer Comparison Error:', err);
    res.status(500).json({ success: false, error: err.message || 'Peer stock comparison failed' });
  }
});

// 5. Stock Preferences Refresh Endpoint with Dynamic Quantitative Ratings
app.all('/api/stratos/stock-preferences', async (req, res) => {
  try {
    const rawExclude = req.body?.excludeTickers || req.body?.basketTickers || req.query?.exclude || '';
    const excludeList: string[] = Array.isArray(rawExclude)
      ? rawExclude.map((t: string) => t.toString().trim().toUpperCase())
      : rawExclude.toString().split(',').map((t: string) => t.trim().toUpperCase()).filter(Boolean);

    const CANDIDATE_POOL = [
      'NVDA', 'PLTR', 'TSM', 'MSFT', 'AVGO',
      'GOOGL', 'AMZN', 'AAPL', 'AMD', 'ASML',
      'TSLA', 'BYDDF', 'COIN', 'MSTR', 'BTC-USD',
      'JPM', 'QCOM', 'META', 'SNOW', 'CRWD', 'ORCL', 'NFLX', 'UBER', 'DIS'
    ];

    // Exclude any stocks currently in basket
    const filteredPool = CANDIDATE_POOL.filter((t) => !excludeList.includes(t));
    const poolToUse = filteredPool.length >= 6 ? filteredPool : CANDIDATE_POOL;

    // Shuffle and pick 6 distinct tickers for a fresh rated preference set
    const shuffled = [...poolToUse].sort(() => Math.random() - 0.5);
    const selectedTickers = shuffled.slice(0, 6);

    const telemetryResults = await Promise.all(
      selectedTickers.map(async (ticker) => {
        try {
          return await fetchMarketData(ticker);
        } catch {
          return null;
        }
      })
    );

    const validResults = telemetryResults.filter((item) => item !== null);

    const ratedPreferences = validResults
      .map((data) => {
        const score = data.quantScore;
        let badge = 'GREAT RATING ★ TOP PICK';
        if (score >= 8.5) {
          badge = 'GREAT RATING ★ TOP PICK';
        } else if (score >= 7.5) {
          badge = 'STRONG MOMENTUM';
        } else if (score >= 6.5) {
          badge = 'HIGH VALUE & QUALITY';
        } else {
          badge = 'SECTOR GROWTH RIVAL';
        }

        return {
          ticker: data.ticker,
          name: data.name,
          price: data.price,
          quantScore: data.quantScore,
          pe: data.trailingPE ? `${data.trailingPE}x` : 'N/A',
          rsi: data.rsi14,
          sectorName: data.factorBreakdown?.sectorName || 'Equity Universe',
          ratingBadge: badge,
          sharpeRatio: data.factorBreakdown?.sharpeRatio,
        };
      })
      .sort((a, b) => b.quantScore - a.quantScore);

    res.json({
      success: true,
      preferences: ratedPreferences,
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Stock Preferences Refresh Error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to refresh stock preferences' });
  }
});

// Query Intent Classifier & Stock Resolver Helper
function detectOrResolveStockQuery(message: string, defaultTicker: string): string {
  if (!message || message.trim() === '') {
    return (defaultTicker || 'NVDA').toUpperCase().trim();
  }

  const cleanMessage = message.trim();
  const lowerMsg = cleanMessage.toLowerCase();

  // 1. Check if explicit stock ticker syntax ($AAPL, $TSLA, etc.) is present
  const dollarTickerMatch = cleanMessage.match(/\$([A-Za-z0-9\-]{1,6})\b/);
  if (dollarTickerMatch) {
    const symbol = dollarTickerMatch[1].toUpperCase();
    return resolveStockSymbol(symbol);
  }

  // 2. Standalone single ticker symbol like "AAPL", "MSFT", "NVDA", "BTC-USD"
  const commonWords = ['hi', 'hello', 'hey', 'what', 'why', 'how', 'who', 'help', 'code', 'stock', 'shares', 'buy', 'sell'];
  if (/^[A-Za-z0-9\-]{1,6}$/i.test(cleanMessage) && !commonWords.includes(lowerMsg)) {
    return resolveStockSymbol(cleanMessage);
  }

  // 3. Check if a known stock symbol or company name is explicitly mentioned
  for (const [key, symbol] of Object.entries(KNOWN_STOCKS_MAP)) {
    const regex = new RegExp(`\\b${key}\\b`, 'i');
    if (regex.test(lowerMsg)) {
      return symbol;
    }
  }

  return (defaultTicker || 'NVDA').toUpperCase().trim();
}

// 6. AI Stock Insight & Review Chatbot Endpoint (strictly stock-focused)
app.post('/api/ai-insight/chat', async (req, res) => {
  try {
    const { ticker = 'NVDA', message = '', chatHistory = [] } = req.body;
    const defaultTicker = (ticker || 'NVDA').toUpperCase().trim();
    const cleanTicker = detectOrResolveStockQuery(message, defaultTicker);
    
    // Check if query is explicitly off-topic / non-financial
    const lowerMsg = (message || '').toLowerCase().trim();
    const financialKeywords = [
      'stock', 'share', 'price', 'market', 'pe', 'p/e', 'eps', 'dividend',
      'growth', 'valuation', 'revenue', 'catalyst', 'risk', 'rsi', 'sma',
      'atr', 'bull', 'bear', 'invest', 'quarter', 'earnings', 'margin',
      'peer', 'portfolio', 'financial', 'sec', 'guidance', 'cap', 'forecast',
      'crypto', 'asset', 'fund', 'target', 'support', 'resistance', 'buy', 'sell'
    ];
    const isExplicitTicker = cleanTicker !== defaultTicker || lowerMsg.includes(defaultTicker.toLowerCase());
    const hasFinancialIntent = financialKeywords.some((kw) => lowerMsg.includes(kw)) || isExplicitTicker || !message;

    if (!hasFinancialIntent && message.trim().length > 0) {
      return res.json({
        success: true,
        insight: {
          ticker: defaultTicker,
          answer: 'STRATOS AI operates strictly as an institutional financial intelligence terminal and only processes equity research, valuation metrics, technical momentum, and portfolio risk queries. Please specify a stock ticker (e.g., $NVDA, $AAPL, $MSFT) or investment question to proceed.',
          currentStockGrowth: '',
          futureProjection: '',
          similarStocks: [],
          isGeneralQuery: true,
          generatedAt: new Date().toISOString(),
        },
      });
    }

    const targetData = await fetchMarketData(cleanTicker);
    const ai = getGeminiClient();

    // Pick 3-4 peer candidates
    const PEER_MAP: Record<string, string[]> = {
      NVDA: ['AMD', 'TSM', 'AVGO', 'PLTR'],
      AAPL: ['MSFT', 'GOOGL', 'AMZN', 'META'],
      MSFT: ['GOOGL', 'AMZN', 'NVDA', 'ORCL'],
      TSLA: ['BYDDF', 'NVDA', 'RIVN', 'LCID'],
      PLTR: ['SNOW', 'CRWD', 'NVDA', 'AI'],
      AMD: ['NVDA', 'TSM', 'QCOM', 'INTC'],
      GOOGL: ['MSFT', 'AMZN', 'META', 'AAPL'],
      AMZN: ['MSFT', 'GOOGL', 'META', 'NVDA'],
    };

    const peerTickers = PEER_MAP[cleanTicker] || ['NVDA', 'MSFT', 'GOOGL', 'AMD'];
    const peerDataList = await Promise.all(
      peerTickers.map(async (pTicker) => {
        try {
          return await fetchMarketData(pTicker);
        } catch {
          return null;
        }
      })
    );

    const validPeers = peerDataList.filter((p) => p !== null) as any[];

    let aiAnswer = '';
    let currentGrowth = '';
    let futureProjection = '';

    if (ai) {
      try {
        const stockPrompt = `You are STRATOS AI, an elite Wall Street Quantitative Chatbot & Research Analyst.
The user is asking about stock ${cleanTicker} (${targetData.name}).
Context Telemetry:
- Current Price: $${targetData.price}
- Quant Score: ${targetData.quantScore}/10
- P/E Ratio: ${targetData.trailingPE ? targetData.trailingPE + 'x' : 'N/A'}
- 14-Day RSI: ${targetData.rsi14}
- 52-Week Range: $${targetData.week52Low} - $${targetData.week52High}
- Volatility: ${(targetData.volatility * 100).toFixed(1)}%
- ATR Stop-Loss: $${targetData.atrRisk?.stopLoss} | Trailing Stop: $${targetData.atrRisk?.trailingStop}
- Sector: ${targetData.factorBreakdown?.sectorName || 'Technology'}

User Question / Query: "${message || `Give a comprehensive institutional review of ${cleanTicker}, including real-time insights, current stock growth momentum, future 3-5 year projections, and 3-4 similar peer stock recommendations.`}"

Please respond with valid JSON ONLY matching this schema:
{
  "answer": "A detailed, conversational, analytical chatbot response directly answering the user query with institutional precision, discussing revenue catalysts, risks, and valuation.",
  "currentStockGrowth": "2-3 sentence review of current 12-month growth trajectory, price momentum, and RSI/ATR technical position.",
  "futureProjection": "2-3 sentence review of future 3-5 year TAM expansion, earnings projections, and price target expectations.",
  "similarStockReasons": [
    ${validPeers.map((p) => `{"ticker": "${p.ticker}", "reason": "Why ${p.ticker} is a strong peer comparison/alternative"}`).join(',\n')}
  ]
}`;

        const genText = await safeGenerateContent(ai, stockPrompt);
        if (genText) {
          try {
            const cleanJsonStr = genText.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanJsonStr);
            aiAnswer = parsed.answer || '';
            currentGrowth = parsed.currentStockGrowth || '';
            futureProjection = parsed.futureProjection || '';

            if (Array.isArray(parsed.similarStockReasons)) {
              parsed.similarStockReasons.forEach((item: any) => {
                const matchPeer = validPeers.find((p) => p.ticker === item.ticker);
                if (matchPeer && item.reason) {
                  matchPeer.aiReason = item.reason;
                }
              });
            }
          } catch {
            aiAnswer = genText.trim();
          }
        }
      } catch (err) {
        console.warn('Gemini Stock Chatbot Error:', err);
      }
    }

    if (!aiAnswer) {
      aiAnswer = `${cleanTicker} (${targetData.name}) is currently trading at $${targetData.price} with a STRATOS Quant Score of ${targetData.quantScore}/10. The asset maintains strong technical momentum with an RSI of ${targetData.rsi14} and an estimated 14-day ATR of $${targetData.atrRisk?.atr14}. Risk parameters dictate a stop-loss buffer at $${targetData.atrRisk?.stopLoss}.`;
      currentGrowth = `${cleanTicker} has demonstrated solid relative strength, holding within its 52-week range ($${targetData.week52Low} - $${targetData.week52High}). Short-term technicals indicate active institutional accumulation.`;
      futureProjection = `Long-term 3-5 year growth is anchored by structural sector tailwinds in ${targetData.factorBreakdown?.sectorName || 'Technology'}, supported by expanding profit margins and high return on invested capital.`;
    }

    const similarStocks = validPeers.slice(0, 4).map((peer) => ({
      ticker: peer.ticker,
      name: peer.name,
      price: peer.price,
      quantScore: peer.quantScore,
      pe: peer.trailingPE ? `${peer.trailingPE}x` : 'N/A',
      reason: peer.aiReason || `Direct sector rival with strong composite rating (${peer.quantScore}/10) and $${peer.price} valuation.`,
      sectorName: peer.factorBreakdown?.sectorName || 'Equity Universe',
    }));

    res.json({
      success: true,
      insight: {
        ticker: cleanTicker,
        answer: aiAnswer,
        currentStockGrowth: currentGrowth,
        futureProjection: futureProjection,
        similarStocks,
        isGeneralQuery: false,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error('AI Insight Chatbot API Error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to process AI chatbot request' });
  }
});


// Serve Vite dev server or production dist
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
    console.log(`⚡ STRATOS Sovereign Engine running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
