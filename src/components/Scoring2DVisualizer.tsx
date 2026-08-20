import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Score2DResult, GraduatedMetricScore } from '../types';
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  TrendingUp,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Layers,
} from 'lucide-react';

interface Scoring2DVisualizerProps {
  score2D: Score2DResult;
}

export const Scoring2DVisualizer: React.FC<Scoring2DVisualizerProps> = ({ score2D }) => {
  const [showSubScores, setShowSubScores] = useState<boolean>(false);
  const [activeMetricHover, setActiveMetricHover] = useState<GraduatedMetricScore | null>(null);

  const { quality, riskAnchor, positionTier, verdictLabel, tierColor, tierBg, tierBorder, tierDescription, isSpeculativeFlag, flags, riskAnchorBreakdown, qualityBreakdown } = score2D;

  // Percentage coordinates for SVG/Canvas (X: Risk Anchor 0-10 -> 0-100%, Y: Quality 0-10 -> 100-0% inverted for SVG)
  const plotX = Math.max(5, Math.min(95, (riskAnchor / 10) * 100));
  const plotY = Math.max(5, Math.min(95, 100 - (quality / 10) * 100));

  return (
    <div className="bg-[#111317] border border-[#24262C] rounded-lg p-4 sm:p-5 space-y-4 font-sans">
      {/* Top Header: 2D Coordinate Pair Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#24262C] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-[#B8863B]" />
            <h3 className="font-mono text-xs sm:text-sm font-bold text-[#E8E9EB] uppercase tracking-wider">
              2D Stock Scoring Architecture // Coordinate Pair
            </h3>
          </div>
          <p className="text-xs text-[#8A8D96]">
            Independent <strong className="text-[#E8E9EB]">Risk Anchor (Safety Filter)</strong> &amp; <strong className="text-[#E8E9EB]">Quality Engine (Growth Moat)</strong> coordinate mapping.
          </p>
        </div>

        {/* 2D Score Badges */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-[#0A0B0D] border border-[#24262C] px-3 py-1.5 rounded flex items-center gap-2">
            <span className="text-[10px] font-mono text-[#8A8D96] uppercase">Quality Score:</span>
            <span className={`text-base font-mono font-bold ${quality >= 7.0 ? 'text-[#3FA66B]' : 'text-[#B8863B]'}`}>
              {quality.toFixed(1)} <span className="text-xs text-[#8A8D96]">/ 10</span>
            </span>
          </div>

          <div className="bg-[#0A0B0D] border border-[#24262C] px-3 py-1.5 rounded flex items-center gap-2">
            <span className="text-[10px] font-mono text-[#8A8D96] uppercase">Risk Anchor:</span>
            <span className={`text-base font-mono font-bold ${riskAnchor >= 7.0 ? 'text-[#3FA66B]' : 'text-[#C0504D]'}`}>
              {riskAnchor.toFixed(1)} <span className="text-xs text-[#8A8D96]">/ 10</span>
            </span>
          </div>

          <div className={`px-3 py-1.5 rounded border text-xs font-mono font-bold ${tierBg} ${tierBorder} ${tierColor}`}>
            {verdictLabel}
          </div>
        </div>
      </div>

      {/* Speculative Growth Warning / Position Sizing Gate */}
      {isSpeculativeFlag && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1D1B14] border border-[#B8863B]/60 p-3 rounded text-xs font-mono text-[#E8E9EB] flex items-start gap-2.5"
        >
          <AlertTriangle className="w-4 h-4 text-[#B8863B] shrink-0 mt-0.5" />
          <div>
            <strong className="text-[#B8863B] uppercase">Gate Rule Activated — High Risk / Speculative Growth:</strong>
            <span className="text-[#8A8D96] ml-1.5">
              While Business Quality is elevated ({quality.toFixed(1)}/10), Risk Anchor ({riskAnchor.toFixed(1)}/10) falls below the 7.0 solvency threshold.
              Institutional sizing mandates strict position caps and trailing stops.
            </span>
          </div>
        </motion.div>
      )}

      {/* Main 2D Quadrant Matrix Visualizer & Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* Left: 2D Quadrant Scatter Plot (7 Cols) */}
        <div className="lg:col-span-7 bg-[#0A0B0D] border border-[#24262C] rounded-lg p-4 relative">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#8A8D96] mb-2">
            <span>Y-AXIS: BUSINESS QUALITY (0-10)</span>
            <span>X-AXIS: RISK ANCHOR / SOLVENCY (0-10)</span>
          </div>

          {/* Coordinate Canvas */}
          <div className="relative w-full aspect-[4/3] bg-[#111317] border border-[#24262C] rounded overflow-hidden select-none">
            {/* 4 Quadrant Background Tints */}
            {/* Top-Left: Speculative Growth */}
            <div className="absolute top-0 left-0 w-[70%] h-[30%] bg-[#B8863B]/5 border-b border-r border-[#B8863B]/20 flex items-start p-2 pointer-events-none">
              <span className="text-[10px] font-mono font-bold text-[#B8863B]/70 uppercase">
                Speculative Growth (Q ≥ 7, R &lt; 7)
              </span>
            </div>

            {/* Top-Right: Core Holding */}
            <div className="absolute top-0 right-0 w-[30%] h-[30%] bg-[#3FA66B]/10 border-b border-[#3FA66B]/30 flex items-start justify-end p-2 pointer-events-none">
              <span className="text-[10px] font-mono font-bold text-[#3FA66B] uppercase">
                ★ Core Holding (Q ≥ 7, R ≥ 7)
              </span>
            </div>

            {/* Bottom-Left: Avoid */}
            <div className="absolute bottom-0 left-0 w-[70%] h-[70%] bg-[#C0504D]/5 border-r border-[#C0504D]/20 flex items-end p-2 pointer-events-none">
              <span className="text-[10px] font-mono font-bold text-[#C0504D]/70 uppercase">
                Avoid / Speculative (Q &lt; 7, R &lt; 7)
              </span>
            </div>

            {/* Bottom-Right: Value / Contrarian */}
            <div className="absolute bottom-0 right-0 w-[30%] h-[70%] bg-[#5B6B85]/10 flex items-end justify-end p-2 pointer-events-none">
              <span className="text-[10px] font-mono font-bold text-[#5B6B85] uppercase">
                Value / Contrarian (Q &lt; 7, R ≥ 7)
              </span>
            </div>

            {/* Threshold Crosshair Reference Lines at (7.0, 7.0) */}
            {/* Vertical Line at X = 70% */}
            <div className="absolute top-0 bottom-0 left-[70%] border-r border-dashed border-[#8A8D96]/40 pointer-events-none">
              <span className="absolute bottom-1 -translate-x-1/2 text-[9px] font-mono text-[#8A8D96] bg-[#0A0B0D] px-1 rounded">
                R=7.0
              </span>
            </div>

            {/* Horizontal Line at Y = 30% (Quality = 7.0 from top) */}
            <div className="absolute left-0 right-0 top-[30%] border-b border-dashed border-[#8A8D96]/40 pointer-events-none">
              <span className="absolute left-1 -translate-y-1/2 text-[9px] font-mono text-[#8A8D96] bg-[#0A0B0D] px-1 rounded">
                Q=7.0
              </span>
            </div>

            {/* Plot Point for Current Asset */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, type: 'spring' }}
              style={{ left: `${plotX}%`, top: `${plotY}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer group"
            >
              {/* Pulsing Beacon Ring */}
              <div className="absolute inset-0 -m-3 rounded-full bg-[#B8863B] opacity-30 animate-ping" />
              
              {/* Coordinate Point */}
              <div className="relative w-5 h-5 rounded-full bg-[#E8E9EB] border-2 border-[#111317] shadow-lg flex items-center justify-center">
                <div className={`w-2.5 h-2.5 rounded-full ${quality >= 7 && riskAnchor >= 7 ? 'bg-[#3FA66B]' : quality >= 7 ? 'bg-[#B8863B]' : 'bg-[#5B6B85]'}`} />
              </div>

              {/* Hover Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-20">
                <div className="bg-[#14161A] border border-[#24262C] text-[#E8E9EB] text-xs font-mono px-3 py-1.5 rounded shadow-xl whitespace-nowrap">
                  <div className="font-bold text-[#B8863B]">${score2D.ticker}</div>
                  <div>Quality: {quality.toFixed(1)} / 10</div>
                  <div>Risk Anchor: {riskAnchor.toFixed(1)} / 10</div>
                  <div className={`font-bold mt-0.5 ${tierColor}`}>{positionTier}</div>
                </div>
                <div className="w-2 h-2 bg-[#14161A] border-r border-b border-[#24262C] rotate-45 -mt-1" />
              </div>
            </motion.div>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-[#5B6B85] mt-2">
            <span>(0.0, 0.0) High Risk / Weak Quality</span>
            <span>Current: (${score2D.ticker} → Q: {quality.toFixed(1)}, R: {riskAnchor.toFixed(1)})</span>
            <span>(10.0, 10.0) Institutional Alpha</span>
          </div>
        </div>

        {/* Right: Position Tier Brief & Action Logic (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className={`p-4 rounded-lg border ${tierBg} ${tierBorder} space-y-2`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-[#8A8D96] tracking-wider">
                POSITION SIZING MATRIX
              </span>
              <span className={`text-xs font-mono font-bold ${tierColor}`}>
                {positionTier}
              </span>
            </div>
            <p className="text-xs text-[#E8E9EB] leading-relaxed">
              {tierDescription}
            </p>
          </div>

          {/* Quick Pillar Comparison */}
          <div className="bg-[#0A0B0D] border border-[#24262C] p-3.5 rounded-lg space-y-2.5 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-[#8A8D96] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#3FA66B]" />
                Solvency Filter Status:
              </span>
              <span className={riskAnchor >= 7.0 ? 'text-[#3FA66B] font-bold' : 'text-[#C0504D] font-bold'}>
                {riskAnchor >= 7.0 ? 'PASS (≥7.0 Solvency)' : 'FAIL (<7.0 Elevated Risk)'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#8A8D96] flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#B8863B]" />
                Growth Moat Engine:
              </span>
              <span className={quality >= 7.0 ? 'text-[#3FA66B] font-bold' : 'text-[#8A8D96] font-bold'}>
                {quality >= 7.0 ? 'HIGH QUALITY (≥7.0)' : 'MODERATE / WEAK (<7.0)'}
              </span>
            </div>

            {flags.length > 0 && (
              <div className="border-t border-[#24262C] pt-2 mt-1">
                <div className="text-[10px] text-[#8A8D96] uppercase mb-1">Active Guardrail Flags ({flags.length}):</div>
                <div className="flex flex-wrap gap-1">
                  {flags.slice(0, 3).map((flag, idx) => (
                    <span
                      key={idx}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-[#14161A] border border-[#24262C] text-[#8A8D96]"
                    >
                      {flag.replace('FLAG_', '')}
                    </span>
                  ))}
                  {flags.length > 3 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#14161A] text-[#5B6B85]">
                      +{flags.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Toggle Full Sub-Score Inspector Button */}
          <button
            onClick={() => setShowSubScores(!showSubScores)}
            className="w-full py-2 px-3 rounded bg-[#14161A] hover:bg-[#1A1D23] border border-[#24262C] text-xs font-mono text-[#E8E9EB] flex items-center justify-between transition cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-[#B8863B]" />
              {showSubScores ? 'Hide Graduated Metric Breakdown' : 'Inspect 10 Graduated Sub-Scores'}
            </span>
            {showSubScores ? <ChevronUp className="w-4 h-4 text-[#8A8D96]" /> : <ChevronDown className="w-4 h-4 text-[#8A8D96]" />}
          </button>
        </div>
      </div>

      {/* Expanded Graduated Metric Sub-Scores Drawer */}
      {showSubScores && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-[#24262C] pt-4 space-y-4 font-mono"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Risk Anchor Sub-Scores (5 Metrics, Max 10 pts) */}
            <div className="bg-[#0A0B0D] border border-[#24262C] p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-between border-b border-[#24262C] pb-2">
                <span className="text-xs font-bold text-[#E8E9EB] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#3FA66B]" />
                  RISK ANCHOR SUB-SCORES (0 - 10)
                </span>
                <span className="text-xs font-bold text-[#3FA66B]">
                  {riskAnchor.toFixed(1)} / 10.0 pts
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                {[
                  riskAnchorBreakdown.netDebtEbitda,
                  riskAnchorBreakdown.interestCoverage,
                  riskAnchorBreakdown.positiveOcfYears,
                  riskAnchorBreakdown.beta,
                  riskAnchorBreakdown.marginStability,
                ].map((metric, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded bg-[#111317] border border-[#24262C] space-y-1 hover:border-[#3FA66B]/40 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[#E8E9EB]">{metric.name}</span>
                      <span className="text-[#3FA66B] font-bold">
                        {metric.pointsEarned.toFixed(2)} / {metric.maxPoints.toFixed(1)} pts
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#8A8D96]">
                      <span>Value: <strong className="text-[#E8E9EB]">{metric.displayValue}</strong></span>
                      <span className="text-[10px] text-[#5B6B85]">{metric.formulaDescription}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Quality Score Sub-Scores (5 Metrics, Max 10 pts) */}
            <div className="bg-[#0A0B0D] border border-[#24262C] p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-between border-b border-[#24262C] pb-2">
                <span className="text-xs font-bold text-[#E8E9EB] flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#B8863B]" />
                  QUALITY ENGINE SUB-SCORES (0 - 10)
                </span>
                <span className="text-xs font-bold text-[#B8863B]">
                  {quality.toFixed(1)} / 10.0 pts
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                {[
                  qualityBreakdown.grossMargin,
                  qualityBreakdown.roic,
                  qualityBreakdown.fcfToNetIncome,
                  qualityBreakdown.pegRatio,
                  qualityBreakdown.revenueCagr3Yr,
                ].map((metric, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded bg-[#111317] border border-[#24262C] space-y-1 hover:border-[#B8863B]/40 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[#E8E9EB]">{metric.name}</span>
                      <span className="text-[#B8863B] font-bold">
                        {metric.pointsEarned.toFixed(2)} / {metric.maxPoints.toFixed(1)} pts
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#8A8D96]">
                      <span>Value: <strong className="text-[#E8E9EB]">{metric.displayValue}</strong></span>
                      <span className="text-[10px] text-[#5B6B85]">{metric.formulaDescription}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
