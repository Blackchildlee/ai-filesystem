/**
 * File System Access API service
 * Allows users to grant access to local folders via browser permission prompt
 */

export interface LocalFile {
  id: string;
  path: string;
  name: string;
  size: number;
  mimeType: string;
  modifiedAt: string;
  handle: FileSystemFileHandle;
}

export interface LocalFolder {
  id: string;
  name: string;
  path: string;
  handle: FileSystemDirectoryHandle;
}

// Check if File System Access API is supported
export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

// Store the directory handle for persistence
let rootDirectoryHandle: FileSystemDirectoryHandle | null = null;

export function getRootHandle(): FileSystemDirectoryHandle | null {
  return rootDirectoryHandle;
}

export function setRootHandle(handle: FileSystemDirectoryHandle | null): void {
  rootDirectoryHandle = handle;
}

// Request permission to access a directory
export async function requestDirectoryAccess(): Promise<FileSystemDirectoryHandle | null> {
  if (!isFileSystemAccessSupported()) {
    throw new Error('File System Access API is not supported in this browser');
  }

  try {
    // Show directory picker - this triggers the browser's permission popup
    const handle = await window.showDirectoryPicker({
      mode: 'read',
    });
    
    rootDirectoryHandle = handle;
    
    // Try to persist the permission
    if ('permissions' in navigator) {
      try {
        // @ts-expect-error - experimental API
        await handle.requestPermission({ mode: 'read' });
      } catch {
        // Permission persistence not supported, that's okay
      }
    }
    
    return handle;
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      // User cancelled the picker
      return null;
    }
    throw error;
  }
}

// Check if we still have permission to the directory
export async function verifyPermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
  try {
    // @ts-expect-error - experimental API
    const permission = await handle.queryPermission({ mode: 'read' });
    if (permission === 'granted') {
      return true;
    }
    // @ts-expect-error - experimental API
    const request = await handle.requestPermission({ mode: 'read' });
    return request === 'granted';
  } catch {
    return false;
  }
}

// Get mime type from file extension
function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const mimeTypes: Record<string, string> = {
    // Documents
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'txt': 'text/plain',
    'rtf': 'application/rtf',
    'csv': 'text/csv',
    'json': 'application/json',
    'xml': 'application/xml',
    'md': 'text/markdown',
    
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
    'bmp': 'image/bmp',
    
    // Audio
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'flac': 'audio/flac',
    'm4a': 'audio/mp4',
    
    // Video
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'avi': 'video/x-msvideo',
    'mov': 'video/quicktime',
    'mkv': 'video/x-matroska',
    
    // Archives
    'zip': 'application/zip',
    'rar': 'application/vnd.rar',
    '7z': 'application/x-7z-compressed',
    'tar': 'application/x-tar',
    'gz': 'application/gzip',
    
    // Code
    'js': 'text/javascript',
    'ts': 'text/typescript',
    'jsx': 'text/javascript',
    'tsx': 'text/typescript',
    'html': 'text/html',
    'css': 'text/css',
    'py': 'text/x-python',
    'java': 'text/x-java',
    'c': 'text/x-c',
    'cpp': 'text/x-c++',
    'go': 'text/x-go',
    'rs': 'text/x-rust',
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}

// Recursively scan a directory and return all files
export async function scanDirectory(
  handle: FileSystemDirectoryHandle,
  basePath: string = '',
  maxDepth: number = 5,
  currentDepth: number = 0
): Promise<LocalFile[]> {
  const files: LocalFile[] = [];
  
  if (currentDepth >= maxDepth) {
    return files;
  }
  
  try {
    for await (const entry of handle.values()) {
      const entryPath = basePath ? `${basePath}/${entry.name}` : `/${entry.name}`;
      
      // Skip hidden files and common ignore patterns
      if (entry.name.startsWith('.') || 
          entry.name === 'node_modules' ||
          entry.name === '__pycache__' ||
          entry.name === '.git') {
        continue;
      }
      
      if (entry.kind === 'file') {
        try {
          const fileHandle = entry as FileSystemFileHandle;
          const file = await fileHandle.getFile();
          
          files.push({
            id: `local-${btoa(entryPath).replace(/[+/=]/g, '')}`,
            path: entryPath,
            name: entry.name,
            size: file.size,
            mimeType: file.type || getMimeType(entry.name),
            modifiedAt: new Date(file.lastModified).toISOString(),
            handle: fileHandle,
          });
        } catch {
          // Skip files we can't access
        }
      } else if (entry.kind === 'directory') {
        const dirHandle = entry as FileSystemDirectoryHandle;
        const subFiles = await scanDirectory(dirHandle, entryPath, maxDepth, currentDepth + 1);
        files.push(...subFiles);
      }
    }
  } catch {
    // Handle permission errors gracefully
  }
  
  return files;
}

// Get top-level folders from a directory
export async function getTopLevelFolders(handle: FileSystemDirectoryHandle): Promise<LocalFolder[]> {
  const folders: LocalFolder[] = [];
  
  try {
    for await (const entry of handle.values()) {
      if (entry.kind === 'directory' && !entry.name.startsWith('.')) {
        if (entry.name !== 'node_modules' && entry.name !== '__pycache__') {
          folders.push({
            id: entry.name,
            name: entry.name.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            path: `/${entry.name}`,
            handle: entry as FileSystemDirectoryHandle,
          });
        }
      }
    }
  } catch {
    // Handle errors gracefully
  }
  
  return folders.sort((a, b) => a.name.localeCompare(b.name));
}

// Read file content (for AI processing)
export async function readFileContent(handle: FileSystemFileHandle): Promise<string> {
  const file = await handle.getFile();
  
  // Only read text-based files
  const textTypes = ['text/', 'application/json', 'application/xml', 'application/javascript'];
  const isText = textTypes.some(type => file.type.startsWith(type)) || 
                 file.name.match(/\.(txt|md|json|xml|csv|html|css|js|ts|jsx|tsx|py|java|c|cpp|go|rs|sh|yml|yaml)$/i);
  
  if (!isText || file.size > 1024 * 1024) { // Skip files larger than 1MB
    return '';
  }
  
  return await file.text();
}
