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
  History,
  Plus,
  X,
  MessageSquare,
  Trash2,
} from 'lucide-react';
import { useEvent } from '../../contexts/EventContext';
import { useAuth } from '../../contexts/AuthContext';
import { sendChatMessage, type AIChatMessage } from '../../services/ai/groq';
import {
  getUserConversations,
  getConversationMessages,
  createConversation,
  addMessageToConversation,
  deleteConversation,
  type ConversationRecord,
} from '../../services/firebase/firestore';
import { SafeMarkdown } from '../../components/common/SafeMarkdown';
import './AIAssistant.css';

interface MessageItem {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  error?: boolean;
}

function formatHistoryTime(val: unknown): string {
  if (!val) return 'Just now';
  let date: Date;
  if (typeof (val as { toDate?: () => Date }).toDate === 'function') {
    date = (val as { toDate: () => Date }).toDate();
  } else if (val instanceof Date) {
    date = val;
  } else if (typeof val === 'number') {
    date = new Date(val);
  } else {
    return 'Saved';
  }

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const yesterday = new Date(now.getTime() - 86400000);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function groupConversations(convs: ConversationRecord[]) {
  const groups: {
    today: ConversationRecord[];
    yesterday: ConversationRecord[];
    lastWeek: ConversationRecord[];
    older: ConversationRecord[];
  } = {
    today: [],
    yesterday: [],
    lastWeek: [],
    older: [],
  };

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86400000;
  const startOfLastWeek = startOfToday - 7 * 86400000;

  convs.forEach((c) => {
    let t = 0;
    if (c.updatedAt && typeof (c.updatedAt as { toMillis?: () => number }).toMillis === 'function') {
      t = (c.updatedAt as { toMillis: () => number }).toMillis();
    } else if (c.updatedAt instanceof Date) {
      t = c.updatedAt.getTime();
    } else if (typeof c.updatedAt === 'number') {
      t = c.updatedAt;
    } else if (typeof c.updatedAt === 'string') {
      const parsed = Date.parse(c.updatedAt);
      if (!isNaN(parsed)) t = parsed;
    }

    if (t >= startOfToday) {
      groups.today.push(c);
    } else if (t >= startOfYesterday) {
      groups.yesterday.push(c);
    } else if (t >= startOfLastWeek) {
      groups.lastWeek.push(c);
    } else {
      groups.older.push(c);
    }
  });

  return groups;
}

export function AIAssistant() {
  const navigate = useNavigate();
  const { activeEvent } = useEvent();
  const { user, idToken } = useAuth();

  const [activeConvId, setActiveConvId] = useState<string | null>(() => {
    return sessionStorage.getItem('celebrai_active_chat_id');
  });
  const isCreatingConvRef = useRef<boolean>(false);
  const activeConvIdRef = useRef<string | null>(activeConvId);

  useEffect(() => {
    activeConvIdRef.current = activeConvId;
  }, [activeConvId]);

  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventId = activeEvent?.id;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const welcomeMessage = useMemo<MessageItem>(() => ({
    id: 'welcome',
    sender: 'ai',
    text: activeEvent?.eventName
      ? `👋 Hi! I'm CelebrAI, your personal event planner powered by GPT-OSS 120B. How can I help you with "${activeEvent.eventName}"?`
      : "👋 Hi! I'm CelebrAI, your personal event assistant powered by GPT-OSS 120B. How can I help you today?",
    timestamp: 'Just now',
  }), [activeEvent?.eventName]);

  // Fetch all conversation threads for this authenticated user
  const fetchConversations = useCallback(async () => {
    if (!user) {
      setConversations([]);
      return;
    }
    setHistoryLoading(true);
    try {
      const list = await getUserConversations(user.uid);
      setConversations(list);
    } catch (err) {
      console.warn('[AIAssistant] Error loading user conversations:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, [user]);

  // Load conversations on mount or when user changes
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Load messages for the currently active conversation
  const loadConversationMessages = useCallback(async (convId: string) => {
    setMessagesLoading(true);
    try {
      const msgs = await getConversationMessages(convId);
      // Double check active conversation has not switched while fetching
      if (activeConvIdRef.current !== convId) return;

      if (msgs.length > 0) {
        const restored: MessageItem[] = msgs.map((m) => ({
          id: m.id,
          sender: m.role === 'assistant' ? 'ai' : 'user',
          text: m.content || '',
          timestamp: formatHistoryTime(m.createdAt),
        }));
        setMessages(restored);
      } else {
        setMessages([welcomeMessage]);
      }
    } catch (err) {
      console.warn('[AIAssistant] Error loading conversation messages:', err);
      if (activeConvIdRef.current === convId) {
        setMessages([welcomeMessage]);
      }
    } finally {
      if (activeConvIdRef.current === convId) {
        setMessagesLoading(false);
      }
    }
  }, [welcomeMessage]);

  // Initialize or restore active chat
  useEffect(() => {
    if (isCreatingConvRef.current) {
      // Just provisioned via handleSend — preserve in-flight message state
      isCreatingConvRef.current = false;
      return;
    }

    if (activeConvId) {
      loadConversationMessages(activeConvId);
    } else {
      setMessages([welcomeMessage]);
    }
  }, [activeConvId, loadConversationMessages, welcomeMessage]);

  // Start a fresh, clean conversation without deleting previous chats
  const handleNewChat = useCallback(() => {
    isCreatingConvRef.current = false;
    activeConvIdRef.current = null;
    setActiveConvId(null);
    sessionStorage.removeItem('celebrai_active_chat_id');
    setMessages([welcomeMessage]);
    setInputVal('');
    setLastFailedMessage(null);
    setShowHistory(false);
  }, [welcomeMessage]);

  // Select a conversation from the history list
  const handleSelectConversation = useCallback((conv: ConversationRecord) => {
    isCreatingConvRef.current = false;
    activeConvIdRef.current = conv.id;
    setActiveConvId(conv.id);
    sessionStorage.setItem('celebrai_active_chat_id', conv.id);
    setShowHistory(false);
  }, []);

  // Delete a conversation thread
  const handleDeleteConversation = useCallback(async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this conversation?')) return;

    try {
      await deleteConversation(convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeConvId === convId) {
        handleNewChat();
      }
    } catch (err) {
      console.error('[AIAssistant] Failed to delete conversation:', err);
    }
  }, [activeConvId, handleNewChat]);

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
    const userMsgId = `usr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const userMsg: MessageItem = {
      id: userMsgId,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setLoading(true);

    let targetConvId = activeConvId;

    // If starting a fresh chat, create the conversation thread in Firestore
    if (!targetConvId && user) {
      try {
        const titleSnippet = text.length > 36 ? `${text.slice(0, 36)}...` : text;
        isCreatingConvRef.current = true;
        targetConvId = await createConversation({
          userId: user.uid,
          title: titleSnippet,
          eventId: eventId && !eventId.startsWith('evt-') ? eventId : null,
          eventName: activeEvent?.eventName || null,
          initialMessage: text,
        });
        activeConvIdRef.current = targetConvId;
        setActiveConvId(targetConvId);
        sessionStorage.setItem('celebrai_active_chat_id', targetConvId);
        fetchConversations();
      } catch (err) {
        isCreatingConvRef.current = false;
        console.warn('[AIAssistant] Error creating conversation:', err);
      }
    } else if (targetConvId && user) {
      // Persist user message to Firestore if conversation already existed
      try {
        await addMessageToConversation(targetConvId, {
          role: 'user',
          content: text,
        });
      } catch (err) {
        console.warn('[AIAssistant] Failed to persist user message:', err);
      }
    }

    try {
      // Build conversation history for API
      const history: AIChatMessage[] = messages
        .filter((m) => m.id !== 'welcome' && !m.error)
        .map((m) => ({
          role: m.sender === 'ai' ? 'assistant' : 'user',
          content: m.text,
        }));
      history.push({ role: 'user', content: text });

      const token = user ? await user.getIdToken() : idToken || '';
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
        token
      );

      const aiMsg: MessageItem = {
        id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        sender: 'ai',
        text: reply || 'I received your message. How else may I assist you?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      // Only append to screen if user is still on this conversation thread
      if (activeConvIdRef.current === targetConvId || (!activeConvIdRef.current && !targetConvId)) {
        setMessages((prev) => [...prev, aiMsg]);
      }

      // Save AI reply to Firestore conversation
      if (targetConvId && user) {
        try {
          await addMessageToConversation(targetConvId, {
            role: 'assistant',
            content: aiMsg.text,
          });
          fetchConversations();
        } catch (err) {
          console.warn('[AIAssistant] Failed to persist assistant reply:', err);
        }
      }
    } catch (err) {
      console.error('[AIAssistant] Error from Groq AI service:', err);
      setLastFailedMessage(text);
      const errMsg: MessageItem = {
        id: `err-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        sender: 'ai',
        text: `Error communicating with AI service: ${(err as Error).message || 'Service temporarily unavailable. Please retry.'}`,
        timestamp: 'Error',
        error: true,
      };
      if (activeConvIdRef.current === targetConvId || (!activeConvIdRef.current && !targetConvId)) {
        setMessages((prev) => [...prev, errMsg]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (lastFailedMessage && !loading) {
      handleSend(lastFailedMessage);
    }
  };

  const grouped = useMemo(() => groupConversations(conversations), [conversations]);

  return (
    <div className="ai-assistant-page">
      {/* Top Header Bar */}
      <div className="ai-top-header">
        <button className="back-btn" onClick={() => navigate(-1)} aria-label="Go back">
          <ChevronLeft size={22} />
        </button>
        <div className="ai-header-info">
          <div className="ai-brand-title-row">
            <img
              src="/assets/branding/celebrai-icon.png"
              alt=""
              className="ai-header-brand-icon"
            />
            <span className="ai-name font-serif">CelebrAI</span>
          </div>
          <span className="ai-sub">
            GPT-OSS 120B · {activeEvent?.eventName ? `Planning "${activeEvent.eventName}"` : 'Planning your event'}
          </span>
        </div>

        {/* Right Header Action Controls */}
        <div className="ai-header-actions">
          <button
            type="button"
            className="ai-history-btn"
            onClick={() => setShowHistory(true)}
            aria-label="Chat History"
            title="Chat History"
          >
            <History size={18} />
          </button>
          <button
            type="button"
            className="ai-new-chat-btn"
            onClick={handleNewChat}
            aria-label="New Chat"
            title="Start New Chat"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Chat Messages Scrollable Area */}
      <div className="chat-messages-container">
        {messagesLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto', color: 'var(--color-tuxedo-black)' }} />
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>Loading conversation...</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`message-row ${msg.sender === 'user' ? 'user-row' : 'ai-row'} ${msg.error ? 'error-row' : ''}`}
            >
              {msg.sender === 'ai' && (
                <div className="ai-avatar-icon">
                  <img
                    src="/assets/branding/celebrai-icon.png"
                    alt="CelebrAI"
                    className="ai-brand-avatar"
                  />
                </div>
              )}
              <div className="message-bubble">
                {msg.sender === 'ai' ? (
                  <SafeMarkdown content={msg.text} />
                ) : (
                  <div className="msg-text-content" style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                )}
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
              <img
                src="/assets/branding/celebrai-icon.png"
                alt="CelebrAI"
                className="ai-brand-avatar"
              />
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
                onClick={() => handleSend(qp.prompt)}
                disabled={loading}
              >
                <Icon size={14} className="chip-icon" />
                <span>{qp.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Input Dock */}
      <div className="chat-input-dock">
        <form
          className="chat-input-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <textarea
            aria-label="Message prompt"
            className="chat-text-input"
            rows={1}
            placeholder={
              activeEvent?.eventName
                ? `Ask anything about "${activeEvent.eventName}"...`
                : 'Ask anything about your celebration...'
            }
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            type="submit"
            className={`chat-send-btn ${inputVal.trim() && !loading ? 'active' : ''}`}
            disabled={!inputVal.trim() || loading}
            aria-label="Send message"
          >
            <ArrowUp size={18} />
          </button>
        </form>
      </div>

      {/* Chat History Drawer Overlay */}
      {showHistory && (
        <div className="history-drawer-backdrop" onClick={() => setShowHistory(false)}>
          <div className="history-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="history-drawer-header">
              <div className="history-header-title-row">
                <History size={18} />
                <h3 className="history-drawer-title font-serif">Chat History</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  type="button"
                  className="history-new-chat-btn"
                  onClick={handleNewChat}
                  title="Start New Chat"
                >
                  <Plus size={15} />
                  <span>New</span>
                </button>
                <button
                  type="button"
                  className="history-close-btn"
                  onClick={() => setShowHistory(false)}
                  aria-label="Close History"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="history-drawer-content">
              {historyLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto', color: 'var(--color-tuxedo-black)' }} />
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>Loading previous chats...</p>
                </div>
              ) : conversations.length === 0 ? (
                <div className="history-empty-view">
                  <MessageSquare size={32} style={{ color: 'var(--border-default)', margin: '0 auto 12px' }} />
                  <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-tuxedo-black)', margin: '0 0 4px' }}>
                    No conversations yet
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 16px' }}>
                    Messages you send will automatically sync to your account history.
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleNewChat}
                    style={{ fontSize: '12.5px', padding: '6px 16px', borderRadius: 'var(--radius-full)' }}
                  >
                    Start a New Chat
                  </button>
                </div>
              ) : (
                <div className="history-groups-list">
                  {grouped.today.length > 0 && (
                    <div className="history-date-group">
                      <span className="history-group-label">Today</span>
                      {grouped.today.map((c) => (
                        <div
                          key={c.id}
                          className={`history-item-row ${activeConvId === c.id ? 'active' : ''}`}
                          onClick={() => handleSelectConversation(c)}
                        >
                          <div className="history-item-body">
                            <span className="history-item-title">{c.title}</span>
                            <span className="history-item-preview">
                              {c.lastMessagePreview || 'No messages yet'}
                            </span>
                          </div>
                          <div className="history-item-actions">
                            <span className="history-item-time">{formatHistoryTime(c.updatedAt)}</span>
                            <button
                              type="button"
                              className="history-del-btn"
                              onClick={(e) => handleDeleteConversation(e, c.id)}
                              title="Delete conversation"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {grouped.yesterday.length > 0 && (
                    <div className="history-date-group">
                      <span className="history-group-label">Yesterday</span>
                      {grouped.yesterday.map((c) => (
                        <div
                          key={c.id}
                          className={`history-item-row ${activeConvId === c.id ? 'active' : ''}`}
                          onClick={() => handleSelectConversation(c)}
                        >
                          <div className="history-item-body">
                            <span className="history-item-title">{c.title}</span>
                            <span className="history-item-preview">
                              {c.lastMessagePreview || 'No messages yet'}
                            </span>
                          </div>
                          <div className="history-item-actions">
                            <span className="history-item-time">{formatHistoryTime(c.updatedAt)}</span>
                            <button
                              type="button"
                              className="history-del-btn"
                              onClick={(e) => handleDeleteConversation(e, c.id)}
                              title="Delete conversation"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {grouped.lastWeek.length > 0 && (
                    <div className="history-date-group">
                      <span className="history-group-label">Previous 7 Days</span>
                      {grouped.lastWeek.map((c) => (
                        <div
                          key={c.id}
                          className={`history-item-row ${activeConvId === c.id ? 'active' : ''}`}
                          onClick={() => handleSelectConversation(c)}
                        >
                          <div className="history-item-body">
                            <span className="history-item-title">{c.title}</span>
                            <span className="history-item-preview">
                              {c.lastMessagePreview || 'No messages yet'}
                            </span>
                          </div>
                          <div className="history-item-actions">
                            <span className="history-item-time">{formatHistoryTime(c.updatedAt)}</span>
                            <button
                              type="button"
                              className="history-del-btn"
                              onClick={(e) => handleDeleteConversation(e, c.id)}
                              title="Delete conversation"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {grouped.older.length > 0 && (
                    <div className="history-date-group">
                      <span className="history-group-label">Older</span>
                      {grouped.older.map((c) => (
                        <div
                          key={c.id}
                          className={`history-item-row ${activeConvId === c.id ? 'active' : ''}`}
                          onClick={() => handleSelectConversation(c)}
                        >
                          <div className="history-item-body">
                            <span className="history-item-title">{c.title}</span>
                            <span className="history-item-preview">
                              {c.lastMessagePreview || 'No messages yet'}
                            </span>
                          </div>
                          <div className="history-item-actions">
                            <span className="history-item-time">{formatHistoryTime(c.updatedAt)}</span>
                            <button
                              type="button"
                              className="history-del-btn"
                              onClick={(e) => handleDeleteConversation(e, c.id)}
                              title="Delete conversation"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
