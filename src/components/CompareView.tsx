import { useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { AccountProfile, Locale } from '../types/account';
import { COPY, PLATFORM_META } from '../data/i18n';
import {
  computeAccountMetrics,
  formatCompactNumber,
  formatCurrency,
} from '../utils/analytics';
import { Avatar } from './Avatar';

interface CompareViewProps {
  accounts: AccountProfile[];
  activeAccountId: string;
  locale: Locale;
}

export function CompareView({ accounts, activeAccountId, locale }: CompareViewProps) {
  const t = COPY[locale];
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    const initial = [activeAccountId];
    for (const acc of accounts) {
      if (initial.length >= Math.min(3, accounts.length)) break;
      if (!initial.includes(acc.id)) initial.push(acc.id);
    }
    return initial;
  });

  const validSelectedIds = useMemo(() => {
    const existing = selectedIds.filter((id) => accounts.some((a) => a.id === id));
    if (existing.length > 0) return existing;
    return accounts.slice(0, Math.min(2, accounts.length)).map((a) => a.id);
  }, [selectedIds, accounts]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const cleaned = prev.filter((item) => accounts.some((a) => a.id === item));
      if (cleaned.includes(id)) {
        if (cleaned.length <= 1) return cleaned;
        return cleaned.filter((item) => item !== id);
      }
      if (cleaned.length >= 3) {
        return [...cleaned.slice(1), id];
      }
      return [...cleaned, id];
    });
  };

  const compared = useMemo(
    () =>
      validSelectedIds
        .map((id) => accounts.find((a) => a.id === id))
        .filter((a): a is AccountProfile => Boolean(a))
        .map((account) => ({
          account,
          metrics: computeAccountMetrics(account),
        })),
    [validSelectedIds, accounts]
  );

  const rows: Array<{
    key: string;
    labelAr: string;
    labelEn: string;
    getValue: (item: (typeof compared)[number]) => number;
    format: (item: (typeof compared)[number]) => string;
  }> = [
    {
      key: 'followers',
      labelAr: 'إجمالي المتابعين',
      labelEn: 'Total Followers',
      getValue: (c) => c.account.followers,
      format: (c) => formatCompactNumber(c.account.followers),
    },
    {
      key: 'er',
      labelAr: 'معدل التفاعل (ERF)',
      labelEn: 'Engagement Rate (ERF)',
      getValue: (c) => c.metrics.engagementRateFollowers,
      format: (c) => `${c.metrics.engagementRateFollowers.toFixed(2)}%`,
    },
    {
      key: 'erv',
      labelAr: 'التفاعل من المشاهدات (ERV)',
      labelEn: 'Engagement by Views',
      getValue: (c) => c.metrics.engagementRateViews,
      format: (c) => `${c.metrics.engagementRateViews.toFixed(2)}%`,
    },
    {
      key: 'views',
      labelAr: 'متوسط المشاهدات للمنشور',
      labelEn: 'Avg. Views / Post',
      getValue: (c) => c.metrics.effectiveAvgViews,
      format: (c) => formatCompactNumber(c.metrics.effectiveAvgViews),
    },
    {
      key: 'viral',
      labelAr: 'مضاعف الانتشار (Views/Followers)',
      labelEn: 'Reach Multiplier',
      getValue: (c) => c.metrics.viralMultiplier,
      format: (c) => `${c.metrics.viralMultiplier.toFixed(2)}×`,
    },
    {
      key: 'growth',
      labelAr: 'معدل النمو الشهري',
      labelEn: 'Monthly Growth',
      getValue: (c) => c.account.monthlyGrowthPct,
      format: (c) =>
        `${c.account.monthlyGrowthPct >= 0 ? '+' : ''}${c.account.monthlyGrowthPct.toFixed(1)}%`,
    },
    {
      key: 'auth',
      labelAr: 'مؤشر جودة الجمهور',
      labelEn: 'Audience Quality Index',
      getValue: (c) => c.metrics.authenticityIndex,
      format: (c) => `${c.metrics.authenticityIndex}/100`,
    },
    {
      key: 'value',
      labelAr: 'القيمة الإعلانية التقديرية',
      labelEn: 'Est. Post Value (USD)',
      getValue: (c) => c.metrics.estimatedPostValueUsd,
      format: (c) => formatCurrency(c.metrics.estimatedPostValueUsd, 'USD'),
    },
  ];

  const barColors = ['bg-emerald-500', 'bg-sky-500', 'bg-amber-500'];

  return (
    <div className="space-y-6">
      {/* Account Picker */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-[#12151C] p-5">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {t.compareTitle}
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          {t.compareSubtitle}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {accounts.map((acc) => {
            const isSelected = validSelectedIds.includes(acc.id);
            const name = locale === 'ar' ? acc.displayName : acc.displayNameEn;
            return (
              <button
                key={acc.id}
                type="button"
                onClick={() => toggleSelect(acc.id)}
                className={`inline-flex items-center gap-2.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? 'border-emerald-500/60 bg-emerald-500/10 text-zinc-900 dark:text-zinc-100'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <Avatar src={acc.avatarUrl} name={name} size="sm" />
                <span className="whitespace-nowrap">{name}</span>
                <span className="font-mono text-[11px] text-zinc-500" dir="ltr">
                  {PLATFORM_META[acc.platform].short}
                </span>
                {isSelected && <Check className="w-3.5 h-3.5 text-emerald-500" />}
              </button>
            );
          })}
        </div>
      </section>

      {/* Matrix Table */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-[#12151C] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-[#0E1117]">
                <th className="py-3.5 px-5 text-xs font-medium text-zinc-500 dark:text-zinc-400 text-start w-60">
                  {t.metricCol}
                </th>
                {compared.map(({ account }, idx) => {
                  const name = locale === 'ar' ? account.displayName : account.displayNameEn;
                  return (
                    <th key={account.id} className="py-3.5 px-5 text-start min-w-[180px]">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-1.5 h-5 rounded-full shrink-0 ${barColors[idx % barColors.length]}`}
                          aria-hidden="true"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {name}
                          </div>
                          <div
                            className="font-mono text-[11px] font-normal text-zinc-500 dark:text-zinc-400 truncate"
                            dir="ltr"
                          >
                            {account.handle} · {PLATFORM_META[account.platform].short}
                          </div>
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-xs">
              {rows.map((row) => {
                const values = compared.map((c) => row.getValue(c));
                const maxVal = Math.max(...values, 0.0001);
                return (
                  <tr key={row.key} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/25">
                    <td className="py-3.5 px-5 font-medium text-zinc-700 dark:text-zinc-300">
                      {locale === 'ar' ? row.labelAr : row.labelEn}
                    </td>
                    {compared.map((item, idx) => {
                      const val = row.getValue(item);
                      const isBest = compared.length > 1 && val === maxVal && val > 0;
                      const widthPct = Math.max(4, Math.min(100, (Math.max(0, val) / maxVal) * 100));
                      return (
                        <td key={item.account.id} className="py-3.5 px-5">
                          <div className="flex items-baseline justify-between gap-2 mb-1.5">
                            <span
                              className={`font-mono text-sm tabular-nums ${
                                isBest
                                  ? 'font-semibold text-zinc-900 dark:text-zinc-50'
                                  : 'font-medium text-zinc-600 dark:text-zinc-400'
                              }`}
                            >
                              {row.format(item)}
                            </span>
                            {isBest && (
                              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                {t.leader}
                              </span>
                            )}
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${barColors[idx % barColors.length]} transition-all duration-300`}
                              style={{ width: `${widthPct}%` }}
                            />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
