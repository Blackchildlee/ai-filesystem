"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, Loader2, Sparkles } from "lucide-react";

interface StatusBarProps {
  itemCount: number;
  selectedCount: number;
  status: {
    type: "idle" | "loading" | "success" | "error";
    message: string;
  };
  isAIProcessing: boolean;
}

export function StatusBar({
  itemCount,
  selectedCount,
  status,
  isAIProcessing,
}: StatusBarProps) {
  return (
    <footer className="h-7 flex items-center justify-between px-4 border-t border-[hsl(var(--divider))] bg-[hsl(var(--surface))] text-xs">
      <div className="flex items-center gap-4">
        <span className="text-[hsl(var(--muted-foreground))]">
          {itemCount} item{itemCount !== 1 ? "s" : ""}
          {selectedCount > 0 && (
            <span className="ml-1">
              ({selectedCount} selected)
            </span>
          )}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {isAIProcessing && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[hsl(var(--primary))] bg-opacity-10">
            <Sparkles className="w-3 h-3 text-[hsl(var(--primary))] animate-pulse" />
            <span className="text-[hsl(var(--primary))]">AI Processing</span>
          </div>
        )}

        {status.type === "loading" && (
          <div className="flex items-center gap-1.5 text-[hsl(var(--muted-foreground))]">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>{status.message}</span>
          </div>
        )}

        {status.type === "success" && (
          <div className="flex items-center gap-1.5 text-green-500">
            <CheckCircle2 className="w-3 h-3" />
            <span>{status.message}</span>
          </div>
        )}

        {status.type === "error" && (
          <div className="flex items-center gap-1.5 text-red-500">
            <AlertCircle className="w-3 h-3" />
            <span>{status.message}</span>
          </div>
        )}

        {status.type === "idle" && (
          <span className="text-[hsl(var(--muted-foreground))]">Ready</span>
        )}
      </div>
    </footer>
  );
}
