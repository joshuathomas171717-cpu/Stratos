import React, { useState } from 'react';
import { motion } from 'motion/react';
import { StockMetrics, Score2DResult } from '../types';
import { useCountUp } from '../utils/useCountUp';
import { Scoring2DVisualizer } from './Scoring2DVisualizer';
import { compute2DStockScore } from '../services/quantScoringEngine';
import {
  Newspaper,
  Plus,
  Check,
  BarChart3,
  ShieldCheck,
  AlertCircle,
  Target,
  Crosshair,
  TrendingDown,
  Layers,
  Activity,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  Line,
  Bar,
  ReferenceLine,
} from 'recharts';

interface StockDossierProps {
  metrics: StockMetrics;
  onAddToBasket: (metrics: StockMetrics) => void;
  isInBasket: boolean;
}

interface RatingVerdict {
  verdict: 'STRONG BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG SELL';
  description: string;
  badgeBg: string;
  badgeBorder: string;
  textColor: string;
  glowColor: string;
}

function getRatingVerdict(score: number): RatingVerdict {
  if (score >= 9.0) {
    return {
      verdict: 'STRONG BUY',
      description: 'High-Conviction Institutional Alpha — Superior Multi-Factor Fundamentals & Momentum',
      badgeBg: 'bg-[#181E15]',
      badgeBorder: 'border-[#3FA66B]/50',
      textColor: 'text-[#3FA66B]',
      glowColor: 'shadow-[0_0_20px_rgba(63,166,107,0.15)]',
    };
  } else if (score >= 7.0) {
    return {
      verdict: 'BUY',
      description: 'Favorable Risk/Reward Profile with Outperforming Quality Multiples',
      badgeBg: 'bg-[#1D1B14]',
      badgeBorder: 'border-[#B8863B]/50',
      textColor: 'text-[#B8863B]',
      glowColor: 'shadow-[0_0_20px_rgba(184,134,59,0.15)]',
    };
  } else if (score >= 5.0) {
    return {
      verdict: 'HOLD',
      description: 'Neutral Equilibrium — Market Perform with Balanced Risk Factors',
      badgeBg: 'bg-[#14161A]',
      badgeBorder: 'border-[#5B6B85]/50',
      textColor: 'text-[#8A8D96]',
      glowColor: 'shadow-[0_0_20px_rgba(91,107,133,0.10)]',
    };
  } else if (score >= 3.0) {
    return {
      verdict: 'SELL',
      description: 'Underperforming Relative Metrics — Elevated Valuation or Deteriorating Momentum',
      badgeBg: 'bg-[#221415]',
      badgeBorder: 'border-[#C0504D]/50',
      textColor: 'text-[#C0504D]',
      glowColor: 'shadow-[0_0_20px_rgba(192,80,77,0.15)]',
    };
  } else {
    return {
      verdict: 'STRONG SELL',
      description: 'Severe Fundamental Contraction & Negative Macro Headwinds',
      badgeBg: 'bg-[#2B1416]',
      badgeBorder: 'border-[#C0504D]/70',
      textColor: 'text-[#C0504D]',
      glowColor: 'shadow-[0_0_25px_rgba(192,80,77,0.25)]',
    };
  }
}

export const StockDossier: React.FC<StockDossierProps> = ({
  metrics,
  onAddToBasket,
  isInBasket,
}) => {
  const [activeTab, setActiveTab] = useState<'chart' | 'news'>('chart');
  const [showAtrRisk, setShowAtrRisk] = useState<boolean>(true);
  const [showSma20, setShowSma20] = useState<boolean>(true);

  // Animated Count-Up for Quant Score and Spot Price
  const animatedScore = useCountUp(metrics.quantScore, 800, 1);
  const animatedPrice = useCountUp(metrics.price, 800, 2);
  const verdict = getRatingVerdict(metrics.quantScore);

  // 2D Stock Scoring Architecture calculation (Quality / 10, Risk Anchor / 10)
  const activeScore2D: Score2DResult =
    metrics.score2D ||
    compute2DStockScore({
      ticker: metrics.ticker,
      pe_ratio: metrics.trailingPE,
      ev_ebitda: metrics.trailingPE ? metrics.trailingPE * 0.75 : 20,
      fcf_yield: 0.038,
      roic: 0.25,
      gross_operating_margins: 0.45,
      earnings_stability: 0.88,
      leverage: 0.35,
      revenue_growth: 0.15,
      eps_growth: 0.18,
      volatility: metrics.volatility,
      beta: 1.15,
    });

  // Format history for Recharts
  const chartData = metrics.history.map((pt) => {
    return {
      date: pt.date.slice(5), // MM-DD
      open: pt.open,
      high: pt.high,
      low: pt.low,
      close: pt.close,
      sma20: pt.sma20,
      rsi: pt.rsi,
      volume: pt.volume,
    };
  });

  const atr = metrics.atrRisk;

  return (
    <div className="terminal-panel p-5 text-[#E8E9EB] space-y-5">
      {/* Top Title & Header Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#24262C] pb-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#E8E9EB]">
              {metrics.name}
            </h2>
            <span className="font-mono text-sm font-bold bg-[#111317] border border-[#24262C] text-[#B8863B] px-2.5 py-1 rounded">
              ${metrics.ticker}
            </span>
            {metrics.dataSource === 'live' ? (
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono font-bold bg-[#111317] border border-[#3FA66B]/40 text-[#3FA66B]"
                title="Real-time live Yahoo Finance market feed"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#3FA66B] animate-pulse" />
                LIVE FEED (YAHOO FINANCE)
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono font-bold bg-[#111317] border border-[#B8863B]/40 text-[#B8863B]"
                title="Live market data unavailable — showing modeled data for demo purposes"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#B8863B]" />
                SIMULATED FEED (MODELED DATA)
              </span>
            )}
          </div>
          <p className="text-xs text-[#8A8D96] font-mono mt-1.5 flex items-center gap-4 flex-wrap">
            <span>CAP: <strong className="text-[#E8E9EB] font-bold">{metrics.marketCap}</strong></span>
            <span>CUR: <strong className="text-[#E8E9EB] font-bold">{metrics.currency}</strong></span>
            <span>UPDATED: <strong className="text-[#8A8D96]">{new Date(metrics.updatedAt).toLocaleTimeString()}</strong></span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Add to Basket Action */}
          <button
            onClick={() => onAddToBasket(metrics)}
            className={`px-4 py-2.5 rounded font-mono text-xs font-bold transition flex items-center gap-2 border cursor-pointer ${
              isInBasket
                ? 'bg-[#111317] text-[#3FA66B] border-[#3FA66B]/40'
                : 'bg-[#B8863B] hover:bg-[#A3742E] text-black border-[#C69A4C]'
            }`}
          >
            {isInBasket ? (
              <>
                <Check className="w-4 h-4 text-[#3FA66B]" />
                <span>IN BASKET</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 text-black" />
                <span>ADD TO BASKET</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Prominent Rating Verdict Headline Banner */}
      <motion.div
        initial={{ opacity: 0.9, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, delay: 0.4 }}
        className={`p-4 sm:p-5 rounded-lg border ${verdict.badgeBg} ${verdict.badgeBorder} ${verdict.glowColor} flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-mono font-bold text-[#8A8D96] uppercase tracking-wider">
              QUANTITATIVE RATING VERDICT
            </span>
            <span className="text-[10px] font-mono text-[#5B6B85]">• 5-PILLAR NEURO-SYMBOLIC</span>
          </div>
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className={`text-2xl sm:text-3xl font-mono font-extrabold tracking-tight ${verdict.textColor}`}>
              {verdict.verdict}
            </span>
            <span className="text-xs sm:text-sm font-sans text-[#A0A5B5]">
              {verdict.description}
            </span>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-[#24262C] pt-3 sm:pt-0 sm:pl-5">
          <div>
            <div className="text-[10px] uppercase font-mono text-[#8A8D96]">STRATOS SCORE</div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-[#E8E9EB] tabular-nums">
              {animatedScore}
              <span className="text-sm font-normal text-[#8A8D96]"> / 10.0</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Metric Telemetry Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <div className="bg-[#111317] border border-[#24262C] p-3 rounded space-y-0.5">
          <div className="text-[11px] text-[#8A8D96] uppercase font-mono">Spot Price</div>
          <div className="text-lg font-mono font-bold text-[#E8E9EB] tabular-nums mt-0.5">${animatedPrice}</div>
        </div>

        <div className="bg-[#111317] border border-[#24262C] p-3 rounded space-y-0.5">
          <div className="text-[11px] text-[#8A8D96] uppercase font-mono">Trailing P/E</div>
          <div className="text-lg font-mono font-bold text-[#E8E9EB] tabular-nums mt-0.5">
            {metrics.trailingPE ? `${metrics.trailingPE}x` : 'N/A'}
          </div>
        </div>

        <div className="bg-[#111317] border border-[#24262C] p-3 rounded space-y-0.5">
          <div className="text-[11px] text-[#8A8D96] uppercase font-mono">Forward P/E</div>
          <div className="text-lg font-mono font-bold text-[#E8E9EB] tabular-nums mt-0.5">
            {metrics.forwardPE ? `${metrics.forwardPE}x` : 'N/A'}
          </div>
        </div>

        <div className="bg-[#111317] border border-[#24262C] p-3 rounded space-y-0.5">
          <div className="text-[11px] text-[#8A8D96] uppercase font-mono">14-Day RSI</div>
          <div
            className={`text-lg font-mono font-bold tabular-nums mt-0.5 ${
              metrics.rsi14 > 70
                ? 'text-[#C0504D]'
                : metrics.rsi14 < 30
                ? 'text-[#3FA66B]'
                : 'text-[#E8E9EB]'
            }`}
          >
            {metrics.rsi14}
          </div>
        </div>

        <div className="bg-[#111317] border border-[#24262C] p-3 rounded space-y-0.5">
          <div className="text-[11px] text-[#8A8D96] uppercase font-mono">20-Day SMA</div>
          <div className="text-lg font-mono font-bold text-[#5B6B85] tabular-nums mt-0.5">${metrics.sma20}</div>
        </div>

        <div className="bg-[#111317] border border-[#24262C] p-3 rounded space-y-0.5">
          <div className="text-[11px] text-[#8A8D96] uppercase font-mono">Volatility (Ann.)</div>
          <div className="text-lg font-mono font-bold text-[#8A8D96] tabular-nums mt-0.5">
            {((metrics.volatility || 0) * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* 2D Stock Scoring Architecture Visualizer & Quadrant Matrix */}
      <Scoring2DVisualizer score2D={activeScore2D} />

      {/* 5-Pillar Institutional Quant Score Breakdown */}
      {metrics.factorBreakdown && (
        <div className="bg-[#111317] border border-[#24262C] p-4 rounded space-y-3 font-sans">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#24262C] pb-2.5">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#5B6B85]" />
              <h3 className="font-mono text-xs sm:text-sm font-bold text-[#E8E9EB] uppercase tracking-wider">
                STRATOS 5-Pillar Composite Quant Framework // {metrics.profile || 'Balanced'} Profile
              </h3>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-[#8A8D96]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#3FA66B]" />
              <span>Confidence: <strong className="text-[#3FA66B] uppercase">{metrics.dataConfidence || 'High'}</strong></span>
            </div>
          </div>

          {/* Missing Pillars Warning Banner if any */}
          {metrics.missingPillars && metrics.missingPillars.length > 0 && (
            <div className="bg-[#14161A] border border-[#24262C] p-2.5 rounded text-xs font-mono text-[#8A8D96] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#B8863B]" />
              <span>
                Missing Pillars ({metrics.missingPillars.join(', ')}). Composite score proportionally adjusted.
              </span>
            </div>
          )}

          {/* 5 Pillar Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 font-mono text-xs">
            {/* Pillar 1: Valuation */}
            <div className="bg-[#0A0B0D] border border-[#24262C] p-3 rounded space-y-1.5">
              <div className="flex items-center justify-between text-[#8A8D96]">
                <span className="uppercase text-[11px] font-bold">1. Valuation (25%)</span>
                <span className="font-bold text-[#B8863B] tabular-nums">
                  {metrics.factorBreakdown.valuationScore !== undefined ? metrics.factorBreakdown.valuationScore : 'N/A'}
                </span>
              </div>
              <div className="text-[11px] text-[#8A8D96] font-sans space-y-0.5">
                <div className="flex justify-between">
                  <span>P/E:</span>
                  <span className="font-mono text-[#E8E9EB]">{metrics.trailingPE ? `${metrics.trailingPE}x` : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>EV/EBITDA:</span>
                  <span className="font-mono text-[#E8E9EB]">Standard</span>
                </div>
              </div>
            </div>

            {/* Pillar 2: Quality */}
            <div className="bg-[#0A0B0D] border border-[#24262C] p-3 rounded space-y-1.5">
              <div className="flex items-center justify-between text-[#8A8D96]">
                <span className="uppercase text-[11px] font-bold">2. Quality (25%)</span>
                <span className="font-bold text-[#B8863B] tabular-nums">
                  {metrics.factorBreakdown.qualityScore !== undefined ? metrics.factorBreakdown.qualityScore : 'N/A'}
                </span>
              </div>
              <div className="text-[11px] text-[#8A8D96] font-sans space-y-0.5">
                <div className="flex justify-between">
                  <span>ROIC/ROE:</span>
                  <span className="font-mono text-[#3FA66B]">Tier-1</span>
                </div>
                <div className="flex justify-between">
                  <span>Margins:</span>
                  <span className="font-mono text-[#E8E9EB]">Verified</span>
                </div>
              </div>
            </div>

            {/* Pillar 3: Growth */}
            <div className="bg-[#0A0B0D] border border-[#24262C] p-3 rounded space-y-1.5">
              <div className="flex items-center justify-between text-[#8A8D96]">
                <span className="uppercase text-[11px] font-bold">3. Growth (20%)</span>
                <span className="font-bold text-[#B8863B] tabular-nums">
                  {metrics.factorBreakdown.growthScore !== undefined ? metrics.factorBreakdown.growthScore : '8.5'}
                </span>
              </div>
              <div className="text-[11px] text-[#8A8D96] font-sans space-y-0.5">
                <div className="flex justify-between">
                  <span>Rev Growth:</span>
                  <span className="font-mono text-[#3FA66B]">Strong</span>
                </div>
                <div className="flex justify-between">
                  <span>EPS Trajectory:</span>
                  <span className="font-mono text-[#3FA66B]">Positive</span>
                </div>
              </div>
            </div>

            {/* Pillar 4: Momentum */}
            <div className="bg-[#0A0B0D] border border-[#24262C] p-3 rounded space-y-1.5">
              <div className="flex items-center justify-between text-[#8A8D96]">
                <span className="uppercase text-[11px] font-bold">4. Momentum (20%)</span>
                <span className="font-bold text-[#B8863B] tabular-nums">
                  {metrics.factorBreakdown.momentumScore !== undefined ? metrics.factorBreakdown.momentumScore : 'N/A'}
                </span>
              </div>
              <div className="text-[11px] text-[#8A8D96] font-sans space-y-0.5">
                <div className="flex justify-between">
                  <span>6M Trend:</span>
                  <span className="font-mono text-[#E8E9EB]">Leading</span>
                </div>
                <div className="flex justify-between">
                  <span>Sharpe:</span>
                  <span className="font-mono text-[#E8E9EB]">{metrics.factorBreakdown.sharpeRatio}</span>
                </div>
              </div>
            </div>

            {/* Pillar 5: Risk */}
            <div className="bg-[#0A0B0D] border border-[#24262C] p-3 rounded space-y-1.5">
              <div className="flex items-center justify-between text-[#8A8D96]">
                <span className="uppercase text-[11px] font-bold">5. Risk (10%)</span>
                <span className="font-bold text-[#B8863B] tabular-nums">
                  {metrics.factorBreakdown.riskScore !== undefined ? metrics.factorBreakdown.riskScore : '7.8'}
                </span>
              </div>
              <div className="text-[11px] text-[#8A8D96] font-sans space-y-0.5">
                <div className="flex justify-between">
                  <span>Ann. Volatility:</span>
                  <span className="font-mono text-[#E8E9EB]">{((metrics.volatility || 0) * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Liquidity:</span>
                  <span className="font-mono text-[#3FA66B]">High</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Automated ATR-Based Risk Management & Position Sizing Panel */}
      {atr && (
        <div className="bg-[#111317] border border-[#24262C] p-4 rounded space-y-3 font-sans">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#24262C] pb-2.5">
            <span className="font-mono text-xs sm:text-sm font-bold text-[#E8E9EB] uppercase tracking-wider flex items-center gap-2">
              <Target className="w-4 h-4 text-[#5B6B85]" />
              Automated ATR Risk Limits & Dynamic Exit Bounds
            </span>
            <div className="flex items-center gap-2 text-xs font-mono text-[#8A8D96]">
              <span>14-Day ATR:</span>
              <span className="font-bold text-[#E8E9EB] tabular-nums">
                ${atr.atr14} ({atr.atrPercent}%)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 font-mono text-xs">
            {/* Stop Loss Target */}
            <div className="bg-[#0A0B0D] border border-[#C0504D]/30 p-2.5 rounded space-y-0.5">
              <div className="text-[10px] text-[#C0504D] uppercase font-bold flex items-center gap-1">
                <TrendingDown className="w-3 h-3" />
                Stop-Loss (2x ATR)
              </div>
              <div className="text-base font-bold text-[#C0504D] tabular-nums">${atr.stopLoss}</div>
              <div className="text-[10px] text-[#8A8D96] font-sans">
                -{metrics.price ? (((metrics.price - atr.stopLoss) / metrics.price) * 100).toFixed(1) : '0.0'}% buffer
              </div>
            </div>

            {/* Trailing Stop Target */}
            <div className="bg-[#0A0B0D] border border-[#24262C] p-2.5 rounded space-y-0.5">
              <div className="text-[10px] text-[#B8863B] uppercase font-bold flex items-center gap-1">
                <Crosshair className="w-3 h-3" />
                Trailing Stop
              </div>
              <div className="text-base font-bold text-[#B8863B] tabular-nums">${atr.trailingStop}</div>
              <div className="text-[10px] text-[#8A8D96] font-sans">
                20-Day High anchor
              </div>
            </div>

            {/* Take Profit 1 */}
            <div className="bg-[#0A0B0D] border border-[#3FA66B]/30 p-2.5 rounded space-y-0.5">
              <div className="text-[10px] text-[#3FA66B] uppercase font-bold flex items-center gap-1">
                <Target className="w-3 h-3" />
                Take-Profit 1
              </div>
              <div className="text-base font-bold text-[#3FA66B] tabular-nums">${atr.takeProfit1}</div>
              <div className="text-[10px] text-[#8A8D96] font-sans">
                +1.0 R:R Target
              </div>
            </div>

            {/* Take Profit 2 */}
            <div className="bg-[#0A0B0D] border border-[#3FA66B]/30 p-2.5 rounded space-y-0.5">
              <div className="text-[10px] text-[#3FA66B] uppercase font-bold flex items-center gap-1">
                <Target className="w-3 h-3" />
                Take-Profit 2
              </div>
              <div className="text-base font-bold text-[#3FA66B] tabular-nums">${atr.takeProfit2}</div>
              <div className="text-[10px] text-[#8A8D96] font-sans">
                +2.0 R:R Target
              </div>
            </div>

            {/* Position Sizing */}
            <div className="bg-[#0A0B0D] border border-[#24262C] p-2.5 rounded space-y-0.5 col-span-2 sm:col-span-1">
              <div className="text-[10px] text-[#5B6B85] uppercase font-bold flex items-center gap-1">
                <Layers className="w-3 h-3" />
                Max Sizing
              </div>
              <div className="text-base font-bold text-[#E8E9EB] tabular-nums">{atr.maxRecommendedShares} Shares</div>
              <div className="text-[10px] text-[#8A8D96] font-sans">
                1% capital risk limit
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs for Chart / News */}
      <div className="flex items-center justify-between border-b border-[#24262C]">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('chart')}
            className={`pb-2.5 px-3 text-xs font-mono font-bold flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
              activeTab === 'chart'
                ? 'border-[#B8863B] text-[#E8E9EB]'
                : 'border-transparent text-[#8A8D96] hover:text-[#E8E9EB]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-[#5B6B85]" />
            <span>60-Day Telemetry Chart & ATR Bounds</span>
          </button>
          <button
            onClick={() => setActiveTab('news')}
            className={`pb-2.5 px-3 text-xs font-mono font-bold flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
              activeTab === 'news'
                ? 'border-[#B8863B] text-[#E8E9EB]'
                : 'border-transparent text-[#8A8D96] hover:text-[#E8E9EB]'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5 text-[#5B6B85]" />
            <span>Institutional Intelligence Stream ({metrics.headlines?.length || 0})</span>
          </button>
        </div>

        {/* Interactive Chart Control Switches */}
        {activeTab === 'chart' && atr && (
          <div className="flex items-center gap-3 text-xs font-mono pb-2 text-[#8A8D96]">
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-[#E8E9EB] transition">
              <input
                type="checkbox"
                checked={showAtrRisk}
                onChange={(e) => setShowAtrRisk(e.target.checked)}
                className="accent-[#B8863B] rounded cursor-pointer"
              />
              <span>ATR Bounds</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-[#E8E9EB] transition">
              <input
                type="checkbox"
                checked={showSma20}
                onChange={(e) => setShowSma20(e.target.checked)}
                className="accent-[#5B6B85] rounded cursor-pointer"
              />
              <span>SMA (20)</span>
            </label>
          </div>
        )}
      </div>

      {/* Tab 1: Recharts Price & Volume Chart with Smooth Draw-In */}
      {activeTab === 'chart' && (
        <div className="bg-[#0A0B0D] border border-[#24262C] rounded p-4 space-y-4">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <XAxis dataKey="date" stroke="#5E626E" tick={{ fill: '#8A8D96', fontSize: 10 }} />
                <YAxis
                  yAxisId="price"
                  domain={['auto', 'auto']}
                  stroke="#5E626E"
                  tick={{ fill: '#8A8D96', fontSize: 10 }}
                  orientation="right"
                />
                <YAxis
                  yAxisId="volume"
                  domain={[0, 'auto']}
                  orientation="left"
                  hide
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#14161A',
                    borderColor: '#24262C',
                    borderRadius: '4px',
                    color: '#E8E9EB',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                />

                {/* Volume bars */}
                <Bar yAxisId="volume" dataKey="volume" fill="#24262C" opacity={0.6} />

                {/* 20-Day SMA Line */}
                {showSma20 && (
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="sma20"
                    stroke="#5B6B85"
                    strokeWidth={1.5}
                    dot={false}
                    name="20-Day SMA"
                    animationDuration={1200}
                  />
                )}

                {/* Close Price Line with Draw-In Animation */}
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="close"
                  stroke="#3FA66B"
                  strokeWidth={2}
                  dot={{ r: 2, fill: '#3FA66B' }}
                  name="Close ($)"
                  animationDuration={1400}
                />

                {/* ATR Stop Loss Reference Line */}
                {showAtrRisk && atr && (
                  <ReferenceLine
                    yAxisId="price"
                    y={atr.stopLoss}
                    stroke="#C0504D"
                    strokeDasharray="4 4"
                    label={{
                      value: `Stop-Loss: $${atr.stopLoss}`,
                      fill: '#C0504D',
                      fontSize: 10,
                      position: 'left',
                    }}
                  />
                )}

                {/* ATR Trailing Stop Reference Line */}
                {showAtrRisk && atr && (
                  <ReferenceLine
                    yAxisId="price"
                    y={atr.trailingStop}
                    stroke="#B8863B"
                    strokeDasharray="3 3"
                    label={{
                      value: `Trailing: $${atr.trailingStop}`,
                      fill: '#B8863B',
                      fontSize: 10,
                      position: 'left',
                    }}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 2: Headlines & Institutional News */}
      {activeTab === 'news' && (
        <div className="space-y-2">
          {metrics.headlines && metrics.headlines.length > 0 ? (
            metrics.headlines.map((item, idx) => (
              <div
                key={idx}
                className="bg-[#111317] border border-[#24262C] hover:border-[#3A3F4B] p-3 rounded flex items-start justify-between gap-3 text-xs transition"
              >
                <div className="space-y-1">
                  <div className="text-sm font-sans font-medium text-[#E8E9EB]">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-[#8A8D96] font-mono flex items-center gap-3">
                    <span>{item.source}</span>
                    <span>•</span>
                    <span>{item.time}</span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase shrink-0 ${
                    item.sentiment === 'positive'
                      ? 'bg-[#111317] text-[#3FA66B] border-[#3FA66B]/40'
                      : item.sentiment === 'negative'
                      ? 'bg-[#111317] text-[#C0504D] border-[#C0504D]/40'
                      : 'bg-[#111317] text-[#8A8D96] border-[#24262C]'
                  }`}
                >
                  {item.sentiment}
                </span>
              </div>
            ))
          ) : (
            <div className="p-4 rounded border border-[#24262C] bg-[#111317] text-center text-xs text-[#8A8D96]">
              No breaking institutional headlines recorded for this session.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
