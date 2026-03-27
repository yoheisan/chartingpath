import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { type MandateRule, type MasterPlan, planToRules } from "@/hooks/useMasterPlan";
import { useTradingCopilotContext } from "./TradingCopilotContext";
import { Plus, Lock, Pencil, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface MandateCardProps {
  onFocusNLBar?: (prefill?: string) => void;
  rules?: MandateRule[];
  hasPlan?: boolean;
  plans?: MasterPlan[];
  selectedPlanId?: string | null;
  onSelectPlan?: (planId: string) => void;
  onNewPlan?: () => void;
  canCreateMore?: boolean;
}

export function MandateCard({
  onFocusNLBar,
  rules,
  hasPlan,
  plans = [],
  selectedPlanId,
  onSelectPlan,
  onNewPlan,
  canCreateMore = true,
}: MandateCardProps) {
  const { t } = useTranslation();
  const copilot = useTradingCopilotContext();
  const hasMandate = hasPlan !== undefined ? hasPlan : true;
  const [isOpen, setIsOpen] = useState(true);

  const handleNewPlan = () => {
    copilot.openNewPlanBuilder();
  };

  const handleEditPlan = (planId: string) => {
    onSelectPlan?.(planId);
    setTimeout(() => copilot.openPlanBuilder(), 50);
  };

  return (
    <Card className="rounded-lg border-border/60 bg-card">
      <CardHeader className="flex flex-row items-center justify-between p-3 pb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('copilotPage.masterPlans')}
        </span>
        <div className="flex items-center gap-1.5">
          {canCreateMore ? (
            <button
              onClick={handleNewPlan}
              className="inline-flex items-center gap-0.5 text-xs text-primary/70 hover:text-primary transition-colors"
            >
              <Plus className="h-3 w-3" />
              {t('copilotPage.new')}
            </button>
          ) : (
            <button
              disabled
              className="inline-flex items-center gap-0.5 text-xs text-muted-foreground/50 cursor-not-allowed"
              title={t('copilotPage.upgradeForMore')}
            >
              <Lock className="h-3 w-3" />
              {t('copilotPage.new')}
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-3 pt-0">
        {hasMandate && plans.length > 0 ? (
          <Accordion
            type="single"
            collapsible
            defaultValue={selectedPlanId ?? undefined}
            className="space-y-1"
          >
            {plans.map((plan) => {
              const planRules = planToRules(plan);
              return (
                <AccordionItem
                  key={plan.id}
                  value={plan.id}
                  className="border border-border/40 rounded-md overflow-hidden"
                >
                  <AccordionTrigger
                    className="px-2.5 py-2 text-xs hover:no-underline hover:bg-muted/30 [&[data-state=open]]:bg-muted/20"
                    onClick={() => onSelectPlan?.(plan.id)}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1 text-left">
                      <span className="relative flex h-2 w-2 shrink-0">
                        {plan.is_active ? (
                          <>
                            <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                          </>
                        ) : (
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-muted-foreground/40" />
                        )}
                      </span>
                      <span className="truncate font-medium text-foreground">
                        {plan.name || t('copilotPage.untitledPlan')}
                      </span>
                      <span className="text-muted-foreground shrink-0">
                        ({planRules.length})
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-2.5 pb-2.5 pt-1">
                    <div className="flex flex-wrap gap-1 mb-2">
                      {planRules.length > 0 ? (
                        planRules.map((rule) => (
                          <span
                            key={rule.label}
                            className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-sm leading-tight"
                          >
                            <span className="font-mono font-bold text-primary">[{rule.label}]</span>
                            <span className="text-muted-foreground truncate max-w-[100px]">{rule.detail}</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground italic">{t('copilotPage.noRulesConfigured')}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleEditPlan(plan.id)}
                      className="inline-flex items-center gap-1 text-xs text-primary/70 hover:text-primary transition-colors"
                    >
                      <Pencil className="h-3 w-3" />
                      {t('copilotPage.editPlan')}
                    </button>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        ) : (
          <button
            onClick={() => copilot.openPlanBuilder()}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('copilotPage.setPlanToStart')}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
