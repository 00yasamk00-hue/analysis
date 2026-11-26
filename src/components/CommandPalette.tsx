import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  Code2,
  GitCompare,
  Languages,
  ListFilter,
  Moon,
  Plus,
  Search,
  Sliders,
  Sun,
} from 'lucide-react';
import { AccountProfile, AppView, Locale } from '../types/account';
import { COPY, PLATFORM_META } from '../data/i18n';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: AccountProfile[];
  locale: Locale;
  isDark: boolean;
  showFormulas: boolean;
  onSelectAccount: (id: string) => void;
  onSelectView: (view: AppView) => void;
  onOpenAddModal: () => void;
  onToggleTheme: () => void;
  onToggleLocale: () => void;
  onToggleFormulas: () => void;
}

interface CommandItem {
  id: string;
  label: string;
  meta: string;
  icon: typeof Search;
  action: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  accounts,
  locale,
  isDark,
  showFormulas,
  onSelectAccount,
  onSelectView,
  onOpenAddModal,
  onToggleTheme,
  onToggleLocale,
  onToggleFormulas,
}: CommandPaletteProps) {
  const t = COPY[locale];
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo<CommandItem[]>(() => {
    const accountCommands: CommandItem[] = accounts.map((acc) => ({
      id: `acc-${acc.id}`,
      label: locale === 'ar' ? acc.displayName : acc.displayNameEn,
      meta: `${acc.handle} · ${PLATFORM_META[acc.platform].short}`,
      icon: BarChart3,
      action: () => {
        onSelectAccount(acc.id);
        onSelectView('overview');
        onClose();
      },
    }));

    const actionCommands: CommandItem[] = [
      {
        id: 'act-add',
        label: t.analyzeNewAccount,
        meta: locale === 'ar' ? 'إضافة / استيراد' : 'New / Import',
        icon: Plus,
        action: () => {
          onClose();
          onOpenAddModal();
        },
      },
      {
        id: 'nav-overview',
        label: t.navOverview,
        meta: locale === 'ar' ? 'القسم' : 'View',
        icon: BarChart3,
        action: () => {
          onSelectView('overview');
          onClose();
        },
      },
      {
        id: 'nav-posts',
        label: t.navPosts,
        meta: locale === 'ar' ? 'القسم' : 'View',
        icon: ListFilter,
        action: () => {
          onSelectView('posts');
          onClose();
        },
      },
      {
        id: 'nav-compare',
        label: t.navCompare,
        meta: locale === 'ar' ? 'القسم' : 'View',
        icon: GitCompare,
        action: () => {
          onSelectView('compare');
          onClose();
        },
      },
      {
        id: 'nav-sim',
        label: t.navSimulator,
        meta: locale === 'ar' ? 'القسم' : 'View',
        icon: Sliders,
        action: () => {
          onSelectView('simulator');
          onClose();
        },
      },
      {
        id: 'act-formulas',
        label: showFormulas ? t.formulasOn : t.formulasOff,
        meta: 'Math',
        icon: Code2,
        action: () => {
          onToggleFormulas();
          onClose();
        },
      },
      {
        id: 'act-theme',
        label: isDark ? t.themeLight : t.themeDark,
        meta: locale === 'ar' ? 'المظهر' : 'Theme',
        icon: isDark ? Sun : Moon,
        action: () => {
          onToggleTheme();
          onClose();
        },
      },
      {
        id: 'act-lang',
        label: locale === 'ar' ? 'Switch to English (LTR)' : 'التبديل إلى العربية (RTL)',
        meta: 'AR / EN',
        icon: Languages,
        action: () => {
          onToggleLocale();
          onClose();
        },
      },
    ];

    const all = [...accountCommands, ...actionCommands];
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (item) =>
        item.label.toLowerCase().includes(q) || item.meta.toLowerCase().includes(q)
    );
  }, [
    accounts,
    locale,
    isDark,
    showFormulas,
    query,
    t,
    onSelectAccount,
    onSelectView,
    onOpenAddModal,
    onToggleTheme,
    onToggleLocale,
    onToggleFormulas,
    onClose,
  ]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((idx) => (items.length ? (idx + 1) % items.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((idx) =>
        items.length ? (idx - 1 + items.length) % items.length : 0
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      items[activeIndex]?.action();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4 bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#12151C] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.commandPlaceholder}
            className="w-full bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
          />
          <kbd className="font-mono text-[10px] text-zinc-400 border border-zinc-200 dark:border-zinc-700 rounded px-1.5 py-0.5 shrink-0">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto py-1.5">
          {items.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-zinc-500">
              {t.noCommandsFound}
            </div>
          ) : (
            items.map((item, idx) => {
              const Icon = item.icon;
              const isActive = idx === activeIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={item.action}
                  className={`w-full px-4 py-2.5 flex items-center justify-between gap-3 text-xs transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500/12 text-zinc-900 dark:text-zinc-50'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span className="truncate font-medium">{item.label}</span>
                  </span>
                  <span className="font-mono text-[11px] text-zinc-400 shrink-0" dir="ltr">
                    {item.meta}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
