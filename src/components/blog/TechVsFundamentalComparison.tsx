import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { 
  BarChart3, BookOpen, Clock, Target, Brain, 
  TrendingUp, GraduationCap, Layers, CheckCircle
} from 'lucide-react';

const TechVsFundamentalComparison = memo(function TechVsFundamentalComparison() {
  const { t } = useTranslation();

  const comparisonRows = [
    { 
      icon: Clock, 
      label: '時間軸',
      technical: '短期〜中期',
      fundamental: '中期〜長期',
    },
    { 
      icon: Target, 
      label: '主な焦点',
      technical: '価格変動とパターン',
      fundamental: '企業/資産価値',
    },
    { 
      icon: Brain, 
      label: '主な信念',
      technical: '価格はすべての情報を反映する',
      fundamental: '市場は資産を誤評価しうる',
    },
    { 
      icon: TrendingUp, 
      label: 'エントリー/イグジット',
      technical: 'チャートシグナルと指標',
      fundamental: 'バリュエーションギャップ',
    },
    { 
      icon: Layers, 
      label: '最適な対象',
      technical: 'アクティブトレーダー',
      fundamental: '投資家・ポジショントレーダー',
    },
    { 
      icon: GraduationCap, 
      label: '学習曲線',
      technical: '中程度（パターン認識）',
      fundamental: '急（財務分析）',
    },
    { 
      icon: Clock, 
      label: '必要な時間',
      technical: '数分〜数時間/トレード',
      fundamental: '数日〜数週間の調査',
    },
    { 
      icon: BarChart3, 
      label: '適した市場',
      technical: 'すべての流動性の高い市場',
      fundamental: '株式、債券、商品',
    },
  ];

  return (
    <div className="my-8">
      <Card className="border-border/50 overflow-hidden">
        <CardHeader className="pb-2 bg-muted/30">
          <CardTitle className="text-lg flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            {t('techVsFund.comparison', '直接比較')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Header row */}
          <div className="grid grid-cols-[1fr_1fr_1fr] border-b border-border text-sm font-semibold">
            <div className="py-3 px-4 text-muted-foreground"></div>
            <div className="py-3 px-4 text-center border-l border-border/50">
              <div className="flex items-center justify-center gap-1.5">
                <BarChart3 className="h-4 w-4 text-blue-500" />
                <span className="text-foreground">テクニカル分析</span>
              </div>
            </div>
            <div className="py-3 px-4 text-center border-l border-border/50">
              <div className="flex items-center justify-center gap-1.5">
                <BookOpen className="h-4 w-4 text-emerald-500" />
                <span className="text-foreground">ファンダメンタル分析</span>
              </div>
            </div>
          </div>
          
          {/* Data rows */}
          {comparisonRows.map((row, i) => (
            <div 
              key={row.label + i} 
              className={`grid grid-cols-[1fr_1fr_1fr] text-sm ${i < comparisonRows.length - 1 ? 'border-b border-border/30' : ''} ${i % 2 === 0 ? 'bg-muted/10' : ''}`}
            >
              <div className="py-2.5 px-4 flex items-center gap-2">
                <row.icon className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                <span className="font-medium text-foreground text-xs">{row.label}</span>
              </div>
              <div className="py-2.5 px-4 text-center text-xs text-muted-foreground border-l border-border/20 flex items-center justify-center">
                {row.technical}
              </div>
              <div className="py-2.5 px-4 text-center text-xs text-muted-foreground border-l border-border/20 flex items-center justify-center">
                {row.fundamental}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
});

export default TechVsFundamentalComparison;
