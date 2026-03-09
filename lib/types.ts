export interface FileItem {
  id: string;
  path: string;
  name: string;
  size: number;
  mimeType: string;
  modifiedAt: string;
  title?: string;
  summary?: string;
  tags?: string[];
  score?: number;
  starred?: boolean;
  trashed?: boolean;
}

export interface SearchResult {
  score: number;
  path: string;
  title: string;
}

export interface IntentResponse {
  action: string;
  query?: string;
  dest?: string;
  tags?: string[];
}

export interface MoveResponse {
  moved: number;
  dest: string;
  files: string[];
}

export type ViewMode = "grid" | "list" | "details";
export type SortBy = "name" | "date" | "size" | "type";
export type SortOrder = "asc" | "desc";
