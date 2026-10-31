import { AI_MODEL_NAME } from '../../config/ai';
import React, { useState } from 'react';
import {
  Search,
  BookOpen,
  Compass,
  Sparkles,
  LifeBuoy,
  Mail,
  Send,
  ChevronRight,
  X,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import { createDoc } from '../../services/firebase/firestore';
import { toast } from '../../components/ui/toast';
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
        <div className="help-grid-item cursor-pointer" onClick={() => setActiveFaq(0)}>
          <div className="h-icon-bg purple">
            <BookOpen size={18} />
          </div>
          <div>
            <h4 className="h-card-title">Getting Started</h4>
            <p className="h-card-sub">Event creation &amp; basics</p>
          </div>
        </div>

        <div className="help-grid-item cursor-pointer" onClick={() => setActiveFaq(1)}>
          <div className="h-icon-bg pink">
            <Compass size={18} />
          </div>
          <div>
            <h4 className="h-card-title">Exports &amp; Reports</h4>
            <p className="h-card-sub">CSV &amp; JSON data</p>
          </div>
        </div>

        <div className="help-grid-item cursor-pointer" onClick={() => setActiveFaq(2)}>
          <div className="h-icon-bg violet">
            <Sparkles size={18} />
          </div>
          <div>
            <h4 className="h-card-title">{AI_MODEL_NAME}</h4>
            <p className="h-card-sub">AI planning tips</p>
          </div>
        </div>

        <div className="help-grid-item cursor-pointer" onClick={() => setActiveFaq(3)}>
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
      <div className="mt-4">
        <h3 className="ui-section-title-sm">
          Frequently Asked Questions
        </h3>
        <div className="flex-col gap-2">
          {filteredFaqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div
                key={idx}
                className="ui-surface-card cursor-pointer"
                onClick={() => setActiveFaq(isOpen ? null : idx)}
              >
                <div className="flex-between">
                  <strong className="text-sm text-tuxedo font-semibold">{faq.q}</strong>
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
        <div className="help-list-row cursor-pointer" onClick={() => setShowFeedbackModal(true)}>
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
          className="ui-modal-backdrop"
          onClick={() => setShowFeedbackModal(false)}
        >
          <div
            className="ui-modal-card"
            onClick={e => e.stopPropagation()}
          >
            <div className="ui-modal-header">
              <h3 className="ui-modal-title">
                Share Your Feedback
              </h3>
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="ui-icon-btn-ghost"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSendFeedback} className="flex-col gap-3">
              <div>
                <label className="ui-field-label">Topic</label>
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
                <label className="ui-field-label">Your Message *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Tell us what you like or what we can improve..."
                  value={feedbackText}
                  onChange={e => setFeedbackText(e.target.value)}
                  className="w-full p-2 border-default rounded-md"
                />
              </div>

              <div className="flex-between justify-end gap-2 mt-2">
                <button className="btn btn-secondary btn btn-secondary rounded-full"
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                >
                  Cancel
                </button>
                <button className="btn btn-primary btn btn-primary rounded-full items-center gap-2"
                  type="submit"
                  disabled={submitting}
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
