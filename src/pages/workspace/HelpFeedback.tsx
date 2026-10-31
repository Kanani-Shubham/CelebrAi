import { AI_MODEL_NAME } from '../../config/ai';
import React, { useState } from 'react';
import {
  Search,
  BookOpen,
  Compass,
  Sparkles,
  LifeBuoy,
  HelpCircle,
  PlayCircle,
  Mail,
  Send,
  ChevronRight,
  X,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { createDoc } from '../../services/firebase/firestore';
import { toast } from '../../components/ui';
import './HelpFeedback.css';

const FAQS = [
  { q: 'How does CelebrAI use ${AI_MODEL_NAME}?', a: 'CelebrAI securely routes planning prompts through our dedicated proxy server to Groq API. Your API keys are kept server-side.' },
  { q: 'Can I export my event budget and checklist?', a: 'Yes! Navigate to Reports & Export to download CSV spreadsheets of tasks, expenses, and guest lists, or a complete JSON master blueprint.' },
  { q: 'How do guest RSVPs work?', a: 'Every event has a shareable RSVP link. Guests submit their party size and dietary preferences without needing an account, and entries sync instantly to your guest dashboard.' },
  { q: 'Is my event data private?', a: 'Yes. Cloud Firestore security rules strictly isolate your private events, budgets, notes, and AI conversations to your authenticated account.' },
];

export function HelpFeedback() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackCategory, setFeedbackCategory] = useState<'Feedback' | 'Bug' | 'Feature Request'>('Feedback');
  const [feedbackText, setFeedbackText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const handleSendFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    setSubmitting(true);
    try {
      await createDoc('feedback', {
        userId: user?.uid || 'anonymous',
        userEmail: user?.email || 'anonymous',
        category: feedbackCategory,
        message: feedbackText.trim(),
      });
      toast.success('Thank you! Your feedback has been received.');
      setFeedbackText('');
      setShowFeedbackModal(false);
    } catch (err) {
      toast.error('Failed to submit feedback: ' + (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFaqs = FAQS.filter(f =>
    f.q.toLowerCase().includes(search.toLowerCase()) ||
    f.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="help-feedback-page">
      <div className="help-head-info">
        <h1 className="help-title">Help &amp; Feedback</h1>
        <p className="help-sub">Everything you need to know about planning with CelebrAI</p>
      </div>

      {/* Search Input */}
      <div className="help-search-bar">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Search FAQs, guides and documentation..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* 4 Cards Grid */}
      <div className="help-cards-grid">
        <div className="help-grid-item" onClick={() => setActiveFaq(0)} style={{ cursor: 'pointer' }}>
          <div className="h-icon-bg purple">
            <BookOpen size={18} />
          </div>
          <div>
            <h4 className="h-card-title">Getting Started</h4>
            <p className="h-card-sub">Event creation &amp; basics</p>
          </div>
        </div>

        <div className="help-grid-item" onClick={() => setActiveFaq(1)} style={{ cursor: 'pointer' }}>
          <div className="h-icon-bg pink">
            <Compass size={18} />
          </div>
          <div>
            <h4 className="h-card-title">Exports &amp; Reports</h4>
            <p className="h-card-sub">CSV &amp; JSON data</p>
          </div>
        </div>

        <div className="help-grid-item" onClick={() => setActiveFaq(2)} style={{ cursor: 'pointer' }}>
          <div className="h-icon-bg violet">
            <Sparkles size={18} />
          </div>
          <div>
            <h4 className="h-card-title">{AI_MODEL_NAME}</h4>
            <p className="h-card-sub">AI planning tips</p>
          </div>
        </div>

        <div className="help-grid-item" onClick={() => setActiveFaq(3)} style={{ cursor: 'pointer' }}>
          <div className="h-icon-bg orange">
            <LifeBuoy size={18} />
          </div>
          <div>
            <h4 className="h-card-title">Privacy &amp; Security</h4>
            <p className="h-card-sub">Data isolation rules</p>
          </div>
        </div>
      </div>

      {/* FAQs Section */}
      <div style={{ marginTop: '24px' }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', margin: '0 0 12px 0', color: 'var(--color-tuxedo-black)' }}>
          Frequently Asked Questions
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredFaqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div
                key={idx}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '14px 16px',
                  cursor: 'pointer',
                }}
                onClick={() => setActiveFaq(isOpen ? null : idx)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '14px', color: 'var(--color-tuxedo-black)' }}>{faq.q}</strong>
                  <ChevronRight size={16} style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s ease', color: 'var(--text-secondary)' }} />
                </div>
                {isOpen && (
                  <p style={{ margin: '10px 0 0 0', fontSize: '13px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* List items */}
      <div className="help-list-group" style={{ marginTop: '20px' }}>
        <div className="help-list-row" onClick={() => setShowFeedbackModal(true)} style={{ cursor: 'pointer' }}>
          <div className="hl-left">
            <Send size={16} />
            <div>
              <span className="hl-title">Send Feedback or Feature Request</span>
              <span className="hl-email">We read every suggestion</span>
            </div>
          </div>
          <ChevronRight size={16} className="hl-arrow" />
        </div>

        <div className="help-list-row">
          <div className="hl-left">
            <Mail size={16} />
            <div>
              <span className="hl-title">Support Desk</span>
              <span className="hl-email">support@celebrai.app</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
          }}
          onClick={() => setShowFeedbackModal(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-xl)',
              maxWidth: '440px',
              width: '100%',
              padding: '24px',
              boxShadow: 'var(--shadow-xl)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', margin: 0 }}>
                Share Your Feedback
              </h3>
              <button
                onClick={() => setShowFeedbackModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSendFeedback} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Topic</label>
                <select
                  value={feedbackCategory}
                  onChange={e => setFeedbackCategory(e.target.value as 'Feedback' | 'Bug' | 'Feature Request')}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', background: '#fff' }}
                >
                  <option value="Feedback">General Feedback</option>
                  <option value="Feature Request">Feature Request</option>
                  <option value="Bug">Report an Issue</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Your Message *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Tell us what you like or what we can improve..."
                  value={feedbackText}
                  onChange={e => setFeedbackText(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowFeedbackModal(false)}
                  style={{ padding: '8px 16px', borderRadius: 'var(--radius-full)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ padding: '8px 20px', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  <span>{submitting ? 'Submitting...' : 'Submit'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
