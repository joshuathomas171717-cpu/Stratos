export type QuantProfile = 'balanced' | 'conservative' | 'aggressive';

export interface ProfileWeights {
  valuation: number;
  quality: number;
  growth_revisions: number;
  momentum: number;
  risk: number;
}

export const QUANT_PROFILES: Record<QuantProfile, ProfileWeights> = {
  balanced: {
    valuation: 0.25,
    quality: 0.25,
    growth_revisions: 0.20,
    momentum: 0.20,
    risk: 0.10,
  },
  conservative: {
    valuation: 0.30,
    quality: 0.30,
    growth_revisions: 0.10,
    momentum: 0.10,
    risk: 0.20,
  },
  aggressive: {
    valuation: 0.15,
    quality: 0.15,
    growth_revisions: 0.30,
    momentum: 0.30,
    risk: 0.10,
  },
};

export interface FactorSubScore {
  raw: number | null;
  z: number | null;
  score: number | null;
}

export interface PillarResult {
  score: number | null;
  present_factors_count: number;
  total_factors_count: number;
  factors: Record<string, FactorSubScore>;
}

export interface CompositeQuantResult {
  ticker: string;
  profile: QuantProfile;
  composite_score: number;
  quantScore: number; // For backward compatibility with legacy UI components
  data_confidence: 'high' | 'medium' | 'low';
  missing_pillars: string[];
  pillars: {
    valuation: PillarResult;
    quality: PillarResult;
    growth_revisions: PillarResult;
    momentum: PillarResult;
    risk: PillarResult;
  };
  factorBreakdown: {
    sharpeRatio: number;
    sectorZScore: number;
    sectorAveragePE: number;
    valuationScore: number;
    momentumScore: number;
    qualityScore: number;
    growthScore: number;
    riskScore: number;
    sectorName: string;
  };
}

export interface SectorBenchmarkData {
  sectorName: string;
  pe_ratio: { mean: number; std: number };
  ev_ebitda: { mean: number; std: number };
  fcf_yield: { mean: number; std: number };
  roic: { mean: number; std: number };
  roe: { mean: number; std: number };
  gross_operating_margins: { mean: number; std: number };
  earnings_stability: { mean: number; std: number };
  leverage: { mean: number; std: number };
  revenue_growth: { mean: number; std: number };
  eps_growth: { mean: number; std: number };
  analyst_revisions: { mean: number; std: number };
  ret_6m_ex1: { mean: number; std: number };
  ret_12m_ex1: { mean: number; std: number };
  volatility: { mean: number; std: number };
  max_drawdown: { mean: number; std: number };
  beta: { mean: number; std: number };
  liquidity: { mean: number; std: number };
}

export const DEFAULT_SECTOR_BENCHMARK: SectorBenchmarkData = {
  sectorName: 'General Equity Universe',
  pe_ratio: { mean: 24.0, std: 8.0 },
  ev_ebitda: { mean: 15.0, std: 5.0 },
  fcf_yield: { mean: 0.04, std: 0.02 },
  roic: { mean: 0.14, std: 0.08 },
  roe: { mean: 0.16, std: 0.10 },
  gross_operating_margins: { mean: 0.22, std: 0.12 },
  earnings_stability: { mean: 0.70, std: 0.20 },
  leverage: { mean: 1.8, std: 1.2 },
  revenue_growth: { mean: 0.10, std: 0.12 },
  eps_growth: { mean: 0.12, std: 0.15 },
  analyst_revisions: { mean: 0.0, std: 0.25 },
  ret_6m_ex1: { mean: 0.08, std: 0.18 },
  ret_12m_ex1: { mean: 0.12, std: 0.25 },
  volatility: { mean: 0.28, std: 0.12 },
  max_drawdown: { mean: -0.22, std: 0.12 },
  beta: { mean: 1.0, std: 0.35 },
  liquidity: { mean: 1000000000, std: 2000000000 },
};

export const SECTOR_BENCHMARKS: Record<string, SectorBenchmarkData> = {
  Technology: {
    ...DEFAULT_SECTOR_BENCHMARK,
    sectorName: 'Technology & AI',
    pe_ratio: { mean: 32.0, std: 12.0 },
    ev_ebitda: { mean: 22.0, std: 8.0 },
    fcf_yield: { mean: 0.035, std: 0.02 },
    roic: { mean: 0.22, std: 0.12 },
    roe: { mean: 0.25, std: 0.15 },
    gross_operating_margins: { mean: 0.35, std: 0.15 },
    revenue_growth: { mean: 0.18, std: 0.18 },
    eps_growth: { mean: 0.20, std: 0.22 },
  },
  Financials: {
    ...DEFAULT_SECTOR_BENCHMARK,
    sectorName: 'Financials & Banking',
    pe_ratio: { mean: 14.0, std: 4.0 },
    ev_ebitda: { mean: 10.0, std: 3.0 },
    fcf_yield: { mean: 0.06, std: 0.025 },
    roic: { mean: 0.10, std: 0.04 },
    roe: { mean: 0.14, std: 0.05 },
    leverage: { mean: 4.5, std: 2.0 },
  },
  Healthcare: {
    ...DEFAULT_SECTOR_BENCHMARK,
    sectorName: 'Healthcare & Pharma',
    pe_ratio: { mean: 25.0, std: 9.0 },
    ev_ebitda: { mean: 17.0, std: 6.0 },
    gross_operating_margins: { mean: 0.30, std: 0.12 },
  },
  Crypto: {
    ...DEFAULT_SECTOR_BENCHMARK,
    sectorName: 'Digital Assets & Web3',
    pe_ratio: { mean: 45.0, std: 20.0 },
    ev_ebitda: { mean: 30.0, std: 15.0 },
    volatility: { mean: 0.65, std: 0.25 },
    max_drawdown: { mean: -0.45, std: 0.20 },
    beta: { mean: 2.1, std: 0.8 },
  },
  Futures: {
    ...DEFAULT_SECTOR_BENCHMARK,
    sectorName: 'Commodity & Index Futures',
    pe_ratio: { mean: 20.0, std: 6.0 },
    volatility: { mean: 0.22, std: 0.08 },
    max_drawdown: { mean: -0.15, std: 0.08 },
    beta: { mean: 1.0, std: 0.25 },
  },
};

/**
 * Reusable Normalization Pipeline:
 * Raw Value -> Sector-relative Z-score -> Direction Adjust -> Winsorize at ±3 -> Rescale to 0-10
 */
export function normalizeFactorValue(
  rawVal: number | null | undefined,
  mean: number,
  stdDev: number,
  isInverted: boolean = false
): { raw: number | null; z: number | null; score: number | null } {
  if (rawVal === null || rawVal === undefined || isNaN(rawVal)) {
    return { raw: null, z: null, score: null };
  }

  const safeStd = Math.max(0.0001, stdDev);
  const rawZ = (rawVal - mean) / safeStd;
  
  // Invert if lower raw value is better (e.g. P/E, EV/EBITDA, Net Debt, Volatility)
  const adjustedZ = isInverted ? -1 * rawZ : rawZ;

  // Winsorize at ±3
  const winsorizedZ = Math.min(3.0, Math.max(-3.0, adjustedZ));

  // Linear Rescale: z = -3 -> 0, z = 0 -> 5, z = +3 -> 10
  const score = Math.min(10.0, Math.max(0.0, (winsorizedZ + 3.0) * (10.0 / 6.0)));

  return {
    raw: Math.round(rawVal * 10000) / 10000,
    z: Math.round(adjustedZ * 100) / 100,
    score: Math.round(score * 10) / 10,
  };
}

export interface RawStockMetricsInput {
  ticker: string;
  sectorName?: string;
  
  // Valuation inputs
  pe_ratio?: number | null;
  ev_ebitda?: number | null;
  fcf_yield?: number | null;

  // 2D Risk Anchor specific inputs
  net_debt_ebitda?: number | null;
  interest_coverage?: number | null;
  positive_ocf_years?: number | null;
  operating_margin_std_dev?: number | null;
  peer_operating_margin_std_dev?: number | null;
  margin_stability?: string | number | null;

  // 2D Quality specific inputs
  gross_margin?: number | null;
  fcf_net_income?: number | null;
  peg_ratio?: number | null;
  revenue_cagr_3yr?: number | null;

  // Quality inputs
  roic?: number | null;
  roe?: number | null;
  gross_operating_margins?: number | null;
  earnings_stability?: number | null;
  leverage?: number | null;

  // Growth & Revisions inputs
  revenue_growth?: number | null;
  eps_growth?: number | null;
  analyst_revisions?: number | null;

  // Momentum inputs
  ret_6m_ex1?: number | null;
  ret_12m_ex1?: number | null;

  // Risk inputs
  volatility?: number | null;
  max_drawdown?: number | null;
  beta?: number | null;
  liquidity?: number | null;
}

/**
 * 5-Pillar Composite Quant Scoring Engine
 */
export function compute5PillarQuantScore(
  input: RawStockMetricsInput,
  profileName: QuantProfile = 'balanced'
): CompositeQuantResult {
  const profile = QUANT_PROFILES[profileName] ? profileName : 'balanced';
  const weights = QUANT_PROFILES[profile];

  const sectorKey = input.sectorName || 'General Equity Universe';
  const bench = SECTOR_BENCHMARKS[sectorKey] || DEFAULT_SECTOR_BENCHMARK;

  let totalPresentFactors = 0;
  const maxPossibleFactors = 17; // 3 + 5 + 3 + 2 + 4

  // Helper to build a pillar result
  function buildPillar(
    factorConfigs: Array<{
      key: string;
      val: number | null | undefined;
      mean: number;
      std: number;
      isInverted?: boolean;
    }>
  ): PillarResult {
    const factors: Record<string, FactorSubScore> = {};
    let validScoresSum = 0;
    let validCount = 0;

    for (const cfg of factorConfigs) {
      const res = normalizeFactorValue(cfg.val, cfg.mean, cfg.std, cfg.isInverted);
      factors[cfg.key] = res;
      if (res.score !== null) {
        validScoresSum += res.score;
        validCount++;
        totalPresentFactors++;
      }
    }

    const pillarScore = validCount > 0 ? Math.round((validScoresSum / validCount) * 10) / 10 : null;

    return {
      score: pillarScore,
      present_factors_count: validCount,
      total_factors_count: factorConfigs.length,
      factors,
    };
  }

  // 1. Valuation Pillar (Weight: 25%)
  const valuation = buildPillar([
    { key: 'pe_ratio', val: input.pe_ratio, mean: bench.pe_ratio.mean, std: bench.pe_ratio.std, isInverted: true },
    { key: 'ev_ebitda', val: input.ev_ebitda, mean: bench.ev_ebitda.mean, std: bench.ev_ebitda.std, isInverted: true },
    { key: 'fcf_yield', val: input.fcf_yield, mean: bench.fcf_yield.mean, std: bench.fcf_yield.std, isInverted: false },
  ]);

  // 2. Quality Pillar (Weight: 25%)
  const quality = buildPillar([
    { key: 'roic', val: input.roic, mean: bench.roic.mean, std: bench.roic.std, isInverted: false },
    { key: 'roe', val: input.roe, mean: bench.roe.mean, std: bench.roe.std, isInverted: false },
    { key: 'gross_operating_margins', val: input.gross_operating_margins, mean: bench.gross_operating_margins.mean, std: bench.gross_operating_margins.std, isInverted: false },
    { key: 'earnings_stability', val: input.earnings_stability, mean: bench.earnings_stability.mean, std: bench.earnings_stability.std, isInverted: false },
    { key: 'leverage', val: input.leverage, mean: bench.leverage.mean, std: bench.leverage.std, isInverted: true },
  ]);

  // 3. Growth & Revisions Pillar (Weight: 20%)
  const growth_revisions = buildPillar([
    { key: 'revenue_growth', val: input.revenue_growth, mean: bench.revenue_growth.mean, std: bench.revenue_growth.std, isInverted: false },
    { key: 'eps_growth', val: input.eps_growth, mean: bench.eps_growth.mean, std: bench.eps_growth.std, isInverted: false },
    { key: 'analyst_revisions', val: input.analyst_revisions, mean: bench.analyst_revisions.mean, std: bench.analyst_revisions.std, isInverted: false },
  ]);

  // 4. Momentum Pillar (Weight: 20%): Blend 6m & 12m z-scores 50/50 before rescaling
  let momentum: PillarResult;
  {
    const has6m = input.ret_6m_ex1 !== null && input.ret_6m_ex1 !== undefined;
    const has12m = input.ret_12m_ex1 !== null && input.ret_12m_ex1 !== undefined;

    let blendedScore: number | null = null;
    let blendedZ: number | null = null;
    let validCount = 0;

    if (has6m || has12m) {
      let zSum = 0;
      let count = 0;

      if (has6m) {
        const z6 = (input.ret_6m_ex1! - bench.ret_6m_ex1.mean) / bench.ret_6m_ex1.std;
        zSum += z6;
        count++;
      }
      if (has12m) {
        const z12 = (input.ret_12m_ex1! - bench.ret_12m_ex1.mean) / bench.ret_12m_ex1.std;
        zSum += z12;
        count++;
      }

      blendedZ = zSum / count;
      const winsorizedZ = Math.min(3.0, Math.max(-3.0, blendedZ));
      blendedScore = Math.min(10.0, Math.max(0.0, (winsorizedZ + 3.0) * (10.0 / 6.0)));
      blendedScore = Math.round(blendedScore * 10) / 10;
      validCount = count;
      totalPresentFactors += count;
    }

    momentum = {
      score: blendedScore,
      present_factors_count: validCount,
      total_factors_count: 2,
      factors: {
        blended_momentum: {
          raw: has12m ? input.ret_12m_ex1! : has6m ? input.ret_6m_ex1! : null,
          z: blendedZ !== null ? Math.round(blendedZ * 100) / 100 : null,
          score: blendedScore,
        },
      },
    };
  }

  // 5. Risk Pillar (Weight: 10%): Inverted scale for volatility, drawdown, beta; normal for liquidity
  const risk = buildPillar([
    { key: 'volatility', val: input.volatility, mean: bench.volatility.mean, std: bench.volatility.std, isInverted: true },
    { key: 'max_drawdown', val: input.max_drawdown, mean: bench.max_drawdown.mean, std: bench.max_drawdown.std, isInverted: true },
    { key: 'beta', val: input.beta, mean: bench.beta.mean, std: bench.beta.std, isInverted: true },
    { key: 'liquidity', val: input.liquidity, mean: bench.liquidity.mean, std: bench.liquidity.std, isInverted: false },
  ]);

  // Evaluate missing pillars and reweight present pillars
  const missing_pillars: string[] = [];
  const activePillars: Array<{ key: keyof ProfileWeights; score: number; weight: number }> = [];

  const pillarEntries: Array<{ key: keyof ProfileWeights; result: PillarResult }> = [
    { key: 'valuation', result: valuation },
    { key: 'quality', result: quality },
    { key: 'growth_revisions', result: growth_revisions },
    { key: 'momentum', result: momentum },
    { key: 'risk', result: risk },
  ];

  for (const item of pillarEntries) {
    if (item.result.score === null) {
      missing_pillars.push(item.key);
    } else {
      activePillars.push({
        key: item.key,
        score: item.result.score,
        weight: weights[item.key],
      });
    }
  }

  let composite_score = 5.0;
  if (activePillars.length > 0) {
    const sumActiveWeights = activePillars.reduce((acc, p) => acc + p.weight, 0);
    const weightedSum = activePillars.reduce((acc, p) => acc + p.score * (p.weight / sumActiveWeights), 0);
    composite_score = Math.round(Math.min(10.0, Math.max(1.0, weightedSum)) * 10) / 10;
  }

  // Determine Data Confidence
  const factorRatio = totalPresentFactors / maxPossibleFactors;
  let data_confidence: 'high' | 'medium' | 'low' = 'low';

  if (missing_pillars.length === 0 && factorRatio >= 0.80) {
    data_confidence = 'high';
  } else if (missing_pillars.length === 0 && factorRatio >= 0.60) {
    data_confidence = 'medium';
  } else {
    data_confidence = 'low';
  }

  const valScore = valuation.score ?? 5.0;
  const qualScore = quality.score ?? 5.0;
  const momScore = momentum.score ?? 5.0;
  const grScore = growth_revisions.score ?? 5.0;
  const rkScore = risk.score ?? 5.0;

  // Construct factorBreakdown for legacy backwards compatibility
  const peVal = input.pe_ratio ?? bench.pe_ratio.mean;
  const sectorZ = Math.round(((peVal - bench.pe_ratio.mean) / bench.pe_ratio.std) * 100) / 100;
  const sharpeRatioEst = Math.round(((momScore - 5.0) / 1.5) * 100) / 100;

  return {
    ticker: input.ticker,
    profile,
    composite_score,
    quantScore: composite_score,
    data_confidence,
    missing_pillars,
    pillars: {
      valuation,
      quality,
      growth_revisions,
      momentum,
      risk,
    },
    factorBreakdown: {
      sharpeRatio: Math.max(-2.0, Math.min(4.0, sharpeRatioEst)),
      sectorZScore: sectorZ,
      sectorAveragePE: bench.pe_ratio.mean,
      valuationScore: valScore,
      momentumScore: momScore,
      qualityScore: qualScore,
      growthScore: grScore,
      riskScore: rkScore,
      sectorName: bench.sectorName,
    },
  };
}

/**
 * ============================================================================
 * 2D STOCK SCORING ARCHITECTURE (Quality Engine / 10, Risk Anchor / 10)
 * ============================================================================
 */

import {
  GraduatedMetricScore,
  QualityScoreBreakdown,
  QuadrantTier,
  RiskAnchorBreakdown,
  Score2DResult,
} from '../types';

export interface Scoring2DConfig {
  riskThreshold: number; // e.g. 7.0
  qualityThreshold: number; // e.g. 7.0
  maxMissingAllowed: number; // e.g. 3
  riskMetrics: {
    netDebtEbitda: { weight: number; fullCredit: number; zeroCredit: number };
    interestCoverage: { weight: number; fullCredit: number; zeroCredit: number };
    positiveOcfYears: { weight: number; pointsPerYear: number; maxYears: number };
    beta: { weight: number; fullCredit: number; zeroCredit: number };
    marginStability: { weight: number; fullCreditRatio: number; zeroCreditRatio: number };
  };
  qualityMetrics: {
    grossMargin: { weight: number; fullCredit: number; zeroCredit: number };
    roic: { weight: number; fullCredit: number; zeroCredit: number };
    fcfToNetIncome: { weight: number; fullCredit: number; zeroCredit: number };
    pegRatio: { weight: number; fullCredit: number; zeroCredit: number };
    revenueCagr3Yr: { weight: number; fullCredit: number; zeroCredit: number };
  };
}

export const SCORING_2D_CONFIG: Scoring2DConfig = {
  riskThreshold: 7.0,
  qualityThreshold: 7.0,
  maxMissingAllowed: 3,
  riskMetrics: {
    netDebtEbitda: { weight: 2.0, fullCredit: 1.0, zeroCredit: 3.0 },
    interestCoverage: { weight: 2.0, fullCredit: 8.0, zeroCredit: 2.0 },
    positiveOcfYears: { weight: 3.0, pointsPerYear: 0.6, maxYears: 5 },
    beta: { weight: 1.5, fullCredit: 0.8, zeroCredit: 1.6 },
    marginStability: { weight: 1.5, fullCreditRatio: 0.5, zeroCreditRatio: 1.5 },
  },
  qualityMetrics: {
    grossMargin: { weight: 2.0, fullCredit: 0.55, zeroCredit: 0.25 },
    roic: { weight: 2.0, fullCredit: 0.20, zeroCredit: 0.05 },
    fcfToNetIncome: { weight: 2.0, fullCredit: 1.20, zeroCredit: 0.30 },
    pegRatio: { weight: 2.0, fullCredit: 1.0, zeroCredit: 2.5 },
    revenueCagr3Yr: { weight: 2.0, fullCredit: 0.20, zeroCredit: 0.00 },
  },
};

/**
 * Computes the 2D Coordinate Score (Quality / 10, Risk Anchor / 10)
 * Evaluates independent Safety Filter and Quality Engine with graduated points.
 */
export function compute2DStockScore(
  input: RawStockMetricsInput,
  config: Scoring2DConfig = SCORING_2D_CONFIG
): Score2DResult {
  const flags: string[] = [];
  const sectorKey = input.sectorName || 'General Equity Universe';
  const bench = SECTOR_BENCHMARKS[sectorKey] || DEFAULT_SECTOR_BENCHMARK;

  // --------------------------------------------------------------------------
  // 1. RISK ANCHOR (0 - 10) — Safety & Solvency Filter
  // --------------------------------------------------------------------------

  // 1A. Net Debt / EBITDA (< 2.0 target, full credit <= 1.0, 0 credit >= 3.0)
  let netDebtEbitdaPoints = 0;
  let netDebtEbitdaRaw: number | null = null;
  const netDebtFlags: string[] = [];
  
  if (input.net_debt_ebitda !== undefined && input.net_debt_ebitda !== null) {
    netDebtEbitdaRaw = input.net_debt_ebitda;
  } else if (input.leverage !== undefined && input.leverage !== null) {
    // Derived proxy: leverage ratio
    netDebtEbitdaRaw = Math.max(0, input.leverage * 1.5);
  }

  if (netDebtEbitdaRaw === null) {
    netDebtFlags.push('FLAG_MISSING_NET_DEBT_EBITDA');
    netDebtEbitdaPoints = 1.0; // Neutral fallback
  } else if (netDebtEbitdaRaw <= 0) {
    // Net cash company (negative net debt)
    netDebtEbitdaPoints = config.riskMetrics.netDebtEbitda.weight;
    netDebtFlags.push('FLAG_NET_CASH_POSITION');
  } else if (netDebtEbitdaRaw <= config.riskMetrics.netDebtEbitda.fullCredit) {
    netDebtEbitdaPoints = config.riskMetrics.netDebtEbitda.weight;
  } else if (netDebtEbitdaRaw >= config.riskMetrics.netDebtEbitda.zeroCredit) {
    netDebtEbitdaPoints = 0.0;
    netDebtFlags.push('FLAG_ELEVATED_LEVERAGE_BURDEN');
  } else {
    // Linear graduated taper
    const span = config.riskMetrics.netDebtEbitda.zeroCredit - config.riskMetrics.netDebtEbitda.fullCredit;
    const progress = (config.riskMetrics.netDebtEbitda.zeroCredit - netDebtEbitdaRaw) / span;
    netDebtEbitdaPoints = config.riskMetrics.netDebtEbitda.weight * progress;
  }

  const netDebtMetric: GraduatedMetricScore = {
    name: 'Net Debt / EBITDA',
    category: 'risk_anchor',
    rawValue: netDebtEbitdaRaw,
    displayValue: netDebtEbitdaRaw !== null ? `${netDebtEbitdaRaw <= 0 ? 'Net Cash' : `${netDebtEbitdaRaw.toFixed(2)}x`}` : 'N/A',
    pointsEarned: Math.round(netDebtEbitdaPoints * 100) / 100,
    maxPoints: config.riskMetrics.netDebtEbitda.weight,
    formulaDescription: 'Full credit <=1.0x, linear taper to 0 at >=3.0x',
    flags: netDebtFlags,
  };

  // 1B. Interest Coverage (> 5x target, full credit >= 8x, 0 credit <= 2x)
  let interestCovPoints = 0;
  let interestCovRaw: number | null = null;
  const interestFlags: string[] = [];

  if (input.interest_coverage !== undefined && input.interest_coverage !== null) {
    interestCovRaw = input.interest_coverage;
  } else if (input.leverage !== undefined && input.leverage !== null) {
    if (input.leverage <= 0.2) {
      interestCovRaw = 25.0; // Negligible debt burden
    } else {
      interestCovRaw = Math.max(1.0, 15.0 / (input.leverage + 0.2));
    }
  }

  if (interestCovRaw === null) {
    interestFlags.push('FLAG_MISSING_INTEREST_COVERAGE');
    interestCovPoints = 1.0;
  } else if (interestCovRaw >= config.riskMetrics.interestCoverage.fullCredit || !isFinite(interestCovRaw)) {
    interestCovPoints = config.riskMetrics.interestCoverage.weight;
    if (!isFinite(interestCovRaw) || interestCovRaw > 20) {
      interestFlags.push('FLAG_ZERO_DEBT_SOLVENT');
    }
  } else if (interestCovRaw <= config.riskMetrics.interestCoverage.zeroCredit) {
    interestCovPoints = 0.0;
    interestFlags.push('FLAG_CRITICAL_INTEREST_BURDEN');
  } else {
    const span = config.riskMetrics.interestCoverage.fullCredit - config.riskMetrics.interestCoverage.zeroCredit;
    const progress = (interestCovRaw - config.riskMetrics.interestCoverage.zeroCredit) / span;
    interestCovPoints = config.riskMetrics.interestCoverage.weight * progress;
  }

  const interestCovMetric: GraduatedMetricScore = {
    name: 'Interest Coverage',
    category: 'risk_anchor',
    rawValue: interestCovRaw,
    displayValue: interestCovRaw !== null ? `${interestCovRaw > 25 ? '>25x (Solvent)' : `${interestCovRaw.toFixed(1)}x`}` : 'N/A',
    pointsEarned: Math.round(interestCovPoints * 100) / 100,
    maxPoints: config.riskMetrics.interestCoverage.weight,
    formulaDescription: 'Full credit >=8.0x, linear taper to 0 at <=2.0x',
    flags: interestFlags,
  };

  // 1C. Positive Operating Cash Flow Consecutive Years (3.0 pts, 0.6 pts/yr up to 5 yrs)
  let ocfYearsRaw: number | null = null;
  const ocfFlags: string[] = [];

  if (input.positive_ocf_years !== undefined && input.positive_ocf_years !== null) {
    ocfYearsRaw = Math.max(0, Math.min(config.riskMetrics.positiveOcfYears.maxYears, input.positive_ocf_years));
  } else {
    // Derived from earnings stability & FCF yield
    const stability = input.earnings_stability ?? 0.85;
    const fcf = input.fcf_yield ?? 0.035;
    if (stability >= 0.90 && fcf > 0.02) ocfYearsRaw = 5;
    else if (stability >= 0.75 && fcf > 0) ocfYearsRaw = 4;
    else if (fcf > 0) ocfYearsRaw = 3;
    else ocfYearsRaw = 1;
  }

  const ocfPoints = ocfYearsRaw * config.riskMetrics.positiveOcfYears.pointsPerYear;
  if (ocfYearsRaw < 5) {
    ocfFlags.push('FLAG_LIMITED_OR_CHOPPY_CASHFLOW');
  }

  const ocfMetric: GraduatedMetricScore = {
    name: 'Consecutive Positive OCF Years',
    category: 'risk_anchor',
    rawValue: ocfYearsRaw,
    displayValue: `${ocfYearsRaw} / 5 Consecutive Years`,
    pointsEarned: Math.round(ocfPoints * 100) / 100,
    maxPoints: config.riskMetrics.positiveOcfYears.weight,
    formulaDescription: '0.60 pts per consecutive positive year up to 5 years',
    flags: ocfFlags,
  };

  // 1D. Beta (< 1.2 target, full credit <= 0.8, 0 credit >= 1.6)
  let betaPoints = 0;
  let betaRaw: number | null = null;
  const betaFlags: string[] = [];

  if (input.beta !== undefined && input.beta !== null) {
    betaRaw = input.beta;
  } else {
    betaRaw = bench.beta.mean;
    betaFlags.push('FLAG_BETA_UNAVAILABLE_SUBSTITUTED');
  }

  if (betaRaw <= config.riskMetrics.beta.fullCredit) {
    betaPoints = config.riskMetrics.beta.weight;
  } else if (betaRaw >= config.riskMetrics.beta.zeroCredit) {
    betaPoints = 0.0;
    betaFlags.push('FLAG_HIGH_BETA_VOLATILITY');
  } else {
    const span = config.riskMetrics.beta.zeroCredit - config.riskMetrics.beta.fullCredit;
    const progress = (config.riskMetrics.beta.zeroCredit - betaRaw) / span;
    betaPoints = config.riskMetrics.beta.weight * progress;
  }

  const betaMetric: GraduatedMetricScore = {
    name: 'Market Beta',
    category: 'risk_anchor',
    rawValue: betaRaw,
    displayValue: betaRaw.toFixed(2),
    pointsEarned: Math.round(betaPoints * 100) / 100,
    maxPoints: config.riskMetrics.beta.weight,
    formulaDescription: 'Full credit <=0.80, linear taper to 0 at >=1.60',
    flags: betaFlags,
  };

  // 1E. Operating Margin Std Dev < Peer Average (1.5 pts)
  let marginStdDevPoints = 0;
  let marginStdDevRaw: number | null = null;
  const marginFlags: string[] = [];

  const assetMarginStd = input.operating_margin_std_dev ?? (input.volatility ? input.volatility * 0.15 : 0.04);
  const peerMarginStd = input.peer_operating_margin_std_dev ?? bench.gross_operating_margins.std;
  marginStdDevRaw = assetMarginStd;

  const marginRatio = assetMarginStd / Math.max(0.001, peerMarginStd);

  if (input.peer_operating_margin_std_dev === undefined) {
    marginFlags.push('FLAG_SECTOR_MARGIN_FALLBACK');
  }

  if (marginRatio <= config.riskMetrics.marginStability.fullCreditRatio) {
    marginStdDevPoints = config.riskMetrics.marginStability.weight;
  } else if (marginRatio >= config.riskMetrics.marginStability.zeroCreditRatio) {
    marginStdDevPoints = 0.0;
    marginFlags.push('FLAG_HIGH_MARGIN_VOLATILITY');
  } else {
    const span = config.riskMetrics.marginStability.zeroCreditRatio - config.riskMetrics.marginStability.fullCreditRatio;
    const progress = (config.riskMetrics.marginStability.zeroCreditRatio - marginRatio) / span;
    marginStdDevPoints = config.riskMetrics.marginStability.weight * progress;
  }

  const marginStabilityMetric: GraduatedMetricScore = {
    name: 'Operating Margin Stability vs Peers',
    category: 'risk_anchor',
    rawValue: marginRatio,
    displayValue: `${(marginRatio * 100).toFixed(0)}% of Peer Std Dev`,
    pointsEarned: Math.round(marginStdDevPoints * 100) / 100,
    maxPoints: config.riskMetrics.marginStability.weight,
    formulaDescription: 'Full credit <=50% peer variance, 0 at >=150%',
    flags: marginFlags,
  };

  // Aggregate Risk Anchor Score
  const rawRiskAnchor = netDebtEbitdaPoints + interestCovPoints + ocfPoints + betaPoints + marginStdDevPoints;
  const finalRiskAnchor = Math.min(10.0, Math.max(0.0, Math.round(rawRiskAnchor * 10) / 10));

  const riskAnchorBreakdown: RiskAnchorBreakdown = {
    score: finalRiskAnchor,
    isSolvent: finalRiskAnchor >= config.riskThreshold,
    netDebtEbitda: netDebtMetric,
    interestCoverage: interestCovMetric,
    positiveOcfYears: ocfMetric,
    beta: betaMetric,
    marginStability: marginStabilityMetric,
  };

  // --------------------------------------------------------------------------
  // 2. QUALITY SCORE (0 - 10) — Growth & Economic Moat Engine
  // --------------------------------------------------------------------------

  // 2A. Gross Margin (> 40% target, full credit >= 55%, 0 credit <= 25%)
  let grossMarginPoints = 0;
  let grossMarginRaw: number | null = null;
  const gmFlags: string[] = [];

  if (input.gross_margin !== undefined && input.gross_margin !== null) {
    grossMarginRaw = input.gross_margin;
  } else if (input.gross_operating_margins !== undefined && input.gross_operating_margins !== null) {
    grossMarginRaw = input.gross_operating_margins;
  } else {
    grossMarginRaw = bench.gross_operating_margins.mean;
    gmFlags.push('FLAG_MISSING_GROSS_MARGIN');
  }

  if (grossMarginRaw >= config.qualityMetrics.grossMargin.fullCredit) {
    grossMarginPoints = config.qualityMetrics.grossMargin.weight;
  } else if (grossMarginRaw <= config.qualityMetrics.grossMargin.zeroCredit) {
    grossMarginPoints = 0.0;
    gmFlags.push('FLAG_COMPRESSED_GROSS_MARGIN');
  } else {
    const span = config.qualityMetrics.grossMargin.fullCredit - config.qualityMetrics.grossMargin.zeroCredit;
    const progress = (grossMarginRaw - config.qualityMetrics.grossMargin.zeroCredit) / span;
    grossMarginPoints = config.qualityMetrics.grossMargin.weight * progress;
  }

  const grossMarginMetric: GraduatedMetricScore = {
    name: 'Gross Margin',
    category: 'quality',
    rawValue: grossMarginRaw,
    displayValue: `${(grossMarginRaw * 100).toFixed(1)}%`,
    pointsEarned: Math.round(grossMarginPoints * 100) / 100,
    maxPoints: config.qualityMetrics.grossMargin.weight,
    formulaDescription: 'Full credit >=55%, linear taper to 0 at <=25%',
    flags: gmFlags,
  };

  // 2B. ROIC (> 15% target, full credit >= 20%, 0 credit <= 5%)
  let roicPoints = 0;
  let roicRaw: number | null = null;
  const roicFlags: string[] = [];

  if (input.roic !== undefined && input.roic !== null) {
    roicRaw = input.roic;
  } else if (input.roe !== undefined && input.roe !== null) {
    roicRaw = input.roe * 0.75; // Estimated ROIC proxy
  } else {
    roicRaw = bench.roic.mean;
    roicFlags.push('FLAG_MISSING_ROIC');
  }

  if (roicRaw <= 0) {
    roicPoints = 0.0;
    roicFlags.push('FLAG_NEGATIVE_INVESTED_CAPITAL');
  } else if (roicRaw >= config.qualityMetrics.roic.fullCredit) {
    roicPoints = config.qualityMetrics.roic.weight;
  } else if (roicRaw <= config.qualityMetrics.roic.zeroCredit) {
    roicPoints = 0.0;
    roicFlags.push('FLAG_SUBPAR_CAPITAL_EFFICIENCY');
  } else {
    const span = config.qualityMetrics.roic.fullCredit - config.qualityMetrics.roic.zeroCredit;
    const progress = (roicRaw - config.qualityMetrics.roic.zeroCredit) / span;
    roicPoints = config.qualityMetrics.roic.weight * progress;
  }

  const roicMetric: GraduatedMetricScore = {
    name: 'ROIC (Return on Invested Capital)',
    category: 'quality',
    rawValue: roicRaw,
    displayValue: `${(roicRaw * 100).toFixed(1)}%`,
    pointsEarned: Math.round(roicPoints * 100) / 100,
    maxPoints: config.qualityMetrics.roic.weight,
    formulaDescription: 'Full credit >=20%, linear taper to 0 at <=5%',
    flags: roicFlags,
  };

  // 2C. FCF / Net Income (> 0.8 target, full credit >= 1.2, 0 credit <= 0.3)
  let fcfNiPoints = 0;
  let fcfNiRaw: number | null = null;
  const fcfFlags: string[] = [];

  if (input.fcf_net_income !== undefined && input.fcf_net_income !== null) {
    fcfNiRaw = input.fcf_net_income;
  } else if (input.fcf_yield !== undefined && input.pe_ratio) {
    fcfNiRaw = Math.max(0.2, (input.fcf_yield || 0.04) * (input.pe_ratio || 25));
  } else {
    fcfNiRaw = 1.0;
    fcfFlags.push('FLAG_MISSING_FCF_NI');
  }

  if (fcfNiRaw <= 0) {
    fcfNiPoints = 0.0;
    fcfFlags.push('FLAG_NEGATIVE_NET_INCOME');
  } else if (fcfNiRaw >= config.qualityMetrics.fcfToNetIncome.fullCredit) {
    fcfNiPoints = config.qualityMetrics.fcfToNetIncome.weight;
  } else if (fcfNiRaw <= config.qualityMetrics.fcfToNetIncome.zeroCredit) {
    fcfNiPoints = 0.0;
    fcfFlags.push('FLAG_POOR_EARNINGS_CONVERSION');
  } else {
    const span = config.qualityMetrics.fcfToNetIncome.fullCredit - config.qualityMetrics.fcfToNetIncome.zeroCredit;
    const progress = (fcfNiRaw - config.qualityMetrics.fcfToNetIncome.zeroCredit) / span;
    fcfNiPoints = config.qualityMetrics.fcfToNetIncome.weight * progress;
  }

  const fcfNiMetric: GraduatedMetricScore = {
    name: 'FCF / Net Income Conversion',
    category: 'quality',
    rawValue: fcfNiRaw,
    displayValue: `${fcfNiRaw.toFixed(2)}x`,
    pointsEarned: Math.round(fcfNiPoints * 100) / 100,
    maxPoints: config.qualityMetrics.fcfToNetIncome.weight,
    formulaDescription: 'Full credit >=1.20x, linear taper to 0 at <=0.30x',
    flags: fcfFlags,
  };

  // 2D. PEG Ratio (< 1.5 target, full credit <= 1.0, 0 credit >= 2.5)
  let pegPoints = 0;
  let pegRaw: number | null = null;
  const pegFlags: string[] = [];

  if (input.peg_ratio !== undefined && input.peg_ratio !== null) {
    pegRaw = input.peg_ratio;
  } else if (input.pe_ratio && input.eps_growth && input.eps_growth > 0) {
    pegRaw = Math.max(0.4, input.pe_ratio / (input.eps_growth * 100));
  } else {
    pegRaw = 1.4; // Benchmark neutral
    pegFlags.push('FLAG_MISSING_PEG');
  }

  if (pegRaw <= 0 || !isFinite(pegRaw)) {
    pegPoints = 0.5; // Neutral fallback for undefined growth
    pegFlags.push('FLAG_PEG_UNDEFINED');
  } else if (pegRaw <= config.qualityMetrics.pegRatio.fullCredit) {
    pegPoints = config.qualityMetrics.pegRatio.weight;
  } else if (pegRaw >= config.qualityMetrics.pegRatio.zeroCredit) {
    pegPoints = 0.0;
    pegFlags.push('FLAG_EXPENSIVE_PEG_VALUATION');
  } else {
    const span = config.qualityMetrics.pegRatio.zeroCredit - config.qualityMetrics.pegRatio.fullCredit;
    const progress = (config.qualityMetrics.pegRatio.zeroCredit - pegRaw) / span;
    pegPoints = config.qualityMetrics.pegRatio.weight * progress;
  }

  const pegMetric: GraduatedMetricScore = {
    name: 'PEG Ratio (Valuation / Growth)',
    category: 'quality',
    rawValue: pegRaw,
    displayValue: pegRaw !== null ? `${pegRaw.toFixed(2)}x` : 'N/A',
    pointsEarned: Math.round(pegPoints * 100) / 100,
    maxPoints: config.qualityMetrics.pegRatio.weight,
    formulaDescription: 'Full credit <=1.0x, linear taper to 0 at >=2.5x',
    flags: pegFlags,
  };

  // 2E. 3-Year Revenue CAGR (> 10% target, full credit >= 20%, 0 credit <= 0%)
  let cagrPoints = 0;
  let cagrRaw: number | null = null;
  const cagrFlags: string[] = [];

  if (input.revenue_cagr_3yr !== undefined && input.revenue_cagr_3yr !== null) {
    cagrRaw = input.revenue_cagr_3yr;
  } else if (input.revenue_growth !== undefined && input.revenue_growth !== null) {
    cagrRaw = input.revenue_growth;
  } else {
    cagrRaw = bench.revenue_growth.mean;
    cagrFlags.push('FLAG_MISSING_REVENUE_CAGR');
  }

  if (cagrRaw >= config.qualityMetrics.revenueCagr3Yr.fullCredit) {
    cagrPoints = config.qualityMetrics.revenueCagr3Yr.weight;
  } else if (cagrRaw <= config.qualityMetrics.revenueCagr3Yr.zeroCredit) {
    cagrPoints = 0.0;
    cagrFlags.push('FLAG_STAGNANT_OR_CONTRACTING_TOPLINE');
  } else {
    const span = config.qualityMetrics.revenueCagr3Yr.fullCredit - config.qualityMetrics.revenueCagr3Yr.zeroCredit;
    const progress = (cagrRaw - config.qualityMetrics.revenueCagr3Yr.zeroCredit) / span;
    cagrPoints = config.qualityMetrics.revenueCagr3Yr.weight * progress;
  }

  const cagrMetric: GraduatedMetricScore = {
    name: '3-Year Revenue CAGR',
    category: 'quality',
    rawValue: cagrRaw,
    displayValue: `${(cagrRaw * 100).toFixed(1)}%`,
    pointsEarned: Math.round(cagrPoints * 100) / 100,
    maxPoints: config.qualityMetrics.revenueCagr3Yr.weight,
    formulaDescription: 'Full credit >=20%, linear taper to 0 at <=0%',
    flags: cagrFlags,
  };

  // Aggregate Quality Score
  const rawQualityScore = grossMarginPoints + roicPoints + fcfNiPoints + pegPoints + cagrPoints;
  const finalQualityScore = Math.min(10.0, Math.max(0.0, Math.round(rawQualityScore * 10) / 10));

  const qualityBreakdown: QualityScoreBreakdown = {
    score: finalQualityScore,
    isHighQuality: finalQualityScore >= config.qualityThreshold,
    grossMargin: grossMarginMetric,
    roic: roicMetric,
    fcfToNetIncome: fcfNiMetric,
    pegRatio: pegMetric,
    revenueCagr3Yr: cagrMetric,
  };

  // Combine all active flags
  const allFlags = [
    ...netDebtFlags,
    ...interestFlags,
    ...ocfFlags,
    ...betaFlags,
    ...marginFlags,
    ...gmFlags,
    ...roicFlags,
    ...fcfFlags,
    ...pegFlags,
    ...cagrFlags,
  ];

  // --------------------------------------------------------------------------
  // 3. 2D QUADRANT POSITION SIZING LOGIC GATES
  // --------------------------------------------------------------------------
  let positionTier: QuadrantTier;
  let verdictLabel: string;
  let tierColor: string;
  let tierBg: string;
  let tierBorder: string;
  let tierDescription: string;
  let isSpeculativeFlag = false;

  const isSolvent = finalRiskAnchor >= config.riskThreshold;
  const isHighQuality = finalQualityScore >= config.qualityThreshold;

  const missingMetricCount = allFlags.filter((f) => f.includes('MISSING')).length;

  if (missingMetricCount > config.maxMissingAllowed) {
    positionTier = 'Insufficient Data';
    verdictLabel = 'INSUFFICIENT DATA';
    tierColor = 'text-[#8A8D96]';
    tierBg = 'bg-[#14161A]';
    tierBorder = 'border-[#5B6B85]/40';
    tierDescription = 'Critical financial metrics unavailable to compute confident 2D quadrant positioning.';
  } else if (isHighQuality && isSolvent) {
    positionTier = 'Core Holding';
    verdictLabel = 'CORE HOLDING';
    tierColor = 'text-[#3FA66B]';
    tierBg = 'bg-[#181E15]';
    tierBorder = 'border-[#3FA66B]/50';
    tierDescription = 'Institutional Alpha — Superior Fundamental Quality coupled with a Fortified Balance Sheet.';
  } else if (isHighQuality && !isSolvent) {
    positionTier = 'Speculative Growth';
    verdictLabel = 'SPECULATIVE GROWTH';
    tierColor = 'text-[#B8863B]';
    tierBg = 'bg-[#1D1B14]';
    tierBorder = 'border-[#B8863B]/50';
    tierDescription = 'High-Growth Engine with elevated leverage or market beta. Recommend strict position size caps.';
    isSpeculativeFlag = true;
  } else if (!isHighQuality && isSolvent) {
    positionTier = 'Value / Contrarian Watch';
    verdictLabel = 'VALUE / CONTRARIAN WATCH';
    tierColor = 'text-[#5B6B85]';
    tierBg = 'bg-[#14161A]';
    tierBorder = 'border-[#5B6B85]/50';
    tierDescription = 'Solvent & Defensive Balance Sheet, but constrained by moderate growth or compressed margins.';
  } else {
    positionTier = 'Avoid';
    verdictLabel = 'AVOID / UNDERPERFORM';
    tierColor = 'text-[#C0504D]';
    tierBg = 'bg-[#221415]';
    tierBorder = 'border-[#C0504D]/50';
    tierDescription = 'Sub-par Quality Multiples accompanied by severe balance sheet or cash-flow risk.';
  }

  return {
    ticker: input.ticker,
    quality: finalQualityScore,
    riskAnchor: finalRiskAnchor,
    positionTier,
    verdictLabel,
    tierColor,
    tierBg,
    tierBorder,
    tierDescription,
    isSpeculativeFlag,
    missingMetricCount,
    flags: Array.from(new Set(allFlags)),
    riskAnchorBreakdown,
    qualityBreakdown,
    calculatedAt: new Date().toISOString(),
  };
}
