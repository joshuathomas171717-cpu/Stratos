import React, { useState } from 'react';
import { AgentDebate } from '../types';
import { TrendingUp, AlertTriangle, Scale, RefreshCw, Copy, Check, ShieldCheck, Zap } from 'lucide-react';

interface AgentCorridorProps {
  debate: AgentDebate;
  ticker: string;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const AgentCorridor: React.FC<AgentCorridorProps> = ({
  debate,
  ticker,
  onRefresh,
  isLoading = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = `STRATOS INSTITUTIONAL MULTI-AGENT DEBATE // $${ticker}\n\n[BULL ANALYST // GROWTH CATALYSTS]\n${debate.bullThesis}\n\n[BEAR CRITIC // INSTITUTIONAL RISKS]\n${debate.bearCritic}\n\nGenerated: ${debate.generatedAt || new Date().toISOString()}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="terminal-panel p-5 text-[#E8E9EB] space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#24262C] pb-3 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-[#1A1D23] border border-[#24262C] flex items-center justify-center text-[#B8863B]">
            <Scale className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-serif text-base sm:text-lg font-bold tracking-tight text-[#E8E9EB]">
              Multi-Agent Debate Corridor // ${ticker}
            </h3>
            <p className="text-[11px] text-[#8A8D96] font-sans">
              Dual-perspective adversarial synthesis powered by Gemini 3.7 Flash
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="px-2.5 py-1 rounded bg-[#1A1D23] hover:bg-[#24262C] text-[#8A8D96] hover:text-[#E8E9EB] text-xs font-mono transition border border-[#24262C] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Regenerate debate analysis"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-[#B8863B]' : ''}`} />
              <span>{isLoading ? 'Synthesizing...' : 'Re-run Debate'}</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="px-2.5 py-1 rounded bg-[#1A1D23] hover:bg-[#24262C] text-[#8A8D96] hover:text-[#E8E9EB] text-xs font-mono transition border border-[#24262C] flex items-center gap-1.5 cursor-pointer"
            title="Copy institutional summary"
          >
            {copied ? <Check className="w-3 h-3 text-[#3FA66B]" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Export Brief'}</span>
          </button>
        </div>
      </div>

      {/* Corridor Visual Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bull Analyst Panel */}
        <div className="bg-[#111317] border border-[#3FA66B]/30 rounded p-4 space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#3FA66B]/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between border-b border-[#24262C] pb-2 relative z-10">
            <div className="flex items-center gap-2 text-[#3FA66B] font-mono text-xs font-bold uppercase tracking-wider">
              <TrendingUp className="w-4 h-4" />
              <span>AGENT // BULL ANALYST</span>
            </div>
            <span className="text-[10px] font-mono text-[#3FA66B] bg-[#3FA66B]/10 border border-[#3FA66B]/30 px-2 py-0.5 rounded font-bold">
              GROWTH CATALYSTS
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#E8E9EB] leading-relaxed font-sans font-normal relative z-10">
            {debate.bullThesis}
          </p>
          <div className="pt-2 border-t border-[#24262C]/60 flex items-center justify-between text-[10px] font-mono text-[#8A8D96]">
            <span className="flex items-center gap-1 text-[#3FA66B]">
              <Zap className="w-3 h-3" />
              <span>MOMENTUM & VALUE DRIVER</span>
            </span>
            <span>INSTITUTIONAL UPSIDE</span>
          </div>
        </div>

        {/* Bear Critic Panel */}
        <div className="bg-[#111317] border border-[#C0504D]/30 rounded p-4 space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#C0504D]/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between border-b border-[#24262C] pb-2 relative z-10">
            <div className="flex items-center gap-2 text-[#C0504D] font-mono text-xs font-bold uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" />
              <span>AGENT // BEAR CRITIC</span>
            </div>
            <span className="text-[10px] font-mono text-[#C0504D] bg-[#C0504D]/10 border border-[#C0504D]/30 px-2 py-0.5 rounded font-bold">
              DOWNSIDE VULNERABILITIES
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#E8E9EB] leading-relaxed font-sans font-normal relative z-10">
            {debate.bearCritic}
          </p>
          <div className="pt-2 border-t border-[#24262C]/60 flex items-center justify-between text-[10px] font-mono text-[#8A8D96]">
            <span className="flex items-center gap-1 text-[#C0504D]">
              <ShieldCheck className="w-3 h-3" />
              <span>RISK GUARDRAILS ACTIVE</span>
            </span>
            <span>MACRO & COMPRESSION</span>
          </div>
        </div>
      </div>
    </div>
  );
};
