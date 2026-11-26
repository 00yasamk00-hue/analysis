import { useMemo, useState } from 'react';
import { ArrowUpDown, Download, Plus, Search, Trash2, X } from 'lucide-react';
import { AccountProfile, Locale, PostFormat, PostRecord } from '../types/account';
import { COPY, FORMAT_LABELS } from '../data/i18n';
import {
  computePostEngagementRate,
  exportPostsCsv,
  formatCompactNumber,
} from '../utils/analytics';

interface PostsLedgerViewProps {
  account: AccountProfile;
  locale: Locale;
  onAddPost: (post: PostRecord) => void;
  onDeletePost: (postId: string) => void;
  onNotify: (msg: string) => void;
}

type SortField = 'publishedAt' | 'views' | 'likes' | 'er';

export function PostsLedgerView({
  account,
  locale,
  onAddPost,
  onDeletePost,
  onNotify,
}: PostsLedgerViewProps) {
  const t = COPY[locale];
  const [query, setQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState<PostFormat | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortField>('publishedAt');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [showAddForm, setShowAddForm] = useState(false);

  // Add post form fields
  const [title, setTitle] = useState('');
  const [format, setFormat] = useState<PostFormat>('video');
  const [publishedAt, setPublishedAt] = useState('2026-11-26');
  const [views, setViews] = useState('42000');
  const [likes, setLikes] = useState('2150');
  const [comments, setComments] = useState('145');
  const [shares, setShares] = useState('230');
  const [saves, setSaves] = useState('390');

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  };

  const filteredPosts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return account.posts
      .filter((p) => {
        if (formatFilter !== 'all' && p.format !== formatFilter) return false;
        if (q && !p.title.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortBy === 'publishedAt') {
          cmp = a.publishedAt.localeCompare(b.publishedAt);
        } else if (sortBy === 'views') {
          cmp = a.views - b.views;
        } else if (sortBy === 'likes') {
          cmp = a.likes - b.likes;
        } else {
          cmp =
            computePostEngagementRate(a, account.followers) -
            computePostEngagementRate(b, account.followers);
        }
        return sortDir === 'desc' ? -cmp : cmp;
      });
  }, [account.posts, account.followers, query, formatFilter, sortBy, sortDir]);

  const handleSubmitPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const newPost: PostRecord = {
      id: `post_${Date.now()}`,
      title: title.trim(),
      publishedAt: publishedAt || new Date().toISOString().slice(0, 10),
      format,
      views: Math.max(1, Number(views) || 1000),
      likes: Math.max(0, Number(likes) || 0),
      comments: Math.max(0, Number(comments) || 0),
      shares: Math.max(0, Number(shares) || 0),
      saves: Math.max(0, Number(saves) || 0),
    };
    onAddPost(newPost);
    setTitle('');
    setShowAddForm(false);
    onNotify(
      locale === 'ar'
        ? 'تمت إضافة المنشور وتحديث متوسطات الحساب تلقائياً.'
        : 'Post logged and account averages recalculated.'
    );
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-[#12151C] p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {t.postsLedgerTitle}
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {locale === 'ar'
                ? 'كل منشور يتم تسجيله هنا ينعكس فوراً على معدل التفاعل ومتوسط المشاهدات وتوزيع الصيغ.'
                : 'Every post logged here recalculates live engagement rate, views, and format breakdown.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                exportPostsCsv(account);
                onNotify(locale === 'ar' ? 'تم تنزيل جدول المنشورات بصيغة CSV.' : 'Downloaded posts CSV.');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              {t.exportCsv}
            </button>

            <button
              type="button"
              onClick={() => setShowAddForm((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {showAddForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {showAddForm ? t.cancel : t.logNewPost}
            </button>
          </div>
        </div>

        {/* Inline Log Post Form */}
        {showAddForm && (
          <form
            onSubmit={handleSubmitPost}
            className="mt-5 pt-5 border-t border-zinc-200 dark:border-zinc-800/90 space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <label className="md:col-span-6 block">
                <span className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                  {t.colTitle}
                </span>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    locale === 'ar'
                      ? 'مثال: شرح عملي لتسريع استعلامات قواعد البيانات'
                      : 'e.g. Deep dive into database indexing performance'
                  }
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-[#0B0D11] px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </label>

              <label className="md:col-span-3 block">
                <span className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                  {t.colFormat}
                </span>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as PostFormat)}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-[#0B0D11] px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  {(['video', 'carousel', 'thread', 'image'] as PostFormat[]).map((f) => (
                    <option key={f} value={f}>
                      {locale === 'ar' ? FORMAT_LABELS[f].ar : FORMAT_LABELS[f].en}
                    </option>
                  ))}
                </select>
              </label>

              <label className="md:col-span-3 block">
                <span className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                  {t.colDate}
                </span>
                <input
                  type="date"
                  value={publishedAt}
                  onChange={(e) => setPublishedAt(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-[#0B0D11] px-3 py-2 text-sm font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: t.colViews, val: views, set: setViews },
                { label: t.colLikes, val: likes, set: setLikes },
                { label: t.colComments, val: comments, set: setComments },
                { label: locale === 'ar' ? 'المشاركات' : 'Shares', val: shares, set: setShares },
                { label: locale === 'ar' ? 'الحفظ' : 'Saves', val: saves, set: setSaves },
              ].map((field) => (
                <label key={field.label} className="block">
                  <span className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                    {field.label}
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={field.val}
                    onChange={(e) => field.set(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-[#0B0D11] px-3 py-2 text-sm font-mono tabular-nums text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3.5 py-2 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
              >
                {t.logNewPost}
              </button>
            </div>
          </form>
        )}

        {/* Filter & Search Bar */}
        <div className="mt-5 pt-4 border-t border-zinc-200 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-zinc-400 absolute top-1/2 -translate-y-1/2 start-3 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.searchPostsPlaceholder}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0B0D11] ps-9 pe-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/35"
            />
          </div>

          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-zinc-100 dark:bg-[#0B0D11] border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
            {(['all', 'video', 'carousel', 'thread', 'image'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormatFilter(f)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  formatFilter === f
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                {f === 'all'
                  ? t.allFormats
                  : locale === 'ar'
                    ? FORMAT_LABELS[f].ar
                    : FORMAT_LABELS[f].en}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* High-Density Data Table */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-[#12151C] overflow-hidden">
        {filteredPosts.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{t.noPostsMatch}</p>
            {account.posts.length === 0 && (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {t.logNewPost}
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50/70 dark:bg-[#0E1117]">
                  <th className="py-3 px-4 text-start min-w-[260px]">{t.colTitle}</th>
                  <th className="py-3 px-3 text-start whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => toggleSort('publishedAt')}
                      className="inline-flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
                    >
                      {t.colDate}
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-3 text-start whitespace-nowrap">{t.colFormat}</th>
                  <th className="py-3 px-3 text-end whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => toggleSort('views')}
                      className="inline-flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
                    >
                      {t.colViews}
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-3 text-end whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => toggleSort('likes')}
                      className="inline-flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
                    >
                      {t.colLikes}
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-3 text-end whitespace-nowrap">{t.colComments}</th>
                  <th className="py-3 px-3 text-end whitespace-nowrap">{t.colSharesSaves}</th>
                  <th className="py-3 px-4 text-end whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => toggleSort('er')}
                      className="inline-flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
                    >
                      {t.colEr}
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-3 w-10" aria-label="Actions" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/70 text-xs">
                {filteredPosts.map((post) => {
                  const er = computePostEngagementRate(post, account.followers);
                  return (
                    <tr
                      key={post.id}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/35 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium text-zinc-900 dark:text-zinc-100 max-w-md">
                        <div className="truncate" title={post.title}>
                          {post.title}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                        {post.publishedAt}
                      </td>
                      <td className="py-3 px-3 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                        {locale === 'ar'
                          ? FORMAT_LABELS[post.format].ar
                          : FORMAT_LABELS[post.format].en}
                      </td>
                      <td className="py-3 px-3 text-end font-mono tabular-nums text-zinc-800 dark:text-zinc-200 whitespace-nowrap">
                        {formatCompactNumber(post.views)}
                      </td>
                      <td className="py-3 px-3 text-end font-mono tabular-nums text-zinc-800 dark:text-zinc-200 whitespace-nowrap">
                        {formatCompactNumber(post.likes)}
                      </td>
                      <td className="py-3 px-3 text-end font-mono tabular-nums text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                        {post.comments.toLocaleString('en-US')}
                      </td>
                      <td className="py-3 px-3 text-end font-mono tabular-nums text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                        {formatCompactNumber(post.shares)} / {formatCompactNumber(post.saves)}
                      </td>
                      <td className="py-3 px-4 text-end font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {er.toFixed(2)}%
                      </td>
                      <td className="py-3 px-3 text-end">
                        <button
                          type="button"
                          onClick={() => onDeletePost(post.id)}
                          aria-label={locale === 'ar' ? 'حذف المنشور' : 'Delete post'}
                          className="p-1.5 rounded-md text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
