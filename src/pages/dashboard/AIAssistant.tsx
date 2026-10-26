import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Sparkles,
  Search,
  Palette,
  Clock,
  PieChart,
  Mail,
  ArrowUp,
  Loader2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { useEvent } from '../../contexts/EventContext';
import { useAuth } from '../../contexts/AuthContext';
import { sendChatMessage, type AIChatMessage } from '../../services/ai/groq';
import {
  getEventConversations,
  saveConversationMessage,
} from '../../services/firebase/firestore';
import './AIAssistant.css';

interface MessageItem {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  error?: boolean;
}

const QUICK_PROMPTS = [
  {
    icon: Search,
    label: 'Recommend caterers',
    prompt: 'Recommend top catering menu styles and service options for our event based on our budget and guest count.',
  },
  {
    icon: Palette,
    label: 'Suggest decor themes',
    prompt: 'Suggest 3 unique and elegant decor themes suitable for our event date and venue.',
  },
  {
    icon: Clock,
    label: 'Create hour-by-hour timeline',
    prompt: 'Generate an hour-by-hour event day schedule for our celebration from morning setup to night wrap-up.',
  },
  {
    icon: PieChart,
    label: 'Optimize my budget',
    prompt: 'Review our event budget and suggest percentage allocations across venue, catering, decor, photography, and entertainment.',
  },
  {
    icon: Mail,
    label: 'Draft invitation text',
    prompt: 'Write an elegant, warm invitation message for our WhatsApp and digital cards.',
  },
];

export function AIAssistant() {
  const navigate = useNavigate();
  const { activeEvent } = useEvent();
  const { user, idToken } = useAuth();

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventId = activeEvent?.id;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Restore conversation history from Firestore
  const loadHistory = useCallback(async () => {
    if (!eventId || !user) {
      setMessages([
        {
          id: 'welcome',
          sender: 'ai',
          text: "👋 Hi! I'm CelebrAI, your personal event planner powered by GPT-OSS 120B. How can I help you plan your celebration today?",
          timestamp: 'Just now',
        },
      ]);
      setHistoryLoading(false);
      return;
    }

    setHistoryLoading(true);
    try {
      const records = await getEventConversations(eventId);
      if (records && records.length > 0) {
        const restored: MessageItem[] = records.map(r => ({
          id: r.id,
          sender: (r.role === 'assistant' ? 'ai' : 'user') as 'ai' | 'user',
          text: String(r.content || ''),
          timestamp: r.createdAt?.toDate ? r.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Saved',
        }));
        setMessages(restored);
      } else {
        setMessages([
          {
            id: 'welcome',
            sender: 'ai',
            text: `👋 Hi! I'm CelebrAI, your personal event planner powered by GPT-OSS 120B. I am ready to help you plan "${activeEvent.eventName || 'your celebration'}". What would you like to work on?`,
            timestamp: 'Just now',
          },
        ]);
      }
    } catch (err) {
      console.warn('[AIAssistant] Could not load conversation history from Firestore:', err);
      setMessages([
        {
          id: 'welcome',
          sender: 'ai',
          text: "👋 Hi! I'm CelebrAI, powered by GPT-OSS 120B. How can I assist with your celebration today?",
          timestamp: 'Just now',
        },
      ]);
    } finally {
      setHistoryLoading(false);
    }
  }, [eventId, user, activeEvent?.eventName]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputVal).trim();
    if (!text || loading) return;

    setLastFailedMessage(null);
    const userMsgId = `usr-${Date.now()}`;
    const userMsg: MessageItem = {
      id: userMsgId,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setLoading(true);

    // Save user message to Firestore
    if (eventId && user) {
      try {
        await saveConversationMessage(eventId, user.uid, {
          role: 'user',
          content: text,
        });
      } catch (err) {
        console.warn('[AIAssistant] Failed to persist user message to Firestore:', err);
      }
    }

    try {
      // Build conversation history for API
      const history: AIChatMessage[] = messages
        .filter(m => m.id !== 'welcome' && !m.error)
        .map(m => ({
          role: m.sender === 'ai' ? 'assistant' : 'user',
          content: m.text,
        }));
      history.push({ role: 'user', content: text });

      const reply = await sendChatMessage(
        history,
        {
          eventName: activeEvent?.eventName || 'Our Celebration',
          eventType: activeEvent?.eventType || 'Event',
          location: activeEvent?.location || 'India',
          guestCount: Number(activeEvent?.guestCount) || 100,
          budget: Number(activeEvent?.budget) || 500000,
        },
        idToken || ''
      );

      const aiMsg: MessageItem = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, aiMsg]);

      // Save AI message to Firestore
      if (eventId && user) {
        try {
          await saveConversationMessage(eventId, user.uid, {
            role: 'assistant',
            content: reply,
          });
        } catch (err) {
          console.warn('[AIAssistant] Failed to persist assistant reply to Firestore:', err);
        }
      }
    } catch (err) {
      console.error('[AIAssistant] Error from Groq AI service:', err);
      setLastFailedMessage(text);
      const errMsg: MessageItem = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: `Error contacting Groq AI: ${(err as Error).message || 'Service temporarily unavailable. Please check your connection and retry.'}`,
        timestamp: 'Error',
        error: true,
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (lastFailedMessage) {
      handleSend(lastFailedMessage);
    }
  };

  return (
    <div className="ai-assistant-page">
      {/* Top Header Bar */}
      <div className="ai-top-header">
        <button className="back-btn" onClick={() => navigate(-1)} aria-label="Go back">
          <ChevronLeft size={22} />
        </button>
        <div className="ai-header-info">
          <div className="ai-title-row">
            <span className="ai-name">CelebrAI</span>
            <span className="ai-badge-pill" title="Model: openai/gpt-oss-120b">GPT-OSS 120B</span>
          </div>
          <span className="ai-sub">
            {activeEvent?.eventName ? `Planning "${activeEvent.eventName}"` : 'AI Event Planning Assistant'}
          </span>
        </div>
      </div>

      {/* Chat Messages Scrollable Area */}
      <div className="chat-messages-container">
        {historyLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto', color: 'var(--color-tuxedo-black)' }} />
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>Restoring conversation...</p>
          </div>
        ) : (
          messages.map(msg => (
            <div
              key={msg.id}
              className={`message-row ${msg.sender === 'user' ? 'user-row' : 'ai-row'} ${msg.error ? 'error-row' : ''}`}
            >
              {msg.sender === 'ai' && (
                <div className={`ai-avatar-circle ${msg.error ? 'error-avatar' : ''}`}>
                  {msg.error ? <AlertCircle size={15} style={{ color: '#dc2626' }} /> : <Sparkles size={15} />}
                </div>
              )}

              <div className="bubble-wrapper">
                <div
                  className={`chat-bubble ${msg.sender === 'user' ? 'user-bubble' : 'ai-bubble'}`}
                  style={msg.error ? { border: '1px solid #f87171', background: '#fef2f2', color: '#991b1b' } : undefined}
                >
                  <p className="bubble-text" style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="bubble-timestamp">{msg.timestamp}</span>
                  {msg.error && lastFailedMessage && (
                    <button
                      onClick={handleRetry}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'none',
                        border: 'none',
                        color: '#dc2626',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      <RotateCcw size={11} /> Retry
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="message-row ai-row">
            <div className="ai-avatar-circle">
              <Sparkles size={15} />
            </div>
            <div className="bubble-wrapper">
              <div className="chat-bubble ai-bubble typing-bubble">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Carousel */}
      <div className="quick-prompts-scroller">
        {QUICK_PROMPTS.map((qp, idx) => {
          const Icon = qp.icon;
          return (
            <button
              key={idx}
              className="quick-prompt-chip"
              onClick={() => handleSend(qp.prompt)}
              disabled={loading}
            >
              <Icon size={14} className="chip-icon" />
              <span>{qp.label}</span>
            </button>
          );
        })}
      </div>

      {/* Input Bar */}
      <div className="chat-input-bar">
        <input
          type="text"
          className="chat-text-input"
          placeholder="Ask CelebrAI anything about your event..."
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          disabled={loading}
        />
        <button
          className={`chat-send-btn ${inputVal.trim() && !loading ? 'active' : ''}`}
          onClick={() => handleSend()}
          disabled={!inputVal.trim() || loading}
          aria-label="Send message"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowUp size={18} strokeWidth={2.5} />}
        </button>
      </div>
    </div>
  );
}
