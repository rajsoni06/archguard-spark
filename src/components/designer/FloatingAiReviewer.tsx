import { Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { detectAiIntent, detectGeneralIntent, getDeterministicAiResponse, type AiReviewerMessage } from "@/lib/aiReviewer";
import type { AnalysisResult, ProjectContext } from "@/lib/ruleEngine";
import { cn } from "@/lib/utils";

interface Props {
  result: AnalysisResult | null;
  ctx: ProjectContext;
}

interface Suggestion {
  label: string;
  question: string;
}

const initialSuggestions: Suggestion[] = [
  { label: "Who are you?", question: "Who are you?" },
  { label: "What can you do?", question: "What can you do?" },
  { label: "What is this website?", question: "What is this website about?" },
  { label: "Architecture score", question: "What is my architecture score?" },
  { label: "Biggest weaknesses", question: "What are the biggest weaknesses?" },
  { label: "How can I improve?", question: "How can I strengthen my architecture?" },
];

const followUpSuggestions: Record<string, Suggestion[]> = {
  identity: [
    { label: "What can you help me with?", question: "What can you help me with?" },
    { label: "How does the AI work?", question: "How does the AI work?" },
    { label: "Can you review my architecture?", question: "Can you review my architecture?" },
  ],
  platform: [
    { label: "How does the designer work?", question: "How does this work?" },
    { label: "What can I build here?", question: "What can I build here?" },
    { label: "Can you review my architecture?", question: "Can you review my architecture?" },
  ],
  aiDoes: [
    { label: "How does the AI work?", question: "How does the AI work?" },
    { label: "What can you help me with?", question: "What can you help me with?" },
    { label: "Can you review my architecture?", question: "Can you review my architecture?" },
  ],
  doHere: [
    { label: "Can I create my own architecture?", question: "Can I create my own architecture?" },
    { label: "What services are available?", question: "What services are available?" },
    { label: "Can you review my architecture?", question: "Can you review my architecture?" },
  ],
  security: [
    { label: "Do I need authentication?", question: "Do I need authentication?" },
    { label: "What security services should I add?", question: "What security services should I add?" },
    { label: "Why is my compliance score low?", question: "Why is my compliance score low?" },
  ],
  scalability: [
    { label: "Can this handle 1M+ users?", question: "Can this handle 1M+ users?" },
    { label: "Should I add a load balancer?", question: "Should I add a load balancer?" },
    { label: "How can I handle traffic spikes?", question: "How can I handle traffic spikes?" },
  ],
  availability: [
    { label: "Where are my single points of failure?", question: "Where are my single points of failure?" },
    { label: "Should I use Multi-AZ?", question: "Should I use Multi-AZ?" },
    { label: "How can I achieve 99.99% availability?", question: "How can I achieve 99.99% availability?" },
  ],
  performance: [
    { label: "How can I reduce latency?", question: "How can I reduce latency?" },
    { label: "Where are the bottlenecks?", question: "Where are the bottlenecks?" },
    { label: "Can this support 10K RPS?", question: "Can this support 10K RPS?" },
  ],
  database: [
    { label: "Should my database be private?", question: "Should my database be private?" },
    { label: "Should I use read replicas?", question: "Should I use read replicas?" },
    { label: "Is my database highly available?", question: "Is my database highly available?" },
  ],
  score: [
    { label: "Why is my score low?", question: "Why is my score low?" },
    { label: "What should I fix first?", question: "What should I fix first?" },
    { label: "How can I increase my score?", question: "How can I increase my score?" },
  ],
  weakness: [
    { label: "What should I fix first?", question: "What should I fix first?" },
    { label: "How can I strengthen my architecture?", question: "How can I strengthen my architecture?" },
    { label: "Which weakness has the highest impact?", question: "Which weakness has the highest impact?" },
  ],
};

export function FloatingAiReviewer({ result, ctx }: Props) {
  const [open, setOpen] = useState(false);
  const [popupMounted, setPopupMounted] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AiReviewerMessage[]>([]);
  const [thinking, setThinking] = useState(false);
  const [nextSuggestions, setNextSuggestions] = useState<Suggestion[] | null>(null);
  const assistantRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const shouldFollowChat = useRef(true);
  const forceScrollToLatest = useRef(false);
  const closeTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutsidePointer = (event: PointerEvent) => {
      if (assistantRef.current && !assistantRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", handleOutsidePointer);
    return () => document.removeEventListener("pointerdown", handleOutsidePointer);
  }, [open]);

  useEffect(() => () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
  }, []);

  const showPopup = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setPopupMounted(true);
    requestAnimationFrame(() => setOpen(true));
  };

  const hidePopup = () => {
    setOpen(false);
    closeTimer.current = window.setTimeout(() => setPopupMounted(false), 180);
  };

  useEffect(() => {
    const chat = chatRef.current;
    if (!chat || (!shouldFollowChat.current && !forceScrollToLatest.current)) return;
    requestAnimationFrame(() => {
      chat.scrollTo({ top: chat.scrollHeight, behavior: "smooth" });
      forceScrollToLatest.current = false;
    });
  }, [messages, thinking, nextSuggestions]);

  const suggestions = initialSuggestions;

  const ask = (question: string) => {
    const prompt = question.trim();
    if (!prompt) return;
    const response = getDeterministicAiResponse(prompt, result, ctx);
    shouldFollowChat.current = true;
    forceScrollToLatest.current = true;
    setMessages((current) => [
      ...current,
      { role: "user", text: prompt },
    ]);
    setInput("");
    setThinking(true);
    window.setTimeout(() => {
      setMessages((current) => [...current, { role: "assistant", text: response }]);
      const generalIntent = detectGeneralIntent(prompt);
      const intent = detectAiIntent(prompt).primary;
      setNextSuggestions(followUpSuggestions[generalIntent ?? intent] ?? followUpSuggestions.improvement ?? initialSuggestions.slice(3, 6));
      setThinking(false);
    }, 500);
  };

  return (
    <div ref={assistantRef} className="designer-ai-reviewer-anchor pointer-events-none absolute inset-x-0 bottom-3 z-40 flex justify-end px-3 sm:bottom-4 sm:px-4">
      <div className="relative flex flex-col items-end gap-2">
        {popupMounted ? (
          <section
            aria-label="AI Architecture Reviewer"
            className={cn(
              "designer-ai-reviewer pointer-events-auto flex origin-bottom-right flex-col overflow-hidden rounded-[1.35rem] border border-slate-300/80 bg-background/95 shadow-2xl backdrop-blur-2xl transition-all duration-200 ease-out dark:border-white/20",
              open ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-2 scale-[0.96] opacity-0",
            )}
          >
            <header className="ai-reviewer-header flex items-start justify-between gap-2.5 border-b border-sky-300/90 bg-sky-200/90 px-3 py-2 dark:border-sky-700/70 dark:bg-sky-900/65">
              <div className="flex min-w-0 items-start gap-1.5">
                <img src="/Ask_AI_logo.png" alt="" className="size-9 shrink-0 rounded-lg object-contain sm:size-10 lg:size-10" />
                <div className="min-w-0">
                  <h2 className="text-[13px] font-semibold tracking-tight">AI Architecture Reviewer</h2>
                  <p className="mt-0.5 text-[10px] text-black">Architecture-aware assistant</p>
                </div>
              </div>
              <button
                type="button"
                onClick={hidePopup}
                aria-label="Close AI Architecture Reviewer"
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </header>

            <div
              ref={chatRef}
              onScroll={(event) => {
                const chat = event.currentTarget;
                shouldFollowChat.current = chat.scrollHeight - chat.scrollTop - chat.clientHeight < 80;
              }}
              className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-3 sm:p-3.5"
            >
              {messages.length === 0 ? (
                <div className="ai-welcome-message ai-message-in w-fit max-w-[85%] rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-[11px] leading-relaxed text-slate-800 shadow-sm dark:border-border dark:bg-card dark:text-foreground/85">
                  <p>Hi! I analyzed your current architecture.</p>
                  <p className="ai-score-summary mt-1.5 font-semibold text-sky-700 dark:text-sky-300">
                    {result ? `Current score: ${result.overall}/100 (${result.maturity}).` : "Run a review to calculate the current score."}
                  </p>
                </div>
              ) : null}

              {messages.length === 0 ? (
                <div className="ai-suggestions-section space-y-1.5">
                  <p className="px-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Try asking</p>
                  <div className="grid grid-cols-2 items-start gap-1.5 sm:grid-cols-3">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.question}
                      type="button"
                      onClick={() => ask(suggestion.question)}
                      className="ai-suggestion-chip inline-flex w-fit max-w-full min-h-0 items-center justify-center rounded-full border border-sky-300 bg-sky-50 px-2.5 py-1.5 text-center text-[11px] font-medium leading-tight text-slate-700 transition-all hover:-translate-y-0.5 hover:border-sky-400 hover:bg-sky-100 active:scale-[0.98] dark:border-sky-700 dark:bg-sky-950/45 dark:text-sky-100 dark:hover:border-sky-600 dark:hover:bg-sky-900/60"
                    >
                      {suggestion.label}
                    </button>
                  ))}
                  </div>
                </div>
              ) : null}

              {messages.length > 0 && !thinking && nextSuggestions ? (
                <div className="space-y-1.5 pt-1">
                  <p className="px-0.5 text-[10px] font-semibold text-muted-foreground">You may also want to ask</p>
                  <div className="grid grid-cols-2 items-start gap-1.5 sm:grid-cols-3">
                    {nextSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.question}
                        type="button"
                        onClick={() => ask(suggestion.question)}
                        className="ai-suggestion-chip inline-flex w-fit max-w-full min-h-0 items-center justify-center rounded-full border border-sky-300 bg-sky-50 px-2.5 py-1.5 text-center text-[11px] font-medium leading-tight text-slate-700 transition-all hover:-translate-y-0.5 hover:border-sky-400 hover:bg-sky-100 active:scale-[0.98] dark:border-sky-700 dark:bg-sky-950/45 dark:text-sky-100 dark:hover:border-sky-600 dark:hover:bg-sky-900/60"
                      >
                        {suggestion.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={cn(
                    "ai-chat-message ai-message-in w-fit max-w-[85%] rounded-xl px-2.5 py-1.5 text-[11px] leading-relaxed whitespace-pre-line break-words",
                    message.role === "user"
                      ? "ml-auto border border-sky-300 bg-sky-200/90 text-slate-800 dark:border-sky-700 dark:bg-sky-900/70 dark:text-sky-50"
                      : "mr-auto border border-slate-200 bg-white text-slate-800 shadow-sm dark:border-border dark:bg-card dark:text-foreground/85",
                  )}
                >
                  {message.role === "assistant" ? (
                    <div className="mb-0.5 text-[9px] font-semibold uppercase tracking-wide opacity-65">AI reviewer</div>
                  ) : null}
                  {message.text}
                </div>
              ))}
              {thinking ? (
                <div className="ai-thinking-message ai-message-in mr-auto flex w-fit items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-[10px] text-muted-foreground shadow-sm dark:border-border dark:bg-card">
                  <span>AI</span>
                  <span className="ai-thinking-dot" />
                  <span className="ai-thinking-dot" />
                  <span className="ai-thinking-dot" />
                  <span className="ai-thinking-dot" />
                </div>
              ) : null}
            </div>

            <form
              className="ai-chat-form flex items-end gap-1.5 border-t border-border/70 bg-card/45 p-2.5"
              onSubmit={(event) => {
                event.preventDefault();
                ask(input);
              }}
            >
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    ask(input);
                  }
                }}
                rows={1}
                placeholder="Ask about your architecture..."
                aria-label="Ask AI about your architecture"
                className="ai-chat-input max-h-20 min-h-8 min-w-0 flex-1 resize-none rounded-xl border border-black/80 bg-background/80 px-2.5 py-1.5 text-[11px] leading-4 outline-none transition-shadow placeholder:text-muted-foreground focus:border-black focus:ring-2 focus:ring-black/15 dark:border-white/70 dark:focus:border-white dark:focus:ring-white/15"
              />
              <Button type="submit" size="icon" className="ai-send-button size-8 shrink-0 rounded-full" aria-label="Send question" disabled={!input.trim()}>
                <Send className="size-3.5" />
              </Button>
            </form>
          </section>
        ) : null}

        <Button
          type="button"
          variant="ghost"
          onClick={() => (open ? hidePopup() : showPopup())}
          className="pointer-events-auto h-auto min-h-8 rounded-none bg-transparent p-0 shadow-none transition-transform hover:bg-transparent hover:-translate-y-0.5 sm:min-h-10"
          aria-expanded={open}
          aria-label={open ? "Close Ask AI" : "Ask AI"}
        >
          <img
            src="/Ask_Ai_main_logo.png"
            alt="Ask AI"
            className="h-8 w-auto max-w-[calc(100vw-2rem)] object-contain sm:h-10"
          />
        </Button>
      </div>
    </div>
  );
}
