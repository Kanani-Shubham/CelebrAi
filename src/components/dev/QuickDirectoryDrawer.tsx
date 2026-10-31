import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layers, X } from 'lucide-react';

export const ALL_PAGES = [
  { id: '01', name: 'Landing Page', path: '/' },
  { id: '02', name: 'Explore Event Types', path: '/explore-events' },
  { id: '03', name: 'Sign Up / Sign In', path: '/signin' },
  { id: '04', name: 'Onboarding Preferences', path: '/onboarding' },
  { id: '05', name: 'Create Event Wizard', path: '/create-event' },
  { id: '06', name: 'AI Plan Preview', path: '/ai-plan-preview' },
  { id: '07', name: 'Home Dashboard', path: '/dashboard' },
  { id: '08', name: 'All Events', path: '/events' },
  { id: '09', name: 'Event Overview', path: '/event-overview' },
  { id: '10', name: 'AI Assistant', path: '/ai' },
  { id: '11', name: 'To-do List', path: '/tasks' },
  { id: '12', name: 'Timeline & Calendar', path: '/timeline' },
  { id: '13', name: 'Budget Dashboard', path: '/budget' },
  { id: '14', name: 'Expense Manager', path: '/expenses' },
  { id: '15', name: 'Guest Management', path: '/guests' },
  { id: '16', name: 'Invitations & RSVP', path: '/invitations' },
  { id: '17', name: 'Vendor Discovery', path: '/vendors' },
  { id: '18', name: 'Vendor Details', path: '/vendors/v-1' },
  { id: '19', name: 'Decor & Theme Studio', path: '/decor' },
  { id: '20', name: 'Invitation & Content Studio', path: '/content-studio' },
  { id: '21', name: 'Saved Workspace', path: '/saved' },
  { id: '22', name: 'Event Run Sheet', path: '/run-sheet' },
  { id: '23', name: 'Team & Responsibilities', path: '/team' },
  { id: '24', name: 'Reports & Export', path: '/reports' },
  { id: '25', name: 'My Profile', path: '/profile' },
  { id: '26', name: 'Settings', path: '/settings' },
  { id: '27', name: 'Help & Feedback', path: '/help' },
  { id: '28', name: 'Privacy & Consent', path: '/privacy' },
  { id: '29', name: '404 & Error Pages', path: '/404' },
  { id: '30', name: 'Loading, Empty & Offline', path: '/demo-states' },
  { id: '31', name: 'Public Event Page', path: '/public-event' },
  { id: '32', name: 'Guest RSVP Page', path: '/guest-rsvp' },
  { id: '33', name: 'Collaboration Workspace', path: '/collaboration' },
  { id: '34', name: 'Notifications Center', path: '/notifications' },
  { id: '35', name: 'Subscription & Usage', path: '/subscription' },
  { id: '36', name: 'Admin & Moderation', path: '/admin' },
];

export function QuickDirectoryDrawer() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const isDevMode =
    new URLSearchParams(location.search).get('dev') === 'true' ||
    localStorage.getItem('celebrai_dev_mode') === 'true';

  if (!isDevMode) return null;

  return (
    <>
      <button
        type="button"
        className="floating-directory-trigger"
        onClick={() => setOpen(true)}
        title="View All 36 Pages"
        aria-label="Open 36 Pages Directory"
      >
        <Layers size={16} aria-hidden="true" />
        <span>36 Pages</span>
      </button>

      {open && (
        <div
          className="directory-modal-overlay"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="36 Pages Directory"
        >
          <div className="directory-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="dir-modal-header">
              <div>
                <h3 className="dir-modal-title">CelebrAI — 36 Pages Directory</h3>
                <span className="dir-modal-sub">Jump to any screen from the specification</span>
              </div>
              <button
                type="button"
                className="dir-close-btn"
                onClick={() => setOpen(false)}
                aria-label="Close directory"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <div className="dir-links-scroll">
              {ALL_PAGES.map((p) => {
                const isCurrent = location.pathname === p.path;
                return (
                  <Link
                    key={p.id}
                    to={p.path}
                    className={`dir-link-item ${isCurrent ? 'active' : ''}`}
                    onClick={() => setOpen(false)}
                  >
                    <span className="dir-num">{p.id}</span>
                    <span className="dir-name">{p.name}</span>
                    <span className="dir-path">{p.path}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
