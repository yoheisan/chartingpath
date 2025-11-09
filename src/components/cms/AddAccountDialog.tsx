import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface AddAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddAccountDialog({ open, onOpenChange }: AddAccountDialogProps) {
  const [platform, setPlatform] = useState<"twitter" | "instagram">("twitter");
  const [accountName, setAccountName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [accessTokenSecret, setAccessTokenSecret] = useState("");

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async () => {
      const credentials = {
        api_key: apiKey,
        api_secret: apiSecret,
        access_token: accessToken,
        access_token_secret: accessTokenSecret,
      };

      const { error } = await supabase.from("social_media_accounts").insert({
        platform,
        account_name: accountName,
        credentials,
        is_active: true,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-accounts"] });
      toast.success("Account connected successfully");
      onOpenChange(false);
      resetForm();
    },
    onError: () => {
      toast.error("Failed to connect account");
    },
  });

  const resetForm = () => {
    setPlatform("twitter");
    setAccountName("");
    setApiKey("");
    setApiSecret("");
    setAccessToken("");
    setAccessTokenSecret("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Connect Social Media Account</DialogTitle>
          <DialogDescription>
            Add your X (Twitter) or Instagram account credentials
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            For X (Twitter), you need API v2 credentials with "Read and Write" permissions from your developer account.
          </AlertDescription>
        </Alert>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Platform</Label>
            <Select value={platform} onValueChange={(v: any) => setPlatform(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="twitter">X (Twitter)</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Account Name *</Label>
            <Input
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="@youraccount"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>API Key / Consumer Key *</Label>
            <Input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              type="password"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>API Secret / Consumer Secret *</Label>
            <Input
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              type="password"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Access Token *</Label>
            <Input
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              type="password"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Access Token Secret *</Label>
            <Input
              value={accessTokenSecret}
              onChange={(e) => setAccessTokenSecret(e.target.value)}
              type="password"
              required
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!accountName || !apiKey || !apiSecret || !accessToken || !accessTokenSecret}
          >
            Connect Account
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}