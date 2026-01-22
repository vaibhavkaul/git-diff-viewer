export interface DiffFile {
  path: string;
  oldPath?: string;
  additions: number;
  deletions: number;
  chunks: DiffChunk[];
}

export interface DiffChunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  header: string;
  lines: DiffLine[];
}

export interface DiffLine {
  type: 'context' | 'addition' | 'deletion';
  content: string;
  oldLineNumber: number | null;
  newLineNumber: number | null;
}

export interface GitStatus {
  staged: string[];
  unstaged: string[];
  untracked: string[];
}

export interface FolderInfo {
  name: string;
  path: string;
  hasChanges: boolean;
  branch: string;
}

export interface Comment {
  id: string;
  folderName: string;
  filePath: string;
  lineNumber: number | null;
  content: string;
  timestamp: number;
}

export interface CommentFile {
  version: string;
  repository: string;
  lastModified: string;
  comments: Comment[];
}
