import {
  Activity,
  ArrowLeft,
  Bot,
  CheckCircle2,
  ChevronRight,
  FileText,
  HelpCircle,
  Info,
  Layers,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { Button } from "../../components/Button";
import { ErrorState } from "../../components/ErrorState";
import { PageHeader } from "../../components/PageHeader";
import { RiskBadge } from "../../components/PredictionCard";
import { getAssistantHealth, postAssistantChat, type AssistantHealthResponse } from "../../services/clinicalAssistantService";
import type {
  AssistantChatResponse,
  AssistantContextSummary,
  CitationItem,
} from "../../types";

interface MessageUI {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: CitationItem[];
  timestamp: string;
}

const DEFAULT_SUGGESTIONS = [
  "Why did this patient's model-assessed risk change?",
  "What are the strongest TreeSHAP model-attributed factors?",
  "Summarize this patient's recent risk progression.",
  "What do the production model performance metrics mean?",
  "Which clinical parameters are missing from this patient record?",
];

export function ClinicalAssistant() {
  const [searchParams] = useSearchParams();

  const patientIdParam = searchParams.get("patient_id") || undefined;
  const predictionIdParam = searchParams.get("prediction_id") ? parseInt(searchParams.get("prediction_id")!, 10) : undefined;

  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<MessageUI[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content: "Hello Doctor. I am your PreStrokeNet AI Decision-Support Assistant. Select a suggested question below or ask any question regarding current predictions, SHAP attributions, patient progression, or model metrics.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [contextSummary, setContextSummary] = useState<AssistantContextSummary | null>(null);
  const [healthState, setHealthState] = useState<AssistantHealthResponse | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getAssistantHealth().then(setHealthState);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const fetchInitialContext = useCallback(async () => {
    if (!patientIdParam && !predictionIdParam) return;
    setIsLoading(true);
    setError("");
    try {
      const res: AssistantChatResponse = await postAssistantChat({
        message: "Provide a clinical decision-support summary of the selected record.",
        patient_id: patientIdParam,
        prediction_id: predictionIdParam,
      });
      setContextSummary(res.context_summary);
      setMessages([
        {
          id: `init-${Date.now()}`,
          role: "assistant",
          content: res.answer,
          citations: res.citations,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load assistant context.");
    } finally {
      setIsLoading(false);
    }
  }, [patientIdParam, predictionIdParam]);

  useEffect(() => {
    fetchInitialContext();
  }, [fetchInitialContext]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    const userMsg: MessageUI = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage("");
    setIsLoading(true);
    setError("");

    try {
      const res = await postAssistantChat({
        message: query,
        patient_id: patientIdParam,
        prediction_id: predictionIdParam,
      });

      if (res.context_summary) {
        setContextSummary(res.context_summary);
      }

      const aiMsg: MessageUI = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: res.answer,
        citations: res.citations,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI Assistant request failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        content: "Conversation cleared. Ask any question regarding patient risk, SHAP factors, or model analytics.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setError("");
  };

  return (
    <div className="page-canvas space-y-6">
      <PageHeader
        eyebrow="Clinical Intelligence Layer"
        title="AI Clinical Assistant Workspace"
        description="Evidence-grounded model explanation & decision-support workspace"
        action={patientIdParam ? { label: "Patient 360 Workspace", to: `/patients/${encodeURIComponent(patientIdParam)}/360`, icon: ArrowLeft } : undefined}
      />

      {/* Provider Status Indicator */}
      {healthState && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.02] border border-line text-xs font-mono">
          <div className="flex items-center gap-2">
            <Bot className="size-4 text-primary" />
            <span className="text-muted">AI Provider Engine:</span>
            {healthState.mode === "built_in" ? (
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                Built-in Grounded Rule Engine
              </span>
            ) : healthState.status === "configured" ? (
              <span className="font-bold text-sky-400 flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-sky-400 animate-pulse" />
                External LLM — {healthState.provider.replace("external_", "").toUpperCase()} ({healthState.model || "configured"})
              </span>
            ) : (
              <span className="font-bold text-danger flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-danger" />
                {healthState.detail || "AI Provider Unavailable"}
              </span>
            )}
          </div>
          <span className="text-[10px] text-muted uppercase tracking-wider">{healthState.mode || "System Status"}</span>
        </div>
      )}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed font-mono">
        <ShieldCheck className="size-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold text-amber-300">Decision-Support Notice:</strong> PreStrokeNet AI explains predictions, TreeSHAP attributions, and historical records. It does not provide medical diagnoses or treatment recommendations. All model probabilities must be evaluated by a licensed clinician.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Active Patient Context & Context Checklist */}
        <div className="lg:col-span-1 space-y-5">
          {/* Active Patient Context Panel */}
          <div className="glass-panel p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
              <Activity className="size-4 text-primary" /> Active Patient Context
            </h3>

            {contextSummary && (contextSummary.patient_name || contextSummary.patient_id) ? (
              <div className="space-y-3.5 text-xs font-mono">
                <div>
                  <div className="text-sm font-bold text-text">{contextSummary.patient_name || "Unknown Name"}</div>
                  <div className="text-muted">ID: {contextSummary.patient_id || "N/A"}</div>
                </div>

                {contextSummary.latest_risk_level && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-line">
                    <span className="text-muted">Risk Category</span>
                    <RiskBadge level={contextSummary.latest_risk_level.toLowerCase() as "low" | "medium" | "high"} />
                  </div>
                )}

                {typeof contextSummary.latest_final_probability === "number" && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/30">
                      <div className="text-primary font-bold text-[10px]">Final Prob</div>
                      <div className="text-sm font-extrabold text-primary mt-0.5">{(contextSummary.latest_final_probability * 100).toFixed(1)}%</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-line">
                      <div className="text-muted text-[10px]">Clinical Prob</div>
                      <div className="text-sm font-bold text-text mt-0.5">{(contextSummary.latest_clinical_probability! * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                )}

                {contextSummary.top_shap_factors.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[11px] font-bold text-muted uppercase">Top SHAP Attributions</div>
                    {contextSummary.top_shap_factors.map((f, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px] p-1.5 rounded bg-white/[0.02] border border-line">
                        <span className="text-text truncate max-w-[110px]">{String(f.feature || "")}</span>
                        <span className="text-primary font-bold">{String(f.patient_value || "")}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-muted border border-dashed border-line rounded-xl space-y-2 font-mono">
                <Info className="size-5 mx-auto text-muted" />
                <p>No specific patient record selected.</p>
                <p className="text-[11px] text-muted">Launch from Patient 360 or Prediction Details to inspect active patient context.</p>
              </div>
            )}
          </div>

          {/* Context Availability Checklist */}
          <div className="glass-panel p-5 space-y-3 font-mono text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
              <Layers className="size-4 text-primary" /> Context Checklist
            </h3>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-success">
                <CheckCircle2 className="size-3.5" /> Latest prediction data
              </div>
              <div className="flex items-center gap-2 text-success">
                <CheckCircle2 className="size-3.5" /> TreeSHAP attributions
              </div>
              <div className="flex items-center gap-2 text-success">
                <CheckCircle2 className="size-3.5" /> Patient risk progression
              </div>
              <div className="flex items-center gap-2 text-success">
                <CheckCircle2 className="size-3.5" /> Doctor notes & follow-ups
              </div>
              <div className="flex items-center gap-2 text-success">
                <CheckCircle2 className="size-3.5" /> Research analytics metrics
              </div>
            </div>
          </div>

          {/* Suggested Questions */}
          <div className="glass-panel p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2 font-mono">
              <HelpCircle className="size-4 text-primary" /> Suggested Clinical Queries
            </h3>

            <div className="space-y-2">
              {DEFAULT_SUGGESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  disabled={isLoading}
                  className="w-full text-left p-2.5 rounded-xl bg-white/[0.02] hover:bg-primary/10 border border-line hover:border-primary/30 transition text-xs text-muted hover:text-text flex items-center justify-between gap-2 group disabled:opacity-50 font-mono"
                >
                  <span className="leading-snug">{q}</span>
                  <ChevronRight className="size-3.5 text-muted group-hover:text-primary shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Chat Workspace */}
        <div className="lg:col-span-3 glass-panel flex flex-col h-[660px]">
          {/* Chat Header */}
          <div className="p-4 px-6 border-b border-line flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
                <Bot className="size-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-text">PreStrokeNet AI Assistant</h2>
                <div className="text-xs text-muted font-mono flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-success animate-pulse" />
                  Provider Status: Operational
                </div>
              </div>
            </div>
            <Button variant="ghost" icon={RotateCcw} onClick={handleClearChat}>
              Reset Conversation
            </Button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3.5 max-w-3xl ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}>
                <div className={`size-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${msg.role === "user" ? "bg-primary text-white" : "bg-white/10 border border-line text-primary"}`}>
                  {msg.role === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
                </div>

                <div className="space-y-2 max-w-[85%] font-mono text-xs">
                  <div className={`p-4 rounded-2xl ${msg.role === "user" ? "bg-primary text-white font-medium rounded-tr-none shadow" : "bg-white/[0.02] border border-line text-text rounded-tl-none space-y-3"}`}>
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>

                    {msg.citations && msg.citations.length > 0 && (
                      <div className="pt-3 border-t border-line/60 space-y-1.5">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted flex items-center gap-1">
                          <Layers className="size-3 text-primary" />
                          Evidence Sources:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.citations.map((c, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold">
                              <FileText className="size-3" />
                              {c.source}: {c.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={`text-[10px] text-muted ${msg.role === "user" ? "text-right" : ""}`}>{msg.timestamp}</div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 max-w-xl">
                <div className="size-8 rounded-full bg-white/10 border border-line flex items-center justify-center shrink-0 text-primary">
                  <Sparkles className="size-4 animate-spin" />
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-line text-xs text-muted flex items-center gap-2 font-mono">
                  Analyzing patient context & model attributions...
                </div>
              </div>
            )}

            {error && (
              <ErrorState title="AI Request Failed" message={error} onRetry={() => handleSendMessage(inputMessage)} />
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Composer */}
          <div className="p-4 border-t border-line bg-white/[0.01]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-3"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about stroke risk factors, SHAP contributions, progression, or model metrics..."
                disabled={isLoading}
                className="flex-1 rounded-xl border border-line bg-white/[0.03] px-4 py-3 text-xs text-text placeholder:text-muted focus:outline-none focus:border-primary font-mono disabled:opacity-50"
              />
              <Button variant="primary" isLoading={isLoading} disabled={!inputMessage.trim() || isLoading}>
                <Send className="size-4 mr-1" />
                Send
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
