import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { 
  Zap, TrendingUp, Mountain, Clock, DollarSign, 
  BarChart3, Target, AlertTriangle, Brain
} from 'lucide-react';

interface StyleProfile {
  icon: typeof Zap;
  color: string;
  bgColor: string;
  borderColor: string;
  titleKey: string;
  fallbackTitle: string;
  metrics: Array<{
    icon: typeof Clock;
    labelKey: string;
    fallbackLabel: string;
    value: string;
  }>;
}

const TradingStyleCards = memo(function TradingStyleCards() {
  const { t } = useTranslation();

  const styles: StyleProfile[] = [
    {
      icon: Zap,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      titleKey: 'tradingStyles.dayTrading',
      fallbackTitle: 'デイトレード',
      metrics: [
        { icon: Clock, labelKey: 'tradingStyles.holdingPeriod', fallbackLabel: '保有期間', value: '数分〜数時間' },
        { icon: BarChart3, labelKey: 'tradingStyles.tradesPerDay', fallbackLabel: '1日の取引数', value: '5-50+' },
        { icon: Target, labelKey: 'tradingStyles.timeframe', fallbackLabel: '時間軸', value: '1分〜15分足' },
        { icon: DollarSign, labelKey: 'tradingStyles.capital', fallbackLabel: '必要な資本', value: '$25,000+' },
        { icon: Brain, labelKey: 'tradingStyles.timeCommitment', fallbackLabel: '時間的コミットメント', value: '4-8時間/日' },
        { icon: TrendingUp, labelKey: 'tradingStyles.profitTarget', fallbackLabel: '利益目標/トレード', value: '0.5% - 2%' },
        { icon: AlertTriangle, labelKey: 'tradingStyles.stressLevel', fallbackLabel: 'ストレスレベル', value: '高' },
      ],
    },
    {
      icon: TrendingUp,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      titleKey: 'tradingStyles.swingTrading',
      fallbackTitle: 'スイングトレード',
      metrics: [
        { icon: Clock, labelKey: 'tradingStyles.holdingPeriod', fallbackLabel: '保有期間', value: '2日〜4週間' },
        { icon: BarChart3, labelKey: 'tradingStyles.tradesPerMonth', fallbackLabel: '1ヶ月の取引数', value: '5-15' },
        { icon: Target, labelKey: 'tradingStyles.timeframe', fallbackLabel: '時間軸', value: '1時間〜日足' },
        { icon: DollarSign, labelKey: 'tradingStyles.capital', fallbackLabel: '必要な資本', value: '$5,000+' },
        { icon: Brain, labelKey: 'tradingStyles.timeCommitment', fallbackLabel: '時間的コミットメント', value: '1-2時間/日' },
        { icon: TrendingUp, labelKey: 'tradingStyles.profitTarget', fallbackLabel: '利益目標/トレード', value: '5% - 15%' },
        { icon: AlertTriangle, labelKey: 'tradingStyles.stressLevel', fallbackLabel: 'ストレスレベル', value: '中程度' },
      ],
    },
    {
      icon: Mountain,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      titleKey: 'tradingStyles.positionTrading',
      fallbackTitle: 'ポジショントレード',
      metrics: [
        { icon: Clock, labelKey: 'tradingStyles.holdingPeriod', fallbackLabel: '保有期間', value: '数週間〜数ヶ月' },
        { icon: BarChart3, labelKey: 'tradingStyles.tradesPerYear', fallbackLabel: '年間取引数', value: '10-30' },
        { icon: Target, labelKey: 'tradingStyles.timeframe', fallbackLabel: '時間軸', value: '日足〜週足' },
        { icon: DollarSign, labelKey: 'tradingStyles.capital', fallbackLabel: '必要な資本', value: '$10,000+' },
        { icon: Brain, labelKey: 'tradingStyles.timeCommitment', fallbackLabel: '時間的コミットメント', value: '2-4時間/週' },
        { icon: TrendingUp, labelKey: 'tradingStyles.profitTarget', fallbackLabel: '利益目標/トレード', value: '15% - 50%+' },
        { icon: AlertTriangle, labelKey: 'tradingStyles.stressLevel', fallbackLabel: 'ストレスレベル', value: '低〜中程度' },
      ],
    },
  ];

  const comparisonRows = [
    { label: '必要な時間', values: ['6-8時間/日', '1-2時間/日', '2-4時間/週'] },
    { label: 'ストレスレベル', values: ['非常に高い', '中程度', '低い'] },
    { label: '取引コスト', values: ['非常に高い', '中程度', '低い'] },
    { label: '初期資本', values: ['$25,000+', '$5,000+', '$10,000+'] },
    { label: 'テクニカルの焦点', values: ['短期パターン', '数日間スイング', '主要トレンド'] },
    { label: 'オーバーナイトリスク', values: ['なし', 'あり', 'あり'] },
    { label: '最適な対象', values: ['フルタイム', 'パートタイム', '忙しい専門家'] },
  ];

  const stressColor = (val: string) => {
    if (val.includes('非常に高い') || val === '高') return 'text-red-400';
    if (val.includes('中程度')) return 'text-amber-400';
    if (val.includes('低')) return 'text-emerald-400';
    return 'text-muted-foreground';
  };

  return (
    <div className="my-8 space-y-8">
      {/* Style Profile Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {styles.map((style) => (
          <Card key={style.fallbackTitle} className={`${style.borderColor} overflow-hidden`}>
            <CardHeader className={`${style.bgColor} pb-3`}>
              <CardTitle className="text-base flex items-center gap-2">
                <style.icon className={`h-5 w-5 ${style.color}`} />
                {t(style.titleKey, style.fallbackTitle)}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {style.metrics.map((metric) => (
                <div key={metric.fallbackLabel} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <metric.icon className={`h-3.5 w-3.5 ${style.color} flex-shrink-0`} />
                    <span>{t(metric.labelKey, metric.fallbackLabel)}</span>
                  </div>
                  <span className={`text-xs font-medium text-foreground ${metric.fallbackLabel === 'ストレスレベル' ? stressColor(metric.value) : ''}`}>
                    {metric.value}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Comparison Matrix */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            {t('tradingStyles.comparisonMatrix', '比較マトリックス')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2.5 px-4 font-medium text-muted-foreground"></th>
                  <th className="text-center py-2.5 px-4 font-semibold">
                    <div className="flex items-center justify-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-red-500" />
                      <span className="text-foreground">{t('tradingStyles.dayTrading', 'デイ')}</span>
                    </div>
                  </th>
                  <th className="text-center py-2.5 px-4 font-semibold">
                    <div className="flex items-center justify-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-foreground">{t('tradingStyles.swingTrading', 'スイング')}</span>
                    </div>
                  </th>
                  <th className="text-center py-2.5 px-4 font-semibold">
                    <div className="flex items-center justify-center gap-1.5">
                      <Mountain className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-foreground">{t('tradingStyles.positionTrading', 'ポジション')}</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr key={row.label} className={i < comparisonRows.length - 1 ? 'border-b border-border/30' : ''}>
                    <td className="py-2.5 px-4 font-medium text-foreground text-xs">{row.label}</td>
                    {row.values.map((val, j) => (
                      <td key={j} className={`py-2.5 px-4 text-center text-xs ${row.label === 'ストレスレベル' ? stressColor(val) : 'text-muted-foreground'}`}>
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

export default TradingStyleCards;
