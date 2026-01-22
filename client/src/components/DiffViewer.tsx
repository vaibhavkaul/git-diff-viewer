import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DiffFile, Comment, DiffLine as DiffLineType } from '../types';
import { DiffLine } from './DiffLine';
import { ViewMode } from './Header';

interface DiffViewerProps {
  files: DiffFile[];
  comments: Comment[];
  onAddComment: (content: string, lineNumber: number | null, filePath: string) => void;
  onUpdateComment: (commentId: string, newContent: string) => void;
  onDeleteComment: (commentId: string) => void;
  loading: boolean;
  error: string | null;
  viewMode: ViewMode;
  folderName?: string | null;
}

function getLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    rb: 'ruby',
    java: 'java',
    go: 'go',
    rs: 'rust',
    c: 'c',
    cpp: 'cpp',
    h: 'c',
    hpp: 'cpp',
    cs: 'csharp',
    php: 'php',
    swift: 'swift',
    kt: 'kotlin',
    json: 'json',
    xml: 'xml',
    html: 'html',
    css: 'css',
    scss: 'scss',
    md: 'markdown',
    sh: 'bash',
    yml: 'yaml',
    yaml: 'yaml',
  };
  return ext ? languageMap[ext] || 'plaintext' : 'plaintext';
}

// For split view: pair up lines side by side
interface SplitLine {
  oldLine: DiffLineType | null;
  newLine: DiffLineType | null;
}

function pairLinesForSplit(lines: DiffLineType[]): SplitLine[] {
  const paired: SplitLine[] = [];

  for (const line of lines) {
    if (line.type === 'context') {
      // Context lines appear on both sides
      paired.push({ oldLine: line, newLine: line });
    } else if (line.type === 'deletion') {
      // Deletion only on left
      paired.push({ oldLine: line, newLine: null });
    } else if (line.type === 'addition') {
      // Addition only on right
      paired.push({ oldLine: null, newLine: line });
    }
  }

  return paired;
}

export function DiffViewer({
  files,
  comments,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  loading,
  error,
  viewMode,
  folderName,
}: DiffViewerProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsedFiles, setCollapsedFiles] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Handle line highlighting from URL hash
    const hash = location.hash;
    if (hash) {
      const match = hash.match(/#L(\d+)/);
      if (match) {
        const lineNumber = match[1];
        const element = document.getElementById(`L${lineNumber}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [location]);

  const toggleFileCollapse = (filePath: string) => {
    setCollapsedFiles(prev => {
      const next = new Set(prev);
      if (next.has(filePath)) {
        next.delete(filePath);
      } else {
        next.add(filePath);
      }
      return next;
    });
  };

  const copyFilePath = (filePath: string, event: React.MouseEvent) => {
    event.stopPropagation();
    navigator.clipboard.writeText(filePath);
  };

  if (loading) {
    return (
      <div className="diff-viewer">
        <div className="loading">Loading diff...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="diff-viewer">
        <div className="error">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="diff-viewer">
        <div className="empty-state">
          <span className="icon">✓</span>
          <h3>No uncommitted changes</h3>
          <p>This repository has no staged or unstaged changes to display.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="diff-viewer">
      {/* Hidden metadata for LLMs - explains code review system and comment storage */}
      <div
        hidden
        data-llm-system="code-review"
        data-repository={folderName || 'unknown'}
        data-comment-count={comments.length}
        aria-hidden="true"
      >
        <div data-llm-info="system-description">
          === GIT DIFF CODE REVIEW SYSTEM ===
          This page displays a code review interface for git diffs.
          Users can add inline comments to specific lines of code changes.

          Repository: {folderName || 'No repository selected'}
          Files with changes: {files.length}
          Total comments: {comments.length}
          View mode: {viewMode}
        </div>

        <div data-llm-info="comment-storage">
          === COMMENT STORAGE LOCATION ===
          Comments for this repository are stored in a JSON file at:
          SOURCE_DIR/code-review/{folderName || 'REPOSITORY_NAME'}/comments.json

          The JSON structure is:
          {`{
            "version": "1.0",
            "repository": "${folderName || 'REPOSITORY_NAME'}",
            "lastModified": "ISO 8601 timestamp",
            "comments": [
              {
                "id": "uuid",
                "folderName": "${folderName || 'REPOSITORY_NAME'}",
                "filePath": "relative/path/to/file.ext",
                "lineNumber": 42 (or null for file-level comments),
                "content": "The comment text",
                "timestamp": 1234567890000
              }
            ]
          }`}
        </div>

        <div data-llm-info="api-endpoints">
          === API ENDPOINTS ===
          - GET  /api/comments/{folderName || ':folderName'} - Load all comments
          - POST /api/comments/{folderName || ':folderName'} - Add new comment
          - PUT  /api/comments/{folderName || ':folderName'}/:commentId - Update comment
          - DELETE /api/comments/{folderName || ':folderName'}/:commentId - Delete comment
          - DELETE /api/comments/{folderName || ':folderName'} - Clear all comments
        </div>

        {comments.length > 0 && (
          <div data-llm-info="comment-summary">
            === COMMENTS IN THIS REVIEW ===
            {comments.map(comment => (
              <div key={comment.id} data-comment-id={comment.id}>
                File: {comment.filePath}
                Line: {comment.lineNumber !== null ? comment.lineNumber : 'file-level'}
                Comment: {comment.content}
                Timestamp: {new Date(comment.timestamp).toISOString()}
              </div>
            ))}
          </div>
        )}
      </div>

      {files.map((file) => {
        const language = getLanguageFromPath(file.path);
        const fileComments = comments.filter((c) => c.filePath === file.path);

        // Wrap onAddComment to include file path
        const handleAddCommentForFile = (content: string, lineNumber: number | null) => {
          onAddComment(content, lineNumber, file.path);
        };

        const isCollapsed = collapsedFiles.has(file.path);

        return (
          <div key={file.path} className={`diff-file ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="diff-file-header" onClick={() => toggleFileCollapse(file.path)}>
              <button className="file-collapse-toggle" title={isCollapsed ? 'Expand file' : 'Collapse file'}>
                <span className={`collapse-icon ${isCollapsed ? 'collapsed' : ''}`}>▼</span>
              </button>
              <div className="diff-file-path">
                <span className="file-icon">📄</span>
                {file.path}
                <button
                  className="file-copy-button"
                  onClick={(e) => copyFilePath(file.path, e)}
                  title="Copy file path"
                >
                  📋
                </button>
              </div>
              <div className="diff-file-stats">
                <span className="additions">+{file.additions}</span>
                <span className="deletions">-{file.deletions}</span>
              </div>
            </div>

            {!isCollapsed && file.chunks.map((chunk, chunkIndex) => (
              <div key={chunkIndex} className="diff-chunk">
                <div className="chunk-header">{chunk.header}</div>
                {viewMode === 'unified' ? (
                  <table className="diff-table unified">
                    <thead>
                      <tr>
                        <th className="line-number-header">Old</th>
                        <th className="line-number-header">New</th>
                        <th className="code-header">Code</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chunk.lines.map((line, lineIndex) => (
                        <DiffLine
                          key={lineIndex}
                          line={line}
                          comments={fileComments}
                          onAddComment={handleAddCommentForFile}
                          onUpdateComment={onUpdateComment}
                          onDeleteComment={onDeleteComment}
                          language={language}
                          viewMode="unified"
                        />
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table className="diff-table split">
                    <thead>
                      <tr>
                        <th className="line-number-header">Old</th>
                        <th className="code-header">Old Code</th>
                        <th className="line-number-header">New</th>
                        <th className="code-header">New Code</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pairLinesForSplit(chunk.lines).map((pair, pairIndex) => (
                        <DiffLine
                          key={pairIndex}
                          line={pair.oldLine || pair.newLine!}
                          oldLine={pair.oldLine}
                          newLine={pair.newLine}
                          comments={fileComments}
                          onAddComment={handleAddCommentForFile}
                          onUpdateComment={onUpdateComment}
                          onDeleteComment={onDeleteComment}
                          language={language}
                          viewMode="split"
                        />
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
