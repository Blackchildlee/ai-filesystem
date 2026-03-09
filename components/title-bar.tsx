"use client";

import { cn } from "@/lib/utils";
import { Minus, Square, X, Maximize2 } from "lucide-react";

interface TitleBarProps {
  title: string;
}

export function TitleBar({ title }: TitleBarProps) {
  return (
    <div className="h-8 flex items-center justify-between bg-[hsl(var(--surface))] border-b border-[hsl(var(--divider))] select-none">
      {/* Left - App icon and title */}
      <div className="flex items-center px-2">
        <span className="text-xs text-[hsl(var(--muted-foreground))]">{title}</span>
      </div>

      {/* Right - Window controls */}
      <div className="flex h-full">
        <button className="h-full px-4 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--subtle))] transition-colors">
          <Minus className="w-3 h-3" />
        </button>
        <button className="h-full px-4 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--subtle))] transition-colors">
          <Square className="w-3 h-3" />
        </button>
        <button className="h-full px-4 text-[hsl(var(--muted-foreground))] hover:bg-red-500 hover:text-white transition-colors">
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
