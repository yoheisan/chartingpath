import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FlaskConical, Send, Loader2, Sparkles, MessageSquare, User, Bot } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface SummaryRow {
  instrument: string;
  pattern: string;
  timeframe: string;
  direction: string;
  win_rate: number;
  avg_r: number;
  sample_size: number;
}

interface Message {
  question: string;
  answer: string;
  summary: SummaryRow[];
}

interface EdgeAnalystProps {
  runId?: string;
  initialQuestion?: string;
  autoAnalyze?: boolean;
}

const AUTO_SUMMARY_PROMPT = "Summarize the key performance findings from this backtest run. Highlight the best and worst patterns, overall win rate trends, and any actionable insights.";

const SummaryTable: React.FC<{ summary: SummaryRow[] }> = ({ summary }) => {
  const { t } = useTranslation();
  if (summary.length === 0) return null;
  return (
    <div className="rounded-lg border overflow-hidden mt-3">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/50 text-muted-foreground">
              <th className="text-left px-3 py-2 font-medium">{t('edgeAnalyst.tableInstrument')}</th>
              <th className="text-left px-3 py-2 font-medium">{t('edgeAnalyst.tablePattern')}</th>
              <th className="text-left px-3 py-2 font-medium">{t('edgeAnalyst.tableTF')}</th>
              <th className="text-right px-3 py-2 font-medium">{t('edgeAnalyst.tableWinRate')}</th>
              <th className="text-right px-3 py-2 font-medium">{t('edgeAnalyst.tableAvgR')}</th>
              <th className="text-right px-3 py-2 font-medium">{t('edgeAnalyst.tableSamples')}</th>
            </tr>
          </thead>
          <tbody>
            {summary.map((row, i) => (
              <tr key={i} className="border-t border-border/50 hover:bg-muted/30">
                <td className="px-3 py-2 font-medium">{row.instrument}</td>
                <td className="px-3 py-2">{row.pattern}</td>
                <td className="px-3 py-2 text-muted-foreground">{row.timeframe}</td>
                <td className={`px-3 py-2 text-right font-mono ${row.win_rate >= 50 ? 'text-green-600' : 'text-red-500'}`}>
                  {row.win_rate}%
                </td>
                <td className={`px-3 py-2 text-right font-mono ${row.avg_r > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {row.avg_r > 0 ? '+' : ''}{row.avg_r.toFixed(2)}R
                </td>
                <td className="px-3 py-2 text-right text-muted-foreground">{row.sample_size}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const EdgeAnalyst: React.FC<EdgeAnalystProps> = ({ runId, initialQuestion, autoAnalyze }) => {
  const { t } = useTranslation();
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const hasAutoAnalyzed = useRef(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const EXAMPLE_QUESTIONS = [
    t('edgeAnalyst.exampleQuestions.positiveExpectancy'),
    t('edgeAnalyst.exampleQuestions.bestTimeframe'),
    t('edgeAnalyst.exampleQuestions.longVsShort'),
    t('edgeAnalyst.exampleQuestions.bestInstrument'),
  ];

  // Auto-analyze on backtest completion
  useEffect(() => {
    if (autoAnalyze && runId && !hasAutoAnalyzed.current && messages.length === 0) {
      hasAutoAnalyzed.current = true;
      handleSubmit(initialQuestion || AUTO_SUMMARY_PROMPT);
    }
  }, [autoAnalyze, runId]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSubmit = async (q?: string) => {
    const queryText = q || question;
    if (!queryText.trim()) return;

    setLoading(true);
    setQuestion('');

    try {
      const { data, error } = await supabase.functions.invoke('edge-analyst', {
        body: { question: queryText, runId },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        setLoading(false);
        return;
      }

      setMessages(prev => [...prev, {
        question: queryText,
        answer: data.answer || '',
        summary: data.summary || [],
      }]);
    } catch (err: any) {
      console.error('Edge Analyst error:', err);
      toast.error(err.message || t('edgeAnalyst.failedToAnalyze'));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const initialMessage = messages[0];
  const followUpMessages = messages.slice(1);

  return (
    <Card className="border-amber-500/20 bg-gradient-to-br from-background to-amber-500/[0.02]">
      {/* Header */}
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FlaskConical className="h-4 w-4 text-amber-500" />
          {t('edgeAnalyst.title')}
          <Badge variant="secondary" className="text-[10px] font-normal">{t('edgeAnalyst.badgeAI')}</Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {initialMessage
            ? t('edgeAnalyst.autoDescription')
            : t('edgeAnalyst.defaultDescription')}
        </p>
      </CardHeader>

      <CardContent className="space-y-0">
        {/* Initial Auto-Analysis Section */}
        {loading && messages.length === 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
            <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
            {t('edgeAnalyst.analyzingResults')}
          </div>
        )}

        {initialMessage && (
          <div className="rounded-lg border border-amber-500/10 bg-amber-500/[0.03] p-4">
            <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
              <ReactMarkdown>{initialMessage.answer}</ReactMarkdown>
            </div>
            <SummaryTable summary={initialMessage.summary} />
          </div>
        )}

        {/* Follow-up Chat Section */}
        {initialMessage && (
          <div className="mt-5 border-t border-border/50 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">{t('edgeAnalyst.followUp')}</span>
            </div>

            {/* Example chips when no follow-ups yet */}
            {followUpMessages.length === 0 && !loading && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {EXAMPLE_QUESTIONS.map((eq) => (
                  <button
                    key={eq}
                    onClick={() => handleSubmit(eq)}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-border hover:border-amber-500/40 hover:bg-amber-500/5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {eq}
                  </button>
                ))}
              </div>
            )}

            {/* Follow-up thread */}
            {followUpMessages.length > 0 && (
              <ScrollArea className="max-h-[400px] mb-3">
                <div className="space-y-4 pr-2">
                  {followUpMessages.map((msg, i) => (
                    <div key={i} className="space-y-2">
                      {/* User question */}
                      <div className="flex items-start gap-2">
                        <div className="shrink-0 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                          <User className="h-3 w-3 text-primary" />
                        </div>
                        <p className="text-sm font-medium">{msg.question}</p>
                      </div>
                      {/* AI answer */}
                      <div className="flex items-start gap-2">
                        <div className="shrink-0 h-5 w-5 rounded-full bg-amber-500/10 flex items-center justify-center mt-0.5">
                          <Bot className="h-3 w-3 text-amber-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                            <ReactMarkdown>{msg.answer}</ReactMarkdown>
                          </div>
                          <SummaryTable summary={msg.summary} />
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              </ScrollArea>
            )}

            {/* Loading for follow-up */}
            {loading && messages.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
                <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
                {t('edgeAnalyst.analyzing')}
              </div>
            )}

            {/* Input */}
            <div className="flex gap-2">
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('edgeAnalyst.placeholder')}
                disabled={loading}
                className="text-sm"
              />
              <Button
                onClick={() => handleSubmit()}
                disabled={loading || !question.trim()}
                size="sm"
                className="shrink-0 gap-1.5"
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                {t('edgeAnalyst.ask')}
              </Button>
            </div>
          </div>
        )}

        {/* Pre-analysis state (no auto-analyze, no messages yet) */}
        {!initialMessage && !loading && (
          <>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {EXAMPLE_QUESTIONS.map((eq) => (
                <button
                  key={eq}
                  onClick={() => handleSubmit(eq)}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-border hover:border-amber-500/40 hover:bg-amber-500/5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {eq}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('edgeAnalyst.placeholder')}
                disabled={loading}
                className="text-sm"
              />
              <Button
                onClick={() => handleSubmit()}
                disabled={loading || !question.trim()}
                size="sm"
                className="shrink-0 gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                {t('edgeAnalyst.ask')}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default EdgeAnalyst;
