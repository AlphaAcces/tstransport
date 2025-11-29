import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Command, Activity, ArrowRight, Shield, Sparkles, Settings2, X, Power, ChevronDown } from 'lucide-react';
import { Subject, View } from '../../types';
import { NAV_ITEMS } from '../../config/navigation';
import { LocaleSwitcher } from '../../domains/settings/components/LocaleSwitcher';
import { CurrencySwitcher } from '../../domains/settings/components/CurrencySwitcher';
import { ThemeToggle } from '../Shared/ThemeToggle';
import { AiCommandPanel } from '../Dashboard/AiCommandPanel';
import { CountrySelector } from '../../domains/settings/components/CountrySelector';
import { useUserSettings } from '../../domains/settings/hooks/useUserSettings';

const FOCUSABLE_SELECTORS = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
const QUICK_LINKS: View[] = ['dashboard', 'executive', 'person', 'companies', 'risk', 'timeline', 'actions', 'vault', 'accessRequests'];

interface CommandDeckProps {
  activeSubject: Subject;
  currentView: View;
  onNavigate: (view: View, options?: { fromDashboard?: boolean }) => void;
  user?: { id: string; role: 'admin' | 'user' } | null;
  onLogout?: () => void;
  topOffset?: number;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onToggle?: () => void;
}

export const CommandDeck: React.FC<CommandDeckProps> = ({
  activeSubject,
  currentView,
  onNavigate,
  user,
  onLogout,
  topOffset = 96,
  isOpen,
  onOpen,
  onClose,
  onToggle,
}) => {
  const { t } = useTranslation();
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(min-width: 1024px)').matches;
  });
  const [isAiExpanded, setIsAiExpanded] = useState(true);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const { country, currency } = useUserSettings();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const handleChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches);

    setIsDesktop(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const closeDeck = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      document.body.style.removeProperty('overflow');
      return;
    }

    previousFocusRef.current = document.activeElement as HTMLElement;
    const focusable = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS);
    focusable?.[0]?.focus();
    document.body.style.setProperty('overflow', 'hidden');

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeDeck();
        return;
      }

      if (event.key === 'Tab' && panelRef.current) {
        const elements = panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS);
        if (elements.length === 0) return;

        const firstEl = elements[0];
        const lastEl = elements[elements.length - 1];
        const activeElement = document.activeElement as HTMLElement;

        if (event.shiftKey) {
          if (activeElement === firstEl || panelRef.current === activeElement) {
            event.preventDefault();
            lastEl.focus();
          }
        } else if (activeElement === lastEl) {
          event.preventDefault();
          firstEl.focus();
        }
      }
    };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.removeProperty('overflow');
        previousFocusRef.current?.focus();
      };
    }, [closeDeck, isOpen]);

  const handleNavigate = (view: View) => {
    onNavigate(view);
    closeDeck();
  };

  const visibleQuickLinks = useMemo(() => {
    return NAV_ITEMS.filter((item) => QUICK_LINKS.includes(item.id as View) && item.showFor.includes(activeSubject));
  }, [activeSubject]);

  const mobileTop = Math.max(topOffset + 16, 80);
  const triggerStyle = isDesktop ? undefined : { top: `${mobileTop}px` };
  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else if (isOpen) {
      onClose();
    } else {
      onOpen();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleToggle}
        style={triggerStyle}
        aria-expanded={isOpen}
        aria-controls="command-deck-panel"
        className="command-deck-trigger fixed right-4 lg:right-6 z-30 flex items-center gap-2 rounded-full bg-[var(--color-gold)] text-[var(--color-background)] shadow-[var(--shadow-gold)] font-semibold tracking-wide transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold-hover)] lg:top-1/2 lg:-translate-y-1/2"
      >
        <Command className="w-5 h-5 command-deck-trigger__icon" />
        <span className="command-deck-trigger__label--full">{t('commandDeck.cta', { defaultValue: 'Command Deck' })}</span>
        <span className="command-deck-trigger__label--short">{t('commandDeck.shortCta', { defaultValue: 'Deck' })}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-[var(--color-overlay)]/70 backdrop-blur-sm z-40"
            onClick={closeDeck}
            aria-hidden="true"
          />
          <aside
            ref={panelRef}
            id="command-deck-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="command-deck-title"
            className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-[var(--color-surface)] border-l border-[var(--color-border)] shadow-[var(--shadow-gold-strong)] flex flex-col"
          >
            <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-text-muted)]">{t('commandDeck.label', { defaultValue: 'Intel Controls' })}</p>
                <h2 id="command-deck-title" className="text-xl font-semibold text-[var(--color-text)] flex items-center gap-2">
                  <Command className="w-5 h-5 text-[var(--color-gold)]" />
                  {t('commandDeck.title', { defaultValue: 'Command Deck' })}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeDeck}
                className="p-2 rounded-full hover:bg-[var(--color-surface-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)]"
                aria-label={t('common.close', { defaultValue: 'Close' })}
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            <div className="command-deck-body flex-1 overflow-y-auto px-6 py-6 space-y-6">
              <section>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-text-muted)]">{t('commandDeck.quickRoutes.label', { defaultValue: 'Quick Routes' })}</p>
                    <h3 className="text-sm font-semibold text-[var(--color-text)]">{t('commandDeck.quickRoutes.subtitle', { defaultValue: 'Navigate anywhere instantly' })}</h3>
                  </div>
                  <Sparkles className="w-4 h-4 text-[var(--color-gold)]" />
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {visibleQuickLinks.map((item) => {
                    const isActive = currentView === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleNavigate(item.id as View)}
                        className={`flex items-center justify-between rounded-xl border px-3 py-3 text-left transition-all focus:outline-none focus-visible:ring-2 ${
                          isActive
                            ? 'bg-[var(--color-gold)]/10 border-[var(--color-gold)] text-[var(--color-text)] shadow-[var(--shadow-gold)]'
                            : 'bg-[var(--color-surface-hover)]/30 border-[var(--color-border)] hover:border-[var(--color-gold)]/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-[var(--color-gold)]">{item.icon}</span>
                          <div>
                            <p className="text-sm font-semibold">{item.i18nKey ? t(item.i18nKey) : item.label}</p>
                            <p className="text-xs text-[var(--color-text-muted)]">{isActive ? t('commandDeck.status.current', { defaultValue: 'Active view' }) : t('commandDeck.status.navigate', { defaultValue: 'Jump to view' })}</p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[var(--color-text-muted)]" />
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-text-muted)]">{t('commandDeck.controls.label', { defaultValue: 'Global Controls' })}</p>
                    <h3 className="text-sm font-semibold text-[var(--color-text)]">{t('commandDeck.controls.subtitle', { defaultValue: 'Adjust operators settings' })}</h3>
                  </div>
                  <Settings2 className="w-4 h-4 text-[var(--color-gold)]" />
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4">
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-hover)]/40 p-4 space-y-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--color-text-muted)]">{t('settings.language.label', { defaultValue: 'Language' })}</p>
                    <LocaleSwitcher variant="condensed" />
                  </div>
                  {country && currency && (
                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-hover)]/40 p-4 space-y-4">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--color-text-muted)]">{t('commandDeck.marketCurrency.label', { defaultValue: 'Market & Currency' })}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{t('commandDeck.marketCurrency.description', { defaultValue: 'Jurisdiction context and display currency' })}</p>
                      </div>
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <CountrySelector variant="condensed" />
                        <CurrencySwitcher variant="condensed" />
                      </div>
                    </div>
                  )}
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-hover)]/40 p-4 space-y-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--color-text-muted)]">{t('theme.title', { defaultValue: 'Theme' })}</p>
                    <ThemeToggle variant="dropdown" showLabel />
                  </div>
                </div>
              </section>

              <section className="command-deck-ai-section">
                <button
                  type="button"
                  onClick={() => setIsAiExpanded(!isAiExpanded)}
                  className="command-deck-ai-toggle w-full flex items-center justify-between lg:cursor-default"
                  aria-expanded={isAiExpanded}
                >
                  <div className="flex items-center gap-3">
                    <Activity className="w-4 h-4 text-[var(--color-gold)]" />
                    <div className="text-left">
                      <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-text-muted)]">{t('commandDeck.ai.label', { defaultValue: 'AI Command' })}</p>
                      <h3 className="text-sm font-semibold text-[var(--color-text)]">{t('commandDeck.ai.subtitle', { defaultValue: 'Send directives and review log' })}</h3>
                    </div>
                  </div>
                  <ChevronDown className={`command-deck-ai-chevron w-4 h-4 text-[var(--color-text-muted)] transition-transform ${isAiExpanded ? 'rotate-180' : ''}`} />
                </button>
                <div className={`command-deck-ai-content mt-4 ${!isAiExpanded ? 'command-deck-ai-content--collapsed' : ''}`}>
                  <AiCommandPanel className="shadow-none border border-[var(--color-border)]" maxHistoryVisible={4} />
                </div>
              </section>

              <section>
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-hover)]/40 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-text-muted)]">{t('commandDeck.session.label', { defaultValue: 'Session' })}</p>
                    <p className="text-base font-semibold text-[var(--color-text)]">{user?.id ?? t('auth.guest', { defaultValue: 'Guest' })}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{user?.role ? t(`auth.roles.${user.role}`, { defaultValue: user.role }) : t('auth.roles.user', { defaultValue: 'User' })}</p>
                  </div>
                  {onLogout && (
                    <button
                      type="button"
                      onClick={() => {
                        onLogout();
                        closeDeck();
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-[var(--color-danger)]/40 px-4 py-2 text-sm font-semibold text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-danger)]"
                    >
                      <Power className="w-4 h-4" />
                      {t('auth.logout', { defaultValue: 'Log out' })}
                    </button>
                  )}
                </div>
              </section>
            </div>

            <footer className="px-6 py-4 border-t border-[var(--color-border)] text-xs text-[var(--color-text-muted)] flex items-center gap-2">
              <Shield className="w-4 h-4 text-[var(--color-gold)]" />
              {t('commandDeck.footer', { defaultValue: 'GreyEYE security perimeter · Changes apply instantly' })}
            </footer>
          </aside>
        </>
      )}
    </>
  );
};

export default CommandDeck;
