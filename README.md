# STRATOS Sovereign Engine // Quantitative Terminal & 2D Scoring Architecture

> **Institutional-Grade Quantitative Equity Intelligence, Neuro-Symbolic Agent Debates, 5-Pillar Multi-Factor Ranking, and 2D Position-Sizing Matrix.**

---

## 📑 Table of Contents
1. [Executive Summary & Philosophy](#executive-summary--philosophy)
2. [4-Step Guided Institutional Workflow](#4-step-guided-institutional-workflow)
3. [2D Stock Scoring Architecture (Quality vs. Risk Anchor)](#2d-stock-scoring-architecture)
   - [Risk Anchor (Safety & Solvency Filter)](#1-risk-anchor-safety--solvency-filter-10-points)
   - [Quality Engine (Growth & Economic Moat)](#2-quality-engine-growth--economic-moat-10-points)
   - [2D Quadrant Decision Gates & Position Sizing](#3-2d-quadrant-decision-gates--position-sizing)
4. [5-Pillar Composite Quant Scoring Engine](#5-pillar-composite-quant-scoring-engine)
   - [Pillar Definitions & Weightings](#pillar-definitions--weightings)
   - [Sector-Relative Z-Score Normalization](#sector-relative-z-score-normalization)
   - [Dynamic Proportional Reweighting & Data Confidence](#dynamic-proportional-reweighting--data-confidence)
   - [Strategy Profiles](#strategy-profiles)
5. [Real-Time Market Telemetry & Smart Symbol Resolution](#real-time-market-telemetry--smart-symbol-resolution)
6. [Neuro-Symbolic Agent Corridor & AI Verification Audit](#neuro-symbolic-agent-corridor--ai-verification-audit)
7. [System Architecture & Tech Stack](#system-architecture--tech-stack)
8. [Testing & Verification Suite](#testing--verification-suite)

---

## Executive Summary & Philosophy

**STRATOS** is an institutional quantitative terminal engineered to bridge mathematical factor modeling with multi-agent AI critique. Unlike consumer-grade stock screeners that rely on static heuristics or ungrounded AI summaries, STRATOS enforces rigorous statistical discipline:

- **Mathematical Grounding:** Every rating is computed via sector-relative Z-score normalization and graduated linear tapers against verified financial benchmarks.
- **Risk-First Separation:** Fast-growing companies with fragile balance sheets are mathematically isolated from fortress-tier balance sheets through independent coordinate axes.
- **Adversarial Synthesis:** Gemini-powered bull and bear agent corridors stress-test every asset prior to portfolio inclusion.
- **Deterministic Reliability:** Live Yahoo Finance v8 chart feeds with automated deterministic fallbacks ensure high availability.

---

## 4-Step Guided Institutional Workflow

The user interface is structured as a 4-step workflow:

```
[ Step 1: Research Asset ] ➔ [ Step 2: Agent Debate ] ➔ [ Step 3: Basket Sizing ] ➔ [ Step 4: Quant Verification ]
```

1. **Step 1: Research Asset (Stock Dossier & Telemetry)**
   - Search any global asset (US Equities, European Blue-Chips, Indian Stocks, Crypto, Commodities, Futures).
   - View spot price, 52-week range, trailing/forward P/E multiples, 14-day RSI, 20-day SMA, and annualized volatility.
   - Interactive historical candlestick chart with ATR volatility bands and 20-day trend lines.
   - Dual scoring breakdown: **2D Coordinate Sizing Matrix** + **5-Pillar Composite Quant Framework**.

2. **Step 2: Agent Corridor (Adversarial AI Debate)**
   - Triggers an adversarial institutional debate between the **STRATOS Bull Thesis Agent** (identifying growth catalysts, secular tailwinds, and multiple expansion) and the **Bear Risk Critic Agent** (interrogating balance sheet leverage, margin compression, and macro headwinds).
   - Multi-model Gemini fallback (`gemini-2.5-flash` ➔ `gemini-2.0-flash` ➔ `gemini-1.5-flash` ➔ `gemini-2.5-pro`) with deterministic fallbacks if offline.

3. **Step 3: Basket & Allocation Matrix (Position Sizing)**
   - Manage target asset baskets with live position tracking and capital allocation sliders.
   - Built-in **Peer Comparison Matrix** surfacing higher-rated alternatives in the same sector.
   - **Institutional Growth Projection Calculator** (Monte Carlo & Compound Growth with volatility adjustments).

4. **Step 4: Quant Verification & AI Audit Matrix**
   - Formal institutional gatekeeper: filters out assets failing minimum score thresholds (Score < 5.0) or critical solvency criteria.
   - **Auto-Rebalancing Engine**: Normalizes portfolio weights to 100% and calculates exact dollar allocations and share purchase counts.
   - Comprehensive AI Portfolio Audit delivering actionable diversification and risk commentary.

---

## 2D Stock Scoring Architecture

The 2D Scoring Engine evaluates assets across two independent mathematical axes, producing a coordinate pair **`(Risk Anchor, Quality)`** where each axis is scored on a **0.0 to 10.0 scale**:

```
 QUALITY (Y-Axis)
  ▲
  │   [ Speculative Growth ]   │    [ ★ Core Holding ]
  │   Quality ≥ 7.0            │    Quality ≥ 7.0
  │   Risk Anchor < 7.0        │    Risk Anchor ≥ 7.0
7.0 ── ── ── ── ── ── ── ── ── ┼ ── ── ── ── ── ── ── ── ── ──
  │   [ Avoid / Underperform ] │    [ Value / Contrarian ]
  │   Quality < 7.0            │    Quality < 7.0
  │   Risk Anchor < 7.0        │    Risk Anchor ≥ 7.0
  └────────────────────────────┴───────────────────────────► RISK ANCHOR (X-Axis)
  0.0                         7.0                         10.0
```

### 1. Risk Anchor (Safety & Solvency Filter) — 10 Points
The Risk Anchor acts as a balance sheet filter to prevent catastrophic capital loss.

| Metric | Max Pts | Target / Full Credit | Zero Credit Threshold | Scoring Formula & Taper | Flags Triggered |
| :--- | :---: | :---: | :---: | :--- | :--- |
| **Net Debt / EBITDA** | **2.0 pts** | $\le 1.0\text{x}$ or Net Cash | $\ge 3.0\text{x}$ | Linear taper between $1.0\text{x}$ and $3.0\text{x}$. Net Cash receives full credit. | `FLAG_NET_CASH_POSITION`, `FLAG_ELEVATED_LEVERAGE_BURDEN` |
| **Interest Coverage** | **2.0 pts** | $\ge 8.0\text{x}$ or Zero Debt | $\le 2.0\text{x}$ | Linear taper between $2.0\text{x}$ and $8.0\text{x}$. Zero debt / infinite coverage gets full credit. | `FLAG_ZERO_DEBT_SOLVENT`, `FLAG_CRITICAL_INTEREST_BURDEN` |
| **Positive OCF Years** | **3.0 pts** | 5 consecutive years | 0 years | $0.60\text{ pts}$ per consecutive positive operating cash flow year (up to 5 years). | `FLAG_LIMITED_OR_CHOPPY_CASHFLOW` |
| **Market Beta** | **1.5 pts** | $\le 0.80$ | $\ge 1.60$ | Linear taper between $0.80$ and $1.60$. | `FLAG_HIGH_BETA_VOLATILITY`, `FLAG_BETA_UNAVAILABLE_SUBSTITUTED` |
| **Operating Margin Stability** | **1.5 pts** | $\le 50\%$ of peer standard dev | $\ge 150\%$ of peer standard dev | Ratio of asset margin std dev to peer group std dev. | `FLAG_HIGH_MARGIN_VOLATILITY`, `FLAG_SECTOR_MARGIN_FALLBACK` |

### 2. Quality Engine (Growth & Economic Moat) — 10 Points
The Quality Engine measures sustainable competitive advantage and capital efficiency.

| Metric | Max Pts | Target / Full Credit | Zero Credit Threshold | Scoring Formula & Taper | Flags Triggered |
| :--- | :---: | :---: | :---: | :--- | :--- |
| **Gross Margin** | **2.0 pts** | $\ge 55\%$ | $\le 25\%$ | Linear taper between $25\%$ and $55\%$. | `FLAG_COMPRESSED_GROSS_MARGIN` |
| **ROIC** | **2.0 pts** | $\ge 20\%$ | $\le 5\%$ | Linear taper between $5\%$ and $20\%$. Negative ROIC gets 0. | `FLAG_NEGATIVE_INVESTED_CAPITAL`, `FLAG_SUBPAR_CAPITAL_EFFICIENCY` |
| **FCF / Net Income** | **2.0 pts** | $\ge 1.20\text{x}$ | $\le 0.30\text{x}$ | Cash conversion ratio. Linear taper between $0.30\text{x}$ and $1.20\text{x}$. | `FLAG_NEGATIVE_NET_INCOME`, `FLAG_POOR_EARNINGS_CONVERSION` |
| **PEG Ratio** | **2.0 pts** | $\le 1.00\text{x}$ | $\ge 2.50\text{x}$ | Valuation relative to growth. Linear taper between $1.00\text{x}$ and $2.50\text{x}$. | `FLAG_EXPENSIVE_PEG_VALUATION`, `FLAG_PEG_UNDEFINED` |
| **3-Year Revenue CAGR** | **2.0 pts** | $\ge 20\%$ | $\le 0\%$ | Top-line compound growth. Linear taper between $0\%$ and $20\%$. | `FLAG_STAGNANT_OR_CONTRACTING_TOPLINE` |

### 3. 2D Quadrant Decision Gates & Position Sizing

1. **★ Core Holding (Quality $\ge 7.0$, Risk Anchor $\ge 7.0$):**
   - **Status:** Institutional High-Conviction Alpha.
   - **Sizing Guidance:** Standard unconstrained sizing (e.g. 5% to 15% portfolio allocation).
2. **Speculative Growth (Quality $\ge 7.0$, Risk Anchor $< 7.0$):**
   - **Status:** High Growth / Leveraged Engine.
   - **Gate Rule Activated:** While business quality is strong, balance sheet risk or market volatility is elevated. Mandatory allocation cap (max 2% to 5%) and trailing stop-losses.
3. **Value / Contrarian Watch (Quality $< 7.0$, Risk Anchor $\ge 7.0$):**
   - **Status:** Defensive Balance Sheet / Low Growth.
   - **Sizing Guidance:** Reduced allocation; monitor for operational turnaround or macro re-rating.
4. **Avoid / Underperform (Quality $< 7.0$, Risk Anchor $< 7.0$):**
   - **Status:** Fundamental Deterioration.
   - **Sizing Guidance:** Zero allocation / Disqualified from portfolio matrix.
5. **Insufficient Data ($>3$ Missing Metrics):**
   - **Status:** Incomplete Data.
   - **Sizing Guidance:** Requires manual financial statement auditing before capital allocation.

---

## 5-Pillar Composite Quant Scoring Engine

In addition to the 2D Coordinate system, STRATOS maintains a neuro-symbolic 5-Pillar ranking system that scores assets from **1.0 to 10.0**.

### Pillar Definitions & Weightings

```
Composite Quant Score (10.0) =
  Valuation (25%) + Quality (25%) + Growth (20%) + Momentum (20%) + Downside Risk (10%)
```

1. **Pillar 1: Valuation (25% Weight)**
   - Trailing P/E Ratio (Inverted)
   - EV / EBITDA Multiple (Inverted)
   - Free Cash Flow Yield (Normal)
2. **Pillar 2: Quality & Moat (25% Weight)**
   - Return on Invested Capital (ROIC)
   - Return on Equity (ROE)
   - Gross / Operating Margins
   - Earnings Stability (10-year variance)
   - Debt-to-Equity / Leverage (Inverted)
3. **Pillar 3: Growth & Revisions (20% Weight)**
   - Forward Revenue Growth
   - EPS Growth Rate
   - Sell-Side Analyst Revisions
4. **Pillar 4: Price Momentum (20% Weight)**
   - 6-Month Relative Momentum (Excluding most recent 1 month to mitigate short-term mean-reversion noise)
   - 12-Month Relative Momentum (Excluding 1 month)
   - Blended 50/50 Z-Score calculation
5. **Pillar 5: Downside Risk & Volatility (10% Weight)**
   - Annualized Realized Volatility (Inverted)
   - Market Beta (Inverted)
   - Maximum Drawdown (Inverted)
   - Bid-Ask Spread & Turnover Liquidity

### Sector-Relative Z-Score Normalization

Raw metrics are normalized against sector-specific means ($\mu$) and standard deviations ($\sigma$):

$$z = \frac{\text{raw\_value} - \mu_{\text{sector}}}{\sigma_{\text{sector}}}$$

- For inverted metrics (e.g. P/E, Debt/Equity, Volatility), the sign is inverted ($z = -z$).
- **Winsorization:** Extreme outliers are clamped at $[-3.0, +3.0]$ standard deviations to protect against statistical distortion.
- **Score Rescaling:** Winsorized Z-scores are mapped to a $0.0 - 10.0$ continuum:

$$\text{Score} = (z_{\text{winsorized}} + 3.0) \times \frac{10.0}{6.0}$$

### Dynamic Proportional Reweighting & Data Confidence

When data providers omit specific financial metrics or an entire pillar is unavailable:
1. Active factors within a pillar are averaged across present metrics.
2. If an entire pillar is missing, the composite score is calculated by proportionally reweighting only the remaining active pillars:

$$\text{Composite Score} = \frac{\sum_{p \in \text{active}} w_p \times \text{Score}_p}{\sum_{p \in \text{active}} w_p}$$

3. **Data Confidence Rating:**
   - **High Confidence:** $\ge 80\%$ of all factors available across all 5 pillars.
   - **Moderate Confidence:** $60\% - 79\%$ factor coverage.
   - **Low Confidence:** $<60\%$ factor coverage or $\ge 1$ complete pillar missing.

### Strategy Profiles

Users can adjust profile weightings:

| Profile | Valuation | Quality | Growth | Momentum | Risk |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Balanced** | 25% | 25% | 20% | 20% | 10% |
| **Conservative** | 30% | 30% | 10% | 10% | 20% |
| **Aggressive** | 15% | 20% | 30% | 25% | 10% |

---

## Real-Time Market Telemetry & Smart Symbol Resolution

STRATOS features an enterprise-grade symbol resolution engine:

- **Fuzzy Levenshtein Distance:** Handles typos (e.g. `aple` ➔ `AAPL`, `nividia` ➔ `NVDA`, `microsofft` ➔ `MSFT`, `googl` ➔ `GOOGL`).
- **Global Asset Universe:**
  - US Equities (`AAPL`, `NVDA`, `PLTR`, `TSLA`, `MSFT`, `GOOGL`, `AMZN`, `META`, etc.)
  - European Equities (`ASML`, `SAP`, `NVO`, `SHEL`, `SIEGY`, `LVMUY`, `SAN`)
  - Indian NSE Equities (`RELIANCE.NS`, `TCS.NS`, `HDFCBANK.NS`, `INFY.NS`, `TATAMOTORS.NS`)
  - Digital Assets (`BTC-USD`, `ETH-USD`, `SOL-USD`, `BNB-USD`, `XRP-USD`)
  - Commodities & Futures (`CL=F` Crude Oil, `GC=F` Gold, `NG=F` Natural Gas, `ES=F` S&P Futures)
- **Data Feed Telemetry Tagging:** Every asset transparently indicates `LIVE FEED (YAHOO FINANCE)` vs. `SIMULATED FEED (MODELED DATA)` with zero silent mock data.

---

## Neuro-Symbolic Agent Corridor & AI Verification Audit

- **Adversarial Synthesis:** Leverages Gemini to generate distinct analytical perspectives.
- **Bull Agent:** Focuses on revenue expansion, margin leverage, TAM growth, and competitive positioning.
- **Bear Agent:** Interrogates multiple compression risk, debt maturities, customer concentration, and supply-chain vulnerabilities.
- **Portfolio AI Risk Auditor:** Evaluates correlation risk, sector concentration, and macro sensitivities across user-selected baskets.

---

## System Architecture & Tech Stack

- **Backend:** Node.js, Express, TypeScript, Vite Middleware, esbuild.
- **AI Engine:** Google GenAI SDK (`@google/genai`) with multi-model fallback cascades.
- **Frontend:** React 18, TypeScript, Tailwind CSS, Recharts, Lucide Icons, Framer Motion (`motion/react`).
- **Data Persistence:** Local session workspace state with deterministic seed hashing.

```
/
├── server.ts                             # Express server, API endpoints, Yahoo Finance feed & Gemini proxy
├── src/
│   ├── App.tsx                           # Main 4-step institutional workflow dashboard
│   ├── types.ts                          # Comprehensive TypeScript definitions (2D scoring, 5 pillars, telemetry)
│   ├── components/
│   │   ├── Header.tsx                    # Terminal header with mode toggles & workspace reset
│   │   ├── StockDossier.tsx              # Candlestick charts, 2D scoring, 5 pillars, and telemetry cards
│   │   ├── Scoring2DVisualizer.tsx       # 2D Cartesian quadrant plot & graduated sub-score drawer
│   │   ├── AgentCorridor.tsx             # Adversarial Bull vs Bear AI debate corridor
│   │   ├── PortfolioMatrix.tsx           # Position sizing matrix, budget allocation, & verification gates
│   │   ├── PeerComparisonMatrix.tsx      # Sector peer ranker and higher-rated alternatives
│   │   ├── GrowthProjectionCalculator.tsx# Compound & Monte Carlo growth simulator
│   │   └── AiStockChatbotModal.tsx       # Deep-dive interactive AI stock analyst chatbot
│   └── services/
│       ├── quantScoringEngine.ts         # 5-Pillar engine, 2D scoring engine, graduated linear tapers
│       ├── quantScoringEngine.test.ts    # Comprehensive 40-assertion unit testing suite
│       ├── verifiedStockData.ts          # Verified multi-factor benchmark parameters & seed generator
│       └── api.ts                        # Client API interface
└── README.md                             # Complete architectural & mathematical documentation
```

---

## Testing & Verification Suite

The repository includes a comprehensive unit test suite covering the 5-pillar engine, 2D coordinate engine, Winsorization limits, profile reweighting, and edge cases.

To execute the test suite:

```bash
npx tsx src/services/quantScoringEngine.test.ts
```

**Test Suite Coverage (40/40 Passing):**
- [x] Complete stock data validation & confidence tagging.
- [x] Missing factor isolation and pillar averaging.
- [x] Missing pillar proportional reweighting.
- [x] Winsorization boundary enforcement ($\pm 3\sigma \rightarrow 0.0\text{ to }10.0$).
- [x] Profile reweighting (Balanced, Conservative, Aggressive).
- [x] 2D Scoring: Core Holding Quadrant verification.
- [x] 2D Scoring: Speculative Growth Gate Rule & Position Sizing Flag.
- [x] 2D Scoring: Value / Contrarian Watch Tier verification.
- [x] 2D Scoring: Net Cash and Zero Debt flag activations.
- [x] 2D Scoring: Insufficient Data tier threshold testing ($>3$ missing metrics).

---

## Getting Started

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Run Development Server:**
   ```bash
   npm run dev
   ```

3. **Run Quant Engine Tests:**
   ```bash
   npx tsx src/services/quantScoringEngine.test.ts
   ```

4. **Production Build:**
   ```bash
   npm run build
   ```

---
*STRATOS Sovereign Engine // Institutional Quantitative Intelligence & Risk Management.*
