import React from "react";
import { Button } from "@/components/ui/button";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  message?: string;
};

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown) {
    // Keep logging minimal and non-sensitive; helps debug "blank page" reports.
    // eslint-disable-next-line no-console
    console.error("App crashed:", error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto px-6 py-16 max-w-xl">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="mt-2 text-muted-foreground">
            The app hit an error while loading this page.
          </p>
          {this.state.message ? (
            <pre className="mt-4 whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
              {this.state.message}
            </pre>
          ) : null}
          <div className="mt-6 flex gap-3">
            <Button onClick={() => window.location.reload()}>Reload</Button>
            <Button variant="outline" onClick={() => (window.location.href = "/")}
            >
              Go Home
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
