"use client";

import { useState, useRef } from "react";
import { FolderOpen, Shield, AlertTriangle, Check, X, Loader2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { isInIframe, processFileInputFiles, type LocalFile, type LocalFolder } from "@/lib/filesystem-access";

interface FolderPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGrantAccess: () => Promise<void>;
  onFilesSelected?: (files: LocalFile[], folders: LocalFolder[]) => void;
  isSupported: boolean;
}

export function FolderPermissionModal({
  isOpen,
  onClose,
  onGrantAccess,
  onFilesSelected,
  isSupported,
}: FolderPermissionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Check if we're in an iframe
  const inIframe = typeof window !== 'undefined' && isInIframe();

  if (!isOpen) return null;

  const handleGrantAccess = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await onGrantAccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to access folder");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { files, folders } = processFileInputFiles(fileList);
      onFilesSelected?.(files, folders);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process files");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectFolder = () => {
    if (inIframe) {
      // Use file input for iframe mode
      fileInputRef.current?.click();
    } else {
      // Use File System Access API for top-level windows
      handleGrantAccess();
    }
  };

  const features = [
    {
      icon: Shield,
      title: "Private & Secure",
      description: "Your files never leave your device. All processing happens locally in your browser.",
    },
    {
      icon: FolderOpen,
      title: "Read-Only Access",
      description: "We only read file names and metadata. We cannot modify or delete your files.",
    },
    {
      icon: Check,
      title: "Revoke Anytime",
      description: "Close the tab or refresh the page to instantly revoke access.",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Hidden file input for folder selection (works in iframes) */}
      <input
        ref={fileInputRef}
        type="file"
        /* @ts-expect-error webkitdirectory is not in standard types */
        webkitdirectory="true"
        directory=""
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />
      
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[hsl(var(--surface))] border border-[hsl(var(--divider))] rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-md hover:bg-[hsl(var(--subtle))] transition-colors"
        >
          <X className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
        </button>

        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[hsl(var(--primary))]/10">
              <FolderOpen className="w-6 h-6 text-[hsl(var(--primary))]" />
            </div>
            <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">
              Connect Your Files
            </h2>
          </div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Select a folder on your computer to browse and manage your files with AI assistance.
          </p>
        </div>

        {/* Content */}
        <div className="px-6 pb-4">
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="p-1.5 rounded-md bg-[hsl(var(--subtle))]">
                  <feature.icon className="w-4 h-4 text-[hsl(var(--primary))]" />
                </div>
                <div>
                  <p className="font-medium text-sm text-[hsl(var(--foreground))]">
                    {feature.title}
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {inIframe && (
            <div className="mt-4 flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Upload className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-400">
                Running in preview mode. Files will be loaded from your selection but won&apos;t persist after refresh.
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 border-t border-[hsl(var(--divider))] flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-md border border-[hsl(var(--divider))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--subtle))] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSelectFolder}
            disabled={isLoading}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2",
              !isLoading
                ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90"
                : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <FolderOpen className="w-4 h-4" />
                Select Folder
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
