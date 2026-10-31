import { createContext } from 'react';
import type { EventItem as Event } from '../types';

export type EventContextType = {
  events: Event[];
  activeEvent: Event | null;
  setActiveEvent: (event: Event | null) => void;
  loading: boolean;
  refresh: () => Promise<void>;
  addEvent: (event: Omit<Event, 'id' | 'status' | 'tasksDone' | 'tasksTotal' | 'daysLeft'>) => Promise<Event>;
  updateEventDetails: (id: string, patch: Partial<Event>) => Promise<void>;
  removeEvent: (id: string) => Promise<void>;
};

export const EventContext = createContext<EventContextType>({
  events: [],
  activeEvent: null,
  setActiveEvent: () => {},
  loading: false,
  refresh: async () => {},
  addEvent: async () => ({} as Event),
  updateEventDetails: async () => {},
  removeEvent: async () => {},
});
