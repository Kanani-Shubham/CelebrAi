import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getUserEvents, createEvent, updateEvent, deleteEvent } from '../services/firebase/firestore';
import { useAuth } from './AuthContext';
import { type EventData } from '../data/mockData';

export type Event = EventData;

type EventContextType = {
  events: Event[];
  activeEvent: Event | null;
  setActiveEvent: (event: Event | null) => void;
  loading: boolean;
  refresh: () => Promise<void>;
  addEvent: (event: Omit<Event, 'id' | 'status' | 'tasksDone' | 'tasksTotal' | 'daysLeft'>) => Promise<Event>;
  updateEventDetails: (id: string, patch: Partial<Event>) => Promise<void>;
  removeEvent: (id: string) => Promise<void>;
};

const EventContext = createContext<EventContextType>({
  events: [],
  activeEvent: null,
  setActiveEvent: () => {},
  loading: false,
  refresh: async () => {},
  addEvent: async () => ({} as Event),
  updateEventDetails: async () => {},
  removeEvent: async () => {},
});

export function EventProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  const handleSetActiveEvent = useCallback((ev: Event | null) => {
    setActiveEvent(ev);
    if (ev) {
      localStorage.setItem('celebrai_active_event', ev.id);
    } else {
      localStorage.removeItem('celebrai_active_event');
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!user) {
      setEvents([]);
      setActiveEvent(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await getUserEvents(user.uid);
      const evts = (data || []) as unknown as Event[];
      setEvents(evts);
      localStorage.setItem('celebrai_events', JSON.stringify(evts));

      if (evts.length === 0) {
        setActiveEvent(null);
        localStorage.removeItem('celebrai_active_event');
      } else {
        const savedId = localStorage.getItem('celebrai_active_event');
        const match = evts.find(e => e.id === savedId) || evts[0];
        setActiveEvent(match);
        localStorage.setItem('celebrai_active_event', match.id);
      }
    } catch (err) {
      console.warn('[EventContext] Error loading user events from Firestore:', err);
      // If error, check local storage
      const saved = localStorage.getItem('celebrai_events');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setEvents(parsed);
          setActiveEvent(parsed[0] || null);
        } catch {
          setEvents([]);
          setActiveEvent(null);
        }
      } else {
        setEvents([]);
        setActiveEvent(null);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addEvent = useCallback(async (eventInput: Omit<Event, 'id' | 'status' | 'tasksDone' | 'tasksTotal' | 'daysLeft'>): Promise<Event> => {
    const newEvent: Event = {
      ...eventInput,
      id: `evt-${Date.now()}`,
      status: 'active',
      tasksDone: 0,
      tasksTotal: 0,
      daysLeft: 30,
    };

    if (user) {
      try {
        const docId = await createEvent(user.uid, newEvent as unknown as Record<string, unknown>);
        newEvent.id = docId;
      } catch (err) {
        console.error('Failed to create event in Firestore:', err);
      }
    }

    setEvents(prev => {
      const updated = [newEvent, ...prev];
      localStorage.setItem('celebrai_events', JSON.stringify(updated));
      return updated;
    });
    handleSetActiveEvent(newEvent);
    return newEvent;
  }, [user, handleSetActiveEvent]);

  const updateEventDetails = useCallback(async (id: string, patch: Partial<Event>) => {
    setEvents(prev => {
      const updated = prev.map(e => e.id === id ? { ...e, ...patch } : e);
      localStorage.setItem('celebrai_events', JSON.stringify(updated));
      return updated;
    });

    if (activeEvent?.id === id) {
      setActiveEvent(prev => prev ? { ...prev, ...patch } : null);
    }

    if (user) {
      try {
        await updateEvent(id, patch as Record<string, unknown>);
      } catch (err) {
        console.error('[EventContext] updateEvent failed:', err);
      }
    }
  }, [activeEvent, user]);

  const removeEvent = useCallback(async (id: string) => {
    setEvents(prev => {
      const updated = prev.filter(e => e.id !== id);
      localStorage.setItem('celebrai_events', JSON.stringify(updated));
      return updated;
    });

    if (activeEvent?.id === id) {
      setEvents(prev => {
        const remaining = prev.filter(e => e.id !== id);
        const next = remaining[0] || null;
        handleSetActiveEvent(next);
        return remaining;
      });
    }

    if (user) {
      try {
        await deleteEvent(id);
      } catch (err) {
        console.error('[EventContext] deleteEvent failed:', err);
      }
    }
  }, [activeEvent, user, handleSetActiveEvent]);

  return (
    <EventContext.Provider value={{
      events,
      activeEvent,
      setActiveEvent: handleSetActiveEvent,
      loading,
      refresh,
      addEvent,
      updateEventDetails,
      removeEvent
    }}>
      {children}
    </EventContext.Provider>
  );
}

export function useEvent() {
  return useContext(EventContext);
}
