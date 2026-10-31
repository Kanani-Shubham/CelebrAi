import { logger } from '../utils/logger';
import React, { useState, useEffect, useCallback } from 'react';
import { getUserEvents, createEvent, updateEvent, deleteEvent } from '../services/firebase/firestore';
import { useAuth } from './useAuth';
import type { EventItem as Event } from '../types';
import { EventContext } from './eventContextDef';

export type { EventItem as Event } from '../types';
export type { EventContextType } from './eventContextDef';

export function EventProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(Boolean(user));

  const handleSetActiveEvent = useCallback((ev: Event | null) => {
    setActiveEvent(ev);
    if (ev?.id) {
      localStorage.setItem('celebrai_active_event', ev.id);
    } else {
      localStorage.removeItem('celebrai_active_event');
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    if (!user) {
      const timer = setTimeout(() => {
        if (!ignore) {
          setEvents([]);
          setActiveEvent(null);
          setLoading(false);
        }
      }, 0);
      return () => {
        ignore = true;
        clearTimeout(timer);
      };
    }

    const currentUid = user.uid;
    async function initEvents() {
      try {
        const data = await getUserEvents(currentUid);
        if (ignore) return;
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
        logger.warn('[EventContext] Error loading user events from Firestore:', err);
        const saved = localStorage.getItem('celebrai_events');
        if (saved && !ignore) {
          try {
            const parsed = JSON.parse(saved);
            setEvents(parsed);
            setActiveEvent(parsed[0] || null);
          } catch {
            setEvents([]);
            setActiveEvent(null);
          }
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void initEvents();
    return () => {
      ignore = true;
    };
  }, [user]);

  const refresh = useCallback(async () => {
    if (!user) {
      setEvents([]);
      setActiveEvent(null);
      setLoading(false);
      return;
    }

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
      logger.warn('[EventContext] Error refreshing events:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addEvent = useCallback(async (eventInput: Omit<Event, 'id' | 'status' | 'tasksDone' | 'tasksTotal' | 'daysLeft'>): Promise<Event> => {
    let finalId = `evt-${Date.now()}`;

    if (user) {
      const docId = await createEvent(user.uid, {
        ...eventInput,
        ownerId: user.uid,
        createdBy: user.uid,
        status: 'active',
        tasksDone: 0,
        tasksTotal: 0,
      } as unknown as Record<string, unknown>);
      finalId = docId;
    }

    const newEvent: Event = {
      ...eventInput,
      id: finalId,
      status: 'active',
      tasksDone: 0,
      tasksTotal: 0,
      daysLeft: 30,
    };

    setEvents(prev => {
      const next = [newEvent, ...prev];
      localStorage.setItem('celebrai_events', JSON.stringify(next));
      return next;
    });

    handleSetActiveEvent(newEvent);
    return newEvent;
  }, [user, handleSetActiveEvent]);

  const updateEventDetails = useCallback(async (id: string, patch: Partial<Event>) => {
    setEvents(prev => {
      const next = prev.map(e => (e.id === id ? { ...e, ...patch } : e));
      localStorage.setItem('celebrai_events', JSON.stringify(next));
      return next;
    });

    if (activeEvent?.id === id) {
      setActiveEvent(prev => (prev ? { ...prev, ...patch } : null));
    }

    if (user && !id.startsWith('evt-')) {
      try {
        await updateEvent(id, patch as Record<string, unknown>);
      } catch (err) {
        logger.error('[EventContext] Failed to persist event update to Firestore:', err);
      }
    }
  }, [activeEvent?.id, user]);

  const removeEvent = useCallback(async (id: string) => {
    setEvents(prev => {
      const next = prev.filter(e => e.id !== id);
      localStorage.setItem('celebrai_events', JSON.stringify(next));
      return next;
    });

    if (activeEvent?.id === id) {
      const remaining = events.filter(e => e.id !== id);
      handleSetActiveEvent(remaining[0] || null);
    }

    if (user && !id.startsWith('evt-')) {
      try {
        await deleteEvent(id);
      } catch (err) {
        logger.error('[EventContext] Failed to delete event from Firestore:', err);
      }
    }
  }, [activeEvent?.id, events, handleSetActiveEvent, user]);

  return (
    <EventContext.Provider
      value={{
        events,
        activeEvent,
        setActiveEvent: handleSetActiveEvent,
        loading,
        refresh,
        addEvent,
        updateEventDetails,
        removeEvent,
      }}
    >
      {children}
    </EventContext.Provider>
  );
}
