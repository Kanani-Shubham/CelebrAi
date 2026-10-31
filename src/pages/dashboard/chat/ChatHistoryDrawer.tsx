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
          <div className="inline-flex items-center gap-1">
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
            <div className="ui-center-empty">
              <Loader2 className="animate-spin mx-auto text-tuxedo"
                size={24}
              />
              <p className="text-sm text-muted mt-2">
                Loading previous chats...
              </p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="history-empty-view">
              <MessageSquare size={32} className="mx-auto mb-2 text-muted" />
              <p className="text-sm font-semibold text-tuxedo mb-1">
                No conversations yet
              </p>
              <p className="text-xs text-muted mb-4">
                Messages you send will automatically sync to your account history.
              </p>
              <button className="btn btn-primary btn btn-primary rounded-full text-xs"
                type="button"
                onClick={onNewChat}
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
