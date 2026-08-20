import React from 'react';
import { VerificationResult } from '../types';
import { ShieldCheck, AlertOctagon, Brain, DollarSign, CheckCircle2 } from 'lucide-react';

interface PortfolioMatrixProps {
  verification: VerificationResult;
  onDismiss: () => void;
}

export const PortfolioMatrix: React.FC<PortfolioMatrixProps> = ({
  verification,
  onDismiss,
}) => {
  const rejectedEntries = Object.entries(verification.rejectedAssets);

  return (
    <div className="terminal-panel p-5 text-[#E8E9EB] space-y-5 animate-sweep">
      {/* Matrix Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#24262C] pb-3">
        <div>
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#B8863B]" />
            <h2 className="font-serif text-lg sm:text-xl font-bold tracking-tight text-[#E8E9EB]">
              Double-Verified Portfolio Allocation Matrix
            </h2>
          </div>
          <p className="text-xs text-[#8A8D96] font-mono mt-1">
            Capital Budget: <strong className="text-[#E8E9EB] tabular-nums">${verification.totalBudget.toLocaleString()}</strong> | 
            Approved Assets: <strong className="text-[#3FA66B] tabular-nums">{verification.verifiedAssets.length}</strong> | 
            Symbolic Rejections: <strong className="text-[#C0504D] tabular-nums">{rejectedEntries.length}</strong>
          </p>
        </div>

        <button
          onClick={onDismiss}
          className="px-3 py-1.5 rounded bg-[#1A1D23] hover:bg-[#24262C] text-[#8A8D96] hover:text-[#E8E9EB] text-xs font-mono transition border border-[#24262C] cursor-pointer self-start sm:self-auto"
        >
          Dismiss Audit View
        </button>
      </div>

      {/* Table: Verified Assets Capital Weighting */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#8A8D96] flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#3FA66B]" />
            Layer 1 Approved Allocations & Position Sizing
          </span>
          <span className="text-[10px] font-mono text-[#5B6B85]">DETERMINISTIC WEIGHTING</span>
        </div>

        {verification.verifiedAssets.length === 0 ? (
          <div className="p-3.5 rounded border border-[#C0504D]/30 bg-[#111317] text-[#C0504D] text-xs font-mono">
            No assets passed the mathematical filter. Capital remains 100% unallocated.
          </div>
        ) : (
          <div className="overflow-x-auto border border-[#24262C] rounded bg-[#0A0B0D]">
            <table className="w-full text-left text-xs font-mono text-[#E8E9EB]">
              <thead className="bg-[#14161A] text-[#8A8D96] uppercase text-[11px] border-b border-[#24262C] font-semibold tracking-wider">
                <tr>
                  <th className="py-2.5 px-3.5">Ticker</th>
                  <th className="py-2.5 px-3.5">Spot Price</th>
                  <th className="py-2.5 px-3.5">Quant Score</th>
                  <th className="py-2.5 px-3.5">Trailing P/E</th>
                  <th className="py-2.5 px-3.5">Weight %</th>
                  <th className="py-2.5 px-3.5">Allocated Capital</th>
                  <th className="py-2.5 px-3.5 text-right">Shares to Buy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#24262C]">
                {verification.verifiedAssets.map((asset) => (
                  <tr key={asset.ticker} className="hover:bg-[#14161A] transition">
                    <td className="py-3 px-3.5 font-bold text-[#E8E9EB]">
                      ${asset.ticker}
                    </td>
                    <td className="py-3 px-3.5 text-[#8A8D96] tabular-nums">${asset.price}</td>
                    <td className="py-3 px-3.5">
                      <span className="px-2 py-0.5 rounded bg-[#111317] text-[#B8863B] border border-[#B8863B]/40 font-bold tabular-nums">
                        {asset.score}/10
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-[#8A8D96] tabular-nums">{asset.pe}</td>
                    <td className="py-3 px-3.5 text-[#3FA66B] font-bold tabular-nums">
                      {asset.weightPercent}%
                    </td>
                    <td className="py-3 px-3.5 font-bold text-[#E8E9EB] tabular-nums">
                      ${asset.allocationDollars.toLocaleString()}
                    </td>
                    <td className="py-3 px-3.5 text-right text-[#B8863B] font-bold tabular-nums">
                      {asset.sharesToBuy} units
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Layer 1 Rejections Section */}
      {rejectedEntries.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#C0504D] flex items-center gap-1.5">
            <AlertOctagon className="w-3.5 h-3.5 text-[#C0504D]" />
            Layer 1 Symbolic Filter Rejections (0% Allocation)
          </span>

          <div className="space-y-1.5">
            {rejectedEntries.map(([ticker, reason]) => (
              <div
                key={ticker}
                className="bg-[#111317] border border-[#C0504D]/30 p-3 rounded text-xs"
              >
                <div className="font-mono font-bold text-[#C0504D] mb-0.5">${ticker} // REJECTED</div>
                <div className="text-[#8A8D96] font-sans leading-relaxed">{reason}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Layer 2 Gemini CRO AI Audit Report */}
      <div className="bg-[#111317] border border-[#24262C] rounded p-4 space-y-2">
        <div className="flex items-center gap-2 text-[#5B6B85] font-mono text-xs font-bold uppercase tracking-wider">
          <Brain className="w-4 h-4 text-[#5B6B85]" />
          <span>Layer 2 Gemini Chief Risk Officer (CRO) Audit Protocol</span>
        </div>
        <div className="text-xs sm:text-sm text-[#E8E9EB] font-sans leading-relaxed whitespace-pre-wrap bg-[#0A0B0D] p-3 rounded border border-[#24262C]">
          {verification.aiAuditReport}
        </div>
      </div>
    </div>
  );
};
