import { describe, it, expect } from 'vitest';

interface GuestRecord { status: string; partySize: number; }

function countAttending(guests: GuestRecord[]) {
  return guests.filter(g => g.status === 'Accepted').reduce((s, g) => s + (g.partySize || 1), 0);
}
function countPending(guests: GuestRecord[]) {
  return guests.filter(g => g.status === 'Pending').reduce((s, g) => s + (g.partySize || 1), 0);
}
function countDeclined(guests: GuestRecord[]) {
  return guests.filter(g => g.status === 'Declined').reduce((s, g) => s + (g.partySize || 1), 0);
}
function totalHeadcount(guests: GuestRecord[]) {
  return guests.reduce((s, g) => s + (g.partySize || 1), 0);
}

describe('RSVP Calculations', () => {
  const guests: GuestRecord[] = [
    { status: 'Accepted', partySize: 2 },
    { status: 'Accepted', partySize: 1 },
    { status: 'Pending', partySize: 3 },
    { status: 'Declined', partySize: 1 },
  ];

  it('counts attending correctly with party sizes', () => { expect(countAttending(guests)).toBe(3); });
  it('counts pending correctly', () => { expect(countPending(guests)).toBe(3); });
  it('counts declined correctly', () => { expect(countDeclined(guests)).toBe(1); });
  it('calculates total headcount', () => { expect(totalHeadcount(guests)).toBe(7); });
  it('handles empty guest list', () => { expect(countAttending([])).toBe(0); });
  it('defaults party size to 1 when 0', () => {
    expect(countAttending([{ status: 'Accepted', partySize: 0 }])).toBe(1);
  });
});
