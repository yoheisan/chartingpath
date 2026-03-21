import { Bot } from "lucide-react";

const Copilot = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
      <div className="p-4 rounded-2xl bg-primary/10">
        <Bot className="h-10 w-10 text-primary" />
      </div>
      <h1 className="text-2xl font-bold text-foreground">Copilot</h1>
      <p className="text-muted-foreground text-center max-w-md">
        Your AI trading assistant is coming soon. This page will be the central hub for interacting with Copilot.
      </p>
    </div>
  );
};

export default Copilot;
