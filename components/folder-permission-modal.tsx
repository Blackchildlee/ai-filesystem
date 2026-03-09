"use client";

import { useState } from "react";
import { FolderOpen, Shield, AlertTriangle, Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FolderPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGrantAccess: () => Promise<void>;
  isSupported: boolean;
}

export function FolderPermissionModal({
  isOpen,
  onClose,
  onGrantAccess,
  isSupported,
}: FolderPermissionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
            Grant access to a folder on your computer to browse and manage your files with AI assistance.
          </p>
        </div>

        {/* Content */}
        <div className="px-6 pb-4">
          {!isSupported ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-amber-500">Browser Not Supported</p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                    The File System Access API requires a Chromium-based browser.
                  </p>
                </div>
              </div>
              
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-[hsl(var(--foreground))]">Google Chrome (v86+)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-[hsl(var(--foreground))]">Microsoft Edge (v86+)</span>
                </li>
                <li className="flex items-center gap-2">
                  <X className="w-4 h-4 text-red-500" />
                  <span className="text-[hsl(var(--muted-foreground))]">Firefox (not supported)</span>
                </li>
                <li className="flex items-center gap-2">
                  <X className="w-4 h-4 text-red-500" />
                  <span className="text-[hsl(var(--muted-foreground))]">Safari (not supported)</span>
                </li>
              </ul>
            </div>
          ) : (
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
          {isSupported && (
            <button
              onClick={handleGrantAccess}
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
                  Connecting...
                </>
              ) : (
                <>
                  <FolderOpen className="w-4 h-4" />
                  Choose Folder
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
