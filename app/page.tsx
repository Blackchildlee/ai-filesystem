"use client";

import { useState, useCallback, useEffect } from "react";
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
import { Sparkles } from "lucide-react";

// Mock data - in production this would come from the Python API
const mockFiles: FileItem[] = [
  {
    id: "1",
    path: "/documents/quarterly-report.pdf",
    name: "Quarterly Report Q4 2025.pdf",
    size: 2457600,
    mimeType: "application/pdf",
    modifiedAt: "2025-12-15T10:30:00Z",
    title: "Quarterly Report Q4 2025",
    summary: "Financial summary and projections for Q4 2025 including revenue analysis and market trends.",
    tags: ["finance", "reports", "2025"],
  },
  {
    id: "2",
    path: "/images/team-photo.jpg",
    name: "Team Photo 2025.jpg",
    size: 4194304,
    mimeType: "image/jpeg",
    modifiedAt: "2025-11-20T14:45:00Z",
    tags: ["photos", "team"],
  },
  {
    id: "3",
    path: "/documents/project-plan.docx",
    name: "Project Plan - AI Integration.docx",
    size: 524288,
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    modifiedAt: "2025-12-10T09:15:00Z",
    summary: "Detailed project plan for implementing AI features into the file management system.",
    tags: ["planning", "AI", "project"],
  },
  {
    id: "4",
    path: "/spreadsheets/budget-2026.xlsx",
    name: "Budget Forecast 2026.xlsx",
    size: 1048576,
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    modifiedAt: "2025-12-01T16:00:00Z",
    tags: ["finance", "budget"],
  },
  {
    id: "5",
    path: "/images/product-mockup.png",
    name: "Product Mockup v3.png",
    size: 3145728,
    mimeType: "image/png",
    modifiedAt: "2025-12-08T11:20:00Z",
    tags: ["design", "product"],
  },
  {
    id: "6",
    path: "/archives/legacy-data.zip",
    name: "Legacy System Backup.zip",
    size: 104857600,
    mimeType: "application/zip",
    modifiedAt: "2025-09-15T08:00:00Z",
    tags: ["backup", "archive"],
  },
  {
    id: "7",
    path: "/documents/meeting-notes.txt",
    name: "Meeting Notes - Dec 12.txt",
    size: 15360,
    mimeType: "text/plain",
    modifiedAt: "2025-12-12T15:30:00Z",
    summary: "Discussion points and action items from the weekly team meeting.",
    tags: ["meetings", "notes"],
  },
  {
    id: "8",
    path: "/videos/product-demo.mp4",
    name: "Product Demo Video.mp4",
    size: 52428800,
    mimeType: "video/mp4",
    modifiedAt: "2025-11-28T13:00:00Z",
    tags: ["video", "product", "demo"],
  },
  {
    id: "9",
    path: "/audio/podcast-ep42.mp3",
    name: "Tech Talk Podcast Ep42.mp3",
    size: 31457280,
    mimeType: "audio/mpeg",
    modifiedAt: "2025-12-05T10:00:00Z",
    tags: ["audio", "podcast"],
  },
  {
    id: "10",
    path: "/documents/api-docs.pdf",
    name: "API Documentation v2.pdf",
    size: 1572864,
    mimeType: "application/pdf",
    modifiedAt: "2025-12-14T17:45:00Z",
    summary: "Complete API reference documentation for the AI File System endpoints.",
    tags: ["documentation", "API", "technical"],
  },
  {
    id: "11",
    path: "/images/architecture-diagram.png",
    name: "System Architecture.png",
    size: 819200,
    mimeType: "image/png",
    modifiedAt: "2025-12-11T12:00:00Z",
    tags: ["technical", "diagram"],
  },
  {
    id: "12",
    path: "/documents/user-research.pdf",
    name: "User Research Findings.pdf",
    size: 3670016,
    mimeType: "application/pdf",
    modifiedAt: "2025-12-07T09:30:00Z",
    summary: "User interviews and usability testing results for the file management interface.",
    tags: ["research", "UX"],
  },
];

export default function HomePage() {
  const [activeSection, setActiveSection] = useState("home");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [files, setFiles] = useState<FileItem[]>(mockFiles);
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

    // Simulate API call to Python backend
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Mock semantic search results
    const results = mockFiles
      .filter(
        (f) =>
          f.name.toLowerCase().includes(query.toLowerCase()) ||
          f.tags?.some((t) => t.toLowerCase().includes(query.toLowerCase())) ||
          f.summary?.toLowerCase().includes(query.toLowerCase())
      )
      .map((f) => ({
        ...f,
        score: Math.random() * 0.4 + 0.6, // Mock relevance score
      }))
      .sort((a, b) => (b.score || 0) - (a.score || 0));

    setSearchResults(results);
    setIsSearching(false);
    setStatus({
      type: "success",
      message: `Found ${results.length} result${results.length !== 1 ? "s" : ""}`,
    });

    setTimeout(() => setStatus({ type: "idle", message: "" }), 3000);
  }, []);

  const handleAICommand = useCallback(async (command: string) => {
    setShowAIAssistant(true);
  }, []);

  const handleExecuteCommand = useCallback(
    async (command: string): Promise<{ success: boolean; message: string }> => {
      setIsAIProcessing(true);

      // Simulate AI processing
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setIsAIProcessing(false);

      // Mock different command responses
      if (command.toLowerCase().includes("move")) {
        return {
          success: true,
          message: `Successfully moved 5 files matching your criteria to the destination folder.`,
        };
      } else if (command.toLowerCase().includes("find")) {
        return {
          success: true,
          message: `Found 12 files matching your query. They have been highlighted in the file browser.`,
        };
      } else if (command.toLowerCase().includes("organize")) {
        return {
          success: true,
          message: `Organized 23 files into 4 categories based on content analysis.`,
        };
      } else {
        return {
          success: true,
          message: `Command processed. I've analyzed your files and found 8 relevant items.`,
        };
      }
    },
    []
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
    setStatus({ type: "success", message: "Refreshed" });
    setTimeout(() => setStatus({ type: "idle", message: "" }), 2000);
  }, []);

  const handleNavigate = useCallback((index: number) => {
    if (index === -1) {
      setCurrentPath(["Home"]);
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
        <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />

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

          {/* File browser area */}
          <div className="flex-1 flex overflow-hidden">
            {/* File grid/list */}
            <div className="flex-1 overflow-auto">
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
              <FileGrid
                files={sortedFiles}
                viewMode={viewMode}
                selectedIds={selectedIds}
                onSelectFile={handleSelectFile}
                onOpenFile={handleOpenFile}
              />
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
