import React, { useState, useEffect } from 'react';
import { Activity, Terminal, Shield, MessageSquare, Layers } from 'lucide-react';

interface HeaderProps {
  basketCount: number;
  onToggleAiInsight?: () => void;
  currentTicker?: string;
  currentScore?: number;
  currentPrice?: number;
  isVerified?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  basketCount,
  onToggleAiInsight,
  currentTicker = 'NVDA',
  currentScore,
  currentPrice,
  isVerified = false,
}) => {
  const [utcTime, setUtcTime] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().slice(17, 25) + ' UTC');
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-[#14161A] border-b border-[#24262C] px-4 lg:px-6 py-2.5 text-[#E8E9EB]">
      <div className="max-w-[1700px] w-full mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Brand Terminal Wordmark */}
        <div className="flex items-center justify-between md:justify-start gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#1A1D23] border border-[#24262C] flex items-center justify-center text-[#B8863B]">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg font-bold tracking-tight text-[#E8E9EB]">STRATOS</span>
                <span className="text-[10px] font-mono font-medium tracking-widest text-[#B8863B] uppercase border border-[#B8863B]/30 px-1.5 py-0.5 rounded">
                  SOVEREIGN TERMINAL
                </span>
                <span className="hidden sm:inline-block text-[10px] font-mono text-[#8A8D96] border-l border-[#24262C] pl-2">
                  GEMINI 3.7 FLASH QUANT INTELLIGENCE
                </span>
              </div>
              <p className="text-[11px] text-[#8A8D96] font-sans hidden lg:block">
                Neuro-Symbolic Double-Verification & Multi-Pillar Quantitative Allocation
              </p>
            </div>
          </div>

          {/* Quick Action Triggers for Mobile */}
          <div className="flex items-center gap-1.5 md:hidden">
            {onToggleAiInsight && (
              <button
                onClick={onToggleAiInsight}
                className="px-2.5 py-1 rounded bg-[#1A1D23] hover:bg-[#24262C] border border-[#24262C] text-[#E8E9EB] font-mono text-xs flex items-center gap-1 transition cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#5B6B85]" />
                <span>AI</span>
              </button>
            )}
          </div>
        </div>

        {/* Global Terminal Telemetry Ribbon */}
        <div className="flex items-center flex-wrap gap-2 text-xs font-mono text-[#8A8D96]">
          {/* Active Target */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#111317] border border-[#24262C] rounded">
            <span className="text-[#5B6B85] font-semibold">TGT:</span>
            <span className="font-bold text-[#E8E9EB] tabular-nums">${currentTicker}</span>
            {currentPrice !== undefined && (
              <span className="text-[#3FA66B] font-bold tabular-nums">(${currentPrice})</span>
            )}
          </div>

          {/* Quant Rating */}
          {currentScore !== undefined && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#111317] border border-[#24262C] rounded">
              <span className="text-[#5B6B85] font-semibold">QUANT:</span>
              <span className="font-bold text-[#B8863B] tabular-nums">{currentScore}/10.0</span>
            </div>
          )}

          {/* Basket Telemetry */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#111317] border border-[#24262C] rounded">
            <Layers className="w-3.5 h-3.5 text-[#5B6B85]" />
            <span className="text-[#5B6B85] font-semibold">BASKET:</span>
            <span className="font-bold text-[#E8E9EB] tabular-nums">{basketCount}</span>
          </div>

          {/* Verification Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#111317] border border-[#24262C] rounded">
            <Shield className="w-3.5 h-3.5 text-[#5B6B85]" />
            <span className="text-[#5B6B85] font-semibold">STATUS:</span>
            <span className={`font-bold uppercase text-[11px] ${isVerified ? 'text-[#3FA66B]' : 'text-[#8A8D96]'}`}>
              {isVerified ? 'VERIFIED' : 'UNVERIFIED'}
            </span>
          </div>

          {/* Live UTC Clock */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-[#111317] border border-[#24262C] rounded text-[#8A8D96]">
            <Activity className="w-3 h-3 text-[#3FA66B]" />
            <span className="tabular-nums font-mono text-[11px]">{utcTime}</span>
          </div>

          {/* AI Terminal Trigger */}
          {onToggleAiInsight && (
            <button
              onClick={onToggleAiInsight}
              className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-[#1A1D23] hover:bg-[#24262C] border border-[#24262C] hover:border-[#5B6B85] text-[#E8E9EB] font-mono text-xs rounded transition cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#5B6B85]" />
              <span>Ask Analyst (${currentTicker})</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
