import { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { AccountProfile, ComputedAccountMetrics, Locale } from '../types/account';
import { COPY } from '../data/i18n';
import {
  formatCompactNumber,
  formatCurrency,
  simulateGrowthTrajectory,
} from '../utils/analytics';
import { ProjectionCurveChart } from './Charts';

interface SimulatorViewProps {
  account: AccountProfile;
  metrics: ComputedAccountMetrics;
  locale: Locale;
}

export function SimulatorView({ account, metrics, locale }: SimulatorViewProps) {
  const t = COPY[locale];

  const [targetPostsPerWeek, setTargetPostsPerWeek] = useState(
    Math.max(account.postsPerWeek, 6)
  );
  const [erLiftPct, setErLiftPct] = useState(15);
  const [cpmUsd, setCpmUsd] = useState(account.cpmUsd);
  const [sponsoredMonthly, setSponsoredMonthly] = useState(3);
  const [horizonMonths, setHorizonMonths] = useState<3 | 6 | 12>(6);
  const [chartMetric, setChartMetric] = useState<'followers' | 'revenue'>('followers');

  const resetDefaults = () => {
    setTargetPostsPerWeek(account.postsPerWeek);
    setErLiftPct(0);
    setCpmUsd(account.cpmUsd);
    setSponsoredMonthly(2);
    setHorizonMonths(6);
  };

  const trajectory = useMemo(
    () =>
      simulateGrowthTrajectory({
        currentFollowers: account.followers,
        currentMonthlyGrowthPct: account.monthlyGrowthPct,
        currentPostsPerWeek: account.postsPerWeek,
        targetPostsPerWeek,
        currentAvgViews: metrics.effectiveAvgViews,
        currentErPct: metrics.engagementRateFollowers,
        targetErLiftPct: erLiftPct,
        cpmUsd,
        sponsoredPostsPerMonth: sponsoredMonthly,
        months: horizonMonths,
      }),
    [
      account.followers,
      account.monthlyGrowthPct,
      account.postsPerWeek,
      metrics.effectiveAvgViews,
      metrics.engagementRateFollowers,
      targetPostsPerWeek,
      erLiftPct,
      cpmUsd,
      sponsoredMonthly,
      horizonMonths,
    ]
  );

  const finalPoint = trajectory[trajectory.length - 1];
  const followersGain = finalPoint.followers - account.followers;
  const gainPct = (followersGain / Math.max(1, account.followers)) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-[#12151C] p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {t.simTitle}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {t.simSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center p-0.5 rounded-lg bg-zinc-100 dark:bg-[#0B0D11] border border-zinc-200 dark:border-zinc-800 font-mono">
            {([3, 6, 12] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setHorizonMonths(m)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  horizonMonths === m
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                {locale === 'ar' ? `${m} أشهر` : `${m}M`}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={resetDefaults}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {t.simResetDefaults}
          </button>
        </div>
      </section>

      {/* Main Split: Sliders (5 cols) + Output & Curve (7 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* Controls Panel */}
        <section className="xl:col-span-5 rounded-xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-[#12151C] p-5 space-y-6">
          {/* Slider 1 */}
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <label htmlFor="sim-cadence" className="font-medium text-zinc-800 dark:text-zinc-200">
                {t.simWeeklyPosts}
              </label>
              <span className="font-mono font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                {targetPostsPerWeek} / {locale === 'ar' ? 'أسبوع' : 'wk'}
              </span>
            </div>
            <input
              id="sim-cadence"
              type="range"
              min={1}
              max={21}
              step={1}
              value={targetPostsPerWeek}
              onChange={(e) => setTargetPostsPerWeek(Number(e.target.value))}
              className="w-full cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-mono text-zinc-400 mt-1">
              <span>1/wk</span>
              <span>
                {locale === 'ar' ? `الحالي: ${account.postsPerWeek}` : `Current: ${account.postsPerWeek}`}
              </span>
              <span>21/wk</span>
            </div>
          </div>

          {/* Slider 2 */}
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <label htmlFor="sim-er" className="font-medium text-zinc-800 dark:text-zinc-200">
                {t.simErLift}
              </label>
              <span className="font-mono font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                {erLiftPct >= 0 ? `+${erLiftPct}%` : `${erLiftPct}%`}
              </span>
            </div>
            <input
              id="sim-er"
              type="range"
              min={-20}
              max={80}
              step={5}
              value={erLiftPct}
              onChange={(e) => setErLiftPct(Number(e.target.value))}
              className="w-full cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-mono text-zinc-400 mt-1">
              <span>-20%</span>
              <span>
                ER → {(metrics.engagementRateFollowers * (1 + erLiftPct / 100)).toFixed(2)}%
              </span>
              <span>+80%</span>
            </div>
          </div>

          {/* Slider 3 */}
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <label htmlFor="sim-cpm" className="font-medium text-zinc-800 dark:text-zinc-200">
                {t.simCpmRate}
              </label>
              <span className="font-mono font-semibold tabular-nums text-amber-600 dark:text-amber-400">
                ${cpmUsd}
              </span>
            </div>
            <input
              id="sim-cpm"
              type="range"
              min={5}
              max={60}
              step={1}
              value={cpmUsd}
              onChange={(e) => setCpmUsd(Number(e.target.value))}
              className="w-full cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-mono text-zinc-400 mt-1">
              <span>$5</span>
              <span>{locale === 'ar' ? `الحالي: $${account.cpmUsd}` : `Current: $${account.cpmUsd}`}</span>
              <span>$60</span>
            </div>
          </div>

          {/* Slider 4 */}
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <label htmlFor="sim-spon" className="font-medium text-zinc-800 dark:text-zinc-200">
                {t.simSponsoredMonthly}
              </label>
              <span className="font-mono font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                {sponsoredMonthly}
              </span>
            </div>
            <input
              id="sim-spon"
              type="range"
              min={1}
              max={12}
              step={1}
              value={sponsoredMonthly}
              onChange={(e) => setSponsoredMonthly(Number(e.target.value))}
              className="w-full cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-mono text-zinc-400 mt-1">
              <span>1</span>
              <span>6</span>
              <span>12</span>
            </div>
          </div>
        </section>

        {/* Output & Trajectory Chart */}
        <section className="xl:col-span-7 rounded-xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-[#12151C] flex flex-col justify-between overflow-hidden">
          {/* 3 Projected KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x rtl:sm:divide-x-reverse divide-zinc-200 dark:divide-zinc-800/90 border-b border-zinc-200 dark:border-zinc-800/90">
            <div className="p-5">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {t.simProjectedFollowers}
              </div>
              <div className="mt-1.5 font-mono text-xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                {formatCompactNumber(finalPoint.followers)}
              </div>
              <div className="mt-1 font-mono text-xs tabular-nums text-emerald-600 dark:text-emerald-400">
                {followersGain >= 0 ? '+' : ''}
                {formatCompactNumber(followersGain)} ({gainPct >= 0 ? '+' : ''}
                {gainPct.toFixed(1)}%)
              </div>
            </div>

            <div className="p-5">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {t.simProjectedReach}
              </div>
              <div className="mt-1.5 font-mono text-xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                {formatCompactNumber(finalPoint.monthlyReach)}
              </div>
              <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {locale === 'ar'
                  ? `عند الشهر ${horizonMonths}`
                  : `At month ${horizonMonths}`}
              </div>
            </div>

            <div className="p-5">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {t.simProjectedRevenue}
              </div>
              <div className="mt-1.5 font-mono text-xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                {formatCurrency(finalPoint.monthlyRevenueUsd, 'USD')}
              </div>
              <div className="mt-1 font-mono text-xs tabular-nums text-amber-600 dark:text-amber-400">
                {formatCurrency(finalPoint.monthlyRevenueSar, 'SAR')}
              </div>
            </div>
          </div>

          <div className="p-5 flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {locale === 'ar'
                  ? `منحنى التوقع التراكمي (${horizonMonths} أشهر)`
                  : `Compounding Trajectory (${horizonMonths} Months)`}
              </h2>
              <div className="inline-flex items-center p-0.5 rounded-lg bg-zinc-100 dark:bg-[#0B0D11] border border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setChartMetric('followers')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    chartMetric === 'followers'
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  {t.followersSeries}
                </button>
                <button
                  type="button"
                  onClick={() => setChartMetric('revenue')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    chartMetric === 'revenue'
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  {locale === 'ar' ? 'العائد الشهري $' : 'Revenue $'}
                </button>
              </div>
            </div>

            <ProjectionCurveChart
              points={trajectory}
              metric={chartMetric}
              locale={locale}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
