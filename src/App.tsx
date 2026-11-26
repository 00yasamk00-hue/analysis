import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  GitCompare,
  Languages,
  ListFilter,
  Menu,
  Moon,
  Plus,
  RotateCcw,
  Search,
  Sliders,
  Sun,
  X,
} from 'lucide-react';
import { AccountProfile, AppView, Locale, PostRecord } from './types/account';
import { SEED_ACCOUNTS } from './data/seedAccounts';
import { COPY, PLATFORM_META } from './data/i18n';
import { computeAccountMetrics, formatCompactNumber } from './utils/analytics';
import { Avatar } from './components/Avatar';
import { OverviewView } from './components/OverviewView';
import { PostsLedgerView } from './components/PostsLedgerView';
import { CompareView } from './components/CompareView';
import { SimulatorView } from './components/SimulatorView';
import { AddAccountModal } from './components/AddAccountModal';
import { CommandPalette } from './components/CommandPalette';

const STORAGE_KEY_ACCOUNTS = 'nabdh_studio_accounts_v1';
const STORAGE_KEY_THEME = 'nabdh_studio_theme_v1';
const STORAGE_KEY_LOCALE = 'nabdh_studio_locale_v1';

function loadInitialAccounts(): AccountProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACCOUNTS);
    if (!raw) return SEED_ACCOUNTS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    // fallback to seed
  }
  return SEED_ACCOUNTS;
}

export default function App() {
  const [accounts, setAccounts] = useState<AccountProfile[]>(loadInitialAccounts);
  const [activeAccountId, setActiveAccountId] = useState<string>(() => {
    const init = loadInitialAccounts();
    return init[0]?.id ?? SEED_ACCOUNTS[0].id;
  });
  const [activeView, setActiveView] = useState<AppView>('overview');
  const [locale, setLocale] = useState<Locale>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_LOCALE);
    return saved === 'en' ? 'en' : 'ar';
  });
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_THEME);
    return saved !== 'light';
  });
  const [showFormulas, setShowFormulas] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const t = COPY[locale];

  // Sync HTML attributes for dark mode & RTL/LTR
  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle('dark', isDark);
    localStorage.setItem(STORAGE_KEY_THEME, isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    const html = document.documentElement;
    html.lang = locale;
    html.dir = locale === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem(STORAGE_KEY_LOCALE, locale);
  }, [locale]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
    } catch {
      // ignore storage quota errors
    }
  }, [accounts]);

  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const notify = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3000);
  };

  const activeAccount = useMemo(() => {
    return accounts.find((a) => a.id === activeAccountId) ?? accounts[0];
  }, [accounts, activeAccountId]);

  const activeMetrics = useMemo(
    () => computeAccountMetrics(activeAccount),
    [activeAccount]
  );

  const handleCreateAccounts = (newItems: AccountProfile[]) => {
    setAccounts((prev) => [...newItems, ...prev]);
    if (newItems[0]) {
      setActiveAccountId(newItems[0].id);
      setActiveView('overview');
      notify(
        locale === 'ar'
          ? `تمت إضافة ${newItems.length === 1 ? newItems[0].handle : `${newItems.length} حسابات`} بنجاح.`
          : `Added ${newItems.length === 1 ? newItems[0].handle : `${newItems.length} accounts`}.`
      );
    }
  };

  const handleUpdateAccount = (updated: AccountProfile) => {
    setAccounts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  };

  const handleDeleteAccount = (id: string) => {
    if (accounts.length <= 1) return;
    const remaining = accounts.filter((a) => a.id !== id);
    setAccounts(remaining);
    if (activeAccountId === id && remaining[0]) {
      setActiveAccountId(remaining[0].id);
    }
    notify(locale === 'ar' ? 'تم حذف الحساب من مساحة العمل.' : 'Account removed from workspace.');
  };

  const handleAddPost = (post: PostRecord) => {
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === activeAccount.id
          ? { ...a, posts: [post, ...a.posts], totalPosts: a.totalPosts + 1 }
          : a
      )
    );
  };

  const handleDeletePost = (postId: string) => {
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === activeAccount.id
          ? { ...a, posts: a.posts.filter((p) => p.id !== postId) }
          : a
      )
    );
    notify(locale === 'ar' ? 'تم حذف المنشور وتحديث الأرقام.' : 'Post deleted.');
  };

  const handleResetDefaults = () => {
    setAccounts(SEED_ACCOUNTS);
    setActiveAccountId(SEED_ACCOUNTS[0].id);
    setActiveView('overview');
    notify(locale === 'ar' ? 'تمت استعادة الحسابات الافتراضية.' : 'Restored default workspace.');
  };

  const navItems: Array<{ id: AppView; label: string; icon: typeof BarChart3 }> = [
    { id: 'overview', label: t.navOverview, icon: BarChart3 },
    { id: 'posts', label: t.navPosts, icon: ListFilter },
    { id: 'compare', label: t.navCompare, icon: GitCompare },
    { id: 'simulator', label: t.navSimulator, icon: Sliders },
  ];

  const activeViewLabel =
    navItems.find((n) => n.id === activeView)?.label ?? t.navOverview;

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand Wordmark */}
      <div className="h-14 px-5 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/90 shrink-0">
        <button
          type="button"
          onClick={() => {
            setActiveView('overview');
            setMobileMenuOpen(false);
          }}
          className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50 whitespace-nowrap shrink-0 cursor-pointer"
        >
          {t.brand}
        </button>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
          aria-label="Close sidebar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Command Trigger */}
      <div className="px-3.5 pt-3.5">
        <button
          type="button"
          onClick={() => {
            setMobileMenuOpen(false);
            setIsCommandOpen(true);
          }}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0B0D11] text-xs text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{t.quickSearch}</span>
          </span>
          <kbd className="font-mono text-[10px] border border-zinc-200 dark:border-zinc-700 rounded px-1.5 py-0.5 shrink-0">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Primary Navigation */}
      <nav className="px-3 pt-4 space-y-0.5" aria-label="Workspace navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveView(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-zinc-900 text-white dark:bg-zinc-800/90 dark:text-zinc-50'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Tracked Accounts List */}
      <div className="mt-6 px-3 flex-1 overflow-y-auto min-h-0">
        <div className="px-2 mb-2 flex items-center justify-between">
          <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            {t.savedAccounts} ({accounts.length})
          </span>
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              setIsAddModalOpen(true);
            }}
            aria-label={t.analyzeNewAccount}
            className="p-1 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-1">
          {accounts.map((acc) => {
            const isSelected = acc.id === activeAccount.id;
            const name = locale === 'ar' ? acc.displayName : acc.displayNameEn;
            return (
              <button
                key={acc.id}
                type="button"
                onClick={() => {
                  setActiveAccountId(acc.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-start transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500/10 text-zinc-900 dark:text-zinc-50'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/45'
                }`}
              >
                <Avatar src={acc.avatarUrl} name={name} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium truncate">{name}</div>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-500 dark:text-zinc-400 truncate">
                    <span>{PLATFORM_META[acc.platform].short}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{formatCompactNumber(acc.followers)}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Workspace Utility Controls */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800/90 space-y-1 shrink-0">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setIsDark((d) => !d)}
            className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors whitespace-nowrap cursor-pointer"
          >
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            <span>{isDark ? (locale === 'ar' ? 'فاتح' : 'Light') : locale === 'ar' ? 'داكن' : 'Dark'}</span>
          </button>

          <button
            type="button"
            onClick={() => setLocale((l) => (l === 'ar' ? 'en' : 'ar'))}
            className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Languages className="w-3.5 h-3.5" />
            <span className="font-mono">{locale === 'ar' ? 'EN' : 'عربي'}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleResetDefaults}
          className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>{t.resetData}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-[#0B0D11] text-zinc-900 dark:text-zinc-100">
      {/* Desktop Sidebar (256px) */}
      <aside className="hidden lg:block w-64 shrink-0 border-e border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-[#0F1218] sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-black/50 backdrop-blur-xs flex"
          onClick={() => setMobileMenuOpen(false)}
        >
          <aside
            className="w-72 max-w-[85vw] h-full bg-white dark:bg-[#0F1218] border-e border-zinc-200 dark:border-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content Column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Clean 1-Row Top Header Bar (Breadcrumb on start + 1 Primary Action CTA on end) */}
        <header className="h-14 px-4 sm:px-6 border-b border-zinc-200 dark:border-zinc-800/90 bg-white/85 dark:bg-[#0B0D11]/85 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation"
              className="lg:hidden p-2 -ms-2 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap shrink-0">
                {activeViewLabel}
              </span>
              {activeView !== 'compare' && (
                <>
                  <span className="text-zinc-400" aria-hidden="true">/</span>
                  <span
                    className="font-mono text-xs text-zinc-500 dark:text-zinc-400 truncate"
                    dir="ltr"
                  >
                    {activeAccount.handle}
                  </span>
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.analyzeNewAccount}</span>
          </button>
        </header>

        {/* Main Workspace Viewport */}
        <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 py-6">
          {activeView === 'overview' && (
            <OverviewView
              account={activeAccount}
              metrics={activeMetrics}
              locale={locale}
              showFormulas={showFormulas}
              onToggleFormulas={() => setShowFormulas((v) => !v)}
              onUpdateAccount={handleUpdateAccount}
              onDeleteAccount={handleDeleteAccount}
              canDelete={accounts.length > 1}
              onNotify={notify}
            />
          )}

          {activeView === 'posts' && (
            <PostsLedgerView
              account={activeAccount}
              locale={locale}
              onAddPost={handleAddPost}
              onDeletePost={handleDeletePost}
              onNotify={notify}
            />
          )}

          {activeView === 'compare' && (
            <CompareView
              accounts={accounts}
              activeAccountId={activeAccount.id}
              locale={locale}
            />
          )}

          {activeView === 'simulator' && (
            <SimulatorView
              key={activeAccount.id}
              account={activeAccount}
              metrics={activeMetrics}
              locale={locale}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <AddAccountModal
        isOpen={isAddModalOpen}
        locale={locale}
        onClose={() => setIsAddModalOpen(false)}
        onCreateAccounts={handleCreateAccounts}
      />

      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        accounts={accounts}
        locale={locale}
        isDark={isDark}
        showFormulas={showFormulas}
        onSelectAccount={(id) => setActiveAccountId(id)}
        onSelectView={(v) => setActiveView(v)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onToggleTheme={() => setIsDark((d) => !d)}
        onToggleLocale={() => setLocale((l) => (l === 'ar' ? 'en' : 'ar'))}
        onToggleFormulas={() => setShowFormulas((f) => !f)}
      />

      {/* Quiet Toast Feedback */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 end-5 z-50 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#161A22] px-4 py-2.5 text-xs font-medium text-zinc-900 dark:text-zinc-100 shadow-lg"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
