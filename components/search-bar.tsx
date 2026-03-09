"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Search, Sparkles, X, ArrowRight, Loader2 } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  onAICommand: (command: string) => void;
  isSearching: boolean;
}

const suggestions = [
  "Find all documents from last week",
  "Show images with landscapes",
  "Move project files to Archive",
  "Find PDFs about finances",
];

export function SearchBar({ onSearch, onAICommand, isSearching }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    // Detect if it's an AI command (contains action verbs)
    const actionVerbs = ["move", "copy", "organize", "find", "show", "get", "list", "delete"];
    const isCommand = actionVerbs.some((verb) =>
      query.toLowerCase().startsWith(verb)
    );
    
    if (isCommand) {
      onAICommand(query);
    } else {
      onSearch(query);
    }
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto" ref={containerRef}>
      <form onSubmit={handleSubmit}>
        <div
          className={cn(
            "relative flex items-center rounded-lg transition-all duration-200",
            "bg-[hsl(var(--subtle))] border",
            isFocused
              ? "border-[hsl(var(--primary))] ring-2 ring-[hsl(var(--primary))] ring-opacity-20"
              : "border-transparent hover:border-[hsl(var(--border))]"
          )}
        >
          <div className="flex items-center pl-4 pr-2 text-[hsl(var(--muted-foreground))]">
            {isSearching ? (
              <Loader2 className="w-5 h-5 animate-spin text-[hsl(var(--primary))]" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              setIsFocused(true);
              setShowSuggestions(true);
            }}
            placeholder="Search files or ask AI to help..."
            className="flex-1 py-3 bg-transparent text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none text-sm"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="submit"
            disabled={!query.trim() || isSearching}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 mr-1 rounded-md text-sm font-medium transition-colors",
              query.trim()
                ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
                : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] cursor-not-allowed"
            )}
          >
            <Sparkles className="w-4 h-4" />
            Search
          </button>
        </div>
      </form>

      {/* Suggestions dropdown */}
      {showSuggestions && isFocused && (
        <div className="absolute top-full left-0 right-0 mt-2 py-2 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-xl z-50">
          <div className="px-3 py-1.5 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
            Try asking
          </div>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--subtle))] transition-colors"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[hsl(var(--primary))]" />
                {suggestion}
              </span>
              <ArrowRight className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
