import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { EventProvider } from './contexts/EventContext';
import { AppShell, PublicShell } from './components/layout/AppShell';

// Public & Onboarding
import { Landing } from './pages/public/Landing';
import { ExploreEvents } from './pages/public/ExploreEvents';
import { Auth } from './pages/auth/Auth';
import { Onboarding } from './pages/onboarding/Onboarding';
import { CreateEvent } from './pages/onboarding/CreateEvent';
import { AIPlanPreview } from './pages/onboarding/AIPlanPreview';

// Main Workspace
import { HomeDashboard } from './pages/dashboard/HomeDashboard';
import { AllEvents } from './pages/dashboard/AllEvents';
import { EventOverview } from './pages/dashboard/EventOverview';
import { AIAssistant } from './pages/dashboard/AIAssistant';

// Planning Modules
import { TodoList } from './pages/planning/TodoList';
import { TimelineCalendar } from './pages/planning/TimelineCalendar';
import { BudgetDashboard } from './pages/planning/BudgetDashboard';
import { ExpenseManager } from './pages/planning/ExpenseManager';
import { GuestManagement } from './pages/planning/GuestManagement';
import { InvitationsRSVP } from './pages/planning/InvitationsRSVP';
import { VendorDiscovery } from './pages/planning/VendorDiscovery';
import { VendorDetails } from './pages/planning/VendorDetails';
import { DecorStudio } from './pages/planning/DecorStudio';
import { ContentStudio } from './pages/planning/ContentStudio';

// Workspace & Account
import { SavedWorkspace } from './pages/workspace/SavedWorkspace';
import { RunSheet } from './pages/workspace/RunSheet';
import { TeamResponsibilities } from './pages/workspace/TeamResponsibilities';
import { ReportsExport } from './pages/workspace/ReportsExport';
import { Profile } from './pages/workspace/Profile';
import { Settings } from './pages/workspace/Settings';
import { HelpFeedback } from './pages/workspace/HelpFeedback';
import { PrivacyConsent } from './pages/workspace/PrivacyConsent';
import { NotFound } from './pages/workspace/NotFound';
import { StatesDemo } from './pages/workspace/StatesDemo';

// Advanced Features
import { PublicEvent } from './pages/advanced/PublicEvent';
import { GuestRSVP } from './pages/advanced/GuestRSVP';
import { CollaborationWorkspace } from './pages/advanced/CollaborationWorkspace';
import { NotificationsCenter } from './pages/advanced/NotificationsCenter';
import { SubscriptionPlans } from './pages/advanced/SubscriptionPlans';
import { AdminModeration } from './pages/advanced/AdminModeration';

import { Layers, X } from 'lucide-react';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { FirebaseConfigBanner } from './components/common/FirebaseConfigBanner';
import './App.css';

const ALL_PAGES = [
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

function QuickDirectoryDrawer() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const isDevMode = new URLSearchParams(location.search).get('dev') === 'true' ||
    localStorage.getItem('celebrai_dev_mode') === 'true';

  if (!isDevMode) return null;

  return (
    <>
      <button
        className="floating-directory-trigger"
        onClick={() => setOpen(true)}
        title="View All 36 Pages"
      >
        <Layers size={16} />
        <span>36 Pages</span>
      </button>

      {open && (
        <div className="directory-modal-overlay" onClick={() => setOpen(false)}>
          <div className="directory-modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="dir-modal-header">
              <div>
                <h3 className="dir-modal-title">CelebrAI — 36 Pages Directory</h3>
                <span className="dir-modal-sub">Jump to any screen from the specification</span>
              </div>
              <button className="dir-close-btn" onClick={() => setOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="dir-links-scroll">
              {ALL_PAGES.map(p => {
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

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <FirebaseConfigBanner />
        <AuthProvider>
          <EventProvider>
            <Routes>
              {/* Public & Onboarding (requireAuth = false) */}
              <Route path="/" element={<PublicShell><Landing /></PublicShell>} />
            <Route path="/explore-events" element={<PublicShell><ExploreEvents /></PublicShell>} />
            <Route path="/signin" element={<PublicShell><Auth /></PublicShell>} />
            <Route path="/signup" element={<PublicShell><Auth /></PublicShell>} />
            <Route path="/onboarding" element={<PublicShell><Onboarding /></PublicShell>} />
            <Route path="/create-event" element={<PublicShell><CreateEvent /></PublicShell>} />
            <Route path="/ai-plan" element={<PublicShell><AIPlanPreview /></PublicShell>} />
            <Route path="/ai-plan-preview" element={<PublicShell><AIPlanPreview /></PublicShell>} />

            {/* Main Workspace (Shell with Top Header & Bottom Nav) */}
            <Route path="/dashboard" element={<AppShell requireAuth={false}><HomeDashboard /></AppShell>} />
            <Route path="/events" element={<AppShell requireAuth={false}><AllEvents /></AppShell>} />
            <Route path="/events/:id" element={<AppShell requireAuth={false} hideNav={true}><EventOverview /></AppShell>} />
            <Route path="/event-overview" element={<AppShell requireAuth={false} hideNav={true}><EventOverview /></AppShell>} />
            <Route path="/ai" element={<AppShell requireAuth={false} hideNav={true}><AIAssistant /></AppShell>} />

            {/* Planning Modules */}
            <Route path="/tasks" element={<AppShell requireAuth={false}><TodoList /></AppShell>} />
            <Route path="/timeline" element={<AppShell requireAuth={false}><TimelineCalendar /></AppShell>} />
            <Route path="/budget" element={<AppShell requireAuth={false}><BudgetDashboard /></AppShell>} />
            <Route path="/expenses" element={<AppShell requireAuth={false} hideNav={true}><ExpenseManager /></AppShell>} />
            <Route path="/guests" element={<AppShell requireAuth={false}><GuestManagement /></AppShell>} />
            <Route path="/invitations" element={<AppShell requireAuth={false}><InvitationsRSVP /></AppShell>} />
            <Route path="/vendors" element={<AppShell requireAuth={false}><VendorDiscovery /></AppShell>} />
            <Route path="/vendors/:id" element={<AppShell requireAuth={false} hideNav={true}><VendorDetails /></AppShell>} />
            <Route path="/decor" element={<AppShell requireAuth={false}><DecorStudio /></AppShell>} />
            <Route path="/content-studio" element={<AppShell requireAuth={false}><ContentStudio /></AppShell>} />

            {/* Workspace & Account */}
            <Route path="/saved" element={<AppShell requireAuth={false}><SavedWorkspace /></AppShell>} />
            <Route path="/run-sheet" element={<AppShell requireAuth={false}><RunSheet /></AppShell>} />
            <Route path="/team" element={<AppShell requireAuth={false}><TeamResponsibilities /></AppShell>} />
            <Route path="/reports" element={<AppShell requireAuth={false}><ReportsExport /></AppShell>} />
            <Route path="/profile" element={<AppShell requireAuth={false}><Profile /></AppShell>} />
            <Route path="/settings" element={<AppShell requireAuth={false} hideNav={true}><Settings /></AppShell>} />
            <Route path="/help" element={<AppShell requireAuth={false} hideNav={true}><HelpFeedback /></AppShell>} />
            <Route path="/privacy" element={<AppShell requireAuth={false} hideNav={true}><PrivacyConsent /></AppShell>} />
            <Route path="/demo-states" element={<AppShell requireAuth={false}><StatesDemo /></AppShell>} />

            {/* Advanced Features */}
            <Route path="/public-event" element={<PublicShell><PublicEvent /></PublicShell>} />
            <Route path="/guest-rsvp" element={<PublicShell><GuestRSVP /></PublicShell>} />
            <Route path="/collaboration" element={<AppShell requireAuth={false}><CollaborationWorkspace /></AppShell>} />
            <Route path="/notifications" element={<AppShell requireAuth={false} hideNav={true}><NotificationsCenter /></AppShell>} />
            <Route path="/subscription" element={<AppShell requireAuth={false} hideNav={true}><SubscriptionPlans /></AppShell>} />
            <Route path="/admin" element={<AppShell requireAuth={false} hideNav={true}><AdminModeration /></AppShell>} />

            {/* 404 Catch All */}
            <Route path="/404" element={<PublicShell><NotFound /></PublicShell>} />
            <Route path="*" element={<PublicShell><NotFound /></PublicShell>} />
          </Routes>

          {/* Quick Page Directory Floating Button */}
          <QuickDirectoryDrawer />
        </EventProvider>
      </AuthProvider>
    </BrowserRouter>
  </ErrorBoundary>
);
}

export default App;
