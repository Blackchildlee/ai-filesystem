"use client";

import { cn, formatFileSize, formatDate } from "@/lib/utils";
import type { FileItem, ViewMode } from "@/lib/types";
import {
  File,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileSpreadsheet,
  FileArchive,
  Folder,
  MoreVertical,
  Star,
  Check,
} from "lucide-react";
import { useState } from "react";

interface FileGridProps {
  files: FileItem[];
  viewMode: ViewMode;
  selectedIds: Set<string>;
  onSelectFile: (id: string, multi: boolean) => void;
  onOpenFile: (file: FileItem) => void;
}

function getFileIconComponent(mimeType: string) {
  if (mimeType === "folder") return Folder;
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType.startsWith("video/")) return FileVideo;
  if (mimeType.startsWith("audio/")) return FileAudio;
  if (mimeType.includes("pdf") || mimeType.includes("document")) return FileText;
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return FileSpreadsheet;
  if (mimeType.includes("archive") || mimeType.includes("zip")) return FileArchive;
  return File;
}

function getFileColor(mimeType: string) {
  if (mimeType === "folder") return "text-yellow-500";
  if (mimeType.startsWith("image/")) return "text-pink-500";
  if (mimeType.startsWith("video/")) return "text-purple-500";
  if (mimeType.startsWith("audio/")) return "text-green-500";
  if (mimeType.includes("pdf")) return "text-red-500";
  if (mimeType.includes("document")) return "text-blue-500";
  if (mimeType.includes("sheet")) return "text-emerald-500";
  return "text-[hsl(var(--muted-foreground))]";
}

export function FileGrid({
  files,
  viewMode,
  selectedIds,
  onSelectFile,
  onOpenFile,
}: FileGridProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (files.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-[hsl(var(--subtle))] flex items-center justify-center mb-4">
          <Folder className="w-10 h-10 text-[hsl(var(--muted-foreground))]" />
        </div>
        <h3 className="text-lg font-medium text-[hsl(var(--foreground))] mb-1">
          No files found
        </h3>
        <p className="text-sm text-[hsl(var(--muted-foreground))] max-w-sm">
          Try searching for something else or use AI to help organize your files.
        </p>
      </div>
    );
  }

  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 p-4">
        {files.map((file) => {
          const Icon = getFileIconComponent(file.mimeType);
          const isSelected = selectedIds.has(file.id);
          const isHovered = hoveredId === file.id;

          return (
            <div
              key={file.id}
              className={cn(
                "group relative flex flex-col items-center p-3 rounded-lg cursor-pointer transition-all duration-150",
                "hover:bg-[hsl(var(--subtle))]",
                isSelected && "bg-[hsl(var(--primary))] bg-opacity-10 ring-2 ring-[hsl(var(--primary))]"
              )}
              onMouseEnter={() => setHoveredId(file.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={(e) => onSelectFile(file.id, e.ctrlKey || e.metaKey)}
              onDoubleClick={() => onOpenFile(file)}
            >
              {/* Selection checkbox */}
              <div
                className={cn(
                  "absolute top-2 left-2 w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                  isSelected
                    ? "bg-[hsl(var(--primary))] border-[hsl(var(--primary))]"
                    : "border-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-100"
                )}
              >
                {isSelected && <Check className="w-3 h-3 text-[hsl(var(--primary-foreground))]" />}
              </div>

              {/* More actions */}
              <button
                className={cn(
                  "absolute top-2 right-2 p-1 rounded transition-all",
                  "opacity-0 group-hover:opacity-100 hover:bg-[hsl(var(--muted))]"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <MoreVertical className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              </button>

              {/* Icon */}
              <div className="w-16 h-16 flex items-center justify-center mb-2">
                <Icon className={cn("w-12 h-12", getFileColor(file.mimeType))} />
              </div>

              {/* Name */}
              <span className="text-sm text-[hsl(var(--foreground))] text-center truncate w-full">
                {file.name}
              </span>

              {/* Score badge if search result */}
              {file.score !== undefined && (
                <span className="mt-1 px-1.5 py-0.5 text-[10px] font-medium bg-[hsl(var(--primary))] bg-opacity-20 text-[hsl(var(--primary))] rounded">
                  {Math.round(file.score * 100)}% match
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="flex flex-col p-2">
        {files.map((file) => {
          const Icon = getFileIconComponent(file.mimeType);
          const isSelected = selectedIds.has(file.id);

          return (
            <div
              key={file.id}
              className={cn(
                "group flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors",
                "hover:bg-[hsl(var(--subtle))]",
                isSelected && "bg-[hsl(var(--primary))] bg-opacity-10"
              )}
              onClick={(e) => onSelectFile(file.id, e.ctrlKey || e.metaKey)}
              onDoubleClick={() => onOpenFile(file)}
            >
              {/* Selection checkbox */}
              <div
                className={cn(
                  "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all",
                  isSelected
                    ? "bg-[hsl(var(--primary))] border-[hsl(var(--primary))]"
                    : "border-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-100"
                )}
              >
                {isSelected && <Check className="w-3 h-3 text-[hsl(var(--primary-foreground))]" />}
              </div>

              <Icon className={cn("w-6 h-6 flex-shrink-0", getFileColor(file.mimeType))} />
              <span className="flex-1 text-sm text-[hsl(var(--foreground))] truncate">
                {file.name}
              </span>
              {file.score !== undefined && (
                <span className="px-2 py-0.5 text-xs font-medium bg-[hsl(var(--primary))] bg-opacity-20 text-[hsl(var(--primary))] rounded">
                  {Math.round(file.score * 100)}%
                </span>
              )}
              <span className="text-sm text-[hsl(var(--muted-foreground))] w-20 text-right">
                {formatFileSize(file.size)}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  // Details view
  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-[hsl(var(--divider))] bg-[hsl(var(--subtle))] text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
        <div className="w-5" />
        <div className="w-6" />
        <div className="flex-1">Name</div>
        <div className="w-28">Modified</div>
        <div className="w-20 text-right">Size</div>
        <div className="w-32">Type</div>
      </div>

      {/* Rows */}
      <div className="flex flex-col">
        {files.map((file) => {
          const Icon = getFileIconComponent(file.mimeType);
          const isSelected = selectedIds.has(file.id);

          return (
            <div
              key={file.id}
              className={cn(
                "group flex items-center gap-3 px-4 py-2 border-b border-[hsl(var(--divider))] cursor-pointer transition-colors",
                "hover:bg-[hsl(var(--subtle))]",
                isSelected && "bg-[hsl(var(--primary))] bg-opacity-10"
              )}
              onClick={(e) => onSelectFile(file.id, e.ctrlKey || e.metaKey)}
              onDoubleClick={() => onOpenFile(file)}
            >
              {/* Selection checkbox */}
              <div
                className={cn(
                  "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all",
                  isSelected
                    ? "bg-[hsl(var(--primary))] border-[hsl(var(--primary))]"
                    : "border-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-100"
                )}
              >
                {isSelected && <Check className="w-3 h-3 text-[hsl(var(--primary-foreground))]" />}
              </div>

              <Icon className={cn("w-5 h-5 flex-shrink-0", getFileColor(file.mimeType))} />
              <div className="flex-1 flex items-center gap-2 min-w-0">
                <span className="text-sm text-[hsl(var(--foreground))] truncate">
                  {file.name}
                </span>
                {file.score !== undefined && (
                  <span className="px-1.5 py-0.5 text-[10px] font-medium bg-[hsl(var(--primary))] bg-opacity-20 text-[hsl(var(--primary))] rounded flex-shrink-0">
                    {Math.round(file.score * 100)}%
                  </span>
                )}
              </div>
              <span className="w-28 text-sm text-[hsl(var(--muted-foreground))]">
                {formatDate(file.modifiedAt)}
              </span>
              <span className="w-20 text-sm text-[hsl(var(--muted-foreground))] text-right">
                {formatFileSize(file.size)}
              </span>
              <span className="w-32 text-sm text-[hsl(var(--muted-foreground))] truncate">
                {file.mimeType}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
