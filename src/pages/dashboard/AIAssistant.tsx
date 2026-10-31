import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  History,
  Plus,
} from 'lucide-react';
import { AI_MODEL_NAME } from '../../config/ai';
import { useAIChat } from './chat/useAIChat';
import { ChatHistoryDrawer } from './chat/ChatHistoryDrawer';
import { ChatMessageList } from './chat/ChatMessageList';
import { ChatInputBar } from './chat/ChatInputBar';

// Re-export for unit tests
export type { MessageItem } from './chat/types';

import './AIAssistant.css';

export function AIAssistant() {
  const navigate = useNavigate();
  const {
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
  } = useAIChat();

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
            {AI_MODEL_NAME} · {activeEvent?.eventName ? `Planning "${activeEvent.eventName}"` : 'Planning your event'}
          </span>
        </div>

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
      <ChatMessageList
        messages={messages}
        loading={loading}
        messagesLoading={messagesLoading}
        onRetry={handleRetry}
        messagesEndRef={messagesEndRef}
      />

      {/* Quick Action Chips & Input Bar */}
      <ChatInputBar
        inputVal={inputVal}
        loading={loading}
        quickPrompts={quickPrompts}
        placeholder={
          activeEvent?.eventName
            ? `Ask anything about "${activeEvent.eventName}"...`
            : 'Ask anything about your celebration...'
        }
        onInputChange={setInputVal}
        onSend={handleSend}
      />

      {/* Chat History Drawer Overlay */}
      <ChatHistoryDrawer
        isOpen={showHistory}
        activeConvId={activeConvId}
        conversations={conversations}
        historyLoading={historyLoading}
        onClose={() => setShowHistory(false)}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
      />
    </div>
  );
}
