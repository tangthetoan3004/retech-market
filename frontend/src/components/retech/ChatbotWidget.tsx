import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  ExternalLink,
  RotateCcw,
  ChevronDown,
} from "lucide-react";
import {
  sendChatMessage,
  getChatHistory,
  getSuggestedQuestions,
} from "../../services/client/chatbot/chatbotService";
import type {
  ChatMessage,
  Citation,
} from "../../services/client/chatbot/chatbotService";

/* ─── session key ─────────────────────────────────────────── */
function getOrCreateSessionKey(): string {
  const KEY = "retech_chat_session";
  let k = localStorage.getItem(KEY);
  if (!k) {
    k = crypto.randomUUID();
    localStorage.setItem(KEY, k);
  }
  return k;
}

/* ─── Types ───────────────────────────────────────────────── */
type LocalMessage = {
  id: string;
  sender: "user" | "bot";
  text: string;
  citations?: Citation[];
  isTyping?: boolean;
  timestamp: Date;
};

/* ─── Markdown-lite renderer ──────────────────────────────── */
function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, '<code class="rt-chat-code">$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="rt-chat-link" target="_blank" rel="noopener">$1</a>')
    .replace(/\n/g, "<br/>");
}

/* ─── Main Component ──────────────────────────────────────── */
export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [sessionKey] = useState(() => getOrCreateSessionKey());
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  /* ── Scroll helpers ── */
  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }, []);

  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distFromBottom > 120);
  }, []);

  /* ── Load history + suggestions on first open ── */
  useEffect(() => {
    if (!open) return;

    const init = async () => {
      if (!historyLoaded) {
        setHistoryLoaded(true);
        try {
          const [histRes, sugRes] = await Promise.all([
            getChatHistory(sessionKey),
            getSuggestedQuestions(),
          ]);
          if (histRes.messages?.length) {
            const loaded: LocalMessage[] = histRes.messages.map((m) => ({
              id: m.id.toString(),
              sender: m.sender,
              text: m.message,
              citations: m.citations ?? [],
              timestamp: new Date(m.created_at),
            }));
            setMessages(loaded);
            setShowSuggestions(false);
          } else {
            // Welcome message
            setMessages([
              {
                id: "welcome",
                sender: "bot",
                text:
                  "Xin chào! 👋 Tôi là **Retech AI**, trợ lý ảo của **Retech Market**.\n\nTôi có thể giúp bạn tìm sản phẩm, tra cứu chính sách, hoặc tư vấn về dịch vụ Thu cũ đổi mới. Bạn muốn hỏi gì?",
                timestamp: new Date(),
              },
            ]);
          }
          setSuggestions(sugRes.suggestions ?? []);
        } catch {
          setMessages([
            {
              id: "welcome",
              sender: "bot",
              text: "Xin chào! 👋 Tôi là trợ lý ảo của **Retech Market**. Bạn cần hỗ trợ gì?",
              timestamp: new Date(),
            },
          ]);
        }
      }
      setTimeout(() => scrollToBottom(false), 50);
    };

    init();
  }, [open]);

  /* ── Auto-scroll on new messages ── */
  useEffect(() => {
    if (open && messages.length) {
      const last = messages[messages.length - 1];
      if (last.sender === "bot" && !last.isTyping) {
        setTimeout(() => scrollToBottom(), 100);
      }
    }
  }, [messages, open]);

  /* ── Unread badge ── */
  useEffect(() => {
    if (!open && messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.sender === "bot") setHasNewMessage(true);
    }
  }, [messages]);

  useEffect(() => {
    if (open) setHasNewMessage(false);
  }, [open]);

  /* ── Send message ── */
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      setInput("");
      setShowSuggestions(false);
      setLoading(true);

      const userMsg: LocalMessage = {
        id: `u-${Date.now()}`,
        sender: "user",
        text: trimmed,
        timestamp: new Date(),
      };

      const typingMsg: LocalMessage = {
        id: "typing",
        sender: "bot",
        text: "",
        isTyping: true,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg, typingMsg]);
      setTimeout(() => scrollToBottom(), 80);

      try {
        const res = await sendChatMessage(sessionKey, trimmed);
        const botMsg: LocalMessage = {
          id: `b-${Date.now()}`,
          sender: "bot",
          text: res.response,
          citations: res.citations ?? [],
          timestamp: new Date(),
        };
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== "typing"),
          botMsg,
        ]);
      } catch (err: any) {
        const errText =
          err?.message && !err.message.includes("fetch")
            ? err.message
            : "Xin lỗi, tôi đang gặp sự cố kết nối. Bạn vui lòng thử lại sau. 🙏";
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== "typing"),
          {
            id: `err-${Date.now()}`,
            sender: "bot",
            text: errText,
            timestamp: new Date(),
          },
        ]);
      } finally {
        setLoading(false);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    },
    [loading, sessionKey, scrollToBottom]
  );

  /* ── Handle key input ── */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  /* ── Clear chat ── */
  const clearChat = () => {
    localStorage.removeItem("retech_chat_session");
    const newKey = crypto.randomUUID();
    localStorage.setItem("retech_chat_session", newKey);
    window.location.reload();
  };

  /* ── Input auto-resize ── */
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  /* ─────────────────────────────────────────────────────────── */
  return (
    <>
      {/* ── Inline styles ── */}
      <style>{`
        .rt-chat-code {
          font-family: monospace;
          font-size: 0.82em;
          background: rgba(0,102,255,0.1);
          padding: 1px 5px;
          border-radius: 4px;
          color: #0066ff;
        }
        .dark .rt-chat-code {
          background: rgba(59,142,255,0.15);
          color: #3b8eff;
        }
        .rt-chat-link {
          color: #0066ff;
          text-decoration: underline;
          text-underline-offset: 2px;
          word-break: break-word;
        }
        .dark .rt-chat-link {
          color: #3b8eff;
        }
        .rt-chat-scroll::-webkit-scrollbar { width: 4px; }
        .rt-chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .rt-chat-scroll::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.12);
          border-radius: 9999px;
        }
        .dark .rt-chat-scroll::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.12);
        }
        @keyframes rt-typing-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-4px); opacity: 1; }
        }
        .rt-typing-dot {
          animation: rt-typing-bounce 1.2s infinite;
        }
        .rt-typing-dot:nth-child(2) { animation-delay: 0.15s; }
        .rt-typing-dot:nth-child(3) { animation-delay: 0.30s; }
        @keyframes rt-pulse-ring {
          0% { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .rt-pulse-ring {
          animation: rt-pulse-ring 2s ease-out infinite;
        }
      `}</style>

      {/* ── Floating Button ── */}
      <div className="fixed bottom-6 right-6 z-[1000]">
        <AnimatePresence>
          {!open && hasNewMessage && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-1 -right-1 z-10 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"
            >
              <span className="text-white text-[9px] font-bold">!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulse ring behind button (only when closed) */}
        {!open && (
          <div className="absolute inset-0 rounded-full bg-blue-500/30 rt-pulse-ring pointer-events-none" />
        )}

        <motion.button
          id="chatbot-toggle-btn"
          onClick={() => setOpen((v) => !v)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
          className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_32px_rgba(0,102,255,0.38)] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          style={{
            background: "linear-gradient(135deg, #0066ff 0%, #00d9a3 100%)",
          }}
          aria-label={open ? "Đóng chatbot" : "Mở chatbot"}
        >
          <AnimatePresence mode="wait">
            {open ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <X className="w-6 h-6 text-white" />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <MessageCircle className="w-6 h-6 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* ── Chat Window ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="chatbot-window"
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="fixed bottom-24 right-6 z-[1000] w-[370px] max-w-[calc(100vw-1.5rem)] flex flex-col"
            style={{
              height: "min(580px, calc(100vh - 130px))",
            }}
          >
            <div
              className="flex flex-col h-full rounded-2xl overflow-hidden border border-border"
              style={{
                background: "var(--background)",
                boxShadow:
                  "0 24px 80px rgba(0,0,0,0.18), 0 4px 24px rgba(0,102,255,0.1)",
              }}
            >
              {/* ── Header ── */}
              <div
                className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
                style={{
                  background:
                    "linear-gradient(135deg, #0a1628 0%, #0d2040 40%, #0a2010 100%)",
                }}
              >
                {/* Bot avatar */}
                <div className="relative flex-shrink-0">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      background:
                        "linear-gradient(135deg, #0066ff 0%, #00d9a3 100%)",
                    }}
                  >
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  {/* Online dot */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0a1628]" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-white truncate">
                      Retech AI
                    </span>
                    <Sparkles className="w-3.5 h-3.5 text-blue-300 flex-shrink-0" />
                  </div>
                  <div className="text-[11px] text-emerald-400 font-medium">
                    Đang hoạt động
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={clearChat}
                    title="Xóa lịch sử chat"
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* ── Messages ── */}
              <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-4 py-4 space-y-4 rt-chat-scroll"
                style={{ background: "var(--muted)" }}
              >
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} msg={msg} />
                ))}

                {/* Suggested questions */}
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <p className="text-[11px] text-muted-foreground text-center font-medium uppercase tracking-wider">
                      Câu hỏi gợi ý
                    </p>
                    {suggestions.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(q)}
                        disabled={loading}
                        className="w-full text-left text-sm px-3 py-2.5 rounded-xl border border-border bg-background hover:bg-accent hover:border-blue-400/50 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed leading-snug"
                        style={{ color: "var(--foreground)" }}
                      >
                        {q}
                      </button>
                    ))}
                  </motion.div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Scroll-to-bottom button */}
              <AnimatePresence>
                {showScrollBtn && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => scrollToBottom()}
                    className="absolute bottom-20 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-background border border-border shadow-md flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer z-10"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.button>
                )}
              </AnimatePresence>

              {/* ── Input area ── */}
              <div
                className="flex-shrink-0 px-3 pb-3 pt-2 border-t border-border"
                style={{ background: "var(--background)" }}
              >
                <div className="flex items-end gap-2 rounded-xl border border-border bg-muted px-3 py-2 focus-within:border-blue-500/60 transition-colors">
                  <textarea
                    ref={inputRef}
                    id="chatbot-input"
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                    rows={1}
                    placeholder="Nhập câu hỏi của bạn..."
                    className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground leading-relaxed max-h-[120px] py-0.5 disabled:opacity-60"
                    style={{ color: "var(--foreground)" }}
                  />
                  <motion.button
                    id="chatbot-send-btn"
                    whileTap={{ scale: 0.9 }}
                    onClick={() => sendMessage(input)}
                    disabled={loading || !input.trim()}
                    className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background:
                        loading || !input.trim()
                          ? "var(--border)"
                          : "linear-gradient(135deg, #0066ff, #00d9a3)",
                    }}
                    aria-label="Gửi tin nhắn"
                  >
                    <Send className="w-3.5 h-3.5 text-white" />
                  </motion.button>
                </div>
                <p className="text-[10px] text-muted-foreground text-center mt-1.5">
                  Enter để gửi · Shift+Enter xuống dòng
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── Message Bubble ──────────────────────────────────────── */
function MessageBubble({ msg }: { msg: LocalMessage }) {
  const isBot = msg.sender === "bot";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-2 ${isBot ? "items-start" : "items-end flex-row-reverse"}`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {isBot ? (
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #0066ff 0%, #00d9a3 100%)",
            }}
          >
            <Bot className="w-3.5 h-3.5 text-white" />
          </div>
        ) : (
          <div className="w-7 h-7 rounded-full flex items-center justify-center bg-accent border border-border">
            <User className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[78%] ${isBot ? "" : "items-end"} flex flex-col gap-1`}
      >
        <div
          className={[
            "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed",
            isBot
              ? "rounded-tl-sm bg-background border border-border shadow-sm"
              : "rounded-br-sm text-white",
          ].join(" ")}
          style={
            !isBot
              ? {
                  background:
                    "linear-gradient(135deg, #0066ff 0%, #0052cc 100%)",
                }
              : { color: "var(--foreground)" }
          }
        >
          {msg.isTyping ? (
            <TypingIndicator />
          ) : (
            <div
              dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }}
            />
          )}
        </div>

        {/* Citations */}
        {isBot && msg.citations && msg.citations.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {msg.citations.map((c) => (
              <a
                key={c.index}
                href={c.url_path}
                target={c.url_path.startsWith("http") ? "_blank" : "_self"}
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border border-border bg-background hover:bg-accent hover:border-blue-400/60 transition-colors"
                style={{ color: "var(--muted-foreground)" }}
              >
                <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                <span className="truncate max-w-[140px]">{c.title}</span>
              </a>
            ))}
          </div>
        )}

        {/* Timestamp */}
        {!msg.isTyping && (
          <span className="text-[10px] text-muted-foreground px-1">
            {msg.timestamp.toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Typing indicator ────────────────────────────────────── */
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 py-0.5 px-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rt-typing-dot w-2 h-2 rounded-full"
          style={{
            background: "linear-gradient(135deg, #0066ff, #00d9a3)",
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}
