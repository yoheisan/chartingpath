import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FlaskConical, Send, Loader2, Sparkles } from 'lucide-react';
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

interface EdgeAnalystProps {
  runId?: string;
  initialQuestion?: string;
}

const EXAMPLE_QUESTIONS = [
  "Which patterns have positive expectancy?",
  "What's the best timeframe for this setup?",
  "Compare long vs short performance",
  "Which instrument performs best?",
];

const EdgeAnalyst: React.FC<EdgeAnalystProps> = ({ runId, initialQuestion }) => {
  const { t } = useTranslation();
  const [question, setQuestion] = useState(initialQuestion || '');
  const [answer, setAnswer] = useState('');
  const [summary, setSummary] = useState<SummaryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasQueried, setHasQueried] = useState(false);
  const hasAutoSubmitted = React.useRef(false);

  // Auto-submit initial question
  React.useEffect(() => {
    if (initialQuestion && !hasAutoSubmitted.current) {
      hasAutoSubmitted.current = true;
      handleSubmit(initialQuestion);
    }
  }, [initialQuestion]);

  const handleSubmit = async (q?: string) => {
    const queryText = q || question;
    if (!queryText.trim()) return;

    setLoading(true);
    setAnswer('');
    setSummary([]);
    setHasQueried(true);

    try {
      const { data, error } = await supabase.functions.invoke('edge-analyst', {
        body: { question: queryText, runId },
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setAnswer(data.answer || '');
      setSummary(data.summary || []);
    } catch (err: any) {
      console.error('Edge Analyst error:', err);
      toast.error(err.message || 'Failed to analyze');
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

  return (
    <Card className="border-amber-500/20 bg-gradient-to-br from-background to-amber-500/[0.02]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FlaskConical className="h-4 w-4 text-amber-500" />
          Edge Analyst
          <Badge variant="secondary" className="text-[10px] font-normal">
            AI
          </Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Ask data-driven questions about pattern performance from your backtests.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Example chips */}
        {!hasQueried && (
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLE_QUESTIONS.map((eq) => (
              <button
                key={eq}
                onClick={() => {
                  setQuestion(eq);
                  handleSubmit(eq);
                }}
                className="text-[11px] px-2.5 py-1 rounded-full border border-border hover:border-amber-500/40 hover:bg-amber-500/5 text-muted-foreground hover:text-foreground transition-colors"
              >
                {eq}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Which patterns have positive expectancy on Gold?"
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
            Ask
          </Button>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
            Analyzing pattern data...
          </div>
        )}

        {/* AI Answer */}
        {answer && !loading && (
          <div className="rounded-lg border border-amber-500/10 bg-amber-500/[0.03] p-4">
            <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
              <ReactMarkdown>{answer}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Summary Table */}
        {summary.length > 0 && !loading && (
          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground">
                    <th className="text-left px-3 py-2 font-medium">Instrument</th>
                    <th className="text-left px-3 py-2 font-medium">Pattern</th>
                    <th className="text-left px-3 py-2 font-medium">TF</th>
                    <th className="text-right px-3 py-2 font-medium">Win Rate</th>
                    <th className="text-right px-3 py-2 font-medium">Avg R</th>
                    <th className="text-right px-3 py-2 font-medium">Samples</th>
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
        )}

        {/* Empty state after query */}
        {hasQueried && !loading && summary.length === 0 && answer && (
          <p className="text-xs text-muted-foreground text-center py-2">
            No patterns with ≥10 trade samples to display in the summary table.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default EdgeAnalyst;
