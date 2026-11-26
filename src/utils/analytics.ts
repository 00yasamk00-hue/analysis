import {
  AccountProfile,
  ComputedAccountMetrics,
  DailySnapshot,
  DiagnosticPillar,
  DiagnosticStatus,
  Platform,
  PostFormat,
  PostRecord,
} from '../types/account';

const SAR_PER_USD = 3.75;

// Industry median engagement rate benchmarks (%) by platform & tier
const PLATFORM_BENCHMARKS: Record<
  Platform,
  { baseEr: number; targetReachRatio: number; targetPostsPerWeek: number; defaultCpm: number }
> = {
  x: { baseEr: 1.8, targetReachRatio: 0.32, targetPostsPerWeek: 10, defaultCpm: 11 },
  instagram: { baseEr: 3.1, targetReachRatio: 0.42, targetPostsPerWeek: 5, defaultCpm: 16 },
  tiktok: { baseEr: 5.4, targetReachRatio: 0.85, targetPostsPerWeek: 6, defaultCpm: 12 },
  youtube: { baseEr: 3.8, targetReachRatio: 0.55, targetPostsPerWeek: 2, defaultCpm: 24 },
  linkedin: { baseEr: 2.9, targetReachRatio: 0.36, targetPostsPerWeek: 4, defaultCpm: 28 },
};

export function getTierKey(followers: number): ComputedAccountMetrics['tierKey'] {
  if (followers < 10_000) return 'nano';
  if (followers < 100_000) return 'micro';
  if (followers < 500_000) return 'mid';
  if (followers < 1_000_000) return 'macro';
  return 'mega';
}

function getTierErMultiplier(tier: ComputedAccountMetrics['tierKey']): number {
  switch (tier) {
    case 'nano':
      return 1.35;
    case 'micro':
      return 1.08;
    case 'mid':
      return 0.9;
    case 'macro':
      return 0.78;
    case 'mega':
      return 0.65;
  }
}

export function getDefaultCpm(platform: Platform): number {
  return PLATFORM_BENCHMARKS[platform].defaultCpm;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function scoreToStatus(score: number): DiagnosticStatus {
  if (score >= 82) return 'optimal';
  if (score >= 64) return 'healthy';
  if (score >= 45) return 'attention';
  return 'warning';
}

export function computePostEngagementRate(post: PostRecord, followers: number): number {
  const interactions = post.likes + post.comments + post.shares + post.saves;
  const base = Math.max(1, followers);
  return (interactions / base) * 100;
}

export function computeAccountMetrics(account: AccountProfile): ComputedAccountMetrics {
  const safeFollowers = Math.max(1, account.followers);
  const safeFollowing = Math.max(1, account.following);

  // If the account has logged posts, derive live averages directly from the posts ledger
  const hasPosts = account.posts.length > 0;
  const effectiveAvgViews = hasPosts
    ? Math.round(account.posts.reduce((acc, p) => acc + p.views, 0) / account.posts.length)
    : Math.max(1, account.avgViews);
  const effectiveAvgLikes = hasPosts
    ? Math.round(account.posts.reduce((acc, p) => acc + p.likes, 0) / account.posts.length)
    : Math.max(0, account.avgLikes);
  const effectiveAvgComments = hasPosts
    ? Math.round(account.posts.reduce((acc, p) => acc + p.comments, 0) / account.posts.length)
    : Math.max(0, account.avgComments);
  const effectiveAvgShares = hasPosts
    ? Math.round(account.posts.reduce((acc, p) => acc + p.shares, 0) / account.posts.length)
    : Math.max(0, account.avgShares);
  const effectiveAvgSaves = hasPosts
    ? Math.round(account.posts.reduce((acc, p) => acc + p.saves, 0) / account.posts.length)
    : Math.max(0, account.avgSaves);

  const avgInteractions =
    effectiveAvgLikes + effectiveAvgComments + effectiveAvgShares + effectiveAvgSaves;

  const engagementRateFollowers = (avgInteractions / safeFollowers) * 100;
  const engagementRateViews =
    effectiveAvgViews > 0 ? (avgInteractions / effectiveAvgViews) * 100 : 0;

  const tierKey = getTierKey(safeFollowers);
  const platformRef = PLATFORM_BENCHMARKS[account.platform];
  const platformBenchmarkEr = Number(
    (platformRef.baseEr * getTierErMultiplier(tierKey)).toFixed(2)
  );
  const erDeltaVsBenchmark = Number((engagementRateFollowers - platformBenchmarkEr).toFixed(2));

  const followerRatio = safeFollowers / safeFollowing;
  const commentToLikePct =
    effectiveAvgLikes > 0 ? (effectiveAvgComments / effectiveAvgLikes) * 100 : 0;
  const saveAndShareRatePct =
    effectiveAvgLikes > 0
      ? ((effectiveAvgShares + effectiveAvgSaves) / effectiveAvgLikes) * 100
      : 0;
  const viralMultiplier = effectiveAvgViews / safeFollowers;

  // Transparent diagnostic scores (0-100)
  const engagementScore = clamp(
    Math.round((engagementRateFollowers / Math.max(0.5, platformBenchmarkEr * 1.35)) * 100),
    12,
    100
  );

  const reachScore = clamp(
    Math.round((viralMultiplier / Math.max(0.15, platformRef.targetReachRatio * 1.4)) * 100),
    15,
    100
  );

  // Audience ratio + organic comment-to-like health
  const ratioComponent = clamp(Math.log10(Math.max(1, followerRatio) * 4) * 32, 10, 60);
  // Healthy comment-to-like is typically between 2% and 14%
  const commentDepthComponent =
    commentToLikePct < 0.8
      ? 10
      : commentToLikePct <= 16
        ? clamp(15 + commentToLikePct * 2.4, 15, 40)
        : 26;
  const ratioScore = clamp(Math.round(ratioComponent + commentDepthComponent), 18, 100);

  const consistencyScore = clamp(
    Math.round(
      (Math.min(account.postsPerWeek, platformRef.targetPostsPerWeek * 1.3) /
        platformRef.targetPostsPerWeek) *
        82 +
        (account.monthlyGrowthPct > 0 ? Math.min(18, account.monthlyGrowthPct * 2.1) : 0)
    ),
    15,
    100
  );

  const authenticityIndex = Math.round(
    engagementScore * 0.34 +
      reachScore * 0.24 +
      ratioScore * 0.24 +
      consistencyScore * 0.18
  );

  // Sponsorship / Post Valuation formula
  const erMultiplier = clamp(
    0.75 + (engagementRateFollowers / Math.max(1, platformBenchmarkEr)) * 0.45,
    0.6,
    2.4
  );
  const effectiveCpm = account.cpmUsd > 0 ? account.cpmUsd : platformRef.defaultCpm;
  const estimatedPostValueUsd = Math.round((effectiveAvgViews / 1000) * effectiveCpm * erMultiplier);
  const estimatedPostValueSar = Math.round(estimatedPostValueUsd * SAR_PER_USD);
  const monthlyReachEstimate = Math.round(effectiveAvgViews * Math.max(1, account.postsPerWeek) * 4.33);

  const diagnostics: DiagnosticPillar[] = [
    {
      key: 'engagement',
      labelAr: 'عمق التفاعل',
      labelEn: 'Engagement Depth',
      score: engagementScore,
      status: scoreToStatus(engagementScore),
      valueFormatted: `${engagementRateFollowers.toFixed(2)}%`,
      benchmarkFormatted: `${platformBenchmarkEr.toFixed(2)}%`,
      formula: '((Likes + Comments + Shares + Saves) / Followers) × 100',
      insightAr:
        erDeltaVsBenchmark >= 0
          ? `يتفوق الحساب على متوسط المنصة بفارق +${erDeltaVsBenchmark.toFixed(2)} نقطة مئوية.`
          : `معدل التفاعل أقل من متوسط المنصة بمقدار ${Math.abs(erDeltaVsBenchmark).toFixed(2)} نقطة مئوية.`,
      insightEn:
        erDeltaVsBenchmark >= 0
          ? `Outperforming platform median by +${erDeltaVsBenchmark.toFixed(2)} percentage points.`
          : `Trailing platform tier median by ${Math.abs(erDeltaVsBenchmark).toFixed(2)} percentage points.`,
      actionAr:
        commentToLikePct < 2.2
          ? 'أضف سؤالاً مباشراً في نهاية المنشورات لرفع نسبة التعليقات إلى الإعجابات.'
          : 'حافظ على وتيرة المحتوى التفاعلي واستثمر في صيغ الحفظ والمشاركة.',
      actionEn:
        commentToLikePct < 2.2
          ? 'Add explicit discussion prompts to lift comment-to-like depth above 2.5%.'
          : 'Double down on high-save educational assets to sustain compounding reach.',
    },
    {
      key: 'reach',
      labelAr: 'كفاءة الانتشار والوصول',
      labelEn: 'Reach Efficiency',
      score: reachScore,
      status: scoreToStatus(reachScore),
      valueFormatted: `${(viralMultiplier * 100).toFixed(0)}%`,
      benchmarkFormatted: `${Math.round(platformRef.targetReachRatio * 100)}%`,
      formula: '(Avg Views / Followers) × 100',
      insightAr:
        viralMultiplier >= platformRef.targetReachRatio
          ? `متوسط المشاهدات يعادل ${viralMultiplier.toFixed(2)}× من حجم المتابعين، ما يدل على توزيع خوارزمي نشط.`
          : `الوصول لكل منشور (${(viralMultiplier * 100).toFixed(0)}%) محدود مقارنة بقاعدة المتابعين الحالية.`,
      insightEn:
        viralMultiplier >= platformRef.targetReachRatio
          ? `Average views reach ${viralMultiplier.toFixed(2)}x follower base, indicating strong algorithmic discovery.`
          : `Per-post reach (${(viralMultiplier * 100).toFixed(0)}% of followers) shows discovery headroom.`,
      actionAr:
        viralMultiplier < platformRef.targetReachRatio
          ? 'حسّن أول 3 ثوانٍ أو الجملة الافتتاحية وارفع نسبة الفيديو القصير.'
          : 'استفد من الوصول غير العضوي بتثبيت عرض واضح في البايو لتحويل المشاهدين لمتابعين.',
      actionEn:
        viralMultiplier < platformRef.targetReachRatio
          ? 'Tighten opening hooks and test shorter high-retention video formats.'
          : 'Optimize profile bio conversion to turn high non-follower reach into follows.',
    },
    {
      key: 'ratio',
      labelAr: 'جودة الجمهور والأصالة',
      labelEn: 'Audience Quality',
      score: ratioScore,
      status: scoreToStatus(ratioScore),
      valueFormatted: `${followerRatio >= 100 ? Math.round(followerRatio) : followerRatio.toFixed(1)}×`,
      benchmarkFormatted: '≥ 5.0×',
      formula: 'Followers / Following · Comment/Like Ratio',
      insightAr: `نسبة المتابعين إلى المتابَعين ${followerRatio.toFixed(1)}× مع عمق تعليقات ${commentToLikePct.toFixed(1)}% من الإعجابات.`,
      insightEn: `Follower-to-following ratio is ${followerRatio.toFixed(1)}x with ${commentToLikePct.toFixed(1)}% comment-to-like depth.`,
      actionAr:
        commentToLikePct < 1.2
          ? 'نسبة التعليقات منخفضة نسبياً — تحقق من نشاط الجمهور الحقيقي وتفاعل مع الردود الأولى.'
          : 'توازن صحي بين حجم الجمهور والتفاعل العضوي مما يعزز مصداقية الحساب للرعايات.',
      actionEn:
        commentToLikePct < 1.2
          ? 'Low comment ratio detected — audit inactive segments and reply within the first 30 minutes.'
          : 'Balanced follower ratio and genuine comment activity support premium brand partnerships.',
    },
    {
      key: 'consistency',
      labelAr: 'انتظام النشر وزخم النمو',
      labelEn: 'Cadence & Velocity',
      score: consistencyScore,
      status: scoreToStatus(consistencyScore),
      valueFormatted: `${account.postsPerWeek}/wk`,
      benchmarkFormatted: `${platformRef.targetPostsPerWeek}/wk`,
      formula: 'Weekly Cadence vs Platform Target + Monthly Growth %',
      insightAr: `معدل نشر ${account.postsPerWeek} منشورات أسبوعياً مع نمو شهري ${account.monthlyGrowthPct >= 0 ? '+' : ''}${account.monthlyGrowthPct.toFixed(1)}%.`,
      insightEn: `Publishing ${account.postsPerWeek} posts/week alongside ${account.monthlyGrowthPct >= 0 ? '+' : ''}${account.monthlyGrowthPct.toFixed(1)}% monthly growth.`,
      actionAr:
        account.postsPerWeek < platformRef.targetPostsPerWeek
          ? `رفع الوتيرة إلى ${platformRef.targetPostsPerWeek} منشورات أسبوعياً سيزيد الوصول الشهري المقدر.`
          : 'وتيرة نشر متماسكة — ركّز على إعادة تدوير أفضل المنشورات أداءً.',
      actionEn:
        account.postsPerWeek < platformRef.targetPostsPerWeek
          ? `Scaling cadence toward ${platformRef.targetPostsPerWeek} posts/week unlocks compounding monthly reach.`
          : 'Consistent output pace — repurpose top-performing formats to prevent creative fatigue.',
    },
  ];

  // Format breakdown
  const formatMap = new Map<PostFormat, { count: number; viewsSum: number; erSum: number }>();
  for (const post of account.posts) {
    const existing = formatMap.get(post.format) ?? { count: 0, viewsSum: 0, erSum: 0 };
    existing.count += 1;
    existing.viewsSum += post.views;
    existing.erSum += computePostEngagementRate(post, safeFollowers);
    formatMap.set(post.format, existing);
  }

  const formatStats = Array.from(formatMap.entries())
    .map(([format, data]) => ({
      format,
      count: data.count,
      avgViews: Math.round(data.viewsSum / data.count),
      avgEngagementRate: Number((data.erSum / data.count).toFixed(2)),
    }))
    .sort((a, b) => b.avgEngagementRate - a.avgEngagementRate);

  return {
    effectiveAvgViews,
    effectiveAvgLikes,
    effectiveAvgComments,
    effectiveAvgShares,
    effectiveAvgSaves,
    engagementRateFollowers: Number(engagementRateFollowers.toFixed(2)),
    engagementRateViews: Number(engagementRateViews.toFixed(2)),
    platformBenchmarkEr,
    erDeltaVsBenchmark,
    followerRatio: Number(followerRatio.toFixed(1)),
    commentToLikePct: Number(commentToLikePct.toFixed(2)),
    saveAndShareRatePct: Number(saveAndShareRatePct.toFixed(1)),
    viralMultiplier: Number(viralMultiplier.toFixed(2)),
    authenticityIndex,
    tierKey,
    estimatedPostValueUsd,
    estimatedPostValueSar,
    monthlyReachEstimate,
    diagnostics,
    formatStats,
  };
}

export function generateSyntheticHistory(
  followers: number,
  monthlyGrowthPct: number,
  baseEr: number,
  avgViews: number,
  days = 90
): DailySnapshot[] {
  const snapshots: DailySnapshot[] = [];
  const today = new Date('2026-11-26T00:00:00Z');
  const dailyRate = Math.pow(1 + clamp(monthlyGrowthPct, -25, 60) / 100, 1 / 30) - 1;

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() - i);
    const dateStr = d.toISOString().slice(0, 10);

    // Deterministic gentle organic wave so curves look realistic & stable
    const wave = Math.sin(i * 0.45) * 0.08 + Math.cos(i * 0.19) * 0.05;
    const projectedFollowers = Math.max(
      10,
      Math.round(followers / Math.pow(1 + dailyRate, i))
    );
    const er = Math.max(0.2, Number((baseEr * (1 + wave)).toFixed(2)));
    const views = Math.max(50, Math.round(avgViews * (1 + wave * 1.4)));

    snapshots.push({
      date: dateStr,
      followers: projectedFollowers,
      engagementRate: er,
      views,
    });
  }
  return snapshots;
}

export interface ProjectionPoint {
  month: number;
  labelAr: string;
  labelEn: string;
  followers: number;
  monthlyReach: number;
  monthlyRevenueUsd: number;
  monthlyRevenueSar: number;
}

export function simulateGrowthTrajectory(params: {
  currentFollowers: number;
  currentMonthlyGrowthPct: number;
  currentPostsPerWeek: number;
  targetPostsPerWeek: number;
  currentAvgViews: number;
  currentErPct: number;
  targetErLiftPct: number;
  cpmUsd: number;
  sponsoredPostsPerMonth: number;
  months: number;
}): ProjectionPoint[] {
  const {
    currentFollowers,
    currentMonthlyGrowthPct,
    currentPostsPerWeek,
    targetPostsPerWeek,
    currentAvgViews,
    currentErPct,
    targetErLiftPct,
    cpmUsd,
    sponsoredPostsPerMonth,
    months,
  } = params;

  const cadenceRatio = targetPostsPerWeek / Math.max(1, currentPostsPerWeek);
  const cadenceBoost = (cadenceRatio - 1) * 0.35; // diminishing returns
  const erBoost = (targetErLiftPct / 100) * 0.45;
  const effectiveMonthlyGrowth = clamp(
    currentMonthlyGrowthPct * (1 + cadenceBoost + erBoost) + (cadenceBoost > 0 ? cadenceBoost * 2.5 : 0),
    -15,
    45
  );

  const viewToFollowerRatio = currentAvgViews / Math.max(1, currentFollowers);
  const boostedEr = Math.max(0.2, currentErPct * (1 + targetErLiftPct / 100));
  const erValMultiplier = clamp(0.85 + boostedEr * 0.14, 0.7, 2.5);

  const points: ProjectionPoint[] = [];
  for (let m = 0; m <= months; m++) {
    const followers = Math.round(
      currentFollowers * Math.pow(1 + effectiveMonthlyGrowth / 100, m)
    );
    const estViewsPerPost = Math.round(
      followers * viewToFollowerRatio * (1 + (targetErLiftPct / 100) * 0.5)
    );
    const monthlyReach = Math.round(estViewsPerPost * targetPostsPerWeek * 4.33);
    const valuePerSponsoredPostUsd = (estViewsPerPost / 1000) * cpmUsd * erValMultiplier;
    const monthlyRevenueUsd = Math.round(valuePerSponsoredPostUsd * sponsoredPostsPerMonth);

    points.push({
      month: m,
      labelAr: m === 0 ? 'الآن' : `ش ${m}`,
      labelEn: m === 0 ? 'Now' : `M${m}`,
      followers,
      monthlyReach,
      monthlyRevenueUsd,
      monthlyRevenueSar: Math.round(monthlyRevenueUsd * SAR_PER_USD),
    });
  }

  return points;
}

export function formatCompactNumber(num: number): string {
  if (!Number.isFinite(num)) return '0';
  const abs = Math.abs(num);
  if (abs >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (abs >= 10_000) return `${(num / 1_000).toFixed(1)}K`;
  if (abs >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
  return Math.round(num).toLocaleString('en-US');
}

export function formatCurrency(amount: number, currency: 'USD' | 'SAR' = 'USD'): string {
  const formatted = Math.round(amount).toLocaleString('en-US');
  return currency === 'USD' ? `$${formatted}` : `${formatted} ر.س`;
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportAccountReportJson(
  account: AccountProfile,
  metrics: ComputedAccountMetrics
): void {
  const payload = {
    exportedAt: new Date().toISOString(),
    account: {
      handle: account.handle,
      displayName: account.displayName,
      platform: account.platform,
      niche: account.niche,
      followers: account.followers,
      following: account.following,
      postsPerWeek: account.postsPerWeek,
      monthlyGrowthPct: account.monthlyGrowthPct,
    },
    analytics: metrics,
    posts: account.posts,
  };
  downloadFile(
    JSON.stringify(payload, null, 2),
    `${account.handle.replace(/^@/, '')}-analytics.json`,
    'application/json;charset=utf-8'
  );
}

export function exportPostsCsv(account: AccountProfile): void {
  const headers = ['id', 'title', 'publishedAt', 'format', 'views', 'likes', 'comments', 'shares', 'saves', 'er_pct'];
  const rows = account.posts.map((p) => [
    p.id,
    `"${p.title.replace(/"/g, '""')}"`,
    p.publishedAt,
    p.format,
    p.views,
    p.likes,
    p.comments,
    p.shares,
    p.saves,
    computePostEngagementRate(p, account.followers).toFixed(2),
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadFile(
    `\uFEFF${csv}`,
    `${account.handle.replace(/^@/, '')}-posts.csv`,
    'text/csv;charset=utf-8'
  );
}

const VALID_PLATFORMS: Platform[] = ['x', 'instagram', 'tiktok', 'youtube', 'linkedin'];

export function parseImportedAccounts(rawText: string): {
  accounts: AccountProfile[];
  error?: string;
} {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return { accounts: [], error: 'البيانات فارغة — الصق نص JSON أو CSV صالح.' };
  }

  // Try JSON first
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      const list = Array.isArray(parsed) ? parsed : [parsed];
      const accounts = list.map((item, idx) => normalizeImportedRecord(item, idx));
      return { accounts };
    } catch {
      return { accounts: [], error: 'صيغة JSON غير صالحة. تحقق من الأقواس والفواصل.' };
    }
  }

  // Fallback to CSV (header row + data rows)
  const lines = trimmed
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) {
    return {
      accounts: [],
      error: 'يجب أن يحتوي CSV على سطر عناوين وسطر بيانات واحد على الأقل.',
    };
  }

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const accounts: AccountProfile[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    const record: Record<string, string> = {};
    headers.forEach((h, idx) => {
      record[h] = cols[idx] ?? '';
    });
    accounts.push(normalizeImportedRecord(record, i));
  }

  return { accounts };
}

function normalizeImportedRecord(raw: Record<string, unknown>, idx: number): AccountProfile {
  const platformRaw = String(raw.platform ?? 'x').toLowerCase() as Platform;
  const platform: Platform = VALID_PLATFORMS.includes(platformRaw) ? platformRaw : 'x';
  const rawHandle = String(raw.handle ?? raw.username ?? `account_${Date.now()}_${idx}`).trim();
  const handle = rawHandle.startsWith('@') ? rawHandle : `@${rawHandle}`;
  const displayName = String(raw.displayName ?? raw.name ?? rawHandle.replace(/^@/, '')).trim();
  const followers = Math.max(10, Number(raw.followers) || 12500);
  const following = Math.max(1, Number(raw.following) || 320);
  const avgViews = Math.max(10, Number(raw.avgViews ?? raw.views) || Math.round(followers * 0.45));
  const avgLikes = Math.max(0, Number(raw.avgLikes ?? raw.likes) || Math.round(followers * 0.032));
  const avgComments = Math.max(0, Number(raw.avgComments ?? raw.comments) || Math.round(avgLikes * 0.06));
  const avgShares = Math.max(0, Number(raw.avgShares ?? raw.shares) || Math.round(avgLikes * 0.09));
  const avgSaves = Math.max(0, Number(raw.avgSaves ?? raw.saves) || Math.round(avgLikes * 0.14));
  const postsPerWeek = Math.max(1, Number(raw.postsPerWeek ?? raw.cadence) || 4);
  const monthlyGrowthPct = Number(raw.monthlyGrowthPct ?? raw.growth) || 5.4;
  const totalPosts = Math.max(1, Number(raw.totalPosts ?? raw.postsCount) || 84);
  const niche = String(raw.niche ?? raw.category ?? 'تقنية ومحتوى رقمي').trim();
  const er = ((avgLikes + avgComments + avgShares + avgSaves) / followers) * 100;

  return {
    id: `acc_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
    handle,
    displayName,
    displayNameEn: String(raw.displayNameEn ?? displayName),
    platform,
    niche,
    nicheEn: String(raw.nicheEn ?? niche),
    bio: String(raw.bio ?? `حساب ${displayName} على منصة ${platform.toUpperCase()}`),
    bioEn: String(raw.bioEn ?? `${displayName} creator account on ${platform.toUpperCase()}`),
    verified: Boolean(raw.verified ?? false),
    followers,
    following,
    totalPosts,
    postsPerWeek,
    monthlyGrowthPct,
    avgViews,
    avgLikes,
    avgComments,
    avgShares,
    avgSaves,
    cpmUsd: Number(raw.cpmUsd) || getDefaultCpm(platform),
    posts: [],
    history: generateSyntheticHistory(followers, monthlyGrowthPct, er, avgViews, 90),
    createdAt: new Date().toISOString().slice(0, 10),
  };
}
