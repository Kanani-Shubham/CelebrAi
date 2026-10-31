import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { EventProvider } from './contexts/EventContext';
import { AppShell, PublicShell } from './components/layout/AppShell';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { FirebaseConfigBanner } from './components/common/FirebaseConfigBanner';
import { RouteLoadingFallback } from './components/common/RouteLoadingFallback';
import { QuickDirectoryDrawer } from './components/dev/QuickDirectoryDrawer';

// Eagerly loaded for instant first contentful paint
import { Landing } from './pages/public/Landing';
import { Auth } from './pages/auth/Auth';

// Lazy-loaded routes for optimal initial bundle size and route-level code splitting
const ExploreEvents = lazy(() => import('./pages/public/ExploreEvents').then(m => ({ default: m.ExploreEvents })));
const Onboarding = lazy(() => import('./pages/onboarding/Onboarding').then(m => ({ default: m.Onboarding })));
const CreateEvent = lazy(() => import('./pages/onboarding/CreateEvent').then(m => ({ default: m.CreateEvent })));
const AIPlanPreview = lazy(() => import('./pages/onboarding/AIPlanPreview').then(m => ({ default: m.AIPlanPreview })));

// Main Workspace
const HomeDashboard = lazy(() => import('./pages/dashboard/HomeDashboard').then(m => ({ default: m.HomeDashboard })));
const AllEvents = lazy(() => import('./pages/dashboard/AllEvents').then(m => ({ default: m.AllEvents })));
const EventOverview = lazy(() => import('./pages/dashboard/EventOverview').then(m => ({ default: m.EventOverview })));
const AIAssistant = lazy(() => import('./pages/dashboard/AIAssistant').then(m => ({ default: m.AIAssistant })));

// Planning Modules
const TodoList = lazy(() => import('./pages/planning/TodoList').then(m => ({ default: m.TodoList })));
const TimelineCalendar = lazy(() => import('./pages/planning/TimelineCalendar').then(m => ({ default: m.TimelineCalendar })));
const BudgetDashboard = lazy(() => import('./pages/planning/BudgetDashboard').then(m => ({ default: m.BudgetDashboard })));
const ExpenseManager = lazy(() => import('./pages/planning/ExpenseManager').then(m => ({ default: m.ExpenseManager })));
const GuestManagement = lazy(() => import('./pages/planning/GuestManagement').then(m => ({ default: m.GuestManagement })));
const InvitationsRSVP = lazy(() => import('./pages/planning/InvitationsRSVP').then(m => ({ default: m.InvitationsRSVP })));
const VendorDiscovery = lazy(() => import('./pages/planning/VendorDiscovery').then(m => ({ default: m.VendorDiscovery })));
const VendorDetails = lazy(() => import('./pages/planning/VendorDetails').then(m => ({ default: m.VendorDetails })));
const DecorStudio = lazy(() => import('./pages/planning/DecorStudio').then(m => ({ default: m.DecorStudio })));
const ContentStudio = lazy(() => import('./pages/planning/ContentStudio').then(m => ({ default: m.ContentStudio })));

// Workspace & Account
const SavedWorkspace = lazy(() => import('./pages/workspace/SavedWorkspace').then(m => ({ default: m.SavedWorkspace })));
const RunSheet = lazy(() => import('./pages/workspace/RunSheet').then(m => ({ default: m.RunSheet })));
const TeamResponsibilities = lazy(() => import('./pages/workspace/TeamResponsibilities').then(m => ({ default: m.TeamResponsibilities })));
const ReportsExport = lazy(() => import('./pages/workspace/ReportsExport').then(m => ({ default: m.ReportsExport })));
const Profile = lazy(() => import('./pages/workspace/Profile').then(m => ({ default: m.Profile })));
const Settings = lazy(() => import('./pages/workspace/Settings').then(m => ({ default: m.Settings })));
const HelpFeedback = lazy(() => import('./pages/workspace/HelpFeedback').then(m => ({ default: m.HelpFeedback })));
const PrivacyConsent = lazy(() => import('./pages/workspace/PrivacyConsent').then(m => ({ default: m.PrivacyConsent })));
const NotFound = lazy(() => import('./pages/workspace/NotFound').then(m => ({ default: m.NotFound })));
const StatesDemo = lazy(() => import('./pages/workspace/StatesDemo').then(m => ({ default: m.StatesDemo })));

// Advanced Features
const PublicEvent = lazy(() => import('./pages/advanced/PublicEvent').then(m => ({ default: m.PublicEvent })));
const GuestRSVP = lazy(() => import('./pages/advanced/GuestRSVP').then(m => ({ default: m.GuestRSVP })));
const CollaborationWorkspace = lazy(() => import('./pages/advanced/CollaborationWorkspace').then(m => ({ default: m.CollaborationWorkspace })));
const NotificationsCenter = lazy(() => import('./pages/advanced/NotificationsCenter').then(m => ({ default: m.NotificationsCenter })));
const SubscriptionPlans = lazy(() => import('./pages/advanced/SubscriptionPlans').then(m => ({ default: m.SubscriptionPlans })));
const AdminModeration = lazy(() => import('./pages/advanced/AdminModeration').then(m => ({ default: m.AdminModeration })));

import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <FirebaseConfigBanner />
        <AuthProvider>
          <EventProvider>
            <Suspense fallback={<RouteLoadingFallback />}>
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
            </Suspense>

            {/* Quick Page Directory Floating Button */}
            <QuickDirectoryDrawer />
          </EventProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
