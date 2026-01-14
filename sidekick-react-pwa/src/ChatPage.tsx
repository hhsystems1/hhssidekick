/**
 * ChatPage Component
 * AI chat interface with agent integration
 */

import { useState, useRef, useEffect } from 'react';
import { processWithAgents } from './agents';
import { supabase } from './lib/supabaseClient';
import { useConversations, useMessages } from './hooks/useChat';

const MOCK_USER_ID = '00000000-0000-0000-0000-000000000000';

export function ChatPage() {
  const [userId, setUserId] = useState<string>(MOCK_USER_ID);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { conversations, createConversation } = useConversations(userId);
  const { messages: dbMessages, addMessage } = useMessages(activeChat, userId);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUser();
  }, []);

  const handleNewChat = async () => {
    const newConv = await createConversation(`New Chat ${conversations.length + 1}`);
    if (newConv) {
      setActiveChat(newConv.id);
    }
  };

  const getTextColorForBg = (bg: string) => {
    const hex = bg.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance > 140 ? '#000000' : '#FFFFFF';
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [dbMessages]);

  const activeMessages = dbMessages.map((msg) => ({
    id: msg.id,
    text: msg.content,
    sender: msg.sender === 'user' ? 'user' : 'bot' as 'user' | 'bot',
    timestamp: new Date(msg.created_at),
  }));

  const getConversationTitle = (convId: string) => {
    const conv = conversations.find((c) => c.id === convId);
    return conv?.title || 'New Chat';
  };

  const getConversationLastMessage = (convId: string) => {
    const convMessages = dbMessages.filter((m) => m.conversation_id === convId);
    if (convMessages.length === 0) return 'Start the conversation...';
    const lastMsg = convMessages[convMessages.length - 1];
    return lastMsg.content.length > 40 ? lastMsg.content.substring(0, 40) + '...' : lastMsg.content;
  };

  return (
    <div className="h-full grid grid-cols-[280px,1fr]">
      <aside className="flex flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 dark:border-slate-800">
          <h2 className="text-sm font-semibold">Chats</h2>
          <button onClick={handleNewChat} className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800" aria-label="New chat">
            <span className="material-icons text-[18px]">add</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setActiveChat(conv.id)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800 ${activeChat === conv.id ? 'bg-slate-100 dark:bg-slate-800/70' : ''}`}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-base dark:bg-slate-700">💬</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="truncate text-sm font-medium">{conv.title}</div>
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                </div>
                <div className="truncate text-xs text-slate-500 dark:text-slate-400">{getConversationLastMessage(conv.id)}</div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <main className="flex h-full flex-col">
        {activeChat ? (
          <>
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-900/60">
              <div className="flex items-center gap-2 text-sm font-medium">
                {getConversationTitle(activeChat)}
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
              </div>
              {error && (
                <div className="rounded-md border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[11px] text-red-200">{error}</div>
              )}
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto bg-slate-50 p-3 dark:bg-slate-900">
              {activeMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {(() => {
                    const bg = msg.sender === 'user' ? '#1a73e8' : '#1f2937';
                    const color = getTextColorForBg(bg);
                    return (
                      <div className="max-w-[75%] rounded-2xl px-3 py-2 shadow-sm" style={{ backgroundColor: bg, color }}>
                        <div className="whitespace-pre-wrap text-sm">{msg.text}</div>
                        <div className="mt-1 text-right text-[10px]" style={{ color: msg.sender === 'user' ? 'rgba(255,255,255,0.8)' : '#9ca3af' }}>
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!message.trim() || !activeChat || isSending) return;
                setError(null);
                const text = message;
                setMessage('');

                // Save the user message and get the returned message data
                const userMessage = await addMessage(text, 'user');

                setIsSending(true);
                try {
                  const userContext = {
                    userId,
                    currentProject: 'Helping Hands Systems',
                    recentTopics: [],
                  };

                  // Build message history including the current user message
                  const messageHistory = dbMessages.map((msg) => ({
                    id: msg.id,
                    conversationId: activeChat,
                    sender: msg.sender as 'user' | 'assistant' | 'system',
                    content: msg.content,
                    timestamp: new Date(msg.created_at),
                  }));

                  // Add the current user message to the history
                  if (userMessage) {
                    messageHistory.push({
                      id: userMessage.id,
                      conversationId: activeChat,
                      sender: 'user' as const,
                      content: text,
                      timestamp: new Date(userMessage.created_at),
                    });
                  }

                  const agentResponse = await processWithAgents({
                    messageContent: text,
                    userContext,
                    conversationId: activeChat,
                    messageHistory,
                  });

                  await addMessage(agentResponse.content, 'assistant', agentResponse.agentType, agentResponse.behavioralMode);

                  console.log('Agent Response:', {
                    agentType: agentResponse.agentType,
                    behavioralMode: agentResponse.behavioralMode,
                    tokensUsed: agentResponse.metadata.tokensUsed,
                    executionTimeMs: agentResponse.metadata.executionTimeMs,
                  });
                } catch (err: any) {
                  setError(`Agent error: ${err.message}`);
                  console.error('Agent processing failed:', err);
                } finally {
                  setIsSending(false);
                }
              }}
              className="flex items-center gap-2 border-t border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900/60"
            >
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={isSending ? 'Sending...' : 'Type a message...'}
                disabled={isSending}
                className="flex-1 rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              <button
                type="submit"
                aria-label="Send"
                disabled={!message.trim() || isSending}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-emerald-50 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-900/50"
              >
                <span className="material-icons text-[18px]">send</span>
              </button>
            </form>
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-slate-500">
              <span className="material-icons text-4xl text-slate-400">chat</span>
              <h2 className="mt-1 text-sm font-medium">Select a chat to start messaging</h2>
              <p className="text-xs">Or create a new conversation</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
