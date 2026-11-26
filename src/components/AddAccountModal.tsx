import { useState } from 'react';
import { FileCode, Plus, X } from 'lucide-react';
import { AccountProfile, Locale, Platform } from '../types/account';
import { COPY, PLATFORM_META } from '../data/i18n';
import {
  generateSyntheticHistory,
  getDefaultCpm,
  parseImportedAccounts,
} from '../utils/analytics';

interface AddAccountModalProps {
  isOpen: boolean;
  locale: Locale;
  onClose: () => void;
  onCreateAccounts: (accounts: AccountProfile[]) => void;
}

const SAMPLE_JSON = `[
  {
    "handle": "@sara_ai_notes",
    "displayName": "سارة العتيبي",
    "platform": "x",
    "niche": "الذكاء الاصطناعي والإنتاجية",
    "followers": 62400,
    "following": 290,
    "postsPerWeek": 8,
    "monthlyGrowthPct": 9.4,
    "avgViews": 38500,
    "avgLikes": 1980,
    "avgComments": 146,
    "avgShares": 290,
    "avgSaves": 440
  }
]`;

const SAMPLE_CSV = `handle,displayName,platform,niche,followers,following,postsPerWeek,monthlyGrowthPct,avgViews,avgLikes,avgComments,avgShares,avgSaves
@khalid_saas,خالد الدوسري,youtube,ريادة الأعمال التقنية,112000,145,2,7.8,68400,4120,310,540,890
@noura_studio,استوديو نورة,instagram,تصميم داخلي ومعماري,54800,410,5,5.2,31200,2350,128,260,720`;

export function AddAccountModal({
  isOpen,
  locale,
  onClose,
  onCreateAccounts,
}: AddAccountModalProps) {
  const t = COPY[locale];
  const [tab, setTab] = useState<'manual' | 'import'>('manual');

  // Manual form state
  const [platform, setPlatform] = useState<Platform>('x');
  const [handle, setHandle] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [niche, setNiche] = useState('');
  const [followers, setFollowers] = useState('45000');
  const [following, setFollowing] = useState('340');
  const [postsPerWeek, setPostsPerWeek] = useState('5');
  const [monthlyGrowthPct, setMonthlyGrowthPct] = useState('6.2');
  const [avgViews, setAvgViews] = useState('24000');
  const [avgLikes, setAvgLikes] = useState('1450');
  const [avgComments, setAvgComments] = useState('95');
  const [avgShares, setAvgShares] = useState('160');
  const [avgSaves, setAvgSaves] = useState('240');

  // Import state
  const [rawImport, setRawImport] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const numFollowers = Math.max(1, Number(followers) || 1);
  const livePreviewEr =
    ((Math.max(0, Number(avgLikes) || 0) +
      Math.max(0, Number(avgComments) || 0) +
      Math.max(0, Number(avgShares) || 0) +
      Math.max(0, Number(avgSaves) || 0)) /
      numFollowers) *
    100;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanHandle = handle.trim() || '@new_account';
    const normalizedHandle = cleanHandle.startsWith('@') ? cleanHandle : `@${cleanHandle}`;
    const name = displayName.trim() || normalizedHandle.replace(/^@/, '');
    const fCount = Math.max(10, Number(followers) || 10000);
    const flwing = Math.max(1, Number(following) || 200);
    const vCount = Math.max(10, Number(avgViews) || Math.round(fCount * 0.4));
    const lCount = Math.max(0, Number(avgLikes) || 0);
    const cCount = Math.max(0, Number(avgComments) || 0);
    const shCount = Math.max(0, Number(avgShares) || 0);
    const svCount = Math.max(0, Number(avgSaves) || 0);
    const growth = Number(monthlyGrowthPct) || 0;
    const cadence = Math.max(1, Number(postsPerWeek) || 4);

    const newAccount: AccountProfile = {
      id: `acc_${Date.now()}`,
      handle: normalizedHandle,
      displayName: name,
      displayNameEn: name,
      platform,
      niche: niche.trim() || (locale === 'ar' ? 'محتوى رقمي وتقني' : 'Digital Content'),
      nicheEn: niche.trim() || 'Digital Content',
      bio:
        locale === 'ar'
          ? `تحليل مخصص لحساب ${name} على منصة ${PLATFORM_META[platform].nameAr}.`
          : `Custom analytics profile for ${name} on ${PLATFORM_META[platform].nameEn}.`,
      bioEn: `Custom analytics profile for ${name} on ${PLATFORM_META[platform].nameEn}.`,
      verified: false,
      followers: fCount,
      following: flwing,
      totalPosts: cadence * 24,
      postsPerWeek: cadence,
      monthlyGrowthPct: growth,
      avgViews: vCount,
      avgLikes: lCount,
      avgComments: cCount,
      avgShares: shCount,
      avgSaves: svCount,
      cpmUsd: getDefaultCpm(platform),
      posts: [],
      history: generateSyntheticHistory(fCount, growth, livePreviewEr, vCount, 90),
      createdAt: new Date().toISOString().slice(0, 10),
    };

    onCreateAccounts([newAccount]);
    setHandle('');
    setDisplayName('');
    setNiche('');
    onClose();
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { accounts, error } = parseImportedAccounts(rawImport);
    if (error || accounts.length === 0) {
      setImportError(error ?? (locale === 'ar' ? 'تعذر قراءة البيانات.' : 'Unable to parse input.'));
      return;
    }
    setImportError(null);
    onCreateAccounts(accounts);
    setRawImport('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-account-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#12151C] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
          <h2 id="add-account-title" className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            {t.modalAddTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.cancel}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="px-5 pt-4 flex items-center gap-1">
          <div className="inline-flex items-center p-0.5 rounded-lg bg-zinc-100 dark:bg-[#0B0D11] border border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setTab('manual')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                tab === 'manual'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              {t.tabManual}
            </button>
            <button
              type="button"
              onClick={() => setTab('import')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                tab === 'import'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              {t.tabImport}
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto">
          {tab === 'manual' ? (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="block">
                  <span className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                    {locale === 'ar' ? 'المنصة' : 'Platform'}
                  </span>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value as Platform)}
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-[#0B0D11] px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  >
                    {(['x', 'instagram', 'tiktok', 'youtube', 'linkedin'] as Platform[]).map(
                      (p) => (
                        <option key={p} value={p}>
                          {locale === 'ar' ? PLATFORM_META[p].nameAr : PLATFORM_META[p].nameEn}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label className="block">
                  <span className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                    {locale === 'ar' ? 'اسم المستخدم (Handle)' : 'Account Handle'}
                  </span>
                  <input
                    type="text"
                    required
                    dir="ltr"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="@username"
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-[#0B0D11] px-3 py-2 text-sm font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </label>

                <label className="block">
                  <span className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                    {locale === 'ar' ? 'الاسم المعروض' : 'Display Name'}
                  </span>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={locale === 'ar' ? 'مثال: فيصل التقني' : 'e.g. Faisal Tech'}
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-[#0B0D11] px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </label>
              </div>

              <label className="block">
                <span className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                  {locale === 'ar' ? 'المجال / التخصص' : 'Niche / Category'}
                </span>
                <input
                  type="text"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder={
                    locale === 'ar'
                      ? 'برمجة، تصميم، تجارة إلكترونية، استثمار...'
                      : 'Software, Design, E-commerce, Finance...'
                  }
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-[#0B0D11] px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: t.kpiFollowers, val: followers, set: setFollowers },
                  {
                    label: locale === 'ar' ? 'المتابَعون' : 'Following',
                    val: following,
                    set: setFollowing,
                  },
                  {
                    label: locale === 'ar' ? 'منشورات / أسبوع' : 'Posts / Week',
                    val: postsPerWeek,
                    set: setPostsPerWeek,
                  },
                  {
                    label: locale === 'ar' ? 'النمو الشهري %' : 'Monthly Growth %',
                    val: monthlyGrowthPct,
                    set: setMonthlyGrowthPct,
                  },
                ].map((f) => (
                  <label key={f.label} className="block">
                    <span className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                      {f.label}
                    </span>
                    <input
                      type="number"
                      step="any"
                      value={f.val}
                      onChange={(e) => f.set(e.target.value)}
                      className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-[#0B0D11] px-3 py-2 text-sm font-mono tabular-nums text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </label>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { label: t.colViews, val: avgViews, set: setAvgViews },
                  { label: t.colLikes, val: avgLikes, set: setAvgLikes },
                  { label: t.colComments, val: avgComments, set: setAvgComments },
                  {
                    label: locale === 'ar' ? 'مشاركات' : 'Shares',
                    val: avgShares,
                    set: setAvgShares,
                  },
                  { label: locale === 'ar' ? 'حفظ' : 'Saves', val: avgSaves, set: setAvgSaves },
                ].map((f) => (
                  <label key={f.label} className="block">
                    <span className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                      {f.label}
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={f.val}
                      onChange={(e) => f.set(e.target.value)}
                      className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-[#0B0D11] px-3 py-2 text-sm font-mono tabular-nums text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </label>
                ))}
              </div>

              {/* Instant Live Formula Preview */}
              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {locale === 'ar' ? 'معدل التفاعل المبدئي (ERF): ' : 'Live preview ERF: '}
                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {livePreviewEr.toFixed(2)}%
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-2 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
                  >
                    {t.createAccount}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleImportSubmit} className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {locale === 'ar'
                    ? 'الصق بيانات حساب أو عدة حسابات بصيغة JSON أو CSV وسيتم تحليلها فوراً.'
                    : 'Paste one or more account records as JSON or CSV to parse and audit instantly.'}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRawImport(SAMPLE_JSON);
                      setImportError(null);
                    }}
                    className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    {t.loadSampleJson}
                  </button>
                  <span className="text-zinc-400" aria-hidden="true">·</span>
                  <button
                    type="button"
                    onClick={() => {
                      setRawImport(SAMPLE_CSV);
                      setImportError(null);
                    }}
                    className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                  >
                    {t.loadSampleCsv}
                  </button>
                </div>
              </div>

              <textarea
                dir="ltr"
                rows={10}
                value={rawImport}
                onChange={(e) => {
                  setRawImport(e.target.value);
                  setImportError(null);
                }}
                placeholder={SAMPLE_JSON}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-[#0B0D11] p-3 font-mono text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />

              {importError && (
                <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                  {importError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
                >
                  {t.importNow}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
