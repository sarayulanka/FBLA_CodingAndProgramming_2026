import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { X, Send, Sparkles, Loader2, User, Search, Star, Heart, Trophy, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

interface HelpPanelProps {
  open: boolean;
  onClose: () => void;
}

const SUGGESTED_TOPICS = [
  { icon: Search, label: "How to search", prompt: "How do I search for businesses?" },
  { icon: Star, label: "Write a review", prompt: "How do I write a review?" },
  { icon: Heart, label: "Save favorites", prompt: "How do I save favorites?" },
  { icon: Trophy, label: "Earn badges", prompt: "How do I earn badges?" },
];

export function HelpPanel({ open, onClose }: HelpPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "system", content: "You are BizBloom's helpful assistant." },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const displayMessages = messages.filter((m) => m.role !== "system");

  const chatMutation = trpc.help.chat.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't respond. Please try again." },
      ]);
    },
  });

  const handleSend = (content: string) => {
    if (!content.trim() || chatMutation.isPending) return;
    const newMessages: Message[] = [...messages, { role: "user", content }];
    setMessages(newMessages);
    setInput("");
    chatMutation.mutate({ messages: newMessages });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatMutation.isPending]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={onClose} />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-[440px] z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 overflow-hidden">
        {/* Header — matching homepage gradient */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-5 relative overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-500/15 rounded-full blur-2xl" />

          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">BizBloom AI</h2>
                <p className="text-xs text-blue-300/80">Your smart assistant</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition p-1 rounded-lg hover:bg-white/10"
              aria-label="Close help panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat body */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {displayMessages.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center h-full px-6 py-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-blue-500/60" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">How can I help?</h3>
              <p className="text-sm text-gray-500 mb-6 text-center">
                Ask me anything about BizBloom or pick a topic below.
              </p>
              <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                {SUGGESTED_TOPICS.map((topic, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(topic.prompt)}
                    disabled={chatMutation.isPending}
                    className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-gray-200 bg-white text-left text-sm font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-700 transition-all shadow-sm hover:shadow disabled:opacity-50"
                  >
                    <topic.icon className="w-4 h-4 text-blue-500 shrink-0" />
                    {topic.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Messages */
            <div className="px-4 py-4 space-y-4">
              {displayMessages.map((msg, i) => (
                <div
                  key={i}
                  className={cn("flex gap-2.5", msg.role === "user" ? "justify-end" : "justify-start")}
                >
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-md"
                        : "bg-white text-gray-800 border border-gray-100 shadow-sm rounded-bl-md"
                    )}
                  >
                    {msg.content}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-7 h-7 rounded-lg bg-gray-200 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5 text-gray-600" />
                    </div>
                  )}
                </div>
              ))}

              {chatMutation.isPending && (
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shrink-0 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="bg-white border-t px-4 py-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="flex items-end gap-2"
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(input);
                }
              }}
              placeholder="Ask anything..."
              rows={1}
              className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition max-h-24 min-h-[40px]"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || chatMutation.isPending}
              className="shrink-0 h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20"
            >
              {chatMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
          <p className="text-[10px] text-gray-400 text-center mt-2">Powered by AI — responses may not be perfect</p>
        </div>
      </div>
    </>
  );
}
