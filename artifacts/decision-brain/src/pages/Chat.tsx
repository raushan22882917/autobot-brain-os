import { useState, useRef, useEffect } from "react";
import { useChatWithDecisions } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BrainCircuit, Send, User, Loader2, FileText, Sparkles } from "lucide-react";
import { Link } from "wouter";

type Message = {
  role: "user" | "assistant";
  content: string;
  decisionIds?: string[];
};

const SUGGESTIONS = [
  "What patterns appear in my high-stakes decisions?",
  "Which decisions have the lowest outcome scores?",
  "Summarize my decision activity this month",
  "What blind spots should I be aware of?",
];

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "I'm your executive decision advisor. I have full context on your decision history, behavioral patterns, and outcomes.\n\nWhat would you like to analyze or understand today?",
    }
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatMutation = (useChatWithDecisions as any)();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, chatMutation.isPending]);

  const handleSend = (text?: string) => {
    const msg = text ?? input;
    if (!msg.trim() || chatMutation.isPending) return;
    const userMessage: Message = { role: "user", content: msg };
    setMessages(prev => [...prev, userMessage]);
    setInput("");

    chatMutation.mutate(
      { data: { message: msg, conversationHistory: messages } },
      {
        onSuccess: (res: any) => {
          setMessages(prev => [...prev, { role: "assistant", content: res.reply, decisionIds: res.relevantDecisionIds }]);
        },
        onError: () => {
          setMessages(prev => [...prev, { role: "assistant", content: "I encountered an error analyzing your request. Please try again." }]);
        }
      }
    );
  };

  const showSuggestions = messages.length === 1;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white tracking-tight">AI Advisor</h1>
          <p className="text-sm mt-1" style={{ color: "#444" }}>Query your decision graph in natural language.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold"
          style={{ background: "rgba(220,38,38,0.08)", color: "#f87171", border: "1px solid rgba(220,38,38,0.15)" }}>
          <Sparkles className="w-3 h-3" />
          Powered by Gemini
        </div>
      </div>

      {/* Chat window */}
      <div className="flex-1 flex flex-col rounded-2xl border overflow-hidden min-h-0"
        style={{ background: "#080808", borderColor: "#161616" }}>

        <ScrollArea className="flex-1 p-5" ref={scrollRef}>
          <div className="space-y-5 pb-2">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.2)" }}>
                    <BrainCircuit className="w-4 h-4" style={{ color: "#f87171" }} />
                  </div>
                )}

                <div className={`flex flex-col gap-2 max-w-[82%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  <div className="px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                    style={msg.role === "user" ? {
                      background: "linear-gradient(135deg, #DC2626, #991b1b)",
                      color: "#fff",
                      borderRadius: "18px 18px 4px 18px",
                    } : {
                      background: "#111",
                      color: "#d4d4d4",
                      border: "1px solid #1e1e1e",
                      borderRadius: "4px 18px 18px 18px",
                    }}>
                    {msg.content}
                  </div>

                  {msg.decisionIds && msg.decisionIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {msg.decisionIds.map((id) => (
                        <Link key={id} href={`/decisions/${id}`}>
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium cursor-pointer transition-colors"
                            style={{ background: "#0d0d0d", color: "#555", border: "1px solid #1e1e1e" }}>
                            <FileText className="w-3 h-3" />
                            Source: {id.substring(0, 8)}…
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
                    <User className="w-3.5 h-3.5" style={{ color: "#666" }} />
                  </div>
                )}
              </div>
            ))}

            {chatMutation.isPending && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.2)" }}>
                  <BrainCircuit className="w-4 h-4" style={{ color: "#f87171" }} />
                </div>
                <div className="px-4 py-3 rounded-2xl text-sm flex items-center gap-2"
                  style={{ background: "#111", border: "1px solid #1e1e1e", color: "#555", borderRadius: "4px 18px 18px 18px" }}>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: "#DC2626" }} />
                  Analyzing your decision intelligence…
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Suggestions */}
        {showSuggestions && (
          <div className="px-5 pb-3">
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => handleSend(s)}
                  className="px-3 py-1.5 rounded-xl text-[11px] font-medium text-white/50 hover:text-white/80 transition-all border hover:border-white/10"
                  style={{ background: "#0d0d0d", borderColor: "#1a1a1a" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="px-4 pb-4 pt-2 border-t" style={{ borderColor: "#161616" }}>
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative flex items-center">
            <Input value={input} onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your decisions, patterns, or outcomes…"
              className="pr-12 text-white h-12 rounded-xl border text-[13px]"
              style={{ background: "#0d0d0d", borderColor: "#222" }} />
            <button type="submit" disabled={!input.trim() || chatMutation.isPending}
              className="absolute right-2 w-8 h-8 rounded-lg flex items-center justify-center text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105"
              style={{ background: "linear-gradient(135deg, #DC2626, #991b1b)" }}>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
