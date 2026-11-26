export type Platform = 'x' | 'instagram' | 'tiktok' | 'youtube' | 'linkedin';

export type PostFormat = 'video' | 'carousel' | 'thread' | 'image';

export type Locale = 'ar' | 'en';

export type AppView = 'overview' | 'posts' | 'compare' | 'simulator';

export type TimeRange = '7d' | '30d' | '90d';

export interface PostRecord {
  id: string;
  title: string;
  publishedAt: string; // YYYY-MM-DD
  format: PostFormat;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  isSponsored?: boolean;
}

export interface DailySnapshot {
  date: string; // YYYY-MM-DD
  followers: number;
  engagementRate: number; // percentage e.g. 4.2
  views: number;
}

export interface AccountProfile {
  id: string;
  handle: string;
  displayName: string;
  displayNameEn: string;
  platform: Platform;
  niche: string;
  nicheEn: string;
  bio: string;
  bioEn: string;
  avatarUrl?: string;
  verified: boolean;
  followers: number;
  following: number;
  totalPosts: number;
  postsPerWeek: number;
  monthlyGrowthPct: number;
  avgViews: number;
  avgLikes: number;
  avgComments: number;
  avgShares: number;
  avgSaves: number;
  cpmUsd: number;
  posts: PostRecord[];
  history: DailySnapshot[];
  createdAt: string;
}

export type DiagnosticStatus = 'optimal' | 'healthy' | 'attention' | 'warning';

export interface DiagnosticPillar {
  key: 'engagement' | 'reach' | 'ratio' | 'consistency';
  labelAr: string;
  labelEn: string;
  score: number; // 0-100
  status: DiagnosticStatus;
  valueFormatted: string;
  benchmarkFormatted: string;
  formula: string;
  insightAr: string;
  insightEn: string;
  actionAr: string;
  actionEn: string;
}

export interface ComputedAccountMetrics {
  effectiveAvgViews: number;
  effectiveAvgLikes: number;
  effectiveAvgComments: number;
  effectiveAvgShares: number;
  effectiveAvgSaves: number;
  engagementRateFollowers: number; // ERF %
  engagementRateViews: number; // ERV %
  platformBenchmarkEr: number; // %
  erDeltaVsBenchmark: number; // percentage points
  followerRatio: number; // followers / max(1, following)
  commentToLikePct: number; // %
  saveAndShareRatePct: number; // % of likes
  viralMultiplier: number; // avgViews / followers
  authenticityIndex: number; // 0-100 transparent heuristic
  tierKey: 'nano' | 'micro' | 'mid' | 'macro' | 'mega';
  estimatedPostValueUsd: number;
  estimatedPostValueSar: number;
  monthlyReachEstimate: number;
  diagnostics: DiagnosticPillar[];
  formatStats: Array<{
    format: PostFormat;
    count: number;
    avgViews: number;
    avgEngagementRate: number;
  }>;
}
