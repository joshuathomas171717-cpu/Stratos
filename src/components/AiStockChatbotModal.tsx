import React, { useState, useEffect, useRef } from 'react';
import { AIChatMessage, PeerStock } from '../types';
import { getAiStockChatbotInsight } from '../services/api';
import {
  Send,
  X,
  TrendingUp,
  Target,
  ArrowUpRight,
  Plus,
  Loader2,
  Copy,
  Check,
  Trash2,
  Terminal,
} from 'lucide-react';

interface AiStockChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTicker?: string;
  onSelectTicker: (ticker: string) => void;
  onQuickAddToBasket?: (peer: PeerStock) => void;
  basketTickers?: string[];
}

export const AiStockChatbotModal: React.FC<AiStockChatbotModalProps> = ({
  isOpen,
  onClose,
  initialTicker = 'NVDA',
  onSelectTicker,
  onQuickAddToBasket,
  basketTickers = [],
}) => {
  const activeTicker = (initialTicker || 'NVDA').toUpperCase().trim();
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync state when modal opens or initialTicker changes
  useEffect(() => {
    if (isOpen) {
      if (messages.length === 0 || (messages.length > 0 && messages[0].ticker !== activeTicker)) {
        fetchStockReview(activeTicker);
      }
    }
  }, [isOpen, activeTicker]);

  const fetchStockReview = async (tickerToReview: string, customMessage?: string) => {
    setIsLoading(true);
    try {
      if (customMessage) {
        const userMsg: AIChatMessage = {
          id: `usr-${Date.now()}`,
          role: 'user',
          content: customMessage,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, userMsg]);
      }

      const insight = await getAiStockChatbotInsight(tickerToReview, customMessage, messages);

      const botMsg: AIChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: insight.answer,
        ticker: tickerToReview,
        insightResponse: insight,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: AIChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `Analysis lookup failed for $${tickerToReview}: ${err.message || 'Connection error'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputQuery.trim() || isLoading) return;
    const q = inputQuery.trim();
    setInputQuery('');
    fetchStockReview(activeTicker, q);
  };

  const handleClearChat = () => {
    setInputQuery('');
    setMessages([]);
    fetchStockReview(activeTicker);
  };

  const handleCopyMessage = (msgContent: string, id: string) => {
    navigator.clipboard.writeText(msgContent);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex justify-center items-center p-4">
      <div className="bg-[#14161A] border border-[#24262C] rounded w-full max-w-2xl h-[85vh] max-h-[760px] flex flex-col overflow-hidden text-[#E8E9EB]">
        {/* Header */}
        <div className="bg-[#111317] border-b border-[#24262C] p-3.5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-[#1A1D23] border border-[#24262C] flex items-center justify-center text-[#B8863B]">
              <Terminal className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-base font-bold text-[#E8E9EB]">
                  Institutional AI Analyst // ${activeTicker}
                </h2>
                <span className="text-[10px] bg-[#1A1D23] text-[#B8863B] border border-[#B8863B]/30 px-1.5 py-0.2 rounded font-mono">
                  GEMINI 3.7 FLASH
                </span>
              </div>
              <p className="text-[11px] text-[#8A8D96] font-sans">
                Real-time valuation commentary, competitive moat, and downside risks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleClearChat}
              className="p-1 rounded bg-[#1A1D23] hover:bg-[#24262C] text-[#8A8D96] hover:text-[#E8E9EB] transition cursor-pointer text-xs font-mono px-2 flex items-center gap-1 border border-[#24262C]"
              title="Reset Conversation"
            >
              <Trash2 className="w-3 h-3" />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded bg-[#1A1D23] hover:bg-[#24262C] text-[#8A8D96] hover:text-[#E8E9EB] transition cursor-pointer border border-[#24262C]"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col gap-1 ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div className="flex items-center justify-between w-full text-[10px] text-[#8A8D96] font-mono px-1">
                <div className="flex items-center gap-1.5">
                  {msg.role === 'user' ? (
                    <span className="text-[#E8E9EB] font-bold">USER</span>
                  ) : (
                    <span className="text-[#B8863B] font-bold">ANALYST DISPATCH</span>
                  )}
                  <span>• {msg.timestamp}</span>
                </div>

                {msg.role === 'assistant' && (
                  <button
                    type="button"
                    onClick={() => handleCopyMessage(msg.content, msg.id)}
                    className="hover:text-[#E8E9EB] transition flex items-center gap-1 cursor-pointer text-[10px]"
                    title="Copy response"
                  >
                    {copiedMsgId === msg.id ? (
                      <>
                        <Check className="w-3 h-3 text-[#3FA66B]" />
                        <span className="text-[#3FA66B]">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-[#8A8D96]" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[94%] rounded p-3.5 leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#1A1D23] border border-[#5B6B85]/40 text-[#E8E9EB]'
                    : 'bg-[#111317] border border-[#24262C] text-[#E8E9EB] space-y-3'
                }`}
              >
                <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>

                {/* Structured Stock Highlights */}
                {msg.insightResponse && (msg.insightResponse.currentStockGrowth || msg.insightResponse.futureProjection) && (
                  <div className="space-y-2.5 font-mono pt-2 border-t border-[#24262C]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      {msg.insightResponse.currentStockGrowth && (
                        <div className="bg-[#0A0B0D] border border-[#24262C] p-2.5 rounded space-y-1">
                          <div className="text-[10px] font-bold text-[#3FA66B] uppercase flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Current Momentum & Technicals
                          </div>
                          <p className="text-[#8A8D96] font-sans text-[11px] leading-snug">
                            {msg.insightResponse.currentStockGrowth}
                          </p>
                        </div>
                      )}

                      {msg.insightResponse.futureProjection && (
                        <div className="bg-[#0A0B0D] border border-[#24262C] p-2.5 rounded space-y-1">
                          <div className="text-[10px] font-bold text-[#B8863B] uppercase flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            3-5 Year Target Outlook
                          </div>
                          <p className="text-[#8A8D96] font-sans text-[11px] leading-snug">
                            {msg.insightResponse.futureProjection}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Similar Peer Stock Recommendations */}
                    {msg.insightResponse.similarStocks && msg.insightResponse.similarStocks.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="text-[10px] font-bold text-[#8A8D96] uppercase tracking-wider border-b border-[#24262C] pb-1">
                          Sector Peer Alternatives
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {msg.insightResponse.similarStocks.map((sim) => {
                            const inBasket = basketTickers.includes(sim.ticker);
                            return (
                              <div
                                key={sim.ticker}
                                className="bg-[#0A0B0D] border border-[#24262C] hover:border-[#3A3F4B] p-2 rounded flex flex-col justify-between gap-1 transition"
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-[#E8E9EB] text-xs">
                                        ${sim.ticker}
                                      </span>
                                      <span className="text-[10px] text-[#8A8D96] tabular-nums">
                                        ${sim.price}
                                      </span>
                                    </div>
                                    <div className="text-[10px] text-[#8A8D96] truncate max-w-[120px]">
                                      {sim.name}
                                    </div>
                                  </div>

                                  <div className="bg-[#111317] border border-[#B8863B]/30 text-[#B8863B] px-1.5 py-0.5 rounded text-[10px] font-bold tabular-nums">
                                    {sim.quantScore}/10
                                  </div>
                                </div>

                                <p className="text-[10px] text-[#8A8D96] leading-tight line-clamp-2">
                                  {sim.reason}
                                </p>

                                <div className="flex items-center gap-1.5 pt-1 border-t border-[#24262C]">
                                  <button
                                    onClick={() => onSelectTicker(sim.ticker)}
                                    className="flex-1 bg-[#14161A] hover:bg-[#1A1D23] text-[#8A8D96] hover:text-[#E8E9EB] text-[10px] font-mono py-0.5 px-1.5 rounded border border-[#24262C] transition flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    <ArrowUpRight className="w-2.5 h-2.5" />
                                    Analyze
                                  </button>

                                  {onQuickAddToBasket && (
                                    <button
                                      onClick={() =>
                                        onQuickAddToBasket({
                                          ticker: sim.ticker,
                                          name: sim.name,
                                          price: sim.price,
                                          quantScore: sim.quantScore,
                                          pe: sim.pe,
                                          forwardPe: 'N/A',
                                          rsi: 50,
                                          scoreAdvantage: 0,
                                          comparisonAdvantage: sim.reason,
                                        })
                                      }
                                      disabled={inBasket}
                                      className={`py-0.5 px-2 rounded text-[10px] font-mono transition flex items-center gap-0.5 cursor-pointer border ${
                                        inBasket
                                          ? 'bg-[#111317] text-[#3FA66B] border-[#3FA66B]/40 cursor-default'
                                          : 'bg-[#14161A] hover:bg-[#1A1D23] text-[#8A8D96] hover:text-[#E8E9EB] border-[#24262C]'
                                      }`}
                                    >
                                      {inBasket ? (
                                        <Check className="w-2.5 h-2.5 text-[#3FA66B]" />
                                      ) : (
                                        <Plus className="w-2.5 h-2.5" />
                                      )}
                                      <span>{inBasket ? 'In Basket' : 'Add'}</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-[#5B6B85] text-xs py-2 px-1 font-mono">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#B8863B]" />
              <span>Analyzing ${activeTicker} via Gemini flash protocol...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Prompt Chips */}
        <div className="bg-[#111317] border-t border-[#24262C] px-3 py-2 flex flex-wrap gap-1.5 shrink-0">
          <button
            onClick={() => fetchStockReview(activeTicker, `What are the primary 3-5 year revenue growth catalysts and TAM expansion drivers for ${activeTicker}?`)}
            disabled={isLoading}
            className="px-2.5 py-1 bg-[#14161A] hover:bg-[#1A1D23] text-[#8A8D96] hover:text-[#E8E9EB] rounded text-[11px] font-mono transition border border-[#24262C] cursor-pointer"
          >
            [GROWTH CATALYSTS]
          </button>
          <button
            onClick={() => fetchStockReview(activeTicker, `Analyze ${activeTicker}'s current valuation multiple (P/E ratio) relative to its historical mean and sector peers.`)}
            disabled={isLoading}
            className="px-2.5 py-1 bg-[#14161A] hover:bg-[#1A1D23] text-[#8A8D96] hover:text-[#E8E9EB] rounded text-[11px] font-mono transition border border-[#24262C] cursor-pointer"
          >
            [VALUATION MULTIPLES]
          </button>
          <button
            onClick={() => fetchStockReview(activeTicker, `What are the top 3 downside risks, margin pressures, or competitive threats for ${activeTicker}?`)}
            disabled={isLoading}
            className="px-2.5 py-1 bg-[#14161A] hover:bg-[#1A1D23] text-[#8A8D96] hover:text-[#E8E9EB] rounded text-[11px] font-mono transition border border-[#24262C] cursor-pointer"
          >
            [DOWNSIDE RISKS]
          </button>
          <button
            onClick={() => fetchStockReview(activeTicker, `Summarize the bull vs bear debate arguments for ${activeTicker}.`)}
            disabled={isLoading}
            className="px-2.5 py-1 bg-[#14161A] hover:bg-[#1A1D23] text-[#8A8D96] hover:text-[#E8E9EB] rounded text-[11px] font-mono transition border border-[#24262C] cursor-pointer"
          >
            [BULL VS BEAR DEBATE]
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendMessage} className="p-3 bg-[#0A0B0D] border-t border-[#24262C] flex items-center gap-2 shrink-0">
          <input
            type="text"
            placeholder={`Query analyst on ${activeTicker} (e.g. margins, catalysts, risk bounds)...`}
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            disabled={isLoading}
            className="flex-1 bg-[#14161A] border border-[#24262C] focus:border-[#5B6B85] text-[#E8E9EB] text-xs px-3 py-2 rounded outline-none placeholder:text-[#5E626E] font-sans"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isLoading}
            className="px-3.5 py-2 bg-[#B8863B] hover:bg-[#A3742E] disabled:opacity-40 text-black font-semibold rounded text-xs font-mono transition flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3 h-3" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
