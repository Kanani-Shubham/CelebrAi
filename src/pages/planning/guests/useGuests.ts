import { useState, useEffect, useCallback, useMemo } from 'react';
import { logger } from '../../../utils/logger';
import { toast } from '../../../components/ui/toast';
import {
  getEventGuests,
  createGuest,
  updateGuest,
  deleteGuest,
} from '../../../services/firebase/firestore';
import type { FirestoreGuest } from './types';

export function useGuests(eventId?: string, user?: { uid: string } | null) {
  const [guests, setGuests] = useState<FirestoreGuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, _setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function fetchGuests() {
      if (!eventId) {
        if (!ignore) {
          setGuests([]);
          setLoading(false);
        }
        return;
      }
      try {
        const data = await getEventGuests(eventId);
        if (!ignore) {
          setGuests(data || []);
        }
      } catch (err) {
        _setError((err as Error).message);
        logger.error('[GuestManagement] Error loading guests:', err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    void fetchGuests();
    return () => { ignore = true; };
  }, [eventId]);

  const loadGuests = useCallback(async () => {
    if (!eventId) return;
    try {
      const data = await getEventGuests(eventId);
      setGuests(data || []);
    } catch (err) {
      logger.error('[GuestManagement] Reload failed:', err);
    }
  }, [eventId]);

  const stats = useMemo(() => {
    let accepted = 0;
    let pending = 0;
    let declined = 0;
    let total = 0;

    for (const g of guests) {
      const size = Number(g.partySize) || 1;
      total += size;
      if (g.status === 'Accepted') accepted += size;
      else if (g.status === 'Declined') declined += size;
      else pending += size;
    }

    return {
      acceptedCount: accepted,
      pendingCount: pending,
      declinedCount: declined,
      totalGuests: total,
    };
  }, [guests]);

  const addGuest = async (cleaned: {
    name: string;
    partySize: number;
    dietary: FirestoreGuest['dietary'];
    status: FirestoreGuest['status'];
    phone?: string;
    email?: string;
  }) => {
    if (!eventId || !user) {
      toast.error('Active event and user authentication required.');
      return false;
    }

    try {
      const id = await createGuest(eventId, {
        name: cleaned.name,
        partySize: cleaned.partySize,
        dietary: cleaned.dietary,
        status: cleaned.status,
        phone: cleaned.phone,
        email: cleaned.email,
      });

      const newGuest: FirestoreGuest = {
        id,
        name: cleaned.name,
        partySize: cleaned.partySize,
        dietary: cleaned.dietary,
        status: cleaned.status,
        eventId,
        phone: cleaned.phone,
        email: cleaned.email,
      };

      setGuests((prev) => [newGuest, ...prev]);
      toast.success('Guest added successfully');
      return true;
    } catch (err) {
      toast.error((err as Error).message || 'Failed to add guest');
      return false;
    }
  };

  const setGuestStatus = async (guest: FirestoreGuest, newStatus: FirestoreGuest['status']) => {
    setGuests((prev) => prev.map((g) => (g.id === guest.id ? { ...g, status: newStatus } : g)));
    try {
      await updateGuest(guest.id, { status: newStatus });
      toast.success(`Marked as ${newStatus}`);
    } catch {
      toast.error('Failed to update status');
      setGuests((prev) => prev.map((g) => (g.id === guest.id ? { ...g, status: guest.status } : g)));
    }
  };

  const removeGuest = async (guestId: string) => {
    setGuests((prev) => prev.filter((g) => g.id !== guestId));
    try {
      await deleteGuest(guestId);
      toast.success('Guest removed');
    } catch {
      toast.error('Failed to remove guest');
      loadGuests();
    }
  };

  return {
    guests,
    loading,
    error,
    stats,
    addGuest,
    setGuestStatus,
    removeGuest,
    reload: loadGuests,
  };
}
