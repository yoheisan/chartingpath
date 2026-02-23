import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, MessageSquarePlus } from 'lucide-react';

interface ContactSupportDialogProps {
  trigger?: React.ReactNode;
  defaultCategory?: 'bug' | 'feature' | 'billing' | 'account' | 'other';
  defaultSubject?: string;
  defaultDescription?: string;
  source?: string;
  contextJson?: Record<string, unknown>;
}

export function ContactSupportDialog({
  trigger,
  defaultCategory = 'other',
  defaultSubject = '',
  defaultDescription = '',
  source = 'contact_form',
  contextJson,
}: ContactSupportDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState(defaultSubject);
  const [description, setDescription] = useState(defaultDescription);
  const [category, setCategory] = useState<string>(defaultCategory);

  const handleSubmit = async () => {
    if (!subject.trim() || !description.trim()) {
      toast.error(t('support.fillRequired', 'Please fill in all required fields.'));
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('submit-support-ticket', {
        body: { subject, description, category, source, context_json: contextJson },
      });

      if (error) throw error;

      toast.success(t('support.ticketCreated', 'Your request has been submitted. We\'ll get back to you shortly!'));
      setOpen(false);
      setSubject('');
      setDescription('');
      setCategory(defaultCategory);
    } catch (err: any) {
      console.error('Support ticket error:', err);
      toast.error(t('support.ticketError', 'Failed to submit your request. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <MessageSquarePlus className="h-4 w-4" />
            {t('support.contactSupport', 'Contact Support')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('support.title', 'Contact Support')}</DialogTitle>
          <DialogDescription>
            {t('support.subtitle', 'Describe your issue or request. Our team will respond to your email.')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="support-category">{t('support.category', 'Category')}</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="support-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bug">{t('support.categoryBug', '🐛 Bug Report')}</SelectItem>
                <SelectItem value="feature">{t('support.categoryFeature', '💡 Feature Request')}</SelectItem>
                <SelectItem value="billing">{t('support.categoryBilling', '💳 Billing')}</SelectItem>
                <SelectItem value="account">{t('support.categoryAccount', '👤 Account')}</SelectItem>
                <SelectItem value="other">{t('support.categoryOther', '📩 Other')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="support-subject">{t('support.subject', 'Subject')} *</Label>
            <Input
              id="support-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t('support.subjectPlaceholder', 'Brief summary of your request')}
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="support-description">{t('support.description', 'Description')} *</Label>
            <Textarea
              id="support-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('support.descriptionPlaceholder', 'Provide as much detail as possible...')}
              rows={5}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground text-right">{description.length}/2000</p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading || !subject.trim() || !description.trim()}
            className="w-full"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {t('support.submitting', 'Submitting...')}</>
            ) : (
              t('support.submit', 'Submit Request')
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
