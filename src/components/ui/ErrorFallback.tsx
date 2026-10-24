import {
  AlertTriangle,
  Check,
  ChevronDown,
  Copy,
  Home,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export interface ErrorFallbackProps {
  error?: unknown;
  resetErrorBoundary?: () => void;
}

function resetApplicationState() {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith("smriti") ||
          key.startsWith("sidebar-") ||
          key === "theme")
      ) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
  } catch {}
  window.location.href = "/";
}

export default function ErrorFallback({
  error,
  resetErrorBoundary,
}: ErrorFallbackProps) {
  const [copied, setCopied] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "An unexpected error occurred.";

  const errorStack =
    error instanceof Error && error.stack ? error.stack : undefined;

  const handleCopy = async () => {
    const details = [
      `Error: ${errorMessage}`,
      errorStack ? `\nStack:\n${errorStack}` : "",
      `\nURL: ${typeof window !== "undefined" ? window.location.href : ""}`,
      `UserAgent: ${typeof navigator !== "undefined" ? navigator.userAgent : ""}`,
      `Time: ${new Date().toISOString()}`,
    ].join("");

    try {
      await navigator.clipboard.writeText(details);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API is unavailable
    }
  };

  const handleReload = () => {
    if (resetErrorBoundary) {
      resetErrorBoundary();
    }
    window.location.reload();
  };

  const handleGoHome = () => {
    if (resetErrorBoundary) {
      resetErrorBoundary();
    }
    window.location.href = "/";
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8 text-foreground">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg md:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Something went wrong
            </h2>
            <p className="text-xs text-muted-foreground">
              Your files and tasks remain safe on your device.
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-muted/60 p-3 mb-5 border border-border/50 text-sm text-muted-foreground wrap-break-word">
          {errorMessage}
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-6">
          <Button
            onClick={handleReload}
            className="flex items-center gap-1.5 h-9 text-sm"
          >
            <RotateCcw className="size-4" />
            Reload App
          </Button>

          <Button
            variant="outline"
            onClick={handleGoHome}
            className="flex items-center gap-1.5 h-9 text-sm"
          >
            <Home className="size-4" />
            Go to Home
          </Button>

          <Button
            variant="ghost"
            onClick={handleCopy}
            className="flex items-center gap-1.5 h-9 text-sm text-muted-foreground hover:text-foreground"
          >
            {copied ? (
              <>
                <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="size-4" />
                Copy Error
              </>
            )}
          </Button>
        </div>

        <div className="border-t border-border pt-4">
          {!showConfirmReset ? (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Still stuck in an error loop?</span>
              <Button
                variant="link"
                onClick={() => setShowConfirmReset(true)}
                className="p-0 h-auto text-xs text-destructive hover:text-destructive/80"
              >
                Reset App Cache
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs space-y-2">
              <p className="font-medium text-foreground">
                Reset application cache?
              </p>
              <p className="text-muted-foreground">
                This clears cached browser state and takes you back to the
                workspace picker. Your actual task files on disk will NOT be
                deleted.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={resetApplicationState}
                  className="h-7 text-xs flex items-center gap-1"
                >
                  <Trash2 className="size-3" />
                  Confirm & Reset
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowConfirmReset(false)}
                  className="h-7 text-xs"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {errorStack && (
          <details className="group mt-4 pt-3 border-t border-border text-xs">
            <summary className="cursor-pointer text-muted-foreground flex items-center gap-1 hover:text-foreground select-none">
              <ChevronDown className="size-3.5 transition-transform duration-150 group-open:rotate-180" />
              <span>Technical Details</span>
            </summary>
            <pre className="mt-2 max-h-48 overflow-auto rounded bg-muted p-2 font-mono text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap break-all">
              {errorStack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
