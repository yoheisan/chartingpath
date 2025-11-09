import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AddAccountDialog } from "./AddAccountDialog";

export function SocialAccountsManager() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data: accounts, isLoading } = useQuery({
    queryKey: ["social-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_media_accounts")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Social Media Accounts</h2>
          <p className="text-muted-foreground">
            Connect and manage your X and Instagram accounts
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Account
        </Button>
      </div>

      {!isLoading && (!accounts || accounts.length === 0) ? (
        <Card className="p-12 text-center">
          <h3 className="text-lg font-semibold mb-2">No accounts connected</h3>
          <p className="text-muted-foreground mb-4">
            Connect your X (Twitter) or Instagram account to start posting
          </p>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            Connect Account
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {accounts?.map((account) => (
            <Card key={account.id} className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{account.account_name}</h3>
                    <Badge variant={account.is_active ? "default" : "secondary"}>
                      {account.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <Badge variant="outline" className="mb-4">
                    {account.platform === "twitter" ? "X (Twitter)" : "Instagram"}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Connected on {new Date(account.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Settings
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AddAccountDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />
    </div>
  );
}