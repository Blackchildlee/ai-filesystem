/**
 * File System Access service
 * Supports both File System Access API and fallback for iframes
 */

// Extend Window interface to include File System Access API
declare global {
  interface Window {
    showDirectoryPicker?: (options?: {
      mode?: 'read' | 'readwrite';
      startIn?: FileSystemHandle | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';
    }) => Promise<FileSystemDirectoryHandle>;
  }
}

export interface LocalFile {
  id: string;
  path: string;
  name: string;
  size: number;
  mimeType: string;
  modifiedAt: string;
  file?: File;
  handle?: FileSystemFileHandle;
}

export interface LocalFolder {
  id: string;
  name: string;
  path: string;
  handle?: FileSystemDirectoryHandle;
}

// Check if File System Access API is supported AND we're not in an iframe
export function isFileSystemAccessSupported(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check if we're in an iframe (cross-origin)
  const inIframe = window !== window.parent;
  
  // Even if showDirectoryPicker exists, it won't work in cross-origin iframes
  return 'showDirectoryPicker' in window && !inIframe;
}

// Check if we're running in an iframe
export function isInIframe(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window !== window.parent;
  } catch {
    return true; // If we can't access parent due to CORS, we're in an iframe
  }
}

// Store the directory handle for persistence
let rootDirectoryHandle: FileSystemDirectoryHandle | null = null;
let cachedFiles: LocalFile[] = [];

export function getRootHandle(): FileSystemDirectoryHandle | null {
  return rootDirectoryHandle;
}

export function setRootHandle(handle: FileSystemDirectoryHandle | null): void {
  rootDirectoryHandle = handle;
}

export function getCachedFiles(): LocalFile[] {
  return cachedFiles;
}

export function setCachedFiles(files: LocalFile[]): void {
  cachedFiles = files;
}

// Request permission to access a directory (for top-level windows)
export async function requestDirectoryAccess(): Promise<FileSystemDirectoryHandle | null> {
  if (!isFileSystemAccessSupported() || !window.showDirectoryPicker) {
    throw new Error('File System Access API is not supported or blocked in iframes');
  }

  try {
    const handle = await window.showDirectoryPicker({
      mode: 'read',
    });
    
    rootDirectoryHandle = handle;
    return handle;
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      return null;
    }
    throw error;
  }
}

// Process files from a file input with webkitdirectory
export function processFileInputFiles(fileList: FileList): { files: LocalFile[], folders: LocalFolder[] } {
  const files: LocalFile[] = [];
  const folderSet = new Set<string>();
  
  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    
    // webkitRelativePath gives us the full path including folder structure
    const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
    const pathParts = relativePath.split('/');
    
    // Skip hidden files and common ignore patterns
    if (pathParts.some(part => 
      part.startsWith('.') || 
      part === 'node_modules' || 
      part === '__pycache__' ||
      part === '.git'
    )) {
      continue;
    }
    
    // Track top-level folders
    if (pathParts.length > 1) {
      folderSet.add(pathParts[0]);
      // Also track immediate subfolders for Quick Access
      if (pathParts.length > 2) {
        folderSet.add(`${pathParts[0]}/${pathParts[1]}`);
      }
    }
    
    const path = '/' + relativePath;
    
    files.push({
      id: `local-${btoa(path).replace(/[+/=]/g, '')}`,
      path,
      name: file.name,
      size: file.size,
      mimeType: file.type || getMimeType(file.name),
      modifiedAt: new Date(file.lastModified).toISOString(),
      file,
    });
  }
  
  // Build folder list from paths - only top-level folders
  const folders: LocalFolder[] = Array.from(folderSet)
    .filter(f => !f.includes('/')) // Only top-level
    .map(name => ({
      id: name,
      name: name.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      path: `/${name}`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  
  cachedFiles = files;
  
  return { files, folders };
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

// Recursively scan a directory (for File System Access API)
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
    for await (const entry of handle) {
      const entryPath = basePath ? `${basePath}/${entry.name}` : `/${entry.name}`;
      
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
  
  cachedFiles = files;
  return files;
}

// Get top-level folders from a directory
export async function getTopLevelFolders(handle: FileSystemDirectoryHandle): Promise<LocalFolder[]> {
  const folders: LocalFolder[] = [];
  
  try {
    for await (const entry of handle) {
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
export async function readFileContent(file: LocalFile): Promise<string> {
  let fileObj: File | undefined;
  
  if (file.file) {
    fileObj = file.file;
  } else if (file.handle) {
    fileObj = await file.handle.getFile();
  }
  
  if (!fileObj) return '';
  
  const textTypes = ['text/', 'application/json', 'application/xml', 'application/javascript'];
  const isText = textTypes.some(type => fileObj!.type.startsWith(type)) || 
                 fileObj.name.match(/\.(txt|md|json|xml|csv|html|css|js|ts|jsx|tsx|py|java|c|cpp|go|rs|sh|yml|yaml)$/i);
  
  if (!isText || fileObj.size > 1024 * 1024) {
    return '';
  }
  
  return await fileObj.text();
}
