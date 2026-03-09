"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  Search,
  Sparkles,
  FolderOpen,
  File,
  Settings,
  Clock,
  Star,
  Command,
} from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onCommand: (command: string) => void;
}

const recentCommands = [
  { icon: Search, label: "Find documents from last week", type: "search" },
  { icon: FolderOpen, label: "Open Downloads folder", type: "navigate" },
  { icon: Sparkles, label: "Organize images by date", type: "ai" },
];

const suggestions = [
  { icon: Sparkles, label: "Ask AI to help...", type: "ai" },
  { icon: Search, label: "Search files...", type: "search" },
  { icon: FolderOpen, label: "Go to folder...", type: "navigate" },
  { icon: Settings, label: "Open settings", type: "action" },
];

export function CommandPalette({ isOpen, onClose, onCommand }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    } else {
      setQuery("");
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/50">
      <div className="w-full max-w-xl bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center px-4 border-b border-[hsl(var(--divider))]">
          <Search className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files, run commands, or ask AI..."
            className="flex-1 px-3 py-4 bg-transparent text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none"
          />
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-[hsl(var(--subtle))] text-[10px] text-[hsl(var(--muted-foreground))]">
            <Command className="w-3 h-3" />K
          </div>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {/* Recent */}
          <div className="px-2 py-2">
            <p className="px-2 py-1 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
              Recent
            </p>
            {recentCommands.map((cmd, i) => (
              <button
                key={i}
                onClick={() => {
                  onCommand(cmd.label);
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-[hsl(var(--subtle))] transition-colors"
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  cmd.type === "ai" && "bg-[hsl(var(--primary))] bg-opacity-10",
                  cmd.type === "search" && "bg-[hsl(var(--subtle))]",
                  cmd.type === "navigate" && "bg-yellow-500 bg-opacity-10"
                )}>
                  <cmd.icon className={cn(
                    "w-4 h-4",
                    cmd.type === "ai" && "text-[hsl(var(--primary))]",
                    cmd.type === "search" && "text-[hsl(var(--muted-foreground))]",
                    cmd.type === "navigate" && "text-yellow-500"
                  )} />
                </div>
                <span className="text-sm text-[hsl(var(--foreground))]">{cmd.label}</span>
                <Clock className="w-3 h-3 ml-auto text-[hsl(var(--muted-foreground))]" />
              </button>
            ))}
          </div>

          {/* Suggestions */}
          <div className="px-2 py-2 border-t border-[hsl(var(--divider))]">
            <p className="px-2 py-1 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
              Suggestions
            </p>
            {suggestions.map((cmd, i) => (
              <button
                key={i}
                onClick={() => {
                  onCommand(cmd.label);
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-[hsl(var(--subtle))] transition-colors"
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  cmd.type === "ai" && "bg-[hsl(var(--primary))] bg-opacity-10",
                  cmd.type !== "ai" && "bg-[hsl(var(--subtle))]"
                )}>
                  <cmd.icon className={cn(
                    "w-4 h-4",
                    cmd.type === "ai" && "text-[hsl(var(--primary))]",
                    cmd.type !== "ai" && "text-[hsl(var(--muted-foreground))]"
                  )} />
                </div>
                <span className="text-sm text-[hsl(var(--foreground))]">{cmd.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-[hsl(var(--divider))] bg-[hsl(var(--subtle))]">
          <div className="flex items-center gap-4 text-xs text-[hsl(var(--muted-foreground))]">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-[hsl(var(--muted))]">Enter</kbd>
              to select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-[hsl(var(--muted))]">Esc</kbd>
              to close
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[hsl(var(--primary))]" />
            <span className="text-xs text-[hsl(var(--primary))]">AI Powered</span>
          </div>
        </div>
      </div>
    </div>
  );
}
