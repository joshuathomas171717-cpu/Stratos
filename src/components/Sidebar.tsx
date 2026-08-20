import React, { useState } from 'react';
import {
  DollarSign,
  Shield,
  X,
  Plus,
  TrendingUp,
  Sliders,
  Check,
} from 'lucide-react';

export interface BasketStockItem {
  name: string;
  price: number;
  score: number;
  pe: string;
  forwardPe: string;
  rsi: number;
}

interface SidebarProps {
  basket: Record<string, BasketStockItem>;
  totalBudget: number;
  onUpdateBudget: (val: number) => void;
  onRunOptimization: () => void;
  onRemoveFromBasket: (ticker: string) => void;
  onQuickAddTicker: (ticker: string) => void;
  isLoadingOptimization: boolean;
  onGoToStep?: (stepIndex: number) => void;
}

const PRESET_TICKERS = [
  { ticker: 'NVDA', score: 9.2 },
  { ticker: 'MSFT', score: 8.4 },
  { ticker: 'AAPL', score: 7.9 },
  { ticker: 'TSM', score: 8.6 },
  { ticker: 'PLTR', score: 8.8 },
  { ticker: 'GOOGL', score: 8.2 },
];

export const Sidebar: React.FC<SidebarProps> = ({
  basket,
  totalBudget,
  onUpdateBudget,
  onRunOptimization,
  onRemoveFromBasket,
  onQuickAddTicker,
  isLoadingOptimization,
  onGoToStep,
}) => {
  const [customInput, setCustomInput] = useState('');

  const basketEntries = Object.entries(basket || {}) as [string, BasketStockItem][];
  const isReadyForVerification = basketEntries.length >= 2;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInput.trim()) {
      onQuickAddTicker(customInput.trim().toUpperCase());
      setCustomInput('');
    }
  };

  const quickBudgetOptions = [10000, 25000, 50000, 100000];

  return (
    <aside className="w-full lg:w-76 xl:w-80 shrink-0 bg-[#14161A] border-r border-[#24262C] p-4 flex flex-col gap-4 text-[#E8E9EB] font-sans lg:sticky lg:top-[53px] lg:max-h-[calc(100vh-53px)] lg:overflow-y-auto z-20">
      {/* 1. Add Asset to Basket */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between border-b border-[#24262C] pb-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#8A8D96] flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-[#5B6B85]" />
            Basket Ingestion
          </span>
          <span className="text-[10px] font-mono text-[#5B6B85]">DIRECT TICKER</span>
        </div>

        <form onSubmit={handleCustomSubmit} className="flex gap-1.5">
          <input
            type="text"
            placeholder="TICKER (e.g. AMD, TSM)..."
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            className="flex-1 bg-[#0A0B0D] border border-[#24262C] focus:border-[#5B6B85] rounded px-2.5 py-1.5 text-xs font-mono text-[#E8E9EB] placeholder:text-[#5E626E] outline-none uppercase"
          />
          <button
            type="submit"
            className="bg-[#1A1D23] hover:bg-[#24262C] border border-[#24262C] hover:border-[#5B6B85] text-[#E8E9EB] px-3 py-1.5 rounded text-xs font-mono font-semibold transition cursor-pointer"
          >
            Add
          </button>
        </form>

        {/* Quick Ticker Preset Pills */}
        <div className="grid grid-cols-3 gap-1 pt-1">
          {PRESET_TICKERS.map((item) => {
            const inBasket = !!basket[item.ticker];
            return (
              <button
                key={item.ticker}
                type="button"
                onClick={() => onQuickAddTicker(item.ticker)}
                className={`px-2 py-1 rounded text-[11px] font-mono font-medium transition flex items-center justify-between cursor-pointer border ${
                  inBasket
                    ? 'bg-[#111317] border-[#3FA66B]/50 text-[#3FA66B]'
                    : 'bg-[#111317] hover:bg-[#1A1D23] text-[#8A8D96] hover:text-[#E8E9EB] border-[#24262C]'
                }`}
                title={`Analyze & add $${item.ticker}`}
              >
                <span>${item.ticker}</span>
                <span className="text-[10px] text-[#B8863B] font-bold tabular-nums">{item.score}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-[#24262C]" />

      {/* 2. Capital Allocation Budget */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between border-b border-[#24262C] pb-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#8A8D96] flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-[#5B6B85]" />
            Capital Allocation
          </span>
          <span className="text-[10px] font-mono text-[#5B6B85]">USD ($)</span>
        </div>

        <div className="bg-[#111317] border border-[#24262C] rounded p-2.5 space-y-2">
          <div className="relative">
            <span className="absolute left-2.5 top-1.5 text-[#8A8D96] font-mono text-xs">$</span>
            <input
              type="number"
              min="1000"
              step="1000"
              value={totalBudget}
              onChange={(e) => onUpdateBudget(Number(e.target.value) || 1000)}
              className="w-full bg-[#0A0B0D] border border-[#24262C] focus:border-[#B8863B] rounded pl-6 pr-2.5 py-1 text-sm text-[#E8E9EB] font-mono font-bold tabular-nums outline-none"
            />
          </div>

          {/* Quick Increment Buttons */}
          <div className="grid grid-cols-4 gap-1">
            {quickBudgetOptions.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => onUpdateBudget(opt)}
                className={`py-1 rounded text-[10px] font-mono transition cursor-pointer border ${
                  totalBudget === opt
                    ? 'bg-[#1A1D23] text-[#B8863B] border-[#B8863B]/60 font-bold'
                    : 'bg-[#0A0B0D] text-[#8A8D96] hover:text-[#E8E9EB] border-[#24262C]'
                }`}
              >
                ${opt / 1000}k
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-[#24262C]" />

      {/* 3. Basket Portfolio Ledger */}
      <div className="flex-1 flex flex-col min-h-[160px] space-y-2">
        <div className="flex items-center justify-between border-b border-[#24262C] pb-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#8A8D96] flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#5B6B85]" />
            Portfolio Basket ({basketEntries.length})
          </span>
          <span
            className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
              isReadyForVerification
                ? 'text-[#3FA66B] border-[#3FA66B]/40 bg-[#3FA66B]/10'
                : 'text-[#8A8D96] border-[#24262C] bg-[#111317]'
            }`}
          >
            {isReadyForVerification ? 'READY (≥2)' : 'NEED ≥2'}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 max-h-[220px]">
          {basketEntries.length === 0 ? (
            <div className="p-3 rounded border border-dashed border-[#24262C] bg-[#0A0B0D] text-center text-xs text-[#8A8D96] font-sans">
              Basket is empty. Select tickers from the presets or search to begin.
            </div>
          ) : (
            basketEntries.map(([ticker, item]) => (
              <div
                key={ticker}
                className="bg-[#111317] border border-[#24262C] hover:border-[#3A3F4B] rounded p-2 flex items-center justify-between text-xs transition"
              >
                <div className="font-mono">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#E8E9EB]">${ticker}</span>
                    <span className="text-[11px] text-[#8A8D96] tabular-nums">${item.price}</span>
                  </div>
                  <div className="text-[10px] text-[#8A8D96] mt-0.5 flex gap-2 tabular-nums">
                    <span>Q-Score: <strong className="text-[#B8863B] font-bold">{item.score}</strong></span>
                    <span>P/E: <strong className="text-[#E8E9EB]">{item.pe}</strong></span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onRemoveFromBasket(ticker)}
                  className="text-[#8A8D96] hover:text-[#C0504D] p-1 rounded hover:bg-[#1A1D23] transition cursor-pointer"
                  title={`Remove $${ticker}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Verification CTA Button (Solid brass/institutional, no rainbow gradient) */}
        <button
          type="button"
          onClick={onRunOptimization}
          disabled={!isReadyForVerification || isLoadingOptimization}
          className={`w-full mt-2 py-2.5 px-3 rounded font-mono text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer border ${
            isReadyForVerification
              ? 'bg-[#B8863B] hover:bg-[#A3742E] text-black border-[#C69A4C]'
              : 'bg-[#111317] text-[#5E626E] border-[#24262C] cursor-not-allowed'
          }`}
        >
          <Shield className="w-4 h-4 shrink-0" />
          <span>
            {isLoadingOptimization
              ? 'RUNNING AUDIT...'
              : isReadyForVerification
              ? 'EXECUTE DOUBLE-VERIFICATION'
              : 'ADD ≥2 STOCKS TO VERIFY'}
          </span>
        </button>
      </div>
    </aside>
  );
};
