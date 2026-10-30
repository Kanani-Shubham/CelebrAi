import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Sparkles, CheckCircle, LayoutDashboard, Users, DollarSign } from 'lucide-react';
import './Landing.css';

const HERO_IMAGE_URL = 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85';
const FALLBACK_HERO_URL = 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=80';

const EVENT_TYPES = [
  { name: 'Wedding', desc: 'Plan your big day', emoji: '💍', img: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop' },
  { name: 'Birthday', desc: 'Make it special', emoji: '🎂', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop' },
  { name: 'Anniversary', desc: 'Celebrate love', emoji: '❤️', img: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400&h=300&fit=crop' },
  { name: 'Corporate', desc: 'Meetings & events', emoji: '🏢', img: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop' },
  { name: 'Community', desc: 'Festivals & gatherings', emoji: '🎉', img: 'https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=400&h=300&fit=crop' },
  { name: 'College Event', desc: 'Fests, hackathons', emoji: '🎓', img: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=400&h=300&fit=crop' },
];

const FEATURES = [
  { icon: <Sparkles size={20} />, title: 'AI Planning', desc: 'Generate complete event plans in seconds with our intelligent AI.' },
  { icon: <DollarSign size={20} />, title: 'Budget Tracking', desc: 'Track every rupee with smart expense management and alerts.' },
  { icon: <Users size={20} />, title: 'Guest & RSVP', desc: 'Manage guests, send invitations and track responses easily.' },
  { icon: <LayoutDashboard size={20} />, title: 'Vendor Discovery', desc: 'Find and compare trusted vendors for every event need.' },
];

export function Landing() {
  const [heroSrc, setHeroSrc] = useState(HERO_IMAGE_URL);

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <div className="landing-logo">
          <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="13" stroke="#171F20" strokeWidth="1.5"/>
            <path d="M14 6C14 6 9 9 9 14C9 19 14 22 14 22C14 22 19 19 19 14C19 9 14 6 14 6Z" fill="#D8CBF1"/>
            <circle cx="14" cy="14" r="2" fill="#171F20"/>
          </svg>
          <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, fontSize: 18, color: 'var(--color-tuxedo-black)' }}>CelebrAI</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link to="/explore-events" className="btn btn-secondary btn-sm">Explore</Link>
          <Link to="/signin" className="btn btn-primary btn-sm">Sign In</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="landing-hero">
        <div className="hero-inner">
          <div className="hero-text">
            <h1 className="hero-title font-serif">
              Plan Beautiful Events,<br />Effortlessly.
            </h1>
            <p className="hero-subtitle">
              Your AI-powered planner for weddings, birthdays, corporate celebrations,
              community gatherings and more.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/signup" className="btn btn-primary btn-lg hero-cta">
                Get Started Free <ArrowRight size={18} />
              </Link>
              <Link to="/explore-events" className="btn btn-secondary btn-lg">
                View Event Types
              </Link>
            </div>
          </div>

          <div className="hero-image-wrap">
            <img
              src={heroSrc}
              alt="Editorial wedding reception decor and table styling"
              className="hero-image"
              onError={() => {
                if (heroSrc !== FALLBACK_HERO_URL) {
                  setHeroSrc(FALLBACK_HERO_URL);
                }
              }}
            />
            <div className="hero-stats">
              <div className="hero-stat">
                <div className="hero-stat-avatars">
                  {['🌸', '💍', '✨'].map((e, i) => (
                    <div key={i} className="hero-avatar">{e}</div>
                  ))}
                </div>
                <div>
                  <strong>50,000+</strong>
                  <span>Celebrations Planned</span>
                </div>
              </div>
              <div className="hero-stat rating">
                <Star size={16} fill="#F59E0B" color="#F59E0B" />
                <strong>4.9/5</strong>
                <span>Host Rating</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Strip */}
      <section className="features-strip">
        {FEATURES.map(f => (
          <div key={f.title} className="feature-strip-item">
            <div className="feature-strip-icon">{f.icon}</div>
            <div className="feature-strip-text">
              <strong>{f.title}</strong>
              <span>{f.desc}</span>
            </div>
          </div>
        ))}
      </section>

      {/* Event Types */}
      <section className="landing-section">
        <div className="section-header">
          <h2 className="section-title font-serif">What are you planning?</h2>
          <p className="section-subtitle">Let's create something extraordinary together.</p>
        </div>
        <div className="event-types-grid">
          {EVENT_TYPES.map(et => (
            <Link to={`/signup?type=${et.name.toLowerCase()}`} key={et.name} className="event-type-card">
              <img src={et.img} alt={et.name} className="event-type-img" />
              <div className="event-type-info">
                <strong>{et.name}</strong>
                <span>{et.desc}</span>
              </div>
            </Link>
          ))}
          <Link to="/signup" className="event-type-card custom-card">
            <div className="custom-card-inner">
              <span style={{ fontSize: 32 }}>✨</span>
              <strong>Custom Event</strong>
              <span>Create your bespoke celebration</span>
            </div>
          </Link>
        </div>
      </section>

      {/* AI Benefits */}
      <section className="landing-section benefits-section">
        <div className="section-header">
          <h2 className="section-title font-serif">Why Hosts Trust CelebrAI</h2>
        </div>
        <div className="benefits-list">
          {[
            'Generate a complete bespoke event plan in seconds with GPT-OSS 120B',
            'Track budgets, expenses and vendor payments in INR or preferred currency',
            'Manage your entire guest list, dietary needs, and digital RSVP confirmations',
            'Discover and compare top venues, caterers, decorators, and photographers',
            'Draft personalized invitation cards and WhatsApp announcements',
            'Coordinate event day run sheets with exact minute-by-minute schedules',
          ].map(b => (
            <div key={b} className="benefit-item">
              <CheckCircle size={18} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
              <span>{b}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="landing-cta">
        <h2 className="font-serif" style={{ fontSize: 'var(--text-3xl)', marginBottom: 12 }}>
          Start Planning Your Celebration Today
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 24 }}>
          Free to start. No credit card required.
        </p>
        <Link to="/signup" className="btn btn-primary btn-lg">
          Create Your Event <ArrowRight size={18} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>© {new Date().getFullYear()} CelebrAI. All rights reserved.</p>
        <div style={{ display: 'flex', gap: 20, fontSize: 'var(--text-sm)' }}>
          <Link to="/explore-events" style={{ color: 'var(--text-secondary)' }}>Event Types</Link>
          <Link to="/privacy" style={{ color: 'var(--text-secondary)' }}>Privacy Policy</Link>
          <Link to="/help" style={{ color: 'var(--text-secondary)' }}>Help & Support</Link>
        </div>
      </footer>
    </div>
  );
}
