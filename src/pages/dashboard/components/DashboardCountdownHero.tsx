import type { EventItem } from '../../../types';

interface DashboardCountdownHeroProps {
  event: EventItem;
  countdown: {
    days: number | null;
    isPast: boolean;
    isToday: boolean;
  };
}

export function DashboardCountdownHero({ event, countdown }: DashboardCountdownHeroProps) {
  return (
    <div className="hero-countdown-card">
      <div className="countdown-content">
        <span className="days-number">
          {countdown.days !== null ? Math.abs(countdown.days) : '--'}
        </span>
        <span className="days-label">
          {countdown.isToday ? (
            <>It's Celebration Day!<br />{event.eventName}</>
          ) : countdown.isPast ? (
            <>Days Since<br />{event.eventName}</>
          ) : (
            <>Days Until<br />{event.eventName}</>
          )}
        </span>
      </div>
      <div className="countdown-img-wrap">
        <img
          src={event.coverImage || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80'}
          alt={event.eventName}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80';
          }}
        />
      </div>
    </div>
  );
}
