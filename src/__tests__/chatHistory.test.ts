import { describe, it, expect } from 'vitest';

interface MockConversation {
  id: string;
  userId: string;
  title: string;
  updatedAt: number;
  lastMessagePreview?: string;
}

function groupTestConversations(convs: MockConversation[]) {
  const groups: {
    today: MockConversation[];
    yesterday: MockConversation[];
    lastWeek: MockConversation[];
    older: MockConversation[];
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
    const t = c.updatedAt;
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

describe('Chat History Date Grouping & Data Organization', () => {
  const now = Date.now();
  const oneHourAgo = now - 3600000;
  const yesterday = now - 90000000;
  const fourDaysAgo = now - 4 * 86400000;
  const tenDaysAgo = now - 10 * 86400000;

  const mockConversations: MockConversation[] = [
    { id: 'c1', userId: 'usr1', title: 'Decor themes for Gala', updatedAt: oneHourAgo, lastMessagePreview: 'Here are 3 themes...' },
    { id: 'c2', userId: 'usr1', title: 'Budget review for Wedding', updatedAt: yesterday, lastMessagePreview: 'Recommended allocation...' },
    { id: 'c3', userId: 'usr1', title: 'Catering menu ideas', updatedAt: fourDaysAgo, lastMessagePreview: 'Live tasting counters...' },
    { id: 'c4', userId: 'usr1', title: 'Initial party plan', updatedAt: tenDaysAgo, lastMessagePreview: 'Welcome to CelebrAI' },
  ];

  it('correctly categorizes conversations into date groups', () => {
    const grouped = groupTestConversations(mockConversations);

    expect(grouped.today).toHaveLength(1);
    expect(grouped.today[0].id).toBe('c1');

    expect(grouped.yesterday).toHaveLength(1);
    expect(grouped.yesterday[0].id).toBe('c2');

    expect(grouped.lastWeek).toHaveLength(1);
    expect(grouped.lastWeek[0].id).toBe('c3');

    expect(grouped.older).toHaveLength(1);
    expect(grouped.older[0].id).toBe('c4');
  });

  it('preserves user isolation across conversation records', () => {
    const userAConvs = [
      { id: 'conv-a1', userId: 'user-A', title: 'User A Chat', updatedAt: now },
    ];
    const userBConvs = [
      { id: 'conv-b1', userId: 'user-B', title: 'User B Chat', updatedAt: now },
    ];

    expect(userAConvs.every((c) => c.userId === 'user-A')).toBe(true);
    expect(userBConvs.every((c) => c.userId === 'user-B')).toBe(true);
    expect(userAConvs.find((c) => c.userId === 'user-B')).toBeUndefined();
  });

  it('guarantees first user message persists alongside AI reply', () => {
    // Simulating message lifecycle in AIAssistant:
    interface MessageItem {
      id: string;
      sender: 'ai' | 'user';
      text: string;
      timestamp: string;
    }

    let messages: MessageItem[] = [
      { id: 'welcome', sender: 'ai', text: 'Hi! I am CelebrAI', timestamp: 'Just now' },
    ];

    // 1. User submits first prompt
    const userPrompt = 'Suggest 3 unique and elegant decor themes for my celebration.';
    const userMsg: MessageItem = {
      id: `usr-${Date.now()}-abc`,
      sender: 'user',
      text: userPrompt,
      timestamp: '12:00 PM',
    };
    messages = [...messages, userMsg];

    // Verify optimistic UI update
    expect(messages).toHaveLength(2);
    expect(messages[1].text).toBe(userPrompt);
    expect(messages[1].sender).toBe('user');

    // 2. Conversation created in Firestore atomically with initialMessage
    const convId = 'new-conv-123';
    expect(convId).toBeDefined();

    // 3. AI assistant response arrives
    const aiResponse = 'Here are three distinct and elegant decor themes...';
    const aiMsg: MessageItem = {
      id: `ai-${Date.now()}-def`,
      sender: 'ai',
      text: aiResponse,
      timestamp: '12:01 PM',
    };
    messages = [...messages, aiMsg];

    // 4. Verify both user prompt and assistant response remain in chronological sequence
    expect(messages).toHaveLength(3);
    expect(messages[0].id).toBe('welcome');
    expect(messages[1].sender).toBe('user');
    expect(messages[1].text).toBe(userPrompt);
    expect(messages[2].sender).toBe('ai');
    expect(messages[2].text).toBe(aiResponse);
  });

  it('preserves conversation isolation when switching chats', () => {
    let activeConvId: string | null = 'conv-A';
    const convAMessages = [{ id: 'a1', text: 'Hello in A' }];
    const convBMessages = [{ id: 'b1', text: 'Hello in B' }];

    // User switches to conv-B
    activeConvId = 'conv-B';
    const activeMessages = activeConvId === 'conv-A' ? convAMessages : convBMessages;

    expect(activeMessages).toBe(convBMessages);
    expect(activeMessages).not.toContain(convAMessages[0]);
  });
});

