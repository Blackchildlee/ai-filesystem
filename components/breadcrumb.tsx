"use client";

import { cn } from "@/lib/utils";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbProps {
  path: string[];
  onNavigate: (index: number) => void;
}

export function Breadcrumb({ path, onNavigate }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1 text-sm" aria-label="Breadcrumb">
      <button
        onClick={() => onNavigate(-1)}
        className="flex items-center gap-1 px-2 py-1 rounded-md text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--subtle))] hover:text-[hsl(var(--foreground))] transition-colors"
      >
        <Home className="w-4 h-4" />
      </button>

      {path.map((segment, index) => (
        <div key={index} className="flex items-center gap-1">
          <ChevronRight className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
          <button
            onClick={() => onNavigate(index)}
            className={cn(
              "px-2 py-1 rounded-md transition-colors",
              index === path.length - 1
                ? "text-[hsl(var(--foreground))] font-medium"
                : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--subtle))] hover:text-[hsl(var(--foreground))]"
            )}
          >
            {segment}
          </button>
        </div>
      ))}
    </nav>
  );
}
