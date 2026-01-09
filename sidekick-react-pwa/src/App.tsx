import { useState, useRef, useEffect } from 'react';
import './index.css';
import { SidekickHome } from './SidekickHome';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
};

type Chat = {
  id: string;
  name: string;
  lastMessage: string;
  unread: number;
  avatar: string;
  isOnline: boolean;
  messages: Message[];
};

function App() {
  type View = 'chat' | 'home';
  const [view, setView] = useState<View>('home');
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [chats, setChats] = useState<Chat[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeMessages = chats.find((c) => c.id === activeChat)?.messages || [];
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const WEBHOOK_URL = 'https://n8n.helpinghandsystems.com/webhook/chat-webhook';

  const handleNewChat = () => {
    const id = Date.now().toString();
    const newChat: Chat = {
      id,
      name: `New Chat ${chats.length + 1}`,
      lastMessage: 'Start the conversation... ',
      unread: 0,
      avatar: '💬',
      isOnline: true,
      messages: [],
    };
    setChats((prev) => [newChat, ...prev]);
    setActiveChat(id);
  };

  const getTextColorForBg = (bg: string) => {
    // Parse hex color like #RRGGBB
    const hex = bg.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    // Relative luminance and contrast heuristic
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance > 140 ? '#000000' : '#FFFFFF';
  };

  useEffect(() => {
    const initialChats: Chat[] = [
      {
        id: '1',
        name: 'Support Team',
        lastMessage: 'How can I help you today?',
        unread: 2,
        avatar: '👨‍💻',
        isOnline: true,
        messages: [
          { id: '1', text: 'Hello! How can I help you today?', sender: 'bot', timestamp: new Date() },
          { id: '2', text: 'I need help with my account', sender: 'user', timestamp: new Date() },
        ],
      },
      {
        id: '2',
        name: 'General Chat',
        lastMessage: 'Welcome to the general chat!',
        unread: 0,
        avatar: '💬',
        isOnline: true,
        messages: [
          { id: '1', text: 'Welcome to the general chat!', sender: 'bot', timestamp: new Date() },
        ],
      },
    ];

    setChats(initialChats);
    if (initialChats.length > 0 && !activeChat) {
      setActiveChat(initialChats[0].id);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  return (
    <div className="h-screen w-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      {view === 'home' ? (
        <div className="h-full overflow-auto">
          <SidekickHome onNavigate={setView} />
        </div>
      ) : (
      /* Layout */
      <div className="grid h-full grid-cols-[280px,1fr]">
        {/* Sidebar */}
        <aside className="flex flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 dark:border-slate-800">
            <h2 className="text-sm font-semibold">Chats</h2>
            <button onClick={handleNewChat} className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800" aria-label="New chat">
              <span className="material-icons text-[18px]">add</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => {
                  setActiveChat(chat.id);
                  setChats((prev) => prev.map((c) => (c.id === chat.id ? { ...c, unread: 0 } : c)));
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800 ${activeChat === chat.id ? 'bg-slate-100 dark:bg-slate-800/70' : ''}`}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-base dark:bg-slate-700">{chat.avatar}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-medium">{chat.name}</div>
                    {chat.isOnline && <span className="h-2 w-2 rounded-full bg-emerald-400" />}
                  </div>
                  <div className="truncate text-xs text-slate-500 dark:text-slate-400">{chat.lastMessage}</div>
                </div>
                {chat.unread > 0 && (
                  <span className="ml-auto inline-flex min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-semibold text-emerald-50">
                    {chat.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </aside>

        {/* Chat Area */}
        <main className="flex h-full flex-col">
          {activeChat ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-900/60">
                <div className="flex items-center gap-2 text-sm font-medium">
                  {chats.find((c) => c.id === activeChat)?.name}
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
                  const newMessage: Message = {
                    id: Date.now().toString(),
                    text,
                    sender: 'user',
                    timestamp: new Date(),
                  };
                  setChats((prev) =>
                    prev.map((c) => (c.id === activeChat ? { ...c, messages: [...c.messages, newMessage], lastMessage: text } : c))
                  );

                  // Send to webhook
                  setIsSending(true);
                  try {
                    const res = await fetch(WEBHOOK_URL, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ message: text, chatId: activeChat }),
                    });
                    const data = await res.json().catch(() => ({}));

                    // Try to extract a reply
                    const replyText =
                      (data && (data.reply || data.message || data.text)) ||
                      (Array.isArray(data) && (data[0]?.text || data[0]?.message)) ||
                      (typeof data === 'string' ? data : null) ||
                      'Received.';

                    const botMsg: Message = {
                      id: (Date.now() + 1).toString(),
                      text: replyText,
                      sender: 'bot',
                      timestamp: new Date(),
                    };
                    setChats((prev) =>
                      prev.map((c) => (c.id === activeChat ? { ...c, messages: [...c.messages, botMsg], lastMessage: replyText } : c))
                    );
                  } catch (err: any) {
                    setError('Failed to contact webhook');
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
                  placeholder={isSending ? 'Sending…' : 'Type a message…'}
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
      )}
    </div>
  );
}

export default App
