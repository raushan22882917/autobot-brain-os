import { useState, useRef, useEffect } from "react";
import { useChatWithDecisions } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BrainCircuit, Send, User, Loader2, FileText } from "lucide-react";
import { Link } from "wouter";

type Message = {
  role: "user" | "assistant";
  content: string;
  decisionIds?: string[];
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "I am your executive decision assistant. I have full context on your decision history, patterns, and outcomes. What would you like to analyze?"
    }
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const chatMutation = (useChatWithDecisions as any)(); // Adjust typing if needed

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, chatMutation.isPending]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatMutation.isPending) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");

    chatMutation.mutate(
      { data: { message: input, conversationHistory: messages } },
      {
        onSuccess: (res: any) => {
          setMessages(prev => [
            ...prev,
            { role: "assistant", content: res.reply, decisionIds: res.relevantDecisionIds }
          ]);
        },
        onError: () => {
          setMessages(prev => [
            ...prev,
            { role: "assistant", content: "Sorry, I encountered an error analyzing your request." }
          ]);
        }
      }
    );
  };

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto pb-4 animate-in fade-in duration-500">
      <div className="mb-6">
        <h1 className="text-3xl font-serif font-bold text-white tracking-tight">Intelligence Assistant</h1>
        <p className="text-muted-foreground mt-2">Query your decision graph in natural language.</p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden bg-card border-border shadow-2xl relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none opacity-50" />
        
        <ScrollArea className="flex-1 p-4 md:p-6" ref={scrollRef}>
          <div className="space-y-6 relative z-10 pb-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                    <BrainCircuit className="w-4 h-4 text-primary" />
                  </div>
                )}
                
                <div className={`flex flex-col gap-2 max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-4 rounded-2xl ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                      : 'bg-white/5 border border-white/10 text-white rounded-tl-sm'
                  }`}>
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  
                  {msg.decisionIds && msg.decisionIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {msg.decisionIds.map((id) => (
                        <Link key={id} href={`/decisions/${id}`}>
                          <div className="text-xs bg-white/5 border border-white/10 hover:border-primary/50 text-muted-foreground hover:text-white px-3 py-1.5 rounded-md cursor-pointer transition-colors flex items-center gap-1.5">
                            <FileText className="w-3 h-3" />
                            Ref: {id.substring(0, 8)}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}
            
            {chatMutation.isPending && (
              <div className="flex gap-4 justify-start">
                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                  <BrainCircuit className="w-4 h-4 text-primary" />
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 rounded-tl-sm flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Synthesizing...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 bg-background border-t border-border z-20">
          <form onSubmit={handleSend} className="relative flex items-center">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="E.g., Analyze my high-stakes decisions from last month..."
              className="pr-12 bg-card border-border text-white h-12 rounded-xl focus-visible:ring-primary/50 text-[15px]"
            />
            <Button 
              type="submit" 
              size="icon"
              disabled={!input.trim() || chatMutation.isPending}
              className="absolute right-1.5 h-9 w-9 bg-primary hover:bg-primary/90 text-white rounded-lg"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}