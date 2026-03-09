"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Home,
  FolderOpen,
  Clock,
  Star,
  Trash2,
  Settings,
  Sparkles,
  HardDrive,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface FolderItem {
  id: string;
  name: string;
  path: string;
}

interface StorageInfo {
  used: number; // in bytes
  total: number; // in bytes
}

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  folders?: FolderItem[];
  storage?: StorageInfo;
}

// Format bytes to human readable string
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

const navItems = [
  { id: "home", label: "Home", icon: Home },
  { id: "search", label: "AI Search", icon: Sparkles },
  { id: "browse", label: "Browse", icon: FolderOpen },
  { id: "recent", label: "Recent", icon: Clock },
  { id: "starred", label: "Starred", icon: Star },
  { id: "trash", label: "Trash", icon: Trash2 },
];

const defaultFolders = [
  { id: "documents", name: "Documents", path: "/Documents" },
  { id: "images", name: "Images", path: "/Images" },
  { id: "downloads", name: "Downloads", path: "/Downloads" },
];

export function Sidebar({ activeSection, onSectionChange, folders }: SidebarProps) {
  // Use provided folders or defaults
  const quickAccessFolders = folders && folders.length > 0 ? folders : defaultFolders;
  const [quickAccessOpen, setQuickAccessOpen] = useState(true);
  
  return (
    <aside className="w-64 flex-shrink-0 flex flex-col h-full border-r border-[hsl(var(--divider))] bg-[hsl(var(--surface))]">
      {/* Logo Section */}
      <div className="h-14 flex items-center px-4 border-b border-[hsl(var(--divider))]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[hsl(var(--primary))] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[hsl(var(--primary-foreground))]" />
          </div>
          <span className="font-semibold text-[hsl(var(--foreground))]">AI File System</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onSectionChange(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    "hover:bg-[hsl(var(--subtle))]",
                    isActive && "bg-[hsl(var(--subtle))] text-[hsl(var(--primary))]",
                    !isActive && "text-[hsl(var(--foreground))]"
                  )}
                >
                  <Icon className={cn("w-5 h-5", isActive && "text-[hsl(var(--primary))]")} />
                  <span>{item.label}</span>
                  {item.id === "search" && (
                    <span className="ml-auto px-1.5 py-0.5 text-[10px] font-medium bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded">
                      AI
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Quick Access */}
        <div className="mt-6">
          <button 
            onClick={() => setQuickAccessOpen(!quickAccessOpen)}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider hover:text-[hsl(var(--foreground))] transition-colors"
          >
            {quickAccessOpen ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
            Quick Access
          </button>
          {quickAccessOpen && (
            <ul className="space-y-0.5">
              {quickAccessFolders.map((item) => {
                const isActive = activeSection === `folder:${item.path}`;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => onSectionChange(`folder:${item.path}`)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                        "hover:bg-[hsl(var(--subtle))]",
                        isActive && "bg-[hsl(var(--subtle))] text-[hsl(var(--primary))]",
                        !isActive && "text-[hsl(var(--foreground))]"
                      )}
                    >
                      <FolderOpen className={cn(
                        "w-5 h-5",
                        isActive ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground))]"
                      )} />
                      <span>{item.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </nav>

      {/* Storage Info */}
      <div className="p-4 border-t border-[hsl(var(--divider))]">
        <div className="flex items-center gap-3 mb-2">
          <HardDrive className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
          <span className="text-sm text-[hsl(var(--foreground))]">Storage</span>
        </div>
        <div className="h-1.5 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
          <div
            className="h-full bg-[hsl(var(--primary))] rounded-full"
            style={{ width: "45%" }}
          />
        </div>
        <p className="mt-1.5 text-xs text-[hsl(var(--muted-foreground))]">
          45.2 GB of 100 GB used
        </p>
      </div>

      {/* Settings */}
      <div className="p-2 border-t border-[hsl(var(--divider))]">
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--subtle))] transition-colors">
          <Settings className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}
