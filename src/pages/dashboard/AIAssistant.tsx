import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
    if (!eventId || !user || eventId.startsWith('evt-')) {
      setMessages([
        {
          id: 'welcome',
          sender: 'ai',
          text: activeEvent?.eventName
            ? `👋 Hi! I'm CelebrAI, powered by GPT-OSS 120B. How can I help you with "${activeEvent.eventName}" today?`
            : "👋 Hi! I'm CelebrAI, your personal event assistant powered by GPT-OSS 120B. How can I help you today?",
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
          timestamp: r.createdAt?.toDate
            ? r.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Saved',
        }));
        setMessages(restored);
      } else {
        setMessages([
          {
            id: 'welcome',
            sender: 'ai',
            text: `👋 Hi! I'm CelebrAI, your personal event planner powered by GPT-OSS 120B. How can I help you with "${activeEvent.eventName || 'your celebration'}"?`,
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
          text: "👋 Hi! I'm CelebrAI, powered by GPT-OSS 120B. How can I assist you today?",
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

  // Dynamic quick action prompts using real event context
  const quickPrompts = useMemo(() => {
    const eventName = activeEvent?.eventName || 'our celebration';
    const hasGuests = Boolean(activeEvent?.guestCount && Number(activeEvent.guestCount) > 0);
    const hasBudget = Boolean(activeEvent?.budget && Number(activeEvent.budget) > 0);
    const currency = activeEvent?.currency || '₹';

    return [
      {
        icon: Search,
        label: 'Recommend caterers',
        prompt: hasGuests
          ? `Recommend catering menu styles and service options for "${eventName}" for ${activeEvent?.guestCount} guests.`
          : `Recommend catering menu styles and service options suitable for "${eventName}".`,
      },
      {
        icon: Palette,
        label: 'Suggest decor themes',
        prompt: activeEvent?.theme
          ? `Suggest 3 refined decor themes inspired by ${activeEvent.theme} for "${eventName}".`
          : `Suggest 3 unique and elegant decor themes for "${eventName}".`,
      },
      {
        icon: Clock,
        label: 'Create hour-by-hour timeline',
        prompt: `Generate an hour-by-hour event day schedule for "${eventName}" from morning setup to night wrap-up.`,
      },
      {
        icon: PieChart,
        label: 'Optimize my budget',
        prompt: hasBudget
          ? `Review our budget of ${currency} ${Number(activeEvent?.budget).toLocaleString('en-IN')} for "${eventName}" and suggest optimal percentage allocations.`
          : `Suggest percentage budget allocations across venue, catering, decor, and entertainment for "${eventName}".`,
      },
      {
        icon: Mail,
        label: 'Draft invitation text',
        prompt: `Write an elegant, warm invitation message for "${eventName}" suitable for digital cards and WhatsApp.`,
      },
    ];
  }, [activeEvent]);

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

    // Save user message to Firestore if in real event
    if (eventId && user && !eventId.startsWith('evt-')) {
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

      // Pass only confirmed event data without inventing assumptions
      const reply = await sendChatMessage(
        history,
        {
          eventName: activeEvent?.eventName || '',
          eventType: activeEvent?.eventType || '',
          location: activeEvent?.location && activeEvent.location !== 'TBD' ? activeEvent.location : '',
          guestCount: Number(activeEvent?.guestCount) > 0 ? Number(activeEvent?.guestCount) : null,
          budget: Number(activeEvent?.budget) > 0 ? Number(activeEvent?.budget) : null,
          currency: activeEvent?.currency || '₹',
        },
        idToken || ''
      );

      const aiMsg: MessageItem = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: reply || 'I received your message. How else may I assist you?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, aiMsg]);

      // Save AI message to Firestore
      if (eventId && user && !eventId.startsWith('evt-')) {
        try {
          await saveConversationMessage(eventId, user.uid, {
            role: 'assistant',
            content: aiMsg.text,
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
        text: `Error communicating with AI service: ${(err as Error).message || 'Service temporarily unavailable. Please retry.'}`,
        timestamp: 'Error',
        error: true,
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (lastFailedMessage && !loading) {
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
            <span className="ai-name font-serif">CelebrAI</span>
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
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>Loading conversation history...</p>
          </div>
        ) : (
          messages.map(msg => (
            <div
              key={msg.id}
              className={`message-row ${msg.sender === 'user' ? 'user-row' : 'ai-row'} ${msg.error ? 'error-row' : ''}`}
            >
              {msg.sender === 'ai' && (
                <div className="ai-avatar-icon">
                  <Sparkles size={16} />
                </div>
              )}
              <div className="message-bubble">
                <div className="msg-text-content" style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                <div className="msg-meta-row">
                  <span className="msg-timestamp">{msg.timestamp}</span>
                  {msg.error && (
                    <button className="msg-retry-btn" onClick={handleRetry} title="Retry sending">
                      <RotateCcw size={12} /> Retry
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="message-row ai-row">
            <div className="ai-avatar-icon">
              <Sparkles size={16} />
            </div>
            <div className="message-bubble typing-bubble">
              <Loader2 size={16} className="animate-spin" />
              <span>Thinking with GPT-OSS 120B...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Action Suggestion Chips */}
      <div className="quick-prompts-scroll-wrap">
        <div className="quick-prompts-row">
          {quickPrompts.map((qp, idx) => {
            const Icon = qp.icon;
            return (
              <button
                key={idx}
                type="button"
                className="quick-chip-btn"
                disabled={loading}
                onClick={() => handleSend(qp.prompt)}
              >
                <Icon size={14} className="chip-icon" />
                <span>{qp.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Message Input Box */}
      <div className="chat-input-dock">
        <form
          className="chat-input-form"
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
        >
          <input
            type="text"
            className="chat-text-input"
            placeholder={activeEvent?.eventName ? `Ask anything about "${activeEvent.eventName}"...` : "Ask anything about your celebration..."}
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            className="chat-send-btn"
            disabled={!inputVal.trim() || loading}
            aria-label="Send message"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowUp size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
}
