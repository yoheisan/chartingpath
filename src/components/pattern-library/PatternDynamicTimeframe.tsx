import { usePatternDetailStats } from "@/hooks/usePatternDetailStats";

interface Props {
  patternKey: string;
  textbookTimeframe: string;
}

export const PatternDynamicTimeframe = ({ patternKey, textbookTimeframe }: Props) => {
  const { data: stats } = usePatternDetailStats(patternKey);

  if (!stats || stats.totalDetections < 20 || !stats.bestTimeframe) {
    return <span>{textbookTimeframe}</span>;
  }

  return (
    <span>
      Textbook: {textbookTimeframe.replace(/Most reliable on |Most effective on |Reliable on |Works on |Effective on /i, '')} · 
      ChartingPath data: Best on {stats.bestTimeframe.toUpperCase()} (n={stats.bestTimeframeN.toLocaleString()}, {stats.bestTimeframeWinRate}% win rate)
    </span>
  );
};
