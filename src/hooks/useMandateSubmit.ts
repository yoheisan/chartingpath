import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type MandateState =
  | { step: "idle" }
  | { step: "parsing" }
  | { step: "confirming"; parsed: any; confirmation: string }
  | { step: "saving" }
  | { step: "error"; message: string };

const EDGE_FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/copilot-mandate`;

async function callMandate(action: string, body: Record<string, any>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const resp = await fetch(EDGE_FN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify({ action, ...body }),
  });

  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error || "Request failed");
  return data;
}

export function useMandateSubmit(onSaved?: () => void) {
  const [state, setState] = useState<MandateState>({ step: "idle" });

  const submit = useCallback(async (text: string) => {
    if (!text.trim()) return;

    setState({ step: "parsing" });

    try {
      // Step 1: Classify
      const { classification } = await callMandate("classify", { text });

      if (classification === "override") {
        const { summary } = await callMandate("override", { text });
        toast.success(`Got it — ${summary}`);
        setState({ step: "idle" });
        return;
      }

      if (classification === "question") {
        // Pass to existing copilot chat — for now just toast
        toast.info("Routing to Copilot chat...");
        setState({ step: "idle" });
        return;
      }

      // new_mandate flow
      const { parsed } = await callMandate("parse", { text });
      if (!parsed) throw new Error("Parse returned empty");

      // Step 2: Get confirmation
      const { confirmation } = await callMandate("confirm", { mandate: parsed });

      setState({ step: "confirming", parsed, confirmation });
    } catch (err: any) {
      const msg = err.message || "Couldn't parse that — try being more specific.\nExample: Max 3% per trade, breakouts only, 9:30-11:30am";
      setState({ step: "error", message: msg });
    }
  }, []);

  const confirmSave = useCallback(async () => {
    if (state.step !== "confirming") return;

    setState({ step: "saving" });
    try {
      await callMandate("save", { mandate: state.parsed });
      toast.success("Master Plan saved");
      setState({ step: "idle" });
      onSaved?.();
    } catch (err: any) {
      setState({ step: "error", message: err.message || "Failed to save" });
    }
  }, [state, onSaved]);

  const reset = useCallback(() => {
    setState({ step: "idle" });
  }, []);

  return { state, submit, confirmSave, reset };
}
