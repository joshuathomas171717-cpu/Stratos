import React, { useState } from 'react';
import { PeerComparisonData, PeerStock } from '../types';
import {
  Award,
  ArrowUpRight,
  Plus,
  Check,
  ChevronDown,
  ChevronUp,
  Layers,
} from 'lucide-react';

interface PeerComparisonMatrixProps {
  comparison: PeerComparisonData;
  onSelectTicker: (ticker: string) => void;
  onAddToBasket?: (peer: PeerStock) => void;
  basketTickers?: string[];
}

export const PeerComparisonMatrix: React.FC<PeerComparisonMatrixProps> = ({
  comparison,
  onSelectTicker,
  onAddToBasket,
  basketTickers = [],
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const { targetTicker, targetScore, targetPrice, targetPe, peersWithHigherRatings, summaryNote } =
    comparison;

  return (
    <div className="terminal-panel p-5 text-[#E8E9EB] space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#24262C] pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 bg-[#1A1D23] hover:bg-[#24262C] border border-[#24262C] rounded text-[#8A8D96] hover:text-[#E8E9EB] transition cursor-pointer"
            title={isCollapsed ? 'Expand Peer Comparison' : 'Collapse Peer Comparison'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4 text-[#B8863B]" /> : <ChevronUp className="w-4 h-4 text-[#B8863B]" />}
          </button>

          <div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#B8863B]" />
              <h3 className="font-serif text-base sm:text-lg font-bold tracking-tight text-[#E8E9EB]">
                Sector Benchmarks & Superior Alternatives // {targetTicker}
              </h3>
            </div>
            <p className="text-xs text-[#8A8D96] font-sans mt-0.5">
              Target <strong className="text-[#E8E9EB] font-mono">${targetTicker}</strong> (Score: {targetScore}/10, P/E: {targetPe}) benchmarked against sector peers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto bg-[#111317] border border-[#24262C] px-3 py-1 rounded text-xs font-mono text-[#B8863B]">
          <Layers className="w-3.5 h-3.5 text-[#B8863B]" />
          <span>{peersWithHigherRatings.length} Superior Peers</span>
        </div>
      </div>

      {!isCollapsed && (
        <div className="space-y-4">
          {/* Summary Note Banner */}
          {summaryNote && (
            <div className="bg-[#111317] border border-[#24262C] p-3 rounded text-xs text-[#8A8D96] font-sans leading-relaxed">
              <span className="font-mono font-bold text-[#E8E9EB] uppercase tracking-wider block mb-1">
                Quantitative Relative Assessment:
              </span>
              {summaryNote}
            </div>
          )}

          {/* Peer Stocks Table */}
          <div className="overflow-x-auto border border-[#24262C] rounded bg-[#0A0B0D]">
            <table className="w-full text-left text-xs font-mono text-[#E8E9EB]">
              <thead className="bg-[#14161A] text-[#8A8D96] uppercase text-[11px] border-b border-[#24262C] font-semibold tracking-wider">
                <tr>
                  <th className="py-2.5 px-3.5">Asset</th>
                  <th className="py-2.5 px-3.5">Spot Price</th>
                  <th className="py-2.5 px-3.5">Quant Score</th>
                  <th className="py-2.5 px-3.5">Trailing P/E</th>
                  <th className="py-2.5 px-3.5">Forward P/E</th>
                  <th className="py-2.5 px-3.5">14D RSI</th>
                  <th className="py-2.5 px-3.5">Catalyst & Rationale</th>
                  <th className="py-2.5 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#24262C]">
                {peersWithHigherRatings.map((peer) => {
                  const inBasket = basketTickers.includes(peer.ticker);
                  return (
                    <tr key={peer.ticker} className="hover:bg-[#14161A] transition">
                      <td className="py-3 px-3.5 font-bold">
                        <button
                          onClick={() => onSelectTicker(peer.ticker)}
                          className="text-[#E8E9EB] hover:text-[#B8863B] text-sm flex items-center gap-1 cursor-pointer"
                        >
                          <span>${peer.ticker}</span>
                          <ArrowUpRight className="w-3 h-3 text-[#5B6B85]" />
                        </button>
                        <span className="block text-[11px] text-[#8A8D96] font-sans font-normal truncate max-w-[140px]">
                          {peer.name}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-[#E8E9EB] tabular-nums font-semibold">
                        ${peer.price}
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="px-2 py-0.5 rounded bg-[#111317] border border-[#B8863B]/40 text-[#B8863B] font-bold tabular-nums">
                          {peer.quantScore}/10
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-[#8A8D96] tabular-nums">{peer.pe}</td>
                      <td className="py-3 px-3.5 text-[#8A8D96] tabular-nums">{peer.forwardPe}</td>
                      <td className="py-3 px-3.5">
                        <span
                          className={`font-semibold tabular-nums ${
                            peer.rsi > 70
                              ? 'text-[#C0504D]'
                              : peer.rsi < 35
                              ? 'text-[#3FA66B]'
                              : 'text-[#E8E9EB]'
                          }`}
                        >
                          {peer.rsi}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-xs text-[#8A8D96] font-sans max-w-[280px]">
                        {peer.reason}
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        {onAddToBasket && (
                          <button
                            onClick={() => onAddToBasket(peer)}
                            disabled={inBasket}
                            className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition cursor-pointer border ${
                              inBasket
                                ? 'bg-[#111317] border-[#3FA66B]/40 text-[#3FA66B] cursor-default'
                                : 'bg-[#1A1D23] hover:bg-[#24262C] border-[#24262C] hover:border-[#5B6B85] text-[#E8E9EB]'
                            }`}
                          >
                            {inBasket ? (
                              <span className="flex items-center gap-1">
                                <Check className="w-3 h-3 text-[#3FA66B]" />
                                In Basket
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Plus className="w-3 h-3 text-[#5B6B85]" />
                                Add
                              </span>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
