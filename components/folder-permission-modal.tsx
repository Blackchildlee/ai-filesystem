"use client";

import { useState } from "react";
import { FolderOpen, Shield, AlertTriangle, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FolderPermissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGrantAccess: () => Promise<void>;
  isSupported: boolean;
}

export function FolderPermissionModal({
  open,
  onOpenChange,
  onGrantAccess,
  isSupported,
}: FolderPermissionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGrantAccess = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await onGrantAccess();
      onOpenChange(false);
    } catch (err) {
      setError((err as Error).message || "Failed to grant access");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-[hsl(var(--card))] border-[hsl(var(--border))]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[hsl(var(--foreground))]">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Browser Not Supported
            </DialogTitle>
            <DialogDescription className="text-[hsl(var(--muted-foreground))]">
              Your browser does not support the File System Access API.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              To use AI Filesystem with your local files, please use one of these browsers:
            </p>
            
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
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-[hsl(var(--foreground))]">Opera (v72+)</span>
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
            
            <Button
              onClick={() => onOpenChange(false)}
              className="w-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
            >
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[hsl(var(--card))] border-[hsl(var(--border))]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[hsl(var(--foreground))]">
            <FolderOpen className="w-5 h-5 text-[hsl(var(--primary))]" />
            Connect Your Files
          </DialogTitle>
          <DialogDescription className="text-[hsl(var(--muted-foreground))]">
            Grant access to a folder to browse and search your files with AI.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Privacy notice */}
          <div className="flex gap-3 p-3 rounded-lg bg-[hsl(var(--subtle))]">
            <Shield className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-[hsl(var(--foreground))]">Your files stay private</p>
              <p className="text-[hsl(var(--muted-foreground))] mt-1">
                Files are read locally in your browser. Only file metadata is sent to the server for AI search.
              </p>
            </div>
          </div>

          {/* How it works */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-[hsl(var(--foreground))]">How it works:</p>
            <ol className="text-sm text-[hsl(var(--muted-foreground))] space-y-1 list-decimal list-inside">
              <li>Click the button below to choose a folder</li>
              <li>Your browser will ask for permission</li>
              <li>We&apos;ll scan the folder and show your files</li>
            </ol>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-[hsl(var(--border))] text-[hsl(var(--foreground))]"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGrantAccess}
              className="flex-1 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Choose Folder
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
