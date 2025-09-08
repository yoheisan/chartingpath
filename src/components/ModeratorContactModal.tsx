import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Bug, CreditCard, Lightbulb, Settings, Flag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const CATEGORIES = [
  { value: 'general', label: 'General Inquiry', icon: Settings },
  { value: 'technical', label: 'Technical Issue', icon: Bug },
  { value: 'billing', label: 'Billing Question', icon: CreditCard },
  { value: 'feature_request', label: 'Feature Request', icon: Lightbulb },
  { value: 'bug_report', label: 'Bug Report', icon: Bug },
  { value: 'inappropriate_content', label: 'Report Content', icon: Flag },
];

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' },
];

interface ModeratorContactModalProps {
  open: boolean;
  onClose: () => void;
}

const ModeratorContactModal: React.FC<ModeratorContactModalProps> = ({ open, onClose }) => {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!subject.trim() || !description.trim() || !category) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to contact moderators",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('moderator_reports')
        .insert({
          user_id: user.id,
          subject: subject.trim(),
          description: description.trim(),
          category,
          priority,
        });

      if (error) throw error;

      toast({
        title: "Report Submitted",
        description: "Your message has been sent to the moderation team. You'll receive a response soon.",
      });

      // Reset form
      setSubject('');
      setDescription('');
      setCategory('');
      setPriority('medium');
      onClose();
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to send your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategory = CATEGORIES.find(c => c.value === category);
  const selectedPriority = PRIORITIES.find(p => p.value === priority);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Contact Moderator
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Category *</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => {
                  const IconComponent = cat.icon;
                  return (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        {cat.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Priority</label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((pri) => (
                  <SelectItem key={pri.value} value={pri.value}>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${pri.color}`}>
                        {pri.label}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Subject *</label>
            <Input
              placeholder="Brief summary of your issue"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1"
              maxLength={100}
            />
            <div className="text-xs text-muted-foreground mt-1">
              {subject.length}/100 characters
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Description *</label>
            <Textarea
              placeholder="Please provide detailed information about your issue or request..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 min-h-[100px]"
              maxLength={1000}
            />
            <div className="text-xs text-muted-foreground mt-1">
              {description.length}/1000 characters
            </div>
          </div>

          {selectedCategory && selectedPriority && (
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-sm font-medium mb-2">Summary:</div>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline">
                  {React.createElement(selectedCategory.icon, { className: "h-3 w-3 mr-1" })}
                  {selectedCategory.label}
                </Badge>
                <Badge className={`text-xs ${selectedPriority.color}`}>
                  {selectedPriority.label} Priority
                </Badge>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || !subject.trim() || !description.trim() || !category}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModeratorContactModal;