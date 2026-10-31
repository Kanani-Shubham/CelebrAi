import type { RefObject } from 'react';
import { Loader2, RotateCcw } from 'lucide-react';
import { SafeMarkdown } from '../../../components/common/SafeMarkdown';
import { AI_MODEL_NAME } from '../../../config/ai';
import type { MessageItem } from './types';

interface ChatMessageListProps {
  messages: MessageItem[];
  loading: boolean;
  messagesLoading: boolean;
  onRetry: () => void;
  messagesEndRef: RefObject<HTMLDivElement | null>;
}

export function ChatMessageList({
  messages,
  loading,
  messagesLoading,
  onRetry,
  messagesEndRef,
}: ChatMessageListProps) {
  return (
    <div className="chat-messages-container">
      {messagesLoading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Loader2
            size={24}
            className="animate-spin"
            style={{ margin: '0 auto', color: 'var(--color-tuxedo-black)' }}
          />
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
            Loading conversation...
          </p>
        </div>
      ) : (
        messages.map((msg) => (
          <div
            key={msg.id}
            className={`message-row ${msg.sender === 'user' ? 'user-row' : 'ai-row'} ${
              msg.error ? 'error-row' : ''
            }`}
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
                <div className="msg-text-content" style={{ whiteSpace: 'pre-wrap' }}>
                  {msg.text}
                </div>
              )}
              <div className="msg-meta-row">
                <span className="msg-timestamp">{msg.timestamp}</span>
                {msg.error && (
                  <button className="msg-retry-btn" onClick={onRetry} title="Retry sending">
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
            <span>Thinking with {AI_MODEL_NAME}...</span>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
