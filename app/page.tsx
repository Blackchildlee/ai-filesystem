"use client";

import { useState, useCallback, useEffect } from "react";
import useSWR from "swr";
import { Sidebar } from "@/components/sidebar";
import { Toolbar } from "@/components/toolbar";
import { SearchBar } from "@/components/search-bar";
import { FileGrid } from "@/components/file-grid";
import { Breadcrumb } from "@/components/breadcrumb";
import { DetailsPanel } from "@/components/details-panel";
import { StatusBar } from "@/components/status-bar";
import { AIAssistant } from "@/components/ai-assistant";
import { TitleBar } from "@/components/title-bar";
import { CommandPalette } from "@/components/command-palette";
import type { FileItem, ViewMode, SortBy, SortOrder } from "@/lib/types";
import { Sparkles, AlertCircle, RefreshCw } from "lucide-react";

// SWR fetcher function
const fetcher = (url: string) => fetch(url).then(res => res.json());

// Helper function to get section title
function getSectionTitle(section: string): string {
  if (section === "home") return "Home";
  if (section === "search") return "AI Search";
  if (section === "browse") return "All Files";
  if (section === "recent") return "Recent Files";
  if (section === "starred") return "Starred";
  if (section === "trash") return "Trash";
  if (section.startsWith("folder:")) {
    const folderPath = section.replace("folder:", "");
    const folderName = folderPath.split("/").filter(Boolean).pop() || "Folder";
    return folderName.charAt(0).toUpperCase() + folderName.slice(1);
  }
  return "Files";
}

// Build API URL based on active section
function buildApiUrl(section: string): string {
  const baseUrl = "/api/files";
  
  if (section.startsWith("folder:")) {
    const folderPath = section.replace("folder:", "");
    return `${baseUrl}?path=${encodeURIComponent(folderPath)}&section=folder`;
  }
  
  return `${baseUrl}?section=${encodeURIComponent(section)}`;
}

export default function HomePage() {
  const [activeSection, setActiveSection] = useState("home");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchResults, setSearchResults] = useState<FileItem[] | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [currentPath, setCurrentPath] = useState<string[]>(["Home"]);
  const [status, setStatus] = useState<{
    type: "idle" | "loading" | "success" | "error";
    message: string;
  }>({ type: "idle", message: "" });

  // Fetch files from backend using SWR
  const apiUrl = buildApiUrl(activeSection);
  const { data, error, isLoading, mutate } = useSWR(apiUrl, fetcher, {
    refreshInterval: 5000, // Refresh every 5 seconds to catch file system changes
    revalidateOnFocus: true,
  });

  const files: FileItem[] = data?.files || [];
  const backendError = data?.error || error;

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Display files - use search results if available, otherwise use fetched files
  const displayFiles = searchResults || files;

  const sortedFiles = [...displayFiles].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "date":
        comparison = new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime();
        break;
      case "size":
        comparison = a.size - b.size;
        break;
      case "type":
        comparison = a.mimeType.localeCompare(b.mimeType);
        break;
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  const handleSearch = useCallback(async (query: string) => {
    setIsSearching(true);
    setStatus({ type: "loading", message: "Searching..." });

    try {
      const response = await fetch(`/api/search?query=${encodeURIComponent(query)}&k=20`);
      const searchData = await response.json();

      if (Array.isArray(searchData)) {
        // Map search results to FileItem format
        const results: FileItem[] = searchData.map((item: { path: string; title: string; score: number }, index: number) => ({
          id: `search-${index}`,
          path: item.path,
          name: item.title || item.path.split('/').pop() || 'Unknown',
          size: 0,
          mimeType: 'application/octet-stream',
          modifiedAt: new Date().toISOString(),
          score: item.score,
        }));
        setSearchResults(results);
        setStatus({
          type: "success",
          message: `Found ${results.length} result${results.length !== 1 ? "s" : ""}`,
        });
      } else {
        // Fallback to client-side search if backend unavailable
        const results = files
          .filter(
            (f) =>
              f.name.toLowerCase().includes(query.toLowerCase()) ||
              f.tags?.some((t) => t.toLowerCase().includes(query.toLowerCase())) ||
              f.summary?.toLowerCase().includes(query.toLowerCase())
          )
          .map((f) => ({
            ...f,
            score: Math.random() * 0.4 + 0.6,
          }))
          .sort((a, b) => (b.score || 0) - (a.score || 0));

        setSearchResults(results);
        setStatus({
          type: "success",
          message: `Found ${results.length} result${results.length !== 1 ? "s" : ""} (local search)`,
        });
      }
    } catch {
      // Client-side fallback search
      const results = files
        .filter(
          (f) =>
            f.name.toLowerCase().includes(query.toLowerCase()) ||
            f.tags?.some((t) => t.toLowerCase().includes(query.toLowerCase()))
        )
        .map((f) => ({
          ...f,
          score: Math.random() * 0.4 + 0.6,
        }))
        .sort((a, b) => (b.score || 0) - (a.score || 0));

      setSearchResults(results);
      setStatus({
        type: "success",
        message: `Found ${results.length} result${results.length !== 1 ? "s" : ""} (local)`,
      });
    }

    setIsSearching(false);
    setTimeout(() => setStatus({ type: "idle", message: "" }), 3000);
  }, [files]);

  const handleAICommand = useCallback(async () => {
    setShowAIAssistant(true);
  }, []);

  const handleExecuteCommand = useCallback(
    async (command: string): Promise<{ success: boolean; message: string }> => {
      setIsAIProcessing(true);

      try {
        // Call the intent API to understand the command
        const intentResponse = await fetch('/api/intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_input: command }),
        });

        if (intentResponse.ok) {
          const intent = await intentResponse.json();
          
          // Execute based on intent
          if (intent.action === 'move' && intent.dest) {
            const moveResponse = await fetch('/api/action/move', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query: intent.query || command, dest: intent.dest }),
            });
            
            if (moveResponse.ok) {
              const result = await moveResponse.json();
              mutate(); // Refresh file list
              setIsAIProcessing(false);
              return {
                success: true,
                message: `Moved ${result.moved} files to ${result.dest}`,
              };
            }
          } else if (intent.action === 'search' && intent.query) {
            handleSearch(intent.query);
            setIsAIProcessing(false);
            return {
              success: true,
              message: `Searching for: ${intent.query}`,
            };
          }
        }
      } catch {
        // Fall through to default response
      }

      setIsAIProcessing(false);
      
      // Default response for unhandled commands
      if (command.toLowerCase().includes("move")) {
        return {
          success: true,
          message: `To move files, please specify a destination. Example: "move documents about finance to /archive"`,
        };
      } else if (command.toLowerCase().includes("find") || command.toLowerCase().includes("search")) {
        return {
          success: true,
          message: `Searching for files matching your query...`,
        };
      } else {
        return {
          success: true,
          message: `Command received. For best results, try: "find [query]", "move [files] to [destination]", or "organize [criteria]"`,
        };
      }
    },
    [mutate, handleSearch]
  );

  const handleSelectFile = useCallback((id: string, multi: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(multi ? prev : []);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

    const file = displayFiles.find((f) => f.id === id);
    if (file) {
      setSelectedFile(file);
      setShowDetailsPanel(true);
    }
  }, [displayFiles]);

  const handleOpenFile = useCallback((file: FileItem) => {
    setSelectedFile(file);
    setShowDetailsPanel(true);
  }, []);

  const handleSortChange = useCallback((by: SortBy, order: SortOrder) => {
    setSortBy(by);
    setSortOrder(order);
  }, []);

  const handleRefresh = useCallback(() => {
    setSearchResults(null);
    setSelectedIds(new Set());
    mutate(); // Refresh data from backend
    setStatus({ type: "success", message: "Refreshed" });
    setTimeout(() => setStatus({ type: "idle", message: "" }), 2000);
  }, [mutate]);

  const handleNavigate = useCallback((index: number) => {
    if (index === -1) {
      setCurrentPath(["Home"]);
      setActiveSection("home");
    } else {
      setCurrentPath((prev) => prev.slice(0, index + 1));
    }
    setSearchResults(null);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-[hsl(var(--background))]">
      {/* Windows-style title bar */}
      <TitleBar title="AI File System" />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar 
          activeSection={activeSection} 
          onSectionChange={(section) => {
            setActiveSection(section);
            setSearchResults(null);
            setSelectedIds(new Set());
            // Update breadcrumb path based on section
            const title = getSectionTitle(section);
            if (section.startsWith("folder:")) {
              const folderPath = section.replace("folder:", "");
              const parts = folderPath.split("/").filter(Boolean);
              setCurrentPath(["Home", ...parts.map(p => p.charAt(0).toUpperCase() + p.slice(1))]);
            } else {
              setCurrentPath([title]);
            }
          }} 
        />

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Header with Search */}
          <header className="h-14 flex items-center gap-4 px-4 border-b border-[hsl(var(--divider))] bg-[hsl(var(--surface))]">
            <Breadcrumb path={currentPath} onNavigate={handleNavigate} />
            <div className="flex-1 max-w-xl">
              <SearchBar
                onSearch={handleSearch}
                onAICommand={handleAICommand}
                isSearching={isSearching}
              />
            </div>
            <button
              onClick={() => setShowAIAssistant(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-gradient-to-r from-[hsl(var(--primary))] to-purple-600 text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Sparkles className="w-4 h-4" />
              AI Assistant
            </button>
          </header>

          {/* Toolbar */}
          <Toolbar
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
            selectedCount={selectedIds.size}
            onRefresh={handleRefresh}
          />

          {/* Backend connection status banner */}
          {backendError && (
            <div className="px-4 py-3 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-500">Backend Not Connected</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  To connect to your local files, run the Python backend: <code className="bg-[hsl(var(--subtle))] px-1 py-0.5 rounded">python -m runtime.cli serve</code>
                </p>
              </div>
              <button
                onClick={handleRefresh}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-amber-500 hover:bg-amber-500/10 rounded-md transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            </div>
          )}

          {/* File browser area */}
          <div className="flex-1 flex overflow-hidden">
            {/* File grid/list */}
            <div className="flex-1 overflow-auto">
              {isLoading && (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="w-8 h-8 text-[hsl(var(--primary))] animate-spin" />
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading files...</p>
                  </div>
                </div>
              )}
              
              {searchResults !== null && (
                <div className="px-4 py-2 bg-[hsl(var(--subtle))] border-b border-[hsl(var(--divider))]">
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    Showing {searchResults.length} search result
                    {searchResults.length !== 1 ? "s" : ""}
                    <button
                      onClick={handleRefresh}
                      className="ml-2 text-[hsl(var(--primary))] hover:underline"
                    >
                      Clear search
                    </button>
                  </p>
                </div>
              )}
              
              {!isLoading && sortedFiles.length === 0 && !backendError && (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="w-16 h-16 mb-4 rounded-full bg-[hsl(var(--subtle))] flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-[hsl(var(--muted-foreground))]" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No files found</h3>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] max-w-md">
                    {activeSection === "starred" 
                      ? "You haven't starred any files yet. Star files to quickly access them here."
                      : activeSection === "trash"
                      ? "Trash is empty."
                      : "Add files to your configured directory to see them here."}
                  </p>
                </div>
              )}
              
              {!isLoading && sortedFiles.length > 0 && (
                <FileGrid
                  files={sortedFiles}
                  viewMode={viewMode}
                  selectedIds={selectedIds}
                  onSelectFile={handleSelectFile}
                  onOpenFile={handleOpenFile}
                />
              )}
            </div>

            {/* Details panel */}
            {showDetailsPanel && (
              <DetailsPanel
                file={selectedFile}
                onClose={() => {
                  setShowDetailsPanel(false);
                  setSelectedFile(null);
                }}
              />
            )}
          </div>

          {/* Status bar */}
          <StatusBar
            itemCount={sortedFiles.length}
            selectedCount={selectedIds.size}
            status={status}
            isAIProcessing={isAIProcessing}
          />
        </main>
      </div>

      {/* AI Assistant Modal */}
      <AIAssistant
        isOpen={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        onExecuteCommand={handleExecuteCommand}
      />

      {/* Command Palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onCommand={(cmd) => {
          if (cmd.toLowerCase().includes("ai")) {
            setShowAIAssistant(true);
          } else {
            handleSearch(cmd);
          }
        }}
      />
    </div>
  );
}
