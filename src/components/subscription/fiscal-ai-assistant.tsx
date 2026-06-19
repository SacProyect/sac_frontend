import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    Bot,
    X,
    Send,
    Loader2,
    Minimize2,
    Sparkles,
    Lightbulb,
    Copy,
    Check,
    RotateCcw,
    ChevronDown,
    ChevronUp,
    Zap,
} from 'lucide-react';
import { Button } from '@/components/UI/button';
import {
    fiscalAiAgent,
    type AgentAttachment,
    type AgentPreview,
} from '@/components/utils/api/subscription-functions';
import { useSubscriptionFeatures } from '@/hooks/use-subscription-features';
import { useAuth } from '@/hooks/use-auth';
import { useAgentPageContext } from '@/hooks/use-agent-page-context';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Download, Table2 } from 'lucide-react';

const SESSION_STORAGE_KEY = 'sac-ai-session-id';

type ChatMessage = {
    role: 'user' | 'assistant';
    content: string;
    toolUsed?: boolean;
    stepCount?: number;
    attachments?: AgentAttachment[];
    previews?: AgentPreview[];
};

const WELCOME =
    'Soy tu **Asistente Fiscal IA**. Consulto datos reales de SAC — RIF, cartera, IVA y normativa. ¿Qué necesitas?';

const SUGGESTIONS_BY_ROLE: Record<string, string[]> = {
    FISCAL: [
        'Resume mi cartera de contribuyentes',
        'Contribuyentes sin reporte IVA este mes',
        'Redactar borrador de aviso por mora',
        'Buscar contribuyente por RIF',
    ],
    SUPERVISOR: [
        'Resumen del equipo de fiscales',
        'Fiscales con casos pendientes',
        'Verificar coherencia de reportes IVA',
        'Indicadores de gestión del mes',
    ],
    COORDINATOR: [
        'Resumen consolidado de coordinaciones',
        'Indicadores de cumplimiento por equipo',
        'Reporte de avances de fiscales',
        'Estado de operativos en curso',
    ],
    ADMIN: [
        'Resume mi cartera de contribuyentes',
        'Excel: sin máquina fiscal y sin IVA 6 meses',
        'Buscar contribuyente por RIF',
        '¿Qué debe llevar una providencia VDF?',
    ],
};

const COLLAPSE_THRESHOLD = 320;

function TypingIndicator() {
    return (
        <div className="flex items-start gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20 ring-1 ring-violet-500/30">
                <Bot className="h-3.5 w-3.5 text-violet-400" />
            </div>
            <div className="rounded-2xl rounded-tl-md border border-violet-500/10 bg-gradient-to-br from-muted/80 to-muted/40 px-4 py-3 backdrop-blur-sm">
                <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:300ms]" />
                    <span className="ml-2 text-[11px] text-muted-foreground">Consultando SAC...</span>
                </div>
            </div>
        </div>
    );
}

function AssistantMessage({
    content,
    toolUsed,
    stepCount,
    attachments,
    previews,
    index,
}: {
    content: string;
    toolUsed?: boolean;
    stepCount?: number;
    attachments?: AgentAttachment[];
    previews?: AgentPreview[];
    index: number;
}) {
    const [expanded, setExpanded] = useState(false);
    const [copied, setCopied] = useState(false);
    const isLong = content.length > COLLAPSE_THRESHOLD;

    const copy = async () => {
        await navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div
            className="flex items-start gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300"
            style={{ animationDelay: `${Math.min(index * 40, 200)}ms` }}
        >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/25 to-indigo-600/25 ring-1 ring-violet-400/30 shadow-sm shadow-violet-500/10">
                <Sparkles className="h-3.5 w-3.5 text-violet-300" />
            </div>
            <div className="group relative min-w-0 max-w-[88%]">
                <div className="relative overflow-hidden rounded-2xl rounded-tl-md border border-violet-500/15 bg-gradient-to-br from-muted/90 via-muted/60 to-violet-950/10 px-3.5 py-2.5 shadow-sm backdrop-blur-sm">
                    <div className="absolute left-0 top-0 h-full w-0.5 bg-gradient-to-b from-violet-400 to-indigo-500" />
                    <div
                        className={cn(
                            'prose prose-sm dark:prose-invert max-w-none',
                            'prose-headings:my-1 prose-headings:text-[13px] prose-headings:font-semibold',
                            'prose-p:my-1 prose-p:text-[13px] prose-p:leading-relaxed',
                            'prose-li:my-0.5 prose-li:text-[13px]',
                            'prose-strong:text-foreground prose-strong:font-semibold',
                            'prose-code:text-violet-300 prose-code:bg-violet-500/10 prose-code:px-1 prose-code:rounded prose-code:text-xs',
                            !expanded && isLong && 'max-h-28 overflow-hidden',
                        )}
                    >
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                    </div>
                    {!expanded && isLong && (
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-muted/95 to-transparent" />
                    )}
                    {isLong && (
                        <button
                            type="button"
                            onClick={() => setExpanded((e) => !e)}
                            className="mt-1.5 flex items-center gap-0.5 text-[11px] font-medium text-violet-400 hover:text-violet-300 transition-colors"
                        >
                            {expanded ? (
                                <>
                                    <ChevronUp className="h-3 w-3" /> Ver menos
                                </>
                            ) : (
                                <>
                                    <ChevronDown className="h-3 w-3" /> Ver respuesta completa
                                </>
                            )}
                        </button>
                    )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 px-1">
                    {toolUsed && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 ring-1 ring-emerald-500/20">
                            <Zap className="h-2.5 w-2.5" />
                            {stepCount && stepCount > 0
                                ? `Consultó ${stepCount} fuente${stepCount > 1 ? 's' : ''}`
                                : 'Verificado en SAC'}
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={copy}
                        className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-all"
                        aria-label="Copiar respuesta"
                    >
                        {copied ? (
                            <>
                                <Check className="h-3 w-3 text-emerald-400" /> Copiado
                            </>
                        ) : (
                            <>
                                <Copy className="h-3 w-3" /> Copiar
                            </>
                        )}
                    </button>
                </div>
                {attachments && attachments.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2 px-1">
                        {attachments.map((a) => (
                            <a
                                key={a.downloadUrl}
                                href={a.downloadUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-[11px] font-medium text-violet-300 hover:bg-violet-500/20"
                            >
                                <Download className="h-3 w-3" />
                                {a.filename}
                            </a>
                        ))}
                    </div>
                )}
                {previews && previews.length > 0 && (
                    <details className="mt-2 px-1 text-[11px] text-muted-foreground">
                        <summary className="cursor-pointer inline-flex items-center gap-1 text-violet-400">
                            <Table2 className="h-3 w-3" />
                            Vista previa ({previews[0].rows.length} filas)
                        </summary>
                        <div className="mt-2 overflow-x-auto rounded border border-border/50">
                            <table className="min-w-full text-left text-[10px]">
                                <thead>
                                    <tr>
                                        {previews[0].columns.map((c) => (
                                            <th key={c} className="border-b px-2 py-1 font-medium">
                                                {c}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {previews[0].rows.map((row, ri) => (
                                        <tr key={ri}>
                                            {row.map((cell, ci) => (
                                                <td key={ci} className="border-b px-2 py-1">
                                                    {String(cell ?? '')}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </details>
                )}
            </div>
        </div>
    );
}

export function FiscalAiAssistant() {
    const { features, loading } = useSubscriptionFeatures();
    const { user } = useAuth();
    const pageContext = useAgentPageContext();
    const [open, setOpen] = useState(false);
    const [minimized, setMinimized] = useState(false);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [sessionId, setSessionId] = useState<string | undefined>(() =>
        typeof sessionStorage !== 'undefined'
            ? sessionStorage.getItem(SESSION_STORAGE_KEY) ?? undefined
            : undefined,
    );
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'assistant', content: WELCOME },
    ]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages, open, sending]);

    useEffect(() => {
        if (open && !minimized) inputRef.current?.focus();
    }, [open, minimized]);

    const resetChat = useCallback(() => {
        setMessages([{ role: 'assistant', content: WELCOME }]);
        setInput('');
        setSessionId(undefined);
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }, []);

    if (loading || !features.aiAssistant) return null;

    const suggestions = user
        ? (SUGGESTIONS_BY_ROLE[user.role] ?? SUGGESTIONS_BY_ROLE.FISCAL)
        : [];
    const showSuggestions = messages.length <= 1 && suggestions.length > 0;

    const send = async (text?: string) => {
        const message = (text ?? input).trim();
        if (!message || sending) return;

        setInput('');
        setMessages((prev) => [...prev, { role: 'user', content: message }]);
        setSending(true);

        try {
            const result = await fiscalAiAgent(message, { sessionId, pageContext });
            setSessionId(result.sessionId);
            sessionStorage.setItem(SESSION_STORAGE_KEY, result.sessionId);
            const hasTools = result.steps.length > 0;
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: result.reply,
                    toolUsed: hasTools,
                    stepCount: result.steps.length,
                    attachments: result.attachments,
                    previews: result.previews,
                },
            ]);
        } catch (err: unknown) {
            const axiosErr = err as {
                response?: { data?: { error?: string | { message?: string } } };
                message?: string;
            };
            const apiErr = axiosErr.response?.data?.error;
            const apiMessage = typeof apiErr === 'string' ? apiErr : apiErr?.message;
            toast.error(apiMessage ?? (err instanceof Error ? err.message : 'Error del asistente'));
        } finally {
            setSending(false);
        }
    };

    if (!open) {
        return (
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="group fixed bottom-6 right-6 z-50"
                aria-label="Abrir asistente fiscal IA"
            >
                <span className="absolute inset-0 rounded-full bg-violet-500/40 blur-xl scale-110 opacity-60 group-hover:opacity-80 transition-opacity" />
                <span className="absolute inset-0 rounded-full bg-violet-500/20 animate-ping opacity-30" />
                <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 via-indigo-600 to-purple-700 text-white shadow-xl shadow-violet-600/40 ring-2 ring-violet-400/30 transition-transform group-hover:scale-105 group-active:scale-95">
                    <Bot className="h-6 w-6 drop-shadow-sm" />
                </span>
            </button>
        );
    }

    return (
        <div
            className={cn(
                'fixed z-50 flex flex-col overflow-hidden transition-all duration-300 ease-out',
                'border border-violet-500/20 shadow-[0_25px_80px_-12px_rgba(124,58,237,0.45)]',
                'bg-card/95 backdrop-blur-xl rounded-2xl ring-1 ring-white/5',
                minimized
                    ? 'bottom-6 right-6 w-72 h-14'
                    : 'bottom-6 right-6 w-[min(100vw-2rem,24rem)] h-[min(85vh,32rem)] sm:w-[26rem]',
            )}
        >
            {/* Header */}
            <div className="relative flex shrink-0 items-center justify-between overflow-hidden px-4 py-3">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600" />
                <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.08)_50%,transparent_75%)] animate-[shimmer_3s_ease-in-out_infinite]" />
                <div className="relative flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
                        <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-white leading-tight">Asistente Fiscal IA</p>
                        <p className="text-[10px] text-violet-200/80">Respuestas directas · SAC</p>
                    </div>
                </div>
                <div className="relative flex items-center gap-0.5">
                    {messages.length > 1 && (
                        <button
                            type="button"
                            onClick={resetChat}
                            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            aria-label="Nueva conversación"
                            title="Nueva conversación"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => setMinimized((m) => !m)}
                        className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        aria-label="Minimizar"
                    >
                        <Minimize2 className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        aria-label="Cerrar"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {!minimized && (
                <>
                    {/* Messages */}
                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto px-3 py-4 space-y-4 bg-gradient-to-b from-background via-background to-violet-950/5 scrollbar-thin"
                    >
                        {messages.map((msg, i) =>
                            msg.role === 'user' ? (
                                <div
                                    key={i}
                                    className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-300"
                                    style={{ animationDelay: `${Math.min(i * 40, 200)}ms` }}
                                >
                                    <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-gradient-to-br from-violet-600 to-indigo-600 px-3.5 py-2 text-[13px] leading-relaxed text-white shadow-md shadow-violet-900/20">
                                        {msg.content}
                                    </div>
                                </div>
                            ) : (
                                <AssistantMessage
                                    key={i}
                                    content={msg.content}
                                    toolUsed={msg.toolUsed}
                                    stepCount={msg.stepCount}
                                    attachments={msg.attachments}
                                    previews={msg.previews}
                                    index={i}
                                />
                            ),
                        )}
                        {sending && <TypingIndicator />}
                    </div>

                    {/* Suggestions */}
                    {showSuggestions && (
                        <div className="px-3 pb-2 animate-in fade-in duration-500">
                            <div className="flex items-center gap-1.5 mb-2 px-1">
                                <Lightbulb className="h-3 w-3 text-amber-400" />
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    Accesos rápidos
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {suggestions.map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => send(s)}
                                        disabled={sending}
                                        className="text-[11px] px-2.5 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/5 text-muted-foreground hover:text-foreground hover:bg-violet-500/15 hover:border-violet-500/40 hover:shadow-sm hover:shadow-violet-500/10 transition-all duration-200 disabled:opacity-50"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input */}
                    <div className="shrink-0 border-t border-violet-500/10 bg-muted/20 p-3">
                        <div className="flex gap-2 items-end">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        send();
                                    }
                                }}
                                placeholder="Consulta fiscal..."
                                rows={1}
                                className="flex-1 resize-none text-[13px] bg-background/80 border border-violet-500/15 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/30 placeholder:text-muted-foreground/60 transition-shadow max-h-24"
                                style={{ minHeight: '2.5rem' }}
                            />
                            <Button
                                size="icon"
                                onClick={() => send()}
                                disabled={sending || !input.trim()}
                                className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-md shadow-violet-900/30 disabled:opacity-40 transition-all"
                            >
                                {sending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        <p className="mt-2 text-center text-[9px] text-muted-foreground/50">
                            Orientación IA — no sustituye criterio del fiscal
                        </p>
                    </div>
                </>
            )}

            <style>{`
                @keyframes shimmer {
                    0%, 100% { transform: translateX(-100%); }
                    50% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
}
