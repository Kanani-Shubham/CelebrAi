import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layers, X } from 'lucide-react';
import { ALL_PAGES } from '../../config/pages';

export function QuickDirectoryDrawer() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open 36 Pages Directory"
        className="fixed bottom-20 right-4 z-40 flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-full shadow-lg transition-transform hover:scale-105"
        style={{
          backgroundColor: 'var(--color-gold, #cda764)',
          color: 'var(--color-tuxedo-black, #171f20)',
          border: '1px solid rgba(255,255,255,0.4)',
        }}
      >
        <Layers size={14} />
        <span>36 Pages</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="36 Pages Navigation Directory"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-end bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full sm:max-w-md max-h-[85vh] bg-[var(--color-card,#202628)] text-[var(--color-bridal-white,#fff)] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-[var(--color-gold,#cda764)]" />
                <h3 className="font-semibold text-sm">36-Page Route Directory</h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close directory"
                className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-3 text-xs text-white/60 bg-white/5 border-b border-white/5">
              Instant one-click access to all 36 evaluation screens across onboarding, planning, and advanced features.
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-white/5">
              {ALL_PAGES.map((page) => {
                const isActive = location.pathname === page.path;
                return (
                  <Link
                    key={page.id}
                    to={page.path}
                    onClick={() => setOpen(false)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                      isActive
                        ? 'bg-[var(--color-gold,#cda764)] text-[var(--color-tuxedo-black,#171f20)] font-semibold'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono text-[10px] opacity-60">#{page.id}</span>
                      <span className="truncate">{page.name}</span>
                    </div>
                    <span className="font-mono text-[10px] opacity-50 shrink-0 ml-2">{page.path}</span>
                  </Link>
                );
              })}
            </div>

            <div className="p-3 border-t border-white/10 text-center">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-full py-1.5 text-xs text-center font-medium text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                Close Directory
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
