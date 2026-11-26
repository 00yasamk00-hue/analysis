import { useMemo, useState } from 'react';
import { DailySnapshot, Locale } from '../types/account';
import { formatCompactNumber, formatCurrency, ProjectionPoint } from '../utils/analytics';

interface GrowthDualChartProps {
  snapshots: DailySnapshot[];
  series: 'followers' | 'engagement';
  locale: Locale;
}

export function GrowthDualChart({ snapshots, series, locale }: GrowthDualChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const width = 760;
  const height = 236;
  const pad = { top: 18, right: 18, bottom: 30, left: 54 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const { minVal, maxVal, points, areaPath, linePath, yTicks, xTickIndices } = useMemo(() => {
    const safeData = snapshots.length > 0 ? snapshots : [];
    const values = safeData.map((d) =>
      series === 'followers' ? d.followers : d.engagementRate
    );
    const rawMin = values.length ? Math.min(...values) : 0;
    const rawMax = values.length ? Math.max(...values) : 100;
    const span = rawMax - rawMin || Math.max(1, rawMax * 0.1);
    const min = Math.max(0, rawMin - span * 0.14);
    const max = rawMax + span * 0.14;

    const pts = safeData.map((d, idx) => {
      const x =
        safeData.length <= 1
          ? pad.left + plotW / 2
          : pad.left + (idx / (safeData.length - 1)) * plotW;
      const val = series === 'followers' ? d.followers : d.engagementRate;
      const ratio = (val - min) / (max - min || 1);
      const y = pad.top + plotH - ratio * plotH;
      return { x, y, val, snapshot: d };
    });

    const line = pts
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(' ');

    const area =
      pts.length > 1
        ? `${line} L ${pts[pts.length - 1].x.toFixed(1)} ${(pad.top + plotH).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(pad.top + plotH).toFixed(1)} Z`
        : '';

    const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
      val: min + (max - min) * t,
      y: pad.top + plotH - t * plotH,
    }));

    const xCount = Math.min(5, safeData.length);
    const xIndices: number[] = [];
    if (xCount > 1) {
      for (let i = 0; i < xCount; i++) {
        xIndices.push(Math.round((i / (xCount - 1)) * (safeData.length - 1)));
      }
    } else if (safeData.length === 1) {
      xIndices.push(0);
    }

    return {
      minVal: min,
      maxVal: max,
      points: pts,
      areaPath: area,
      linePath: line,
      yTicks: ticks,
      xTickIndices: xIndices,
    };
  }, [snapshots, series, plotW, plotH, pad.left, pad.top]);

  if (points.length === 0) {
    return (
      <div className="h-[236px] flex items-center justify-center text-sm text-zinc-500">
        {locale === 'ar' ? 'لا توجد بيانات تاريخية متاحة' : 'No historical snapshots available'}
      </div>
    );
  }

  const activePoint = hoverIdx !== null && points[hoverIdx] ? points[hoverIdx] : null;
  const strokeColor = series === 'followers' ? '#10B981' : '#38BDF8';
  const gradientId = series === 'followers' ? 'gradFollowers' : 'gradEr';

  const formatTick = (v: number) =>
    series === 'followers' ? formatCompactNumber(v) : `${v.toFixed(1)}%`;

  return (
    <div className="relative w-full select-none" dir="ltr">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-[236px] overflow-visible"
        onMouseLeave={() => setHoverIdx(null)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const relX = ((e.clientX - rect.left) / rect.width) * width;
          let nearest = 0;
          let bestDist = Infinity;
          for (let i = 0; i < points.length; i++) {
            const dist = Math.abs(points[i].x - relX);
            if (dist < bestDist) {
              bestDist = dist;
              nearest = i;
            }
          }
          setHoverIdx(nearest);
        }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.22" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal gridlines & Y ticks */}
        {yTicks.map((tick, idx) => (
          <g key={idx}>
            <line
              x1={pad.left}
              y1={tick.y}
              x2={width - pad.right}
              y2={tick.y}
              className="stroke-zinc-200 dark:stroke-zinc-800/80"
              strokeWidth="1"
              strokeDasharray={idx === 0 ? undefined : '2 4'}
            />
            <text
              x={pad.left - 10}
              y={tick.y + 4}
              textAnchor="end"
              className="fill-zinc-500 dark:fill-zinc-400 font-mono text-[11px]"
            >
              {formatTick(tick.val)}
            </text>
          </g>
        ))}

        {/* X axis dates */}
        {xTickIndices.map((idx) => {
          const pt = points[idx];
          if (!pt) return null;
          return (
            <text
              key={idx}
              x={pt.x}
              y={height - 6}
              textAnchor="middle"
              className="fill-zinc-500 dark:fill-zinc-400 font-mono text-[11px]"
            >
              {pt.snapshot.date.slice(5)}
            </text>
          );
        })}

        {/* Area & Line */}
        {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}
        <path
          d={linePath}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Hover crosshair */}
        {activePoint && (
          <g>
            <line
              x1={activePoint.x}
              y1={pad.top}
              x2={activePoint.x}
              y2={pad.top + plotH}
              className="stroke-zinc-400 dark:stroke-zinc-600"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <circle
              cx={activePoint.x}
              cy={activePoint.y}
              r="4.5"
              fill={strokeColor}
              className="stroke-white dark:stroke-[#12151C]"
              strokeWidth="2"
            />
          </g>
        )}

        {/* Suppress unused lint on minVal/maxVal */}
        <title>{`${minVal.toFixed(1)} - ${maxVal.toFixed(1)}`}</title>
      </svg>

      {/* Floating precision tooltip */}
      {activePoint && (
        <div
          className="pointer-events-none absolute top-2 z-10 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white/95 dark:bg-[#161A22]/95 px-3 py-2 shadow-sm backdrop-blur-sm text-xs"
          style={{
            left:
              activePoint.x > width * 0.65
                ? `calc(${(activePoint.x / width) * 100}% - 168px)`
                : `calc(${(activePoint.x / width) * 100}% + 12px)`,
          }}
        >
          <div className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
            {activePoint.snapshot.date}
          </div>
          <div className="flex items-center justify-between gap-4 font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
            <span className="text-zinc-500 dark:text-zinc-400 font-sans">
              {locale === 'ar' ? 'المتابعون' : 'Followers'}
            </span>
            <span className="font-semibold">
              {activePoint.snapshot.followers.toLocaleString('en-US')}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 font-mono tabular-nums text-zinc-900 dark:text-zinc-100 mt-0.5">
            <span className="text-zinc-500 dark:text-zinc-400 font-sans">
              {locale === 'ar' ? 'التفاعل' : 'ER'}
            </span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {activePoint.snapshot.engagementRate.toFixed(2)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

interface ProjectionCurveChartProps {
  points: ProjectionPoint[];
  metric: 'followers' | 'revenue';
  locale: Locale;
}

export function ProjectionCurveChart({
  points,
  metric,
  locale,
}: ProjectionCurveChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const width = 760;
  const height = 240;
  const pad = { top: 20, right: 20, bottom: 32, left: 64 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const computed = useMemo(() => {
    const vals = points.map((p) =>
      metric === 'followers' ? p.followers : p.monthlyRevenueUsd
    );
    const min = Math.min(...vals) * 0.92;
    const max = Math.max(...vals, min + 10) * 1.06;

    const coords = points.map((p, idx) => {
      const x =
        points.length <= 1
          ? pad.left + plotW / 2
          : pad.left + (idx / (points.length - 1)) * plotW;
      const v = metric === 'followers' ? p.followers : p.monthlyRevenueUsd;
      const y = pad.top + plotH - ((v - min) / (max - min || 1)) * plotH;
      return { x, y, v, point: p };
    });

    const line = coords
      .map((c, idx) => `${idx === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
      .join(' ');
    const area =
      coords.length > 1
        ? `${line} L ${coords[coords.length - 1].x.toFixed(1)} ${(pad.top + plotH).toFixed(1)} L ${coords[0].x.toFixed(1)} ${(pad.top + plotH).toFixed(1)} Z`
        : '';

    const yTicks = [0, 0.33, 0.66, 1].map((t) => ({
      val: min + (max - min) * t,
      y: pad.top + plotH - t * plotH,
    }));

    return { coords, line, area, yTicks };
  }, [points, metric, plotW, plotH, pad.left, pad.top]);

  const active = hoverIdx !== null && computed.coords[hoverIdx] ? computed.coords[hoverIdx] : null;
  const color = metric === 'followers' ? '#10B981' : '#F59E0B';

  return (
    <div className="relative w-full select-none" dir="ltr">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-[240px] overflow-visible"
        onMouseLeave={() => setHoverIdx(null)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const relX = ((e.clientX - rect.left) / rect.width) * width;
          let nearest = 0;
          let bestDist = Infinity;
          computed.coords.forEach((c, idx) => {
            const dist = Math.abs(c.x - relX);
            if (dist < bestDist) {
              bestDist = dist;
              nearest = idx;
            }
          });
          setHoverIdx(nearest);
        }}
      >
        <defs>
          <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {computed.yTicks.map((t, i) => (
          <g key={i}>
            <line
              x1={pad.left}
              y1={t.y}
              x2={width - pad.right}
              y2={t.y}
              className="stroke-zinc-200 dark:stroke-zinc-800/80"
              strokeWidth="1"
              strokeDasharray={i === 0 ? undefined : '2 4'}
            />
            <text
              x={pad.left - 10}
              y={t.y + 4}
              textAnchor="end"
              className="fill-zinc-500 dark:fill-zinc-400 font-mono text-[11px]"
            >
              {metric === 'followers'
                ? formatCompactNumber(t.val)
                : formatCurrency(t.val, 'USD')}
            </text>
          </g>
        ))}

        {computed.area && <path d={computed.area} fill="url(#projGrad)" />}
        <path
          d={computed.line}
          fill="none"
          stroke={color}
          strokeWidth="2.25"
          strokeLinejoin="round"
        />

        {computed.coords.map((c, idx) => (
          <g key={idx}>
            <circle
              cx={c.x}
              cy={c.y}
              r={hoverIdx === idx ? 5 : 3}
              fill={color}
              className="stroke-white dark:stroke-[#12151C] transition-all"
              strokeWidth="1.5"
            />
            {(points.length <= 7 || idx % 2 === 0 || idx === points.length - 1) && (
              <text
                x={c.x}
                y={height - 8}
                textAnchor="middle"
                className="fill-zinc-500 dark:fill-zinc-400 font-mono text-[11px]"
              >
                {locale === 'ar' ? c.point.labelAr : c.point.labelEn}
              </text>
            )}
          </g>
        ))}
      </svg>

      {active && (
        <div
          className="pointer-events-none absolute top-2 z-10 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white/95 dark:bg-[#161A22]/95 px-3 py-2 shadow-sm text-xs"
          style={{
            left:
              active.x > width * 0.65
                ? `calc(${(active.x / width) * 100}% - 184px)`
                : `calc(${(active.x / width) * 100}% + 12px)`,
          }}
        >
          <div className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
            {locale === 'ar' ? active.point.labelAr : active.point.labelEn}
          </div>
          <div className="flex justify-between gap-4 font-mono tabular-nums">
            <span className="text-zinc-500 font-sans">
              {locale === 'ar' ? 'المتابعون' : 'Followers'}
            </span>
            <span className="text-zinc-900 dark:text-zinc-100 font-medium">
              {formatCompactNumber(active.point.followers)}
            </span>
          </div>
          <div className="flex justify-between gap-4 font-mono tabular-nums mt-0.5">
            <span className="text-zinc-500 font-sans">
              {locale === 'ar' ? 'العائد الشهري' : 'Est. Revenue'}
            </span>
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              {formatCurrency(active.point.monthlyRevenueUsd, 'USD')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
