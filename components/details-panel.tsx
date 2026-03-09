"use client";

import { cn, formatFileSize, formatDate } from "@/lib/utils";
import type { FileItem } from "@/lib/types";
import {
  X,
  File,
  FileText,
  FileImage,
  Calendar,
  HardDrive,
  Tag,
  FolderOpen,
  Share2,
  Trash2,
  Download,
  Star,
  Sparkles,
} from "lucide-react";

interface DetailsPanelProps {
  file: FileItem | null;
  onClose: () => void;
  onToggleStar?: (fileId: string) => void;
  isStarred?: boolean;
}

function getFileIconComponent(mimeType: string) {
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType.includes("pdf") || mimeType.includes("document")) return FileText;
  return File;
}

export function DetailsPanel({ file, onClose, onToggleStar, isStarred }: DetailsPanelProps) {
  if (!file) return null;

  const Icon = getFileIconComponent(file.mimeType);

  return (
    <aside className="w-80 flex-shrink-0 border-l border-[hsl(var(--divider))] bg-[hsl(var(--surface))] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-[hsl(var(--divider))]">
        <h3 className="font-medium text-[hsl(var(--foreground))]">Details</h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md hover:bg-[hsl(var(--subtle))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* File icon and name */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-20 h-20 rounded-xl bg-[hsl(var(--subtle))] flex items-center justify-center mb-3">
            <Icon className="w-10 h-10 text-[hsl(var(--primary))]" />
          </div>
          <h4 className="font-medium text-[hsl(var(--foreground))] break-all">
            {file.name}
          </h4>
          {file.score !== undefined && (
            <div className="flex items-center gap-1 mt-2 px-2 py-1 rounded-full bg-[hsl(var(--primary))] bg-opacity-10">
              <Sparkles className="w-3 h-3 text-[hsl(var(--primary))]" />
              <span className="text-xs font-medium text-[hsl(var(--primary))]">
                {Math.round(file.score * 100)}% match
              </span>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="flex justify-center gap-2 mb-6">
          <button className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-[hsl(var(--subtle))] transition-colors">
            <Share2 className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
            <span className="text-xs text-[hsl(var(--muted-foreground))]">Share</span>
          </button>
          <button className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-[hsl(var(--subtle))] transition-colors">
            <Download className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
            <span className="text-xs text-[hsl(var(--muted-foreground))]">Download</span>
          </button>
          <button 
            onClick={() => onToggleStar?.(file.id)}
            className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-[hsl(var(--subtle))] transition-colors"
          >
            <Star className={cn(
              "w-5 h-5",
              isStarred ? "text-yellow-500 fill-yellow-500" : "text-[hsl(var(--muted-foreground))]"
            )} />
            <span className="text-xs text-[hsl(var(--muted-foreground))]">{isStarred ? "Unstar" : "Star"}</span>
          </button>
          <button className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-[hsl(var(--subtle))] transition-colors">
            <Trash2 className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
            <span className="text-xs text-[hsl(var(--muted-foreground))]">Delete</span>
          </button>
        </div>

        {/* Metadata */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <FolderOpen className="w-5 h-5 text-[hsl(var(--muted-foreground))] mt-0.5" />
            <div>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Location</p>
              <p className="text-sm text-[hsl(var(--foreground))] break-all">
                {file.path}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-[hsl(var(--muted-foreground))] mt-0.5" />
            <div>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Modified</p>
              <p className="text-sm text-[hsl(var(--foreground))]">
                {formatDate(file.modifiedAt)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <HardDrive className="w-5 h-5 text-[hsl(var(--muted-foreground))] mt-0.5" />
            <div>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Size</p>
              <p className="text-sm text-[hsl(var(--foreground))]">
                {formatFileSize(file.size)}
              </p>
            </div>
          </div>

          {file.tags && file.tags.length > 0 && (
            <div className="flex items-start gap-3">
              <Tag className="w-5 h-5 text-[hsl(var(--muted-foreground))] mt-0.5" />
              <div>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1.5">Tags</p>
                <div className="flex flex-wrap gap-1">
                  {file.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-xs rounded-full bg-[hsl(var(--subtle))] text-[hsl(var(--foreground))]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {file.summary && (
            <div className="pt-4 border-t border-[hsl(var(--divider))]">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-[hsl(var(--primary))]" />
                <p className="text-xs font-medium text-[hsl(var(--primary))]">
                  AI Summary
                </p>
              </div>
              <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
                {file.summary}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
