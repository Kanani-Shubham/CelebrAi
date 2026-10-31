import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Palette,
  Clock,
  PieChart,
  Mail,
} from 'lucide-react';
import { useEvent } from '../../../contexts/useEvent';
import { useAuth } from '../../../contexts/useAuth';
import { sendChatMessage, type AIChatMessage } from '../../../services/ai/groq';
import {
  getUserConversations,
  getConversationMessages,
  createConversation,
  addMessageToConversation,
  deleteConversation,
  type ConversationRecord,
} from '../../../services/firebase/firestore';
import { AI_MODEL_NAME } from '../../../config/ai';
import { logger } from '../../../utils/logger';
import {
  type MessageItem,
  formatHistoryTime,
} from './types';

export function useAIChat() {
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
  const [historyLoading, _setHistoryLoading] = useState(false);

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
      ? `👋 Hi! I'm CelebrAI, your personal event planner powered by ${AI_MODEL_NAME}. How can I help you with "${activeEvent.eventName}"?`
      : `👋 Hi! I'm CelebrAI, your personal event assistant powered by ${AI_MODEL_NAME}. How can I help you today?`,
    timestamp: 'Just now',
  }), [activeEvent?.eventName]);

  useEffect(() => {
    let ignore = false;
    if (!user) return;
    const currentUid = user.uid;
    async function initConvs() {
      try {
        const list = await getUserConversations(currentUid);
        if (!ignore) setConversations(list);
      } catch (err) {
        logger.warn('[AIAssistant] Error loading user conversations:', err);
      }
    }
    void initConvs();
    return () => { ignore = true; };
  }, [user]);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    try {
      const list = await getUserConversations(user.uid);
      setConversations(list);
    } catch (err) {
      logger.warn('[AIAssistant] Error reloading conversations:', err);
    }
  }, [user]);

  useEffect(() => {
    let ignore = false;
    if (isCreatingConvRef.current) {
      isCreatingConvRef.current = false;
      return;
    }
    if (!activeConvId) return;

    async function fetchMsgs() {
      try {
        const msgs = await getConversationMessages(activeConvId!);
        if (ignore || activeConvIdRef.current !== activeConvId) return;
        if (msgs.length > 0) {
          const restored: MessageItem[] = msgs.map((m) => ({
            id: m.id,
            sender: m.role === 'assistant' ? 'ai' : 'user',
            text: m.content || '',
            timestamp: formatHistoryTime(m.createdAt),
          }));
          setMessages(restored);
        }
      } catch (err) {
        logger.warn('[AIAssistant] Error loading messages:', err);
      } finally {
        if (!ignore && activeConvIdRef.current === activeConvId) {
          setMessagesLoading(false);
        }
      }
    }
    void fetchMsgs();
    return () => { ignore = true; };
  }, [activeConvId]);

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

  const handleSelectConversation = useCallback((conv: ConversationRecord) => {
    isCreatingConvRef.current = false;
    activeConvIdRef.current = conv.id;
    setActiveConvId(conv.id);
    sessionStorage.setItem('celebrai_active_chat_id', conv.id);
    setShowHistory(false);
  }, []);

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
      logger.error('[AIAssistant] Failed to delete conversation:', err);
    }
  }, [activeConvId, handleNewChat]);

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
        logger.warn('[AIAssistant] Error creating conversation:', err);
      }
    } else if (targetConvId && user) {
      try {
        await addMessageToConversation(targetConvId, {
          role: 'user',
          content: text,
        });
      } catch (err) {
        logger.warn('[AIAssistant] Failed to persist user message:', err);
      }
    }

    try {
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

      if (activeConvIdRef.current === targetConvId || (!activeConvIdRef.current && !targetConvId)) {
        setMessages((prev) => [...prev, aiMsg]);
      }

      if (targetConvId && user) {
        try {
          await addMessageToConversation(targetConvId, {
            role: 'assistant',
            content: aiMsg.text,
          });
          fetchConversations();
        } catch (err) {
          logger.warn('[AIAssistant] Failed to persist assistant reply:', err);
        }
      }
    } catch (err) {
      logger.error('[AIAssistant] Error from Groq AI service:', err);
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

  return {
    activeEvent,
    activeConvId,
    conversations,
    showHistory,
    setShowHistory,
    historyLoading,
    messages,
    inputVal,
    setInputVal,
    loading,
    messagesLoading,
    messagesEndRef,
    quickPrompts,
    handleNewChat,
    handleSelectConversation,
    handleDeleteConversation,
    handleSend,
    handleRetry,
  };
}

