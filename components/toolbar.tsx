"use client";

import { cn } from "@/lib/utils";
import {
  LayoutGrid,
  List,
  Columns,
  ArrowUpDown,
  ChevronDown,
  Plus,
  Upload,
  FolderPlus,
  RefreshCw,
  MoreHorizontal,
} from "lucide-react";
import type { ViewMode, SortBy, SortOrder } from "@/lib/types";
import { useState, useRef, useEffect } from "react";

interface ToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortBy: SortBy;
  sortOrder: SortOrder;
  onSortChange: (by: SortBy, order: SortOrder) => void;
  selectedCount: number;
  onRefresh: () => void;
}

const viewModes: { id: ViewMode; icon: React.ElementType; label: string }[] = [
  { id: "grid", icon: LayoutGrid, label: "Grid view" },
  { id: "list", icon: List, label: "List view" },
  { id: "details", icon: Columns, label: "Details view" },
];

const sortOptions: { id: SortBy; label: string }[] = [
  { id: "name", label: "Name" },
  { id: "date", label: "Date modified" },
  { id: "size", label: "Size" },
  { id: "type", label: "Type" },
];

export function Toolbar({
  viewMode,
  onViewModeChange,
  sortBy,
  sortOrder,
  onSortChange,
  selectedCount,
  onRefresh,
}: ToolbarProps) {
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showNewMenu, setShowNewMenu] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const newMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
      if (newMenuRef.current && !newMenuRef.current.contains(e.target as Node)) {
        setShowNewMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="h-12 flex items-center justify-between px-4 border-b border-[hsl(var(--divider))] bg-[hsl(var(--surface))]">
      {/* Left side - Actions */}
      <div className="flex items-center gap-1">
        {/* New Button */}
        <div className="relative" ref={newMenuRef}>
          <button
            onClick={() => setShowNewMenu(!showNewMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            New
            <ChevronDown className="w-3 h-3" />
          </button>
          {showNewMenu && (
            <div className="absolute top-full left-0 mt-1 w-48 py-1 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-lg z-50">
              <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--subtle))]">
                <FolderPlus className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                New folder
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--subtle))]">
                <Upload className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                Upload files
              </button>
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-[hsl(var(--divider))] mx-2" />

        {/* Refresh */}
        <button
          onClick={onRefresh}
          className="p-2 rounded-md text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--subtle))] hover:text-[hsl(var(--foreground))] transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Selection info */}
        {selectedCount > 0 && (
          <>
            <div className="w-px h-6 bg-[hsl(var(--divider))] mx-2" />
            <span className="text-sm text-[hsl(var(--muted-foreground))]">
              {selectedCount} selected
            </span>
          </>
        )}
      </div>

      {/* Right side - View options */}
      <div className="flex items-center gap-1">
        {/* Sort dropdown */}
        <div className="relative" ref={sortMenuRef}>
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--subtle))] transition-colors"
          >
            <ArrowUpDown className="w-4 h-4" />
            Sort by {sortOptions.find((s) => s.id === sortBy)?.label}
            <ChevronDown className="w-3 h-3" />
          </button>
          {showSortMenu && (
            <div className="absolute top-full right-0 mt-1 w-44 py-1 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-lg z-50">
              {sortOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    onSortChange(
                      option.id,
                      sortBy === option.id && sortOrder === "asc" ? "desc" : "asc"
                    );
                    setShowSortMenu(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-[hsl(var(--subtle))]",
                    sortBy === option.id
                      ? "text-[hsl(var(--primary))]"
                      : "text-[hsl(var(--foreground))]"
                  )}
                >
                  {option.label}
                  {sortBy === option.id && (
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">
                      {sortOrder === "asc" ? "A-Z" : "Z-A"}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-[hsl(var(--divider))] mx-1" />

        {/* View mode toggles */}
        <div className="flex items-center rounded-md bg-[hsl(var(--subtle))] p-0.5">
          {viewModes.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => onViewModeChange(id)}
              className={cn(
                "p-1.5 rounded transition-colors",
                viewMode === id
                  ? "bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm"
                  : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              )}
              title={label}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>

        {/* More options */}
        <button
          className="p-2 rounded-md text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--subtle))] hover:text-[hsl(var(--foreground))] transition-colors"
          title="More options"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
