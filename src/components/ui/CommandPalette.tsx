/**
 * CommandPalette — ⌘K / Ctrl+K global launcher.
 * - Desktop: centered floating panel (max-w-xl)
 * - Mobile: full bottom Sheet
 * - Commands: role-filtered navigation + quick actions
 * - Keyboard: Up/Down to move, Enter to run, Esc to close
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Command as CommandIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { navigationItems, quickActions } from '../../lib/mobileMenuConfig';
import { Kbd } from './Kbd';
import { cn } from '../../lib/utils';

interface CommandItem {
  id: string;
  label: string;
  group: string;
  href: string;
  icon: typeof navigationItems[number]['icon'];
  color?: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  // Global shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.userAgent);
      const modifier = isMac ? e.metaKey : e.ctrlKey;
      if (modifier && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIdx(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const allCommands = useMemo<CommandItem[]>(() => {
    if (!user?.role) return [];
    const nav: CommandItem[] = navigationItems
      .filter((i) => i.roles.includes(user.role))
      .map((i) => ({
        id: `nav-${i.id}`,
        label: t(i.nameKey),
        group: t('common.navigation'),
        href: i.getHref ? i.getHref(user.role) : i.href,
        icon: i.icon,
        color: i.color,
      }));
    const actions: CommandItem[] = quickActions
      .filter((a) => a.roles.includes(user.role))
      .map((a) => ({
        id: `qa-${a.id}`,
        label: t(a.labelKey),
        group: t('dashboard.quickActions.title'),
        href: a.getHref ? a.getHref(user.role) : (a.href ?? '/dashboard'),
        icon: a.icon,
        color: a.color,
      }));
    return [...nav, ...actions];
  }, [user?.role, t]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allCommands;
    return allCommands.filter((c) => c.label.toLowerCase().includes(q) || c.group.toLowerCase().includes(q));
  }, [allCommands, query]);

  // Reset active index when filter set changes
  useEffect(() => {
    setActiveIdx(0);
  }, [query, allCommands.length]);

  const runCommand = (cmd: CommandItem) => {
    setOpen(false);
    navigate(cmd.href);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = filtered[activeIdx];
      if (cmd) runCommand(cmd);
    }
  };

  // Group display
  const grouped = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    filtered.forEach((c) => {
      const list = map.get(c.group) ?? [];
      list.push(c);
      map.set(c.group, list);
    });
    return Array.from(map.entries());
  }, [filtered]);

  let displayIdx = -1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="cmdk-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 pt-[10vh] md:pt-[15vh]"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={t('common.commandPalette', 'Command palette')}
        >
          <motion.div
            key="cmdk-panel"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-xl bg-[var(--color-surface-1)] border border-[var(--color-border-strong)] rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border-subtle)]">
              <Search className="w-5 h-5 text-[var(--color-ink-muted)] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={t('common.searchPlaceholder')}
                className="flex-1 bg-transparent border-0 outline-none text-[var(--color-ink-primary)] placeholder:text-[var(--color-ink-muted)] text-[15px]"
              />
              <div className="hidden md:flex items-center gap-1">
                <Kbd>Esc</Kbd>
              </div>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto py-2">
              {grouped.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-[var(--color-ink-muted)]">
                  {t('common.noResults', 'No results')}
                </div>
              ) : (
                grouped.map(([groupName, items]) => (
                  <div key={groupName} className="mb-1">
                    <div className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
                      {groupName}
                    </div>
                    {items.map((cmd) => {
                      displayIdx++;
                      const isActive = displayIdx === activeIdx;
                      const Icon = cmd.icon;
                      return (
                        <button
                          key={cmd.id}
                          type="button"
                          onClick={() => runCommand(cmd)}
                          onMouseEnter={() => setActiveIdx(displayIdx)}
                          className={cn(
                            'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                            isActive
                              ? 'bg-[var(--color-surface-2)] text-[var(--color-ink-primary)]'
                              : 'text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-2)]/60'
                          )}
                        >
                          <Icon className={cn('w-4 h-4 shrink-0', cmd.color ?? 'text-[var(--color-ink-muted)]')} />
                          <span className="flex-1 text-sm truncate">{cmd.label}</span>
                          {isActive && (
                            <span className="hidden md:inline-flex items-center gap-1 text-[10px] text-[var(--color-ink-muted)]">
                              <Kbd>↵</Kbd>
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer hint */}
            <div className="px-4 py-2 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-[11px] text-[var(--color-ink-muted)]">
              <span className="inline-flex items-center gap-1.5">
                <CommandIcon className="w-3 h-3" />
                {t('common.commandPalette', 'Command palette')}
              </span>
              <span className="inline-flex items-center gap-1">
                <Kbd>↑</Kbd><Kbd>↓</Kbd>
                <span className="ml-1">{t('common.navigate', 'navigate')}</span>
                <Kbd>↵</Kbd>
                <span className="ml-1">{t('common.select', 'select')}</span>
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default CommandPalette;
