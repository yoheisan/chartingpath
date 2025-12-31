import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Bell,
  Shield,
  Activity,
  PieChart,
  Minus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HoldingAnalysis {
  symbol: string;
  lastPrice: number;
  regime: string;
  regimeKey: string;
  currentPattern: string;
  patternSignal: 'bullish' | 'bearish' | 'neutral';
  volatility: number;
  atr: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendation: 'hold' | 'watch' | 'neutral';
}

interface AlertSuggestion {
  symbol: string;
  patternId: string;
  patternName: string;
  direction: 'long' | 'short';
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

interface PortfolioCheckupArtifact {
  projectType: 'portfolio_checkup';
  timeframe: string;
  lookbackYears: number;
  generatedAt: string;
  summary: {
    totalHoldings: number;
    highRiskCount: number;
    averageVolatility: number;
    alertSuggestionsCount: number;
  };
  holdings: HoldingAnalysis[];
  riskMetrics: {
    concentrationRisk: number;
    highRiskHoldings: number;
    averageVolatility: number;
  };
  alertSuggestions: AlertSuggestion[];
}

interface PortfolioCheckupViewerProps {
  artifact: PortfolioCheckupArtifact;
  runId: string;
}

const PortfolioCheckupViewer = ({ artifact, runId }: PortfolioCheckupViewerProps) => {
  const navigate = useNavigate();
  
  const getRiskBadge = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Low Risk</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Medium</Badge>;
      case 'high':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">High Risk</Badge>;
    }
  };
  
  const getSignalIcon = (signal: 'bullish' | 'bearish' | 'neutral') => {
    switch (signal) {
      case 'bullish':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'bearish':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/50 bg-card/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              <div className="text-2xl font-bold">{artifact.summary.totalHoldings}</div>
            </div>
            <p className="text-sm text-muted-foreground">Holdings Analyzed</p>
          </CardContent>
        </Card>
        
        <Card className={`border-border/50 ${artifact.summary.highRiskCount > 0 ? 'bg-red-500/5 border-red-500/20' : 'bg-card/50'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Shield className={`h-5 w-5 ${artifact.summary.highRiskCount > 0 ? 'text-red-500' : 'text-green-500'}`} />
              <div className="text-2xl font-bold">{artifact.summary.highRiskCount}</div>
            </div>
            <p className="text-sm text-muted-foreground">High Risk Holdings</p>
          </CardContent>
        </Card>
        
        <Card className="border-border/50 bg-card/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-violet-500" />
              <div className="text-2xl font-bold">{(artifact.summary.averageVolatility * 100).toFixed(1)}%</div>
            </div>
            <p className="text-sm text-muted-foreground">Avg Volatility</p>
          </CardContent>
        </Card>
        
        <Card className="border-border/50 bg-card/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-amber-500" />
              <div className="text-2xl font-bold">{artifact.summary.alertSuggestionsCount}</div>
            </div>
            <p className="text-sm text-muted-foreground">Alert Suggestions</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Alert Suggestions */}
      {artifact.alertSuggestions.length > 0 && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5 text-amber-500" />
              Pattern Alert Suggestions
            </CardTitle>
            <CardDescription>Patterns detected on your holdings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {artifact.alertSuggestions.map((alert, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                  <div className="flex items-center gap-3">
                    {alert.direction === 'long' ? (
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <div className="font-medium">{alert.symbol} - {alert.patternName}</div>
                      <div className="text-sm text-muted-foreground">{alert.reason}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={alert.priority === 'high' ? 'destructive' : 'secondary'}>
                      {alert.priority}
                    </Badge>
                    <Button 
                      size="sm" 
                      onClick={() => navigate('/members/alerts')}
                    >
                      <Bell className="h-4 w-4 mr-1" />
                      Create
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Holdings Table */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="text-lg">Holdings Analysis</CardTitle>
          <CardDescription>Pattern state and risk assessment for each holding</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Pattern</TableHead>
                <TableHead>Regime</TableHead>
                <TableHead className="text-right">Volatility</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {artifact.holdings.map(holding => (
                <TableRow key={holding.symbol}>
                  <TableCell className="font-medium">{holding.symbol}</TableCell>
                  <TableCell className="font-mono">${holding.lastPrice.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getSignalIcon(holding.patternSignal)}
                      <span className="text-sm">{holding.currentPattern}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{holding.regime}</TableCell>
                  <TableCell className="text-right font-mono">
                    {(holding.volatility * 100).toFixed(1)}%
                  </TableCell>
                  <TableCell>{getRiskBadge(holding.riskLevel)}</TableCell>
                  <TableCell>
                    <Badge variant={
                      holding.recommendation === 'watch' ? 'destructive' : 
                      holding.recommendation === 'hold' ? 'default' : 'secondary'
                    }>
                      {holding.recommendation}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Risk Concentration Warning */}
      {artifact.riskMetrics.concentrationRisk > 0.3 && (
        <Alert className="border-red-500/30 bg-red-500/5">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertDescription>
            <strong>High Risk Concentration:</strong> {(artifact.riskMetrics.concentrationRisk * 100).toFixed(0)}% of your holdings are in high-risk assets. Consider diversifying.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default PortfolioCheckupViewer;
