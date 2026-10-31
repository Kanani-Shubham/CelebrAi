export interface PageDirectoryItem {
  id: string;
  name: string;
  path: string;
}

export const ALL_PAGES: PageDirectoryItem[] = [
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
  { id: '23', name: 'Team Responsibilities', path: '/team' },
  { id: '24', name: 'Reports & Export', path: '/reports' },
  { id: '25', name: 'My Profile', path: '/profile' },
  { id: '26', name: 'Settings', path: '/settings' },
  { id: '27', name: 'Help & Feedback', path: '/help' },
  { id: '28', name: 'Privacy & Consent', path: '/privacy' },
  { id: '29', name: 'Loading & Error States', path: '/demo-states' },
  { id: '30', name: 'Not Found Page', path: '/404' },
  { id: '31', name: 'Public Event Landing', path: '/public-event' },
  { id: '32', name: 'Public Guest RSVP', path: '/guest-rsvp' },
  { id: '33', name: 'Collaboration Workspace', path: '/collaboration' },
  { id: '34', name: 'Notifications Center', path: '/notifications' },
  { id: '35', name: 'Subscription Plans', path: '/subscription' },
  { id: '36', name: 'Admin & Moderation', path: '/admin' },
];

