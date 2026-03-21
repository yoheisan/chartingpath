import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Pause, Square } from 'lucide-react';

interface LiveControlsProps {
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
}

export function LiveControls({ isPaused, onPause, onResume }: LiveControlsProps) {
  const [flattenModalOpen, setFlattenModalOpen] = useState(false);
  const [flattening, setFlattening] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleFlatten = async () => {
    if (!user) return;
    setFlattening(true);
    try {
      const res = await supabase.functions.invoke('alpaca-broker', {
        body: { action: 'flatten_all', user_id: user.id },
      });
      if (res.error) throw res.error;
      
      // Set is_live = false
      await supabase
        .from('broker_connections')
        .update({ is_live: false, is_paused: false } as any)
        .eq('user_id', user.id);

      toast({ title: 'All positions flattened', description: 'Copilot is now offline.' });
      setFlattenModalOpen(false);
    } catch (err) {
      toast({ title: 'Error flattening positions', variant: 'destructive' });
    } finally {
      setFlattening(false);
    }
  };

  return (
    <>
      <div className="flex gap-2 px-3 py-2 border-t border-border/40">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-sm"
          onClick={isPaused ? onResume : onPause}
        >
          <Pause className="h-3.5 w-3.5 mr-1.5" />
          {isPaused ? 'Resume entries' : 'Pause entries'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-sm border-red-500/30 text-red-400 hover:bg-red-500/10"
          onClick={() => setFlattenModalOpen(true)}
        >
          <Square className="h-3.5 w-3.5 mr-1.5" />
          Stop + flatten
        </Button>
      </div>

      <Dialog open={flattenModalOpen} onOpenChange={setFlattenModalOpen}>
        <DialogContent className="sm:max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Flatten all positions</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will close all open positions at market price. Are you sure?
          </p>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setFlattenModalOpen(false)} className="flex-1">Cancel</Button>
            <Button
              onClick={handleFlatten}
              disabled={flattening}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {flattening ? 'Closing…' : 'Flatten all'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
