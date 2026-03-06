import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Trash2, Pencil, Check, X, FolderOpen } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AgentScoringSettingsData, useAgentScoringSettings } from '@/hooks/useAgentScoringSettings';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface Props {
  currentSettings: Omit<AgentScoringSettingsData, 'id' | 'name' | 'isDefault'>;
  onLoad: (setting: AgentScoringSettingsData) => void;
  activeSettingId?: string;
  setActiveSettingId: (id?: string) => void;
}

export const SettingsManager: React.FC<Props> = ({ currentSettings, onLoad, activeSettingId, setActiveSettingId }) => {
  const { t } = useTranslation();
  const { settings, save, remove, rename, isSaving } = useAgentScoringSettings();
  const [saveName, setSaveName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [open, setOpen] = useState(false);

  const handleSave = async () => {
    const name = saveName.trim() || `Setting ${settings.length + 1}`;
    try {
      const id = await save({
        ...currentSettings,
        name,
        isDefault: false,
      });
      setActiveSettingId(id);
      setSaveName('');
      toast.success(`Saved "${name}"`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to save');
    }
  };

  const handleUpdate = async () => {
    if (!activeSettingId) return;
    const existing = settings.find(s => s.id === activeSettingId);
    if (!existing) return;
    try {
      await save({ ...currentSettings, id: activeSettingId, name: existing.name, isDefault: existing.isDefault });
      toast.success(`Updated "${existing.name}"`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to update');
    }
  };

  const handleRename = async (id: string) => {
    if (!renameValue.trim()) return;
    try {
      await rename({ id, name: renameValue.trim() });
      setRenamingId(null);
      toast.success('Renamed');
    } catch (e: any) {
      toast.error(e.message || 'Failed to rename');
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      {/* Save current */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
            <Save className="h-3.5 w-3.5" /> Save
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3 space-y-2" align="start">
          <Input
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="Setting name..."
            className="h-8 text-xs"
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <Button size="sm" className="w-full h-7 text-xs" onClick={handleSave} disabled={isSaving}>
            Save as New
          </Button>
          {activeSettingId && (
            <Button size="sm" variant="secondary" className="w-full h-7 text-xs" onClick={handleUpdate} disabled={isSaving}>
              Update Current
            </Button>
          )}
        </PopoverContent>
      </Popover>

      {/* Load */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
            <FolderOpen className="h-3.5 w-3.5" /> Load
            {settings.length > 0 && <span className="ml-0.5 text-muted-foreground">({settings.length})</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-2 space-y-1 max-h-64 overflow-y-auto" align="start">
          {settings.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No saved settings yet</p>
          ) : settings.map((s) => (
            <div key={s.id} className={`flex items-center gap-1.5 p-2 rounded-md hover:bg-muted/50 transition-colors ${s.id === activeSettingId ? 'bg-primary/10 border border-primary/20' : ''}`}>
              {renamingId === s.id ? (
                <div className="flex items-center gap-1 flex-1">
                  <Input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="h-6 text-xs flex-1"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleRename(s.id!)}
                  />
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleRename(s.id!)}>
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setRenamingId(null)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <>
                  <button
                    className="flex-1 text-left text-xs font-medium truncate"
                    onClick={() => { onLoad(s); setActiveSettingId(s.id); setOpen(false); toast.success(`Loaded "${s.name}"`); }}
                  >
                    {s.name}
                  </button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground" onClick={() => { setRenamingId(s.id!); setRenameValue(s.name); }}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive" onClick={async () => { await remove(s.id!); if (activeSettingId === s.id) setActiveSettingId(undefined); toast.success('Deleted'); }}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  );
};
