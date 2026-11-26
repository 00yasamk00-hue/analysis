import { useState } from 'react';
import {
  Check,
  Code2,
  Download,
  SlidersHorizontal,
  Trash2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  AccountProfile,
  ComputedAccountMetrics,
  DiagnosticStatus,
  Locale,
  TimeRange,
} from '../types/account';
import {
  COPY,
  FORMAT_LABELS,
  PLATFORM_META,
  STATUS_LABELS,
  TIER_LABELS,
} from '../data/i18n';
import {
  exportAccountReportJson,
  formatCompactNumber,
  formatCurrency,
} from '../utils/analytics';
import { Avatar } from './Avatar';
import { GrowthDualChart } from './Charts';

interface OverviewViewProps {
  account: AccountProfile;
  metrics: ComputedAccountMetrics;
  locale: Locale;
  showFormulas: boolean;
  onToggleFormulas: () => void;
  onUpdateAccount: (updated: AccountProfile) => void;
  onDeleteAccount: (id: string) => void;
  canDelete: boolean;
  onNotify: (msg: string) => void;
}

const STATUS_TEXT_COLOR: Record<DiagnosticStatus, string> = {
  optimal: 'text-emerald-600 dark:text-emerald-400',
  healthy: 'text-sky-600 dark:text-sky-400',
  attention: 'text-amber-600 dark:text-amber-400',
  warning: 'text-rose-600 dark:text-rose-400',
};

const STATUS_BAR_COLOR: Record<DiagnosticStatus, string> = {
  optimal: 'bg-emerald-500',
  healthy: 'bg-sky-500',
  attention: 'bg-amber-500',
  warning: 'bg-rose-500',
};

export function OverviewView({
  account,
  metrics,
  locale,
  showFormulas,
  onToggleFormulas,
  onUpdateAccount,
  onDeleteAccount,
  canDelete,
  onNotify,
}: OverviewViewProps) {
  const t = COPY[locale];
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [chartSeries, setChartSeries] = useState<'followers' | 'engagement'>('followers');
  const [isEditing, setIsEditing] = useState(false);

  // Quick edit draft state
  const [draftFollowers, setDraftFollowers] = useState(String(account.followers));
  const [draftFollowing, setDraftFollowing] = useState(String(account.following));
  const [draftPostsPerWeek, setDraftPostsPerWeek] = useState(String(account.postsPerWeek));
  const [draftGrowth, setDraftGrowth] = useState(String(account.monthlyGrowthPct));
  const [draftCpm, setDraftCpm] = useState(String(account.cpmUsd));

  const openEditor = () => {
    setDraftFollowers(String(account.followers));
    setDraftFollowing(String(account.following));
    setDraftPostsPerWeek(String(account.postsPerWeek));
    setDraftGrowth(String(account.monthlyGrowthPct));
    setDraftCpm(String(account.cpmUsd));
    setIsEditing(true);
  };

  const handleSaveMetrics = (e: React.FormEvent) => {
    e.preventDefault();
    const followers = Math.max(10, Number(draftFollowers) || account.followers);
    const following = Math.max(1, Number(draftFollowing) || account.following);
    const postsPerWeek = Math.max(1, Number(draftPostsPerWeek) || account.postsPerWeek);
    const monthlyGrowthPct = Number(draftGrowth);
    const cpmUsd = Math.max(1, Number(draftCpm) || account.cpmUsd);

    onUpdateAccount({
      ...account,
      followers,
      following,
      postsPerWeek,
      monthlyGrowthPct: Number.isFinite(monthlyGrowthPct)
        ? monthlyGrowthPct
        : account.monthlyGrowthPct,
      cpmUsd,
    });
    setIsEditing(false);
    onNotify(locale === 'ar' ? 'تم تحديث أرقام الحساب وإعادة الحساب.' : 'Account metrics updated.');
  };

  const sliceCount = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  const visibleSnapshots = account.history.slice(-sliceCount);
  const platformLabel =
    locale === 'ar'
      ? PLATFORM_META[account.platform].nameAr
      : PLATFORM_META[account.platform].nameEn;

  const displayName = locale === 'ar' ? account.displayName : account.displayNameEn;
  const niche = locale === 'ar' ? account.niche : account.nicheEn;
  const bio = locale === 'ar' ? account.bio : account.bioEn;
  const maxFormatEr = Math.max(
    1,
    ...metrics.formatStats.map((f) => f.avgEngagementRate)
  );

  return (
    <div className="space-y-6">
      {/* Account Identity Header Band */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-[#12151C] p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <Avatar src={account.avatarUrl} name={displayName} size="lg" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 truncate">
                  {displayName}
                </h1>
                <span className="font-mono text-sm text-zinc-500 dark:text-zinc-400" dir="ltr">
                  {account.handle}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">{platformLabel}</span>
                <span aria-hidden="true">·</span>
                <span>{niche}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  {locale === 'ar' ? TIER_LABELS[metrics.tierKey].ar : TIER_LABELS[metrics.tierKey].en}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  {locale === 'ar'
                    ? `${account.posts.length} منشورات محللة`
                    : `${account.posts.length} analyzed posts`}
                </span>
              </div>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
                {bio}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onToggleFormulas}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                showFormulas
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                  : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/70'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              {showFormulas ? t.formulasOn : t.formulasOff}
            </button>

            <button
              type="button"
              onClick={isEditing ? () => setIsEditing(false) : openEditor}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {t.quickEditMetrics}
            </button>

            <button
              type="button"
              onClick={() => {
                exportAccountReportJson(account, metrics);
                onNotify(locale === 'ar' ? 'تم تصدير تقرير التحليل بصيغة JSON.' : 'Exported JSON analytics report.');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              {t.exportJson}
            </button>
          </div>
        </div>

        {/* Inline Live Metrics Editor */}
        {isEditing && (
          <form
            onSubmit={handleSaveMetrics}
            className="mt-5 pt-5 border-t border-zinc-200 dark:border-zinc-800/90"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <label className="block">
                <span className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                  {t.kpiFollowers}
                </span>
                <input
                  type="number"
                  min={10}
                  value={draftFollowers}
                  onChange={(e) => setDraftFollowers(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-[#0B0D11] px-3 py-2 text-sm font-mono tabular-nums text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </label>

              <label className="block">
                <span className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                  {locale === 'ar' ? 'المتابَعون' : 'Following'}
                </span>
                <input
                  type="number"
                  min={1}
                  value={draftFollowing}
                  onChange={(e) => setDraftFollowing(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-[#0B0D11] px-3 py-2 text-sm font-mono tabular-nums text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </label>

              <label className="block">
                <span className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                  {locale === 'ar' ? 'منشورات / أسبوع' : 'Posts / Week'}
                </span>
                <input
                  type="number"
                  min={1}
                  max={70}
                  value={draftPostsPerWeek}
                  onChange={(e) => setDraftPostsPerWeek(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-[#0B0D11] px-3 py-2 text-sm font-mono tabular-nums text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </label>

              <label className="block">
                <span className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                  {locale === 'ar' ? 'النمو الشهري %' : 'Monthly Growth %'}
                </span>
                <input
                  type="number"
                  step="0.1"
                  value={draftGrowth}
                  onChange={(e) => setDraftGrowth(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-[#0B0D11] px-3 py-2 text-sm font-mono tabular-nums text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </label>

              <label className="block">
                <span className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                  CPM (USD)
                </span>
                <input
                  type="number"
                  min={1}
                  value={draftCpm}
                  onChange={(e) => setDraftCpm(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-[#0B0D11] px-3 py-2 text-sm font-mono tabular-nums text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => onDeleteAccount(account.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {t.deleteAccount}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  {t.saveChanges}
                </button>
              </div>
            </div>
          </form>
        )}
      </section>

      {/* Primary 4-Column KPI Strip (single elevation, hairline dividers, zero nested cards) */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-[#12151C] grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x rtl:sm:divide-x-reverse divide-zinc-200 dark:divide-zinc-800/90">
        {/* KPI 1: Followers */}
        <div className="p-5">
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {t.kpiFollowers}
          </div>
          <div className="mt-2 font-mono text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
            {formatCompactNumber(account.followers)}
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-xs font-mono tabular-nums">
            <span
              className={`inline-flex items-center gap-0.5 font-medium ${
                account.monthlyGrowthPct >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {account.monthlyGrowthPct >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              {account.monthlyGrowthPct >= 0 ? '+' : ''}
              {account.monthlyGrowthPct.toFixed(1)}%
            </span>
            <span className="font-sans text-zinc-500 dark:text-zinc-400">{t.monthlyGrowth}</span>
          </div>
          {showFormulas && (
            <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/70 font-mono text-[11px] text-zinc-500 dark:text-zinc-400" dir="ltr">
              ratio = {account.followers.toLocaleString('en-US')} / {account.following.toLocaleString('en-US')} ({metrics.followerRatio}x)
            </div>
          )}
        </div>

        {/* KPI 2: Engagement Rate */}
        <div className="p-5">
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {t.kpiEngagement}
          </div>
          <div className="mt-2 font-mono text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
            {metrics.engagementRateFollowers.toFixed(2)}%
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-xs font-mono tabular-nums">
            <span
              className={`font-medium ${
                metrics.erDeltaVsBenchmark >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {metrics.erDeltaVsBenchmark >= 0 ? '+' : ''}
              {metrics.erDeltaVsBenchmark.toFixed(2)}%
            </span>
            <span className="font-sans text-zinc-500 dark:text-zinc-400">
              {t.vsBenchmark} ({metrics.platformBenchmarkEr}%)
            </span>
          </div>
          {showFormulas && (
            <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/70 font-mono text-[11px] text-zinc-500 dark:text-zinc-400" dir="ltr">
              ERF = ({metrics.effectiveAvgLikes}+{metrics.effectiveAvgComments}+{metrics.effectiveAvgShares}+{metrics.effectiveAvgSaves}) / {formatCompactNumber(account.followers)}
            </div>
          )}
        </div>

        {/* KPI 3: Avg Views & Reach Efficiency */}
        <div className="p-5">
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {t.kpiAvgViews}
          </div>
          <div className="mt-2 font-mono text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
            {formatCompactNumber(metrics.effectiveAvgViews)}
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-xs font-mono tabular-nums">
            <span className="font-medium text-sky-600 dark:text-sky-400">
              {(metrics.viralMultiplier * 100).toFixed(0)}%
            </span>
            <span className="font-sans text-zinc-500 dark:text-zinc-400">{t.ofFollowers}</span>
            <span className="text-zinc-400" aria-hidden="true">·</span>
            <span className="text-zinc-500 dark:text-zinc-400">
              ERV {metrics.engagementRateViews.toFixed(1)}%
            </span>
          </div>
          {showFormulas && (
            <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/70 font-mono text-[11px] text-zinc-500 dark:text-zinc-400" dir="ltr">
              monthlyReach ≈ avgViews × {account.postsPerWeek} × 4.33 ({formatCompactNumber(metrics.monthlyReachEstimate)})
            </div>
          )}
        </div>

        {/* KPI 4: Est. Sponsorship Value */}
        <div className="p-5">
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {t.kpiEstValue}
          </div>
          <div className="mt-2 font-mono text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
            {formatCurrency(metrics.estimatedPostValueUsd, 'USD')}
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-xs font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
            <span className="text-zinc-700 dark:text-zinc-300 font-medium">
              {formatCurrency(metrics.estimatedPostValueSar, 'SAR')}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-sans">{t.perPost}</span>
          </div>
          {showFormulas && (
            <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/70 font-mono text-[11px] text-zinc-500 dark:text-zinc-400" dir="ltr">
              val = (avgViews / 1000) × ${account.cpmUsd} CPM × erFactor
            </div>
          )}
        </div>
      </section>

      {/* Main Chart + Format Breakdown Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* Dual-Series Growth Chart (8 cols) */}
        <section className="xl:col-span-8 rounded-xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-[#12151C] p-5 flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {t.growthTrajectory}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {locale === 'ar'
                  ? `عرض بيانات آخر ${sliceCount} يوماً — مرّر المؤشر على المنحنى للقراءة اليومية الدقيقة`
                  : `Showing trailing ${sliceCount} days — hover curve for exact daily snapshot`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Series switch */}
              <div className="inline-flex items-center p-0.5 rounded-lg bg-zinc-100 dark:bg-[#0B0D11] border border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setChartSeries('followers')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    chartSeries === 'followers'
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  {t.followersSeries}
                </button>
                <button
                  type="button"
                  onClick={() => setChartSeries('engagement')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    chartSeries === 'engagement'
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  {t.engagementSeries}
                </button>
              </div>

              {/* Timeframe segmented control */}
              <div className="inline-flex items-center p-0.5 rounded-lg bg-zinc-100 dark:bg-[#0B0D11] border border-zinc-200 dark:border-zinc-800 font-mono">
                {(['7d', '30d', '90d'] as TimeRange[]).map((range) => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => setTimeRange(range)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      timeRange === range
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    {range.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <GrowthDualChart
            snapshots={visibleSnapshots}
            series={chartSeries}
            locale={locale}
          />
        </section>

        {/* Format Performance + Audience Quality Summary (4 cols) */}
        <section className="xl:col-span-4 rounded-xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-[#12151C] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-baseline justify-between gap-2 pb-4 border-b border-zinc-200 dark:border-zinc-800/80">
              <div>
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {t.kpiAuthenticity}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {locale === 'ar'
                    ? 'مركّب رياضي من 4 مؤشرات قابلة للفحص'
                    : 'Weighted composite of 4 inspectable signals'}
                </p>
              </div>
              <div className="font-mono text-2xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                {metrics.authenticityIndex}
                <span className="text-sm text-zinc-400 dark:text-zinc-500">/100</span>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                {t.formatPerformance}
              </h3>

              {metrics.formatStats.length === 0 ? (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 py-6">
                  {locale === 'ar'
                    ? 'أضف منشورات في سجل المنشورات لمقارنة أداء الصيغ المختلفة.'
                    : 'Log posts in the Posts Ledger to compare content format performance.'}
                </p>
              ) : (
                <div className="space-y-3.5">
                  {metrics.formatStats.map((item) => {
                    const pct = Math.max(8, (item.avgEngagementRate / maxFormatEr) * 100);
                    return (
                      <div key={item.format}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">
                            {locale === 'ar'
                              ? FORMAT_LABELS[item.format].ar
                              : FORMAT_LABELS[item.format].en}
                          </span>
                          <span className="font-mono tabular-nums text-zinc-600 dark:text-zinc-400">
                            {item.avgEngagementRate.toFixed(2)}% ER · {formatCompactNumber(item.avgViews)}
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Secondary Compact Ratio Footnote */}
          <div className="mt-5 pt-4 border-t border-zinc-200 dark:border-zinc-800/80 grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-zinc-500 dark:text-zinc-400">
                {locale === 'ar' ? 'التعليقات / الإعجابات' : 'Comments / Likes'}
              </div>
              <div className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                {metrics.commentToLikePct.toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-zinc-500 dark:text-zinc-400">
                {locale === 'ar' ? 'الحفظ والمشاركة' : 'Save + Share Rate'}
              </div>
              <div className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                {metrics.saveAndShareRatePct.toFixed(1)}%
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 4-Pillar Diagnostic Breakdown (Single elevation, clean internal hairline grid) */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-[#12151C] overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800/90 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {t.diagnosticAudit}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {locale === 'ar'
                ? 'تشخيص مباشر مبني على نسب المنصة الفعلية مع إجراء عملي مقترح لكل محور'
                : 'Rule-based diagnostic benchmarked against platform tier medians with concrete next steps'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 divide-zinc-200 dark:divide-zinc-800/90">
          {metrics.diagnostics.map((pillar, idx) => {
            const borderClasses =
              idx >= 2
                ? 'md:border-t border-zinc-200 dark:border-zinc-800/90'
                : '';
            const sideBorder =
              idx % 2 === 1
                ? 'md:border-s border-zinc-200 dark:border-zinc-800/90'
                : '';
            return (
              <div key={pillar.key} className={`p-5 ${borderClasses} ${sideBorder}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {locale === 'ar' ? pillar.labelAr : pillar.labelEn}
                    </h3>
                    <div className="mt-0.5 flex items-center gap-2 text-xs">
                      <span className={`font-medium ${STATUS_TEXT_COLOR[pillar.status]}`}>
                        {locale === 'ar'
                          ? STATUS_LABELS[pillar.status].ar
                          : STATUS_LABELS[pillar.status].en}
                      </span>
                      <span className="text-zinc-400" aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums text-zinc-600 dark:text-zinc-400">
                        {pillar.valueFormatted} / {pillar.benchmarkFormatted}
                      </span>
                    </div>
                  </div>
                  <div className="font-mono text-base font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                    {pillar.score}
                    <span className="text-xs text-zinc-400">/100</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${STATUS_BAR_COLOR[pillar.status]}`}
                    style={{ width: `${pillar.score}%` }}
                  />
                </div>

                <p className="mt-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                  {locale === 'ar' ? pillar.insightAr : pillar.insightEn}
                </p>

                <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    {locale === 'ar' ? 'الإجراء المقترح: ' : 'Next action: '}
                  </span>
                  {locale === 'ar' ? pillar.actionAr : pillar.actionEn}
                </p>

                {showFormulas && (
                  <div
                    className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/70 font-mono text-[11px] text-zinc-500 dark:text-zinc-400"
                    dir="ltr"
                  >
                    {pillar.formula}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
