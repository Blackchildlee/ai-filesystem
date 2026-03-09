"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
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
import { FolderPermissionModal } from "@/components/folder-permission-modal";
import type { FileItem, ViewMode, SortBy, SortOrder } from "@/lib/types";
import { Sparkles, FolderOpen, RefreshCw } from "lucide-react";
import {
  isFileSystemAccessSupported,
  requestDirectoryAccess,
  scanDirectory,
  getTopLevelFolders,
  getRootHandle,
  setRootHandle,
  type LocalFile,
  type LocalFolder,
} from "@/lib/filesystem-access";

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

// Convert LocalFile to FileItem
function localFileToFileItem(file: LocalFile, starredIds: Set<string>): FileItem {
  return {
    id: file.id,
    path: file.path,
    name: file.name,
    size: file.size,
    mimeType: file.mimeType,
    modifiedAt: file.modifiedAt,
    title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension for title
    starred: starredIds.has(file.id),
    trashed: false,
  };
}

export default function HomePage() {
  // Track if component is mounted (for hydration safety)
  const [isMounted, setIsMounted] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());
  const [searchResults, setSearchResults] = useState<FileItem[] | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPath, setCurrentPath] = useState<string[]>(["Home"]);
  const [status, setStatus] = useState<{
    type: "idle" | "loading" | "success" | "error";
    message: string;
  }>({ type: "idle", message: "" });
  
  // File system state
  const [isConnected, setIsConnected] = useState(false);
  const [localFiles, setLocalFiles] = useState<LocalFile[]>([]);
  const [folders, setFolders] = useState<LocalFolder[]>([]);
  const [rootFolderName, setRootFolderName] = useState<string>("");
  const [isSupported, setIsSupported] = useState(true);

  // Set mounted state after initial render to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check File System Access API support on mount
  useEffect(() => {
    setIsSupported(isFileSystemAccessSupported());
    
    // Show permission modal on first load if not connected
    const hasConnected = localStorage.getItem("ai-fs-has-connected");
    if (!hasConnected) {
      // Small delay to let the UI render first
      const timer = setTimeout(() => {
        setShowPermissionModal(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Load starred files from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("ai-fs-starred");
    if (saved) {
      try {
        setStarredIds(new Set(JSON.parse(saved)));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Save starred files to localStorage
  useEffect(() => {
    localStorage.setItem("ai-fs-starred", JSON.stringify([...starredIds]));
  }, [starredIds]);

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

  // Handle granting folder access
  const handleGrantAccess = useCallback(async () => {
    setIsLoading(true);
    setStatus({ type: "loading", message: "Requesting folder access..." });
    
    try {
      const handle = await requestDirectoryAccess();
      
      if (handle) {
        setRootHandle(handle);
        setRootFolderName(handle.name);
        setIsConnected(true);
        localStorage.setItem("ai-fs-has-connected", "true");
        
        setStatus({ type: "loading", message: "Scanning folder..." });
        
        // Scan the directory
        const files = await scanDirectory(handle);
        setLocalFiles(files);
        
        // Get top-level folders for quick access
        const topFolders = await getTopLevelFolders(handle);
        setFolders(topFolders);
        
        setStatus({ type: "success", message: `Found ${files.length} files` });
        setTimeout(() => setStatus({ type: "idle", message: "" }), 3000);
      }
    } catch (error) {
      setStatus({ type: "error", message: (error as Error).message });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh files
  const handleRefresh = useCallback(async () => {
    const handle = getRootHandle();
    if (!handle) {
      setShowPermissionModal(true);
      return;
    }
    
    setIsLoading(true);
    setSearchResults(null);
    setSelectedIds(new Set());
    setStatus({ type: "loading", message: "Refreshing..." });
    
    try {
      const files = await scanDirectory(handle);
      setLocalFiles(files);
      
      const topFolders = await getTopLevelFolders(handle);
      setFolders(topFolders);
      
      setStatus({ type: "success", message: "Refreshed" });
    } catch {
      setStatus({ type: "error", message: "Failed to refresh" });
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatus({ type: "idle", message: "" }), 2000);
    }
  }, []);

  // Convert local files to FileItems and filter by section
  const files: FileItem[] = localFiles.map(f => localFileToFileItem(f, starredIds));
  
  const filteredFiles = (() => {
    if (activeSection === "home" || activeSection === "browse") {
      return files;
    }
    if (activeSection === "recent") {
      return [...files]
        .sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime())
        .slice(0, 20);
    }
    if (activeSection === "starred") {
      return files.filter(f => starredIds.has(f.id));
    }
    if (activeSection === "trash") {
      return files.filter(f => f.trashed);
    }
    if (activeSection.startsWith("folder:")) {
      const folderPath = activeSection.replace("folder:", "");
      return files.filter(f => f.path.startsWith(folderPath + "/") || f.path === folderPath);
    }
    return files;
  })();

  // Display files - use search results if available
  const displayFiles = searchResults || filteredFiles;

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

    // Client-side search on local files
    const results = files
      .filter(f => 
        f.name.toLowerCase().includes(query.toLowerCase()) ||
        f.path.toLowerCase().includes(query.toLowerCase()) ||
        f.tags?.some(t => t.toLowerCase().includes(query.toLowerCase()))
      )
      .map(f => ({
        ...f,
        score: f.name.toLowerCase().includes(query.toLowerCase()) ? 0.9 : 0.7,
      }))
      .sort((a, b) => (b.score || 0) - (a.score || 0));

    setSearchResults(results);
    setStatus({
      type: "success",
      message: `Found ${results.length} result${results.length !== 1 ? "s" : ""}`,
    });

    setIsSearching(false);
    setTimeout(() => setStatus({ type: "idle", message: "" }), 3000);
  }, [files]);

  const handleAICommand = useCallback(async () => {
    setShowAIAssistant(true);
  }, []);

  const handleExecuteCommand = useCallback(
    async (command: string): Promise<{ success: boolean; message: string }> => {
      setIsAIProcessing(true);

      // Simple command parsing for local operations
      const lowerCmd = command.toLowerCase();
      
      if (lowerCmd.includes("find") || lowerCmd.includes("search")) {
        const query = command.replace(/find|search/gi, "").trim();
        if (query) {
          handleSearch(query);
          setIsAIProcessing(false);
          return { success: true, message: `Searching for: ${query}` };
        }
      }
      
      if (lowerCmd.includes("star") || lowerCmd.includes("favorite")) {
        if (selectedIds.size > 0) {
          setStarredIds(prev => {
            const next = new Set(prev);
            selectedIds.forEach(id => next.add(id));
            return next;
          });
          setIsAIProcessing(false);
          return { success: true, message: `Starred ${selectedIds.size} file(s)` };
        }
      }

      setIsAIProcessing(false);
      return {
        success: true,
        message: `Command received. Available commands: "find [query]", "star selected files"`,
      };
    },
    [handleSearch, selectedIds]
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

  const handleNavigate = useCallback((index: number) => {
    if (index === -1) {
      setCurrentPath(["Home"]);
      setActiveSection("home");
    } else {
      setCurrentPath((prev) => prev.slice(0, index + 1));
    }
    setSearchResults(null);
  }, []);

  const handleToggleStar = useCallback((fileId: string) => {
    setStarredIds(prev => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  }, []);

  // Show loading skeleton during SSR/initial hydration to prevent mismatch
  if (!isMounted) {
    return (
      <div className="h-screen flex flex-col bg-[hsl(var(--background))]">
        <div className="h-8 bg-[hsl(var(--surface))] border-b border-[hsl(var(--divider))]" />
        <div className="flex-1 flex">
          <div className="w-60 bg-[hsl(var(--surface))] border-r border-[hsl(var(--divider))]" />
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 text-[hsl(var(--primary))] animate-spin" />
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[hsl(var(--background))]">
      {/* Windows-style title bar */}
      <TitleBar title="AI File System" />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar 
          activeSection={activeSection} 
          folders={folders}
          onSectionChange={(section) => {
            setActiveSection(section);
            setSearchResults(null);
            setSelectedIds(new Set());
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

          {/* Connection banner when not connected */}
          {!isConnected && (
            <div className="px-4 py-4 bg-[hsl(var(--subtle))] border-b border-[hsl(var(--divider))] flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[hsl(var(--primary))]/10 flex items-center justify-center flex-shrink-0">
                <FolderOpen className="w-6 h-6 text-[hsl(var(--primary))]" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-[hsl(var(--foreground))]">Connect to your files</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Grant access to a folder to browse and search your files with AI
                </p>
              </div>
              <button
                onClick={() => setShowPermissionModal(true)}
                className="px-4 py-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Connect Folder
              </button>
            </div>
          )}

          {/* Connected folder info */}
          {isConnected && rootFolderName && (
            <div className="px-4 py-2 bg-green-500/10 border-b border-green-500/20 flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-500">
                Connected to: <strong>{rootFolderName}</strong>
              </span>
              <span className="text-sm text-[hsl(var(--muted-foreground))]">
                ({localFiles.length} files)
              </span>
              <button
                onClick={() => setShowPermissionModal(true)}
                className="ml-auto text-sm text-[hsl(var(--primary))] hover:underline"
              >
                Change folder
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
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">Scanning files...</p>
                  </div>
                </div>
              )}
              
              {searchResults !== null && (
                <div className="px-4 py-2 bg-[hsl(var(--subtle))] border-b border-[hsl(var(--divider))]">
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    Showing {searchResults.length} search result
                    {searchResults.length !== 1 ? "s" : ""}
                    <button
                      onClick={() => {
                        setSearchResults(null);
                        setSelectedIds(new Set());
                      }}
                      className="ml-2 text-[hsl(var(--primary))] hover:underline"
                    >
                      Clear search
                    </button>
                  </p>
                </div>
              )}
              
              {!isLoading && !isConnected && (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="w-20 h-20 mb-6 rounded-full bg-[hsl(var(--subtle))] flex items-center justify-center">
                    <FolderOpen className="w-10 h-10 text-[hsl(var(--muted-foreground))]" />
                  </div>
                  <h3 className="text-xl font-medium mb-2 text-[hsl(var(--foreground))]">No folder connected</h3>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] max-w-md mb-6">
                    Connect a folder from your computer to browse and search your files using AI.
                    Your files stay private and are read locally in your browser.
                  </p>
                  <button
                    onClick={() => setShowPermissionModal(true)}
                    className="px-6 py-3 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                  >
                    <FolderOpen className="w-5 h-5" />
                    Connect Folder
                  </button>
                </div>
              )}
              
              {!isLoading && isConnected && sortedFiles.length === 0 && (
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
                      : "This folder appears to be empty or contains only hidden files."}
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
                  onToggleStar={handleToggleStar}
                  starredIds={starredIds}
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
                onToggleStar={handleToggleStar}
                isStarred={selectedFile ? starredIds.has(selectedFile.id) : false}
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

      {/* Folder Permission Modal */}
      <FolderPermissionModal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        onGrantAccess={handleGrantAccess}
        isSupported={isSupported}
      />

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
