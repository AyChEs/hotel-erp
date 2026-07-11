import { useTranslation } from 'react-i18next';

/**
 * Small ES / EN toggle. Renders as two compact text buttons so it fits
 * in either the public nav or the admin sidebar without taking much room.
 */
export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { i18n } = useTranslation();
  const current = (i18n.resolvedLanguage || i18n.language || 'es').slice(0, 2);

  const set = (lng: 'es' | 'en') => {
    if (current === lng) return;
    i18n.changeLanguage(lng);
  };

  return (
    <div
      className={`flex items-center gap-1 rounded-full border border-glaze-200 bg-glaze-50 p-1 text-[11px] font-semibold ${className}`}
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        onClick={() => set('es')}
        aria-pressed={current === 'es'}
        className={
          'rounded-full px-3 py-1 transition-colors ' +
          (current === 'es'
            ? 'bg-teal-950 text-glaze-50'
            : 'text-teal-800 hover:text-teal-950')
        }
      >
        ES
      </button>
      <button
        type="button"
        onClick={() => set('en')}
        aria-pressed={current === 'en'}
        className={
          'rounded-full px-3 py-1 transition-colors ' +
          (current === 'en'
            ? 'bg-teal-950 text-glaze-50'
            : 'text-teal-800 hover:text-teal-950')
        }
      >
        EN
      </button>
    </div>
  );
}
