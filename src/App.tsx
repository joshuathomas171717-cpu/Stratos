import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { StockDossier } from './components/StockDossier';
import { AgentCorridor } from './components/AgentCorridor';
import { PortfolioMatrix } from './components/PortfolioMatrix';
import { PeerComparisonMatrix } from './components/PeerComparisonMatrix';
import { GrowthProjectionCalculator } from './components/GrowthProjectionCalculator';
import { AiStockChatbotModal } from './components/AiStockChatbotModal';
import {
  fetchStockTelemetry,
  generateAgentDebate,
  runPortfolioVerification,
  fetchPeerComparison,
} from './services/api';
import {
  StockMetrics,
  AgentDebate,
  VerificationResult,
  PeerComparisonData,
  PeerStock,
} from './types';
import {
  Search,
  BarChart3,
  Scale,
  ShoppingBag,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Plus,
  Trash2,
  DollarSign,
  AlertCircle,
  TrendingUp,
  Bot,
  Layers,
  ChevronRight,
} from 'lucide-react';

const POPULAR_TICKERS = ['NVDA', 'MSFT', 'AAPL', 'TSLA', 'PLTR', 'TSM', 'AMD', 'GOOGL'];

export interface BasketItem {
  name: string;
  price: number;
  score: number;
  pe: string;
  forwardPe: string;
  rsi: number;
}

export function App() {
  // Navigation Stepper State (1: Analyze, 2: Debate, 3: Build Basket, 4: Verify)
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);

  // Active Stock Analysis State
  const [searchTicker, setSearchTicker] = useState<string>('NVDA');
  const [activeMetrics, setActiveMetrics] = useState<StockMetrics | null>(null);
  const [activeDebate, setActiveDebate] = useState<AgentDebate | null>(null);
  const [activePeerComparison, setActivePeerComparison] = useState<PeerComparisonData | null>(null);

  // Loading States
  const [isLoadingStock, setIsLoadingStock] = useState<boolean>(false);
  const [isLoadingDebate, setIsLoadingDebate] = useState<boolean>(false);
  const [isLoadingPeers, setIsLoadingPeers] = useState<boolean>(false);
  const [isLoadingVerification, setIsLoadingVerification] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Basket & Verification State (Persistent in localStorage)
  const [basket, setBasket] = useState<Record<string, BasketItem>>(() => {
    try {
      const saved = localStorage.getItem('stratos_basket');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      NVDA: { name: 'NVIDIA Corp.', price: 135.5, score: 9.2, pe: '42.5', forwardPe: '32.1', rsi: 62 },
      MSFT: { name: 'Microsoft Corp.', price: 448.2, score: 8.4, pe: '34.8', forwardPe: '29.4', rsi: 54 },
      TSM: { name: 'Taiwan Semiconductor', price: 188.4, score: 8.6, pe: '28.1', forwardPe: '22.0', rsi: 58 },
    };
  });

  const [totalBudget, setTotalBudget] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('stratos_budget');
      if (saved) return Number(saved) || 25000;
    } catch {
      // ignore
    }
    return 25000;
  });

  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

  // Modal
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);

  // Save basket and budget to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('stratos_basket', JSON.stringify(basket));
    } catch {
      // ignore
    }
  }, [basket]);

  useEffect(() => {
    try {
      localStorage.setItem('stratos_budget', totalBudget.toString());
    } catch {
      // ignore
    }
  }, [totalBudget]);

  // Initial Load of Default Stock (NVDA)
  useEffect(() => {
    loadCompleteStockAnalysis('NVDA');
  }, []);

  // Primary function to load stock telemetry, debate, and peer benchmarks
  const loadCompleteStockAnalysis = async (ticker: string) => {
    const clean = ticker.trim().toUpperCase();
    if (!clean) return;

    setSearchTicker(clean);
    setIsLoadingStock(true);
    setIsLoadingDebate(true);
    setIsLoadingPeers(true);
    setErrorMessage(null);

    try {
      // Step 1: Telemetry
      const metrics = await fetchStockTelemetry(clean);
      setActiveMetrics(metrics);
      setIsLoadingStock(false);

      // Step 2: Debate & Peer Comparison in parallel
      const [debateRes, peerRes] = await Promise.allSettled([
        generateAgentDebate(clean, metrics),
        fetchPeerComparison(metrics),
      ]);

      if (debateRes.status === 'fulfilled') {
        setActiveDebate(debateRes.value);
      }
      setIsLoadingDebate(false);

      if (peerRes.status === 'fulfilled') {
        setActivePeerComparison(peerRes.value);
      }
      setIsLoadingPeers(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load stock telemetry');
      setIsLoadingStock(false);
      setIsLoadingDebate(false);
      setIsLoadingPeers(false);
    }
  };

  const handleRefreshDebate = async () => {
    if (!activeMetrics) return;
    setIsLoadingDebate(true);
    try {
      const debate = await generateAgentDebate(activeMetrics.ticker, activeMetrics);
      setActiveDebate(debate);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to refresh agent debate');
    } finally {
      setIsLoadingDebate(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadCompleteStockAnalysis(searchTicker);
  };

  const handleAddMetricsToBasket = (metrics: StockMetrics) => {
    setBasket((prev) => ({
      ...prev,
      [metrics.ticker]: {
        name: metrics.name,
        price: metrics.price,
        score: metrics.quantScore,
        pe: metrics.trailingPE ? `${metrics.trailingPE}` : 'N/A',
        forwardPe: metrics.forwardPE ? `${metrics.forwardPE}` : 'N/A',
        rsi: metrics.rsi14,
      },
    }));
  };

  const handleAddPeerToBasket = (peer: PeerStock) => {
    setBasket((prev) => ({
      ...prev,
      [peer.ticker]: {
        name: peer.name,
        price: peer.price,
        score: peer.quantScore,
        pe: peer.pe,
        forwardPe: peer.forwardPe,
        rsi: peer.rsi,
      },
    }));
  };

  const handleAddAssetToBasket = (asset: { ticker: string; name: string; price: number; score: number; pe?: string }) => {
    setBasket((prev) => ({
      ...prev,
      [asset.ticker]: {
        name: asset.name,
        price: asset.price,
        score: asset.score,
        pe: asset.pe || 'N/A',
        forwardPe: 'N/A',
        rsi: 50,
      },
    }));
  };

  const handleRemoveFromBasket = (ticker: string) => {
    setBasket((prev) => {
      const copy = { ...prev };
      delete copy[ticker];
      return copy;
    });
  };

  const handleQuickAddTicker = async (ticker: string) => {
    loadCompleteStockAnalysis(ticker);
  };

  const handleRunVerification = async () => {
    const basketEntries = Object.entries(basket);
    if (basketEntries.length < 2) {
      setActiveStep(3); // Guide user to build basket first
      return;
    }

    setIsLoadingVerification(true);
    setActiveStep(4); // Switch to Verify view

    try {
      const result = await runPortfolioVerification(basket, totalBudget);
      setVerificationResult(result);
    } catch (err: any) {
      setErrorMessage(`Verification failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoadingVerification(false);
    }
  };

  const basketCount = Object.keys(basket).length;
  const isInBasket = activeMetrics ? !!basket[activeMetrics.ticker] : false;

  return (
    <div className="min-h-screen bg-[#0A0B0D] text-[#E8E9EB] font-sans flex flex-col selection:bg-[#B8863B] selection:text-black">
      {/* 1. Sovereign Institutional Header */}
      <Header
        basketCount={basketCount}
        onToggleAiInsight={() => setIsAiModalOpen(true)}
        currentTicker={activeMetrics?.ticker || searchTicker}
        currentScore={activeMetrics?.quantScore}
        currentPrice={activeMetrics?.price}
        isVerified={!!verificationResult}
      />

      {/* 2. Main Sovereign Terminal Studio Body */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-[1700px] w-full mx-auto">
        {/* Left Sovereign Sidebar */}
        <Sidebar
          basket={basket}
          totalBudget={totalBudget}
          onUpdateBudget={setTotalBudget}
          onRunOptimization={handleRunVerification}
          onRemoveFromBasket={handleRemoveFromBasket}
          onQuickAddTicker={handleQuickAddTicker}
          isLoadingOptimization={isLoadingVerification}
          onGoToStep={(stepIndex) => setActiveStep(stepIndex as any)}
        />

        {/* Right Guided 4-Step Analysis Canvas */}
        <main className="flex-1 p-4 sm:p-6 space-y-4 overflow-y-auto">
            {/* Guided 4-Step Horizontal Stepper */}
            <div className="bg-[#14161A] border border-[#24262C] rounded p-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
                {/* Step 1: Analyze */}
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className={`p-2.5 rounded transition text-left cursor-pointer flex items-center gap-2.5 border ${
                    activeStep === 1
                      ? 'bg-[#1A1D23] border-[#B8863B] text-[#E8E9EB]'
                      : 'bg-[#111317] border-[#24262C] text-[#8A8D96] hover:text-[#E8E9EB] hover:bg-[#1A1D23]'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                      activeStep === 1
                        ? 'bg-[#B8863B] text-black'
                        : 'bg-[#0A0B0D] text-[#8A8D96]'
                    }`}
                  >
                    1
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-mono font-bold flex items-center gap-1">
                      <BarChart3 className="w-3.5 h-3.5 text-[#5B6B85]" />
                      <span>Analyze</span>
                    </div>
                    <div className="text-[10px] text-[#8A8D96] font-sans truncate">
                      Telemetry & Scorecard
                    </div>
                  </div>
                </button>

                {/* Step 2: Debate */}
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className={`p-2.5 rounded transition text-left cursor-pointer flex items-center gap-2.5 border ${
                    activeStep === 2
                      ? 'bg-[#1A1D23] border-[#B8863B] text-[#E8E9EB]'
                      : 'bg-[#111317] border-[#24262C] text-[#8A8D96] hover:text-[#E8E9EB] hover:bg-[#1A1D23]'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                      activeStep === 2
                        ? 'bg-[#B8863B] text-black'
                        : 'bg-[#0A0B0D] text-[#8A8D96]'
                    }`}
                  >
                    2
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-mono font-bold flex items-center gap-1">
                      <Scale className="w-3.5 h-3.5 text-[#5B6B85]" />
                      <span>Debate</span>
                    </div>
                    <div className="text-[10px] text-[#8A8D96] font-sans truncate">
                      AI Corridor & Peers
                    </div>
                  </div>
                </button>

                {/* Step 3: Build Basket */}
                <button
                  type="button"
                  onClick={() => setActiveStep(3)}
                  className={`p-2.5 rounded transition text-left cursor-pointer flex items-center gap-2.5 border ${
                    activeStep === 3
                      ? 'bg-[#1A1D23] border-[#B8863B] text-[#E8E9EB]'
                      : 'bg-[#111317] border-[#24262C] text-[#8A8D96] hover:text-[#E8E9EB] hover:bg-[#1A1D23]'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                      activeStep === 3
                        ? 'bg-[#B8863B] text-black'
                        : 'bg-[#0A0B0D] text-[#8A8D96]'
                    }`}
                  >
                    3
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-mono font-bold flex items-center gap-1">
                      <ShoppingBag className="w-3.5 h-3.5 text-[#5B6B85]" />
                      <span>Build Basket</span>
                    </div>
                    <div className="text-[10px] text-[#8A8D96] font-sans truncate">
                      {basketCount} Assets • ${totalBudget.toLocaleString()}
                    </div>
                  </div>
                </button>

                {/* Step 4: Verify */}
                <button
                  type="button"
                  onClick={() => setActiveStep(4)}
                  className={`p-2.5 rounded transition text-left cursor-pointer flex items-center gap-2.5 border ${
                    activeStep === 4
                      ? 'bg-[#1A1D23] border-[#3FA66B] text-[#E8E9EB]'
                      : 'bg-[#111317] border-[#24262C] text-[#8A8D96] hover:text-[#E8E9EB] hover:bg-[#1A1D23]'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                      activeStep === 4
                        ? 'bg-[#3FA66B] text-black'
                        : 'bg-[#0A0B0D] text-[#8A8D96]'
                    }`}
                  >
                    4
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-mono font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#3FA66B]" />
                      <span>Verify</span>
                    </div>
                    <div className="text-[10px] text-[#8A8D96] font-sans truncate">
                      Double-Verification
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Global Error Banner */}
            {errorMessage && (
              <div className="bg-[#14161A] border border-[#C0504D]/60 p-3 rounded flex items-center justify-between text-[#C0504D] font-mono text-xs">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="text-xs font-mono text-[#8A8D96] hover:text-[#E8E9EB] cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 1: ANALYZE — Real-Time Telemetry & Quant Scorecard                   */}
            {/* ========================================================================= */}
            {activeStep === 1 && (
              <div className="space-y-4">
                {/* Search & Telemetry Controls */}
                <div className="terminal-panel p-4 space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-[#24262C] pb-3">
                    <div>
                      <h2 className="font-serif text-lg font-bold text-[#E8E9EB] flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-[#B8863B]" />
                        Step 1: Real-Time Telemetry & Quantitative Scorecard
                      </h2>
                      <p className="text-xs text-[#8A8D96] font-sans">
                        Institutional fundamental metrics, technical momentum, and 5-pillar mathematical score.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsAiModalOpen(true)}
                      className="px-3 py-1.5 rounded bg-[#1A1D23] hover:bg-[#24262C] border border-[#24262C] text-[#B8863B] font-mono text-xs font-medium transition flex items-center gap-1.5 cursor-pointer self-start md:self-auto"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      <span>Ask AI Analyst (${activeMetrics?.ticker || searchTicker})</span>
                    </button>
                  </div>

                  {/* Search Bar & Quick Ticker Buttons */}
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
                      <Search className="absolute left-3 top-2.5 text-[#5E626E] w-3.5 h-3.5" />
                      <input
                        type="text"
                        value={searchTicker}
                        onChange={(e) => setSearchTicker(e.target.value)}
                        placeholder="ENTER EQUITY TICKER (e.g. NVDA, MSFT, TSM, PLTR, AAPL)..."
                        className="w-full bg-[#0A0B0D] border border-[#24262C] focus:border-[#5B6B85] rounded pl-9 pr-3 py-2 text-xs font-mono text-[#E8E9EB] placeholder:text-[#5E626E] outline-none uppercase"
                      />
                    </form>
                    <button
                      type="button"
                      onClick={() => loadCompleteStockAnalysis(searchTicker)}
                      disabled={isLoadingStock}
                      className="w-full sm:w-auto px-4 py-2 bg-[#B8863B] hover:bg-[#A3742E] text-black font-mono text-xs font-bold rounded transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                    >
                      {isLoadingStock ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <TrendingUp className="w-3.5 h-3.5" />
                      )}
                      <span>Analyze Ticker</span>
                    </button>
                  </div>

                  {/* Popular Presets */}
                  <div className="flex items-center gap-1.5 flex-wrap text-xs font-mono">
                    <span className="text-[#8A8D96] text-[11px] uppercase">Benchmarks:</span>
                    {POPULAR_TICKERS.map((sym) => (
                      <button
                        key={sym}
                        onClick={() => loadCompleteStockAnalysis(sym)}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono transition cursor-pointer border ${
                          activeMetrics?.ticker === sym
                            ? 'bg-[#1A1D23] text-[#B8863B] border-[#B8863B]/60 font-bold'
                            : 'bg-[#111317] hover:bg-[#1A1D23] text-[#8A8D96] hover:text-[#E8E9EB] border-[#24262C]'
                        }`}
                      >
                        ${sym}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stock Dossier */}
                {isLoadingStock ? (
                  <div className="terminal-panel p-10 text-center text-[#8A8D96] font-mono space-y-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-[#B8863B] mx-auto" />
                    <p className="text-xs font-bold text-[#E8E9EB]">Streaming real-time telemetry for ${searchTicker}...</p>
                    <p className="text-[11px] text-[#8A8D96] font-sans">
                      Computing 5-pillar quant score, 20-day SMA, 14-day RSI, and volatility bounds.
                    </p>
                  </div>
                ) : activeMetrics ? (
                  <div className="space-y-4">
                    <StockDossier
                      metrics={activeMetrics}
                      onAddToBasket={handleAddMetricsToBasket}
                      isInBasket={isInBasket}
                    />

                    {/* Guided Next Step Action */}
                    <div className="terminal-panel p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold text-[#E8E9EB] font-mono">
                          Ready for qualitative institutional review?
                        </div>
                        <div className="text-xs text-[#8A8D96] font-sans">
                          Advance to Step 2 to view Bull vs. Bear AI debates and peer sector benchmark matrices.
                        </div>
                      </div>

                      <button
                        onClick={() => setActiveStep(2)}
                        className="px-4 py-2 rounded bg-[#B8863B] hover:bg-[#A3742E] text-black font-mono text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 self-stretch sm:self-auto justify-center"
                      >
                        <span>Next: Multi-Agent Debate</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 2: DEBATE — Multi-Agent Debate & Sector Peer Matrix                   */}
            {/* ========================================================================= */}
            {activeStep === 2 && (
              <div className="space-y-4">
                <div className="terminal-panel p-4 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#24262C] pb-2">
                    <div>
                      <h2 className="font-serif text-lg font-bold text-[#E8E9EB] flex items-center gap-2">
                        <Scale className="w-4 h-4 text-[#B8863B]" />
                        Step 2: Multi-Agent Debate & Sector Benchmark Matrix
                      </h2>
                      <p className="text-xs text-[#8A8D96] font-sans">
                        Bull and Bear AI agents debate valuation arguments alongside higher-scoring sector alternatives.
                      </p>
                    </div>

                    <span className="text-xs font-mono text-[#B8863B] bg-[#111317] border border-[#B8863B]/30 px-2.5 py-0.5 rounded self-start sm:self-auto font-bold">
                      Target: ${activeMetrics?.ticker || searchTicker}
                    </span>
                  </div>
                </div>

                {/* Multi-Agent Corridor */}
                {isLoadingDebate && !activeDebate ? (
                  <div className="terminal-panel p-8 text-center text-[#8A8D96] font-mono space-y-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-[#B8863B] mx-auto" />
                    <p className="text-xs font-bold text-[#E8E9EB]">
                      Synthesizing Bull Analyst and Bear Critic debate with Gemini 3.7 Flash...
                    </p>
                  </div>
                ) : activeDebate ? (
                  <AgentCorridor
                    debate={activeDebate}
                    ticker={activeMetrics?.ticker || searchTicker}
                    onRefresh={handleRefreshDebate}
                    isLoading={isLoadingDebate}
                  />
                ) : null}

                {/* Sector Peer Benchmarks */}
                {isLoadingPeers ? (
                  <div className="terminal-panel p-8 text-center text-[#8A8D96] font-mono space-y-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-[#5B6B85] mx-auto" />
                    <p className="text-xs font-bold text-[#E8E9EB]">
                      Benchmarking sector alternatives and higher-scoring peers...
                    </p>
                  </div>
                ) : activePeerComparison ? (
                  <PeerComparisonMatrix
                    comparison={activePeerComparison}
                    onSelectTicker={(sym) => {
                      loadCompleteStockAnalysis(sym);
                      setActiveStep(1);
                    }}
                    onAddToBasket={handleAddPeerToBasket}
                    basketTickers={Object.keys(basket)}
                  />
                ) : null}

                {/* Navigation Actions */}
                <div className="terminal-panel p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    onClick={() => setActiveStep(1)}
                    className="px-4 py-2 rounded bg-[#1A1D23] hover:bg-[#24262C] text-[#8A8D96] hover:text-[#E8E9EB] font-mono text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer border border-[#24262C] self-stretch sm:self-auto justify-center"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Analyze</span>
                  </button>

                  <button
                    onClick={() => setActiveStep(3)}
                    className="px-4 py-2 rounded bg-[#B8863B] hover:bg-[#A3742E] text-black font-mono text-xs font-bold transition flex items-center gap-1.5 cursor-pointer self-stretch sm:self-auto justify-center"
                  >
                    <span>Next: Build Basket ({basketCount} assets)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 3: BUILD BASKET — Assemble Target Assets & Budget                     */}
            {/* ========================================================================= */}
            {activeStep === 3 && (
              <div className="space-y-4">
                <div className="terminal-panel p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#24262C] pb-2">
                    <div>
                      <h2 className="font-serif text-lg font-bold text-[#E8E9EB] flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-[#B8863B]" />
                        Step 3: Portfolio Basket & Capital Sizing
                      </h2>
                      <p className="text-xs text-[#8A8D96] font-sans">
                        Assemble target portfolio holdings and define capital sizing before neuro-symbolic verification.
                      </p>
                    </div>

                    <span className="text-xs font-mono font-bold text-[#3FA66B] bg-[#111317] border border-[#3FA66B]/30 px-2.5 py-0.5 rounded">
                      {basketCount} Assets in Basket
                    </span>
                  </div>

                  {/* Capital Budget Sizer */}
                  <div className="bg-[#111317] border border-[#24262C] rounded p-3 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#E8E9EB] font-mono">
                        <DollarSign className="w-4 h-4 text-[#B8863B]" />
                        <span>Investment Capital Budget</span>
                      </div>

                      <div className="flex items-center gap-1">
                        {[10000, 25000, 50000, 100000].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setTotalBudget(amt)}
                            className={`px-2.5 py-1 rounded text-xs font-mono transition cursor-pointer border ${
                              totalBudget === amt
                                ? 'bg-[#1A1D23] text-[#B8863B] border-[#B8863B]/60 font-bold'
                                : 'bg-[#0A0B0D] text-[#8A8D96] hover:text-[#E8E9EB] border-[#24262C]'
                            }`}
                          >
                            ${amt.toLocaleString()}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="relative max-w-xs">
                      <span className="absolute left-2.5 top-1.5 text-[#8A8D96] font-mono text-xs">$</span>
                      <input
                        type="number"
                        min="1000"
                        step="1000"
                        value={totalBudget}
                        onChange={(e) => setTotalBudget(Number(e.target.value) || 1000)}
                        className="w-full bg-[#0A0B0D] border border-[#24262C] focus:border-[#B8863B] rounded pl-6 pr-3 py-1.5 text-sm font-mono text-[#E8E9EB] font-bold outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Basket Table View */}
                <div className="terminal-panel p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-mono font-bold text-[#E8E9EB] uppercase tracking-wider">
                      Selected Portfolio Assets ({basketCount})
                    </h3>

                    {basketCount >= 2 ? (
                      <span className="text-[11px] font-mono font-bold text-[#3FA66B] bg-[#111317] border border-[#3FA66B]/30 px-2 py-0.5 rounded flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Ready for Double-Verification
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono font-bold text-[#B8863B] bg-[#111317] border border-[#B8863B]/30 px-2 py-0.5 rounded">
                        Add at least 2 assets to verify
                      </span>
                    )}
                  </div>

                  {basketCount === 0 ? (
                    <div className="p-6 rounded border border-dashed border-[#24262C] bg-[#0A0B0D] text-center text-xs text-[#8A8D96] font-sans space-y-2">
                      <p>Your portfolio basket is currently empty.</p>
                      <p className="text-[11px] text-[#5E626E]">
                        Search tickers in Step 1 or select presets below to start building your basket.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-[#24262C] rounded bg-[#0A0B0D] font-mono text-xs">
                      <table className="w-full text-left text-[#E8E9EB]">
                        <thead className="bg-[#111317] text-[#8A8D96] uppercase text-[11px] border-b border-[#24262C]">
                          <tr>
                            <th className="py-2.5 px-3">Asset</th>
                            <th className="py-2.5 px-3">Spot Price</th>
                            <th className="py-2.5 px-3">Quant Score</th>
                            <th className="py-2.5 px-3">P/E Multiple</th>
                            <th className="py-2.5 px-3">14D RSI</th>
                            <th className="py-2.5 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#24262C]">
                          {(Object.entries(basket) as [string, BasketItem][]).map(([ticker, item]) => (
                            <tr key={ticker} className="hover:bg-[#14161A] transition">
                              <td className="py-2.5 px-3 font-mono font-bold text-[#E8E9EB]">
                                <div>
                                  <span className="text-sm">${ticker}</span>
                                  <span className="block text-[11px] text-[#8A8D96] font-sans font-normal truncate max-w-[180px]">
                                    {item.name}
                                  </span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 font-mono tabular-nums">${item.price}</td>
                              <td className="py-2.5 px-3">
                                <span className="px-1.5 py-0.5 rounded bg-[#111317] border border-[#B8863B]/30 text-[#B8863B] font-bold tabular-nums">
                                  {item.score}/10
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-[#8A8D96] tabular-nums">{item.pe}</td>
                              <td className="py-2.5 px-3 tabular-nums">
                                <span
                                  className={`font-bold ${
                                    item.rsi > 70
                                      ? 'text-[#C0504D]'
                                      : item.rsi < 35
                                      ? 'text-[#3FA66B]'
                                      : 'text-[#E8E9EB]'
                                  }`}
                                >
                                  {item.rsi}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <button
                                  onClick={() => handleRemoveFromBasket(ticker)}
                                  className="p-1 text-[#8A8D96] hover:text-[#C0504D] rounded hover:bg-[#1A1D23] transition cursor-pointer"
                                  title={`Remove $${ticker}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Quick Add Presets to Basket */}
                  <div className="pt-1">
                    <div className="text-[11px] text-[#8A8D96] font-mono mb-1.5">Quick Add Institutional Stocks:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {POPULAR_TICKERS.map((ticker) => {
                        const alreadyIn = !!basket[ticker];
                        return (
                          <button
                            key={ticker}
                            onClick={() => {
                              if (!alreadyIn) {
                                loadCompleteStockAnalysis(ticker);
                              }
                            }}
                            className={`px-2.5 py-1 rounded text-xs font-mono transition flex items-center gap-1 cursor-pointer border ${
                              alreadyIn
                                ? 'bg-[#111317] border-[#3FA66B]/40 text-[#3FA66B] cursor-default'
                                : 'bg-[#111317] hover:bg-[#1A1D23] text-[#8A8D96] hover:text-[#E8E9EB] border-[#24262C]'
                            }`}
                          >
                            <Plus className="w-3 h-3" />
                            <span>${ticker}</span>
                            {alreadyIn && <span className="text-[10px] text-[#3FA66B]">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Navigation Actions */}
                <div className="terminal-panel p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    onClick={() => setActiveStep(2)}
                    className="px-4 py-2 rounded bg-[#1A1D23] hover:bg-[#24262C] text-[#8A8D96] hover:text-[#E8E9EB] font-mono text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer border border-[#24262C] self-stretch sm:self-auto justify-center"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Debate</span>
                  </button>

                  <button
                    onClick={handleRunVerification}
                    disabled={basketCount < 2 || isLoadingVerification}
                    className={`px-5 py-2.5 rounded font-mono text-xs font-bold transition flex items-center gap-2 cursor-pointer self-stretch sm:self-auto justify-center border ${
                      basketCount >= 2
                        ? 'bg-[#B8863B] hover:bg-[#A3742E] text-black border-[#C69A4C]'
                        : 'bg-[#111317] text-[#5E626E] border-[#24262C] cursor-not-allowed'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>
                      {isLoadingVerification
                        ? 'Executing Double-Verification...'
                        : 'Proceed to Double-Verification →'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 4: VERIFY — Double-Verification Guardrails & Projections              */}
            {/* ========================================================================= */}
            {activeStep === 4 && (
              <div className="space-y-4">
                <div className="terminal-panel p-4 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#24262C] pb-2">
                    <div>
                      <h2 className="font-serif text-lg font-bold text-[#E8E9EB] flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#3FA66B]" />
                        Step 4: Neuro-Symbolic Double-Verification & Monte-Carlo Projections
                      </h2>
                      <p className="text-xs text-[#8A8D96] font-sans">
                        Deterministic mathematical filter bounds and Gemini Chief Risk Officer (CRO) audit.
                      </p>
                    </div>

                    <button
                      onClick={handleRunVerification}
                      disabled={isLoadingVerification || basketCount < 2}
                      className="px-3 py-1.5 rounded bg-[#1A1D23] hover:bg-[#24262C] text-[#E8E9EB] border border-[#24262C] font-mono text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-[#B8863B] ${isLoadingVerification ? 'animate-spin' : ''}`} />
                      <span>Re-Run Audit</span>
                    </button>
                  </div>
                </div>

                {/* Verification Results Panel */}
                {isLoadingVerification ? (
                  <div className="terminal-panel p-10 text-center text-[#8A8D96] font-mono space-y-3">
                    <RefreshCw className="w-8 h-8 animate-spin text-[#3FA66B] mx-auto" />
                    <div>
                      <h3 className="text-sm font-bold text-[#E8E9EB]">
                        Executing Neuro-Symbolic Double-Verification...
                      </h3>
                      <p className="text-xs text-[#8A8D96] font-sans mt-1">
                        Layer 1: Deterministic filter bounds (P/E &lt; 80, RSI &lt; 85, score &ge; 4.0).
                        <br />
                        Layer 2: Gemini Chief Risk Officer (CRO) institutional portfolio audit.
                      </p>
                    </div>
                  </div>
                ) : verificationResult ? (
                  <div className="space-y-4">
                    <PortfolioMatrix
                      verification={verificationResult}
                      onDismiss={() => setActiveStep(3)}
                    />

                    {/* Growth Projection Engine */}
                    <GrowthProjectionCalculator
                      initialBudget={totalBudget}
                      portfolioBasket={(Object.entries(basket) as [string, BasketItem][]).map(([ticker, item]) => ({
                        ticker,
                        name: item.name,
                        price: item.price,
                        currency: 'USD',
                        trailingPE: parseFloat(item.pe) || null,
                        forwardPE: parseFloat(item.forwardPe) || null,
                        rsi14: item.rsi,
                        sma20: item.price,
                        volatility: 0.25,
                        quantScore: item.score,
                        week52High: item.price * 1.2,
                        week52Low: item.price * 0.8,
                        marketCap: '$1.2T',
                        headlines: [],
                        history: [],
                        updatedAt: new Date().toISOString(),
                      }))}
                      verifiedAllocations={verificationResult.verifiedAssets}
                      currentStock={activeMetrics}
                    />

                    {/* Navigation Actions */}
                    <div className="terminal-panel p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <button
                        onClick={() => setActiveStep(3)}
                        className="px-4 py-2 rounded bg-[#1A1D23] hover:bg-[#24262C] text-[#8A8D96] hover:text-[#E8E9EB] font-mono text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer border border-[#24262C] self-stretch sm:self-auto justify-center"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back to Basket Setup</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveStep(1);
                          setSearchTicker('NVDA');
                          loadCompleteStockAnalysis('NVDA');
                        }}
                        className="px-4 py-2 rounded bg-[#B8863B] hover:bg-[#A3742E] text-black font-mono text-xs font-bold transition flex items-center gap-1.5 cursor-pointer self-stretch sm:self-auto justify-center"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Start New Analysis</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="terminal-panel p-8 text-center text-[#8A8D96] font-mono space-y-3">
                    <p className="text-xs font-bold text-[#E8E9EB]">No active verification run yet.</p>
                    <p className="text-[11px] text-[#8A8D96] font-sans">
                      Execute Layer 1 Symbolic Filters and Layer 2 AI Audit to lock in verified capital weightings.
                    </p>
                    <button
                      onClick={handleRunVerification}
                      className="px-5 py-2 rounded bg-[#3FA66B] hover:bg-[#348A58] text-black font-mono text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Run Double-Verification on {basketCount} Assets</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>

      {/* AI Stock Intelligence Chatbot Modal */}
      <AiStockChatbotModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        initialTicker={activeMetrics?.ticker || searchTicker}
        onSelectTicker={(sym) => {
          loadCompleteStockAnalysis(sym);
          setActiveStep(1);
          setIsAiModalOpen(false);
        }}
        onQuickAddToBasket={handleAddPeerToBasket}
        basketTickers={Object.keys(basket)}
      />
    </div>
  );
}

export default App;
