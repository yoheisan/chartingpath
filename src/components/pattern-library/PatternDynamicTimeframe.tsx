import { useTranslation } from "react-i18next";
import { usePatternDetailStats } from "@/hooks/usePatternDetailStats";

interface Props {
  patternKey: string;
  textbookTimeframe: string;
}

export const PatternDynamicTimeframe = ({ patternKey, textbookTimeframe }: Props) => {
  const { t } = useTranslation();
  const { data: stats } = usePatternDetailStats(patternKey);

  if (!stats || stats.totalDetections < 20 || !stats.bestTimeframe) {
    return <span>{textbookTimeframe}</span>;
  }

  const cleanedTextbook = textbookTimeframe.replace(/Most reliable on |Most effective on |Reliable on |Works on |Effective on /i, '');

  return (
    <span>
      {t('patternTimeframe.textbook', 'Textbook: {{tf}}', { tf: cleanedTextbook })} · {t('patternTimeframe.bestOn', 'ChartingPath data: Best on {{tf}} (n={{n}}, {{wr}}% win rate)', { tf: stats.bestTimeframe.toUpperCase(), n: stats.bestTimeframeN.toLocaleString(), wr: stats.bestTimeframeWinRate })}
    </span>
  );
};
