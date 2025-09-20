import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Copy } from 'lucide-react';

interface ExportPanelProps {
  strategy: any;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ strategy }) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export & Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              MetaTrader 4
            </Button>
            <Button className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              MetaTrader 5
            </Button>
            <Button className="flex items-center gap-2">
              <Copy className="w-4 h-4" />
              Pine Script v5
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};