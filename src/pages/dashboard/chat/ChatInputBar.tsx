import React from 'react';
import { ArrowUp } from 'lucide-react';

interface QuickPrompt {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  prompt: string;
}

interface ChatInputBarProps {
  inputVal: string;
  loading: boolean;
  quickPrompts: QuickPrompt[];
  placeholder: string;
  onInputChange: (val: string) => void;
  onSend: (textToSend?: string) => void;
}

export function ChatInputBar({
  inputVal,
  loading,
  quickPrompts,
  placeholder,
  onInputChange,
  onSend,
}: ChatInputBarProps) {
  return (
    <>
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
                onClick={() => onSend(qp.prompt)}
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
            onSend();
          }}
        >
          <textarea
            aria-label="Message prompt"
            className="chat-text-input"
            rows={1}
            placeholder={placeholder}
            value={inputVal}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSend();
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
    </>
  );
}
