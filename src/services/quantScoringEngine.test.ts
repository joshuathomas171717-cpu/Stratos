import {
  compute5PillarQuantScore,
  compute2DStockScore,
  normalizeFactorValue,
  QUANT_PROFILES,
  SCORING_2D_CONFIG,
  RawStockMetricsInput,
} from './quantScoringEngine';

function runTests() {
  console.log('====================================================');
  console.log('RUNNING STRATOS QUANT SCORING ENGINE UNIT TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // ----------------------------------------------------
  // TEST 1: Stock with Complete Data
  // ----------------------------------------------------
  console.log('--- TEST 1: Stock with Complete Data ---');
  const completeStockInput: RawStockMetricsInput = {
    ticker: 'NVDA',
    sectorName: 'Technology',
    pe_ratio: 35.0,
    ev_ebitda: 28.0,
    fcf_yield: 0.04,
    roic: 0.35,
    roe: 0.40,
    gross_operating_margins: 0.55,
    earnings_stability: 0.90,
    leverage: 0.20,
    revenue_growth: 0.50,
    eps_growth: 0.60,
    analyst_revisions: 0.80,
    ret_6m_ex1: 0.40,
    ret_12m_ex1: 0.90,
    volatility: 0.30,
    max_drawdown: -0.18,
    beta: 1.40,
    liquidity: 10000000000,
  };

  const resultComplete = compute5PillarQuantScore(completeStockInput, 'balanced');
  
  assert(resultComplete.ticker === 'NVDA', 'Ticker is set correctly');
  assert(resultComplete.data_confidence === 'high', 'Data confidence is "high" for complete stock data');
  assert(resultComplete.missing_pillars.length === 0, 'No missing pillars reported');
  assert(resultComplete.composite_score >= 1.0 && resultComplete.composite_score <= 10.0, 'Composite score in range 1.0 - 10.0');
  assert(resultComplete.pillars.valuation.score !== null, 'Valuation pillar computed');
  assert(resultComplete.pillars.quality.score !== null, 'Quality pillar computed');
  assert(resultComplete.pillars.growth_revisions.score !== null, 'Growth & Revisions pillar computed');
  assert(resultComplete.pillars.momentum.score !== null, 'Momentum pillar computed');
  assert(resultComplete.pillars.risk.score !== null, 'Risk pillar computed');

  // ----------------------------------------------------
  // TEST 2: Stock with One Missing Factor
  // ----------------------------------------------------
  console.log('\n--- TEST 2: Stock with One Missing Factor ---');
  const missingFactorInput: RawStockMetricsInput = {
    ...completeStockInput,
    analyst_revisions: undefined, // Analyst revisions factor missing
  };

  const resultMissingFactor = compute5PillarQuantScore(missingFactorInput, 'balanced');

  assert(resultMissingFactor.data_confidence === 'high', 'Data confidence remains "high" when >=80% factors present');
  assert(resultMissingFactor.pillars.growth_revisions.factors.analyst_revisions.raw === null, 'Missing factor raw value is null');
  assert(resultMissingFactor.pillars.growth_revisions.factors.analyst_revisions.score === null, 'Missing factor score is null');
  assert(resultMissingFactor.pillars.growth_revisions.score !== null, 'Pillar average calculated from remaining present factors');
  assert(resultMissingFactor.missing_pillars.length === 0, 'Pillar itself is not marked as missing');

  // ----------------------------------------------------
  // TEST 3: Stock with an Entire Missing Pillar
  // ----------------------------------------------------
  console.log('\n--- TEST 3: Stock with Entire Missing Pillar ---');
  const missingPillarInput: RawStockMetricsInput = {
    ticker: 'IPO_STOCK',
    sectorName: 'Technology',
    pe_ratio: 25.0,
    ev_ebitda: 18.0,
    fcf_yield: 0.03,
    roic: 0.20,
    roe: 0.22,
    gross_operating_margins: 0.30,
    earnings_stability: 0.80,
    leverage: 0.50,
    revenue_growth: 0.25,
    eps_growth: 0.30,
    analyst_revisions: 0.10,
    // Risk pillar factors completely omitted (e.g. IPO with no risk history)
    volatility: undefined,
    max_drawdown: undefined,
    beta: undefined,
    liquidity: undefined,
  };

  const resultMissingPillar = compute5PillarQuantScore(missingPillarInput, 'balanced');

  assert(resultMissingPillar.data_confidence === 'low', 'Data confidence flagged as "low" when an entire pillar is missing');
  assert(resultMissingPillar.missing_pillars.includes('risk'), 'Missing pillar "risk" included in missing_pillars list');
  assert(resultMissingPillar.pillars.risk.score === null, 'Risk pillar score is null');
  assert(resultMissingPillar.composite_score >= 1.0 && resultMissingPillar.composite_score <= 10.0, 'Composite score computed proportionally from remaining 4 active pillars');

  // ----------------------------------------------------
  // TEST 4: Stock at Winsorization Boundary (z-score > 3)
  // ----------------------------------------------------
  console.log('\n--- TEST 4: Stock at Winsorization Boundary (z-score > 3) ---');
  // Extreme high revenue growth (3.0 = 300% growth vs sector mean 0.18, std 0.18 -> raw z = +15.6)
  const extremeVal = normalizeFactorValue(3.0, 0.18, 0.18, false);
  
  assert(extremeVal.z !== null && extremeVal.z >= 3.0, 'Raw Z-score calculated properly (>3)');
  assert(extremeVal.score === 10.0, 'Winsorized at +3 and rescaled to max score 10.0');

  // Extreme low revenue growth (-3.0 -> raw z = -17.6)
  const extremeLowVal = normalizeFactorValue(-3.0, 0.18, 0.18, false);
  assert(extremeLowVal.score === 0.0, 'Winsorized at -3 and rescaled to min score 0.0');

  // ----------------------------------------------------
  // TEST 5: Profile Reweighting Config Test
  // ----------------------------------------------------
  console.log('\n--- TEST 5: Profile Reweighting Config ---');
  const conservativeResult = compute5PillarQuantScore(completeStockInput, 'conservative');
  const aggressiveResult = compute5PillarQuantScore(completeStockInput, 'aggressive');

  assert(conservativeResult.profile === 'conservative', 'Profile set to conservative');
  assert(aggressiveResult.profile === 'aggressive', 'Profile set to aggressive');
  assert(QUANT_PROFILES.conservative.valuation === 0.30, 'Conservative valuation weight is 30%');
  assert(QUANT_PROFILES.aggressive.growth_revisions === 0.30, 'Aggressive growth weight is 30%');

  // ----------------------------------------------------
  // TEST 6: 2D Scoring Engine - Core Holding
  // ----------------------------------------------------
  console.log('\n--- TEST 6: 2D Scoring Engine - Core Holding Tier ---');
  const fortressInput: RawStockMetricsInput = {
    ticker: 'FORT',
    gross_margin: 0.65, // >50% => 2.5 pts
    roic: 0.30,         // >25% => 2.5 pts
    fcf_net_income: 1.25, // >1.1 => 2.0 pts
    peg_ratio: 1.2,     // <=1.5 => 1.5 pts
    revenue_cagr_3yr: 0.22, // >20% => 1.5 pts
    net_debt_ebitda: -0.5,  // net cash => 2.5 pts
    interest_coverage: 25.0, // >10 => 2.5 pts
    positive_ocf_years: 5,   // 5/5 => 2.0 pts
    beta: 0.85,             // <1.0 => 1.5 pts
    margin_stability: 'EXPANDING', // 1.5 pts
  };

  const fortressResult = compute2DStockScore(fortressInput);
  assert(fortressResult.quality >= 7.0, `High Quality score achieved: ${fortressResult.quality}`);
  assert(fortressResult.riskAnchor >= 7.0, `High Risk Anchor score achieved: ${fortressResult.riskAnchor}`);
  assert(fortressResult.positionTier === 'Core Holding', `Position tier is Core Holding (${fortressResult.positionTier})`);
  assert(!fortressResult.isSpeculativeFlag, 'Speculative flag is false for fortress stock');

  // ----------------------------------------------------
  // TEST 7: 2D Scoring Engine - Speculative Growth
  // ----------------------------------------------------
  console.log('\n--- TEST 7: 2D Scoring Engine - Speculative Growth Tier ---');
  const specGrowthInput: RawStockMetricsInput = {
    ticker: 'SPEC',
    gross_margin: 0.75, // 2.5 pts
    roic: 0.28,         // 2.5 pts
    fcf_net_income: 1.15, // 2.0 pts
    peg_ratio: 1.3,     // 1.5 pts
    revenue_cagr_3yr: 0.35, // 1.5 pts => Quality ~ 10.0
    net_debt_ebitda: 4.5,   // >4.0 => 0 pts
    interest_coverage: 1.8, // <2.0 => 0 pts
    positive_ocf_years: 2,  // 2/5 => 0.5 pts
    beta: 2.1,             // >1.8 => 0 pts
    margin_stability: 'VOLATILE', // 0.375 pts => Risk Anchor < 5.0
  };

  const specResult = compute2DStockScore(specGrowthInput);
  assert(specResult.quality >= 7.0, `Quality is elevated: ${specResult.quality}`);
  assert(specResult.riskAnchor < 7.0, `Risk Anchor is below solvency threshold: ${specResult.riskAnchor}`);
  assert(specResult.positionTier === 'Speculative Growth', `Position tier is Speculative Growth (${specResult.positionTier})`);
  assert(specResult.isSpeculativeFlag, 'Speculative flag triggered for high-beta / leveraged growth');

  // ----------------------------------------------------
  // TEST 8: 2D Scoring Engine - Value / Contrarian Watch
  // ----------------------------------------------------
  console.log('\n--- TEST 8: 2D Scoring Engine - Value / Contrarian Watch Tier ---');
  const valueInput: RawStockMetricsInput = {
    ticker: 'VALU',
    gross_margin: 0.20, // 0 pts
    roic: 0.08,         // 0.4 pts
    fcf_net_income: 0.85, // 0.8 pts
    peg_ratio: 2.8,     // 0 pts
    revenue_cagr_3yr: 0.02, // 0 pts => Quality < 5.0
    net_debt_ebitda: 0.5,   // 2.5 pts
    interest_coverage: 15.0, // 2.5 pts
    positive_ocf_years: 5,   // 2.0 pts
    beta: 0.65,             // 1.5 pts
    margin_stability: 'STABLE', // 1.125 pts => Risk Anchor ~ 9.6
  };

  const valueResult = compute2DStockScore(valueInput);
  assert(valueResult.quality < 7.0, `Quality is low: ${valueResult.quality}`);
  assert(valueResult.riskAnchor >= 7.0, `Risk Anchor is strong: ${valueResult.riskAnchor}`);
  assert(valueResult.positionTier === 'Value / Contrarian Watch', `Position tier is Value / Contrarian Watch (${valueResult.positionTier})`);

  // ----------------------------------------------------
  // TEST 9: 2D Scoring Engine - Edge Cases & Missing Fields
  // ----------------------------------------------------
  console.log('\n--- TEST 9: 2D Scoring Engine - Edge Cases & Missing Fields ---');
  // Net cash position
  const netCashInput: RawStockMetricsInput = {
    ticker: 'CASH',
    net_debt_ebitda: -1.0,
    gross_margin: 0.40,
    roic: 0.15,
  };
  const netCashResult = compute2DStockScore(netCashInput);
  assert(netCashResult.flags.includes('FLAG_NET_CASH_POSITION'), 'Net cash flag registered');
  assert(netCashResult.riskAnchorBreakdown.netDebtEbitda.pointsEarned === SCORING_2D_CONFIG.riskMetrics.netDebtEbitda.weight, 'Net cash receives max points for leverage');

  // Extreme missing fields (Insufficient Data)
  const emptyInput: RawStockMetricsInput = {
    ticker: 'VOID',
  };
  const emptyResult = compute2DStockScore(emptyInput);
  assert(emptyResult.positionTier === 'Insufficient Data', 'Correctly flagged Insufficient Data');
  assert(emptyResult.missingMetricCount !== undefined && emptyResult.missingMetricCount >= 3, 'Missing metrics counted properly');

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
