import React, { useMemo } from 'react';
import { History, Plus, X, MessageSquare, Trash2, Loader2 } from 'lucide-react';
import type { ConversationRecord } from '../../../services/firebase/firestore';
import { groupConversations, formatHistoryTime } from './types';

interface ChatHistoryDrawerProps {
  isOpen: boolean;
  activeConvId: string | null;
  conversations: ConversationRecord[];
  historyLoading: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onSelectConversation: (conv: ConversationRecord) => void;
  onDeleteConversation: (e: React.MouseEvent, convId: string) => void;
}

export function ChatHistoryDrawer({
  isOpen,
  activeConvId,
  conversations,
  historyLoading,
  onClose,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
}: ChatHistoryDrawerProps) {
  const grouped = useMemo(() => groupConversations(conversations), [conversations]);

  if (!isOpen) return null;

  return (
    <div className="history-drawer-backdrop" onClick={onClose}>
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
              onClick={onNewChat}
              title="Start New Chat"
            >
              <Plus size={15} />
              <span>New</span>
            </button>
            <button
              type="button"
              className="history-close-btn"
              onClick={onClose}
              aria-label="Close History"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="history-drawer-content">
          {historyLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <Loader2
                size={24}
                className="animate-spin"
                style={{ margin: '0 auto', color: 'var(--color-tuxedo-black)' }}
              />
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                Loading previous chats...
              </p>
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
                onClick={onNewChat}
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
                      onClick={() => onSelectConversation(c)}
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
                          onClick={(e) => onDeleteConversation(e, c.id)}
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
                      onClick={() => onSelectConversation(c)}
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
                          onClick={(e) => onDeleteConversation(e, c.id)}
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
                      onClick={() => onSelectConversation(c)}
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
                          onClick={(e) => onDeleteConversation(e, c.id)}
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
                      onClick={() => onSelectConversation(c)}
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
                          onClick={(e) => onDeleteConversation(e, c.id)}
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
  );
}
