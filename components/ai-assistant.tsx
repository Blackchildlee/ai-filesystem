"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  X,
  Send,
  Loader2,
  FolderSync,
  Search,
  Tags,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteCommand: (command: string) => Promise<{ success: boolean; message: string }>;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  status?: "pending" | "success" | "error";
  action?: {
    type: string;
    details: string;
  };
}

const quickActions = [
  { icon: Search, label: "Find files", prompt: "Find all files containing" },
  { icon: FolderSync, label: "Organize", prompt: "Move all documents to" },
  { icon: Tags, label: "Tag files", prompt: "Tag all images as" },
];

export function AIAssistant({ isOpen, onClose, onExecuteCommand }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I can help you manage your files using natural language. Try asking me to find, move, or organize your files.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "Processing your request...",
      status: "pending",
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
    setIsProcessing(true);

    try {
      const result = await onExecuteCommand(input);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id
            ? {
                ...msg,
                content: result.message,
                status: result.success ? "success" : "error",
              }
            : msg
        )
      );
    } catch {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id
            ? {
                ...msg,
                content: "Sorry, something went wrong. Please try again.",
                status: "error",
              }
            : msg
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg h-[600px] bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--divider))]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(var(--primary))] to-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-[hsl(var(--foreground))]">AI Assistant</h2>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Manage files with natural language
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-[hsl(var(--subtle))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 px-4 py-3 border-b border-[hsl(var(--divider))]">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => setInput(action.prompt)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[hsl(var(--border))] text-xs text-[hsl(var(--foreground))] hover:bg-[hsl(var(--subtle))] transition-colors"
            >
              <action.icon className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
              {action.label}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-xl px-4 py-2.5",
                  message.role === "user"
                    ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                    : "bg-[hsl(var(--subtle))] text-[hsl(var(--foreground))]"
                )}
              >
                <div className="flex items-start gap-2">
                  {message.status === "pending" && (
                    <Loader2 className="w-4 h-4 mt-0.5 animate-spin text-[hsl(var(--primary))]" />
                  )}
                  {message.status === "success" && (
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                  )}
                  {message.status === "error" && (
                    <AlertCircle className="w-4 h-4 mt-0.5 text-red-500 flex-shrink-0" />
                  )}
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 px-4 py-3 border-t border-[hsl(var(--divider))]"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI to help manage your files..."
            disabled={isProcessing}
            className="flex-1 px-4 py-2.5 rounded-lg bg-[hsl(var(--subtle))] text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className={cn(
              "p-2.5 rounded-lg transition-colors",
              input.trim() && !isProcessing
                ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
                : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] cursor-not-allowed"
            )}
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
