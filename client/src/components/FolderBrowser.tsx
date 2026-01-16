import React from 'react';
import { FolderInfo } from '../types';

interface FolderBrowserProps {
  folders: FolderInfo[];
  selectedFolder: string | null;
  onSelectFolder: (folderName: string) => void;
  loading: boolean;
  error: string | null;
}

export function FolderBrowser({
  folders,
  selectedFolder,
  onSelectFolder,
  loading,
  error,
}: FolderBrowserProps) {
  if (loading) {
    return (
      <div className="folder-browser">
        <div className="folder-browser-header">
          <h2>Repositories</h2>
        </div>
        <div className="folder-browser-content">
          <div className="loading">Loading repositories...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="folder-browser">
        <div className="folder-browser-header">
          <h2>Repositories</h2>
        </div>
        <div className="folder-browser-content">
          <div className="error">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (folders.length === 0) {
    return (
      <div className="folder-browser">
        <div className="folder-browser-header">
          <h2>Repositories</h2>
        </div>
        <div className="folder-browser-content">
          <div className="empty-state">
            <span className="icon">📂</span>
            <p>No git repositories found in the source directory.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="folder-browser">
      <div className="folder-browser-header">
        <h2>Repositories</h2>
        <div className="folder-count">{folders.length}</div>
      </div>
      <div className="folder-browser-content">
        <div className="folder-list">
          {folders.map((folder) => (
            <button
              key={folder.name}
              className={`folder-item ${selectedFolder === folder.name ? 'selected' : ''}`}
              onClick={() => onSelectFolder(folder.name)}
            >
              <span className="folder-icon">
                {folder.hasChanges ? '📝' : '📁'}
              </span>
              <span className="folder-name">{folder.name}</span>
              {folder.hasChanges && (
                <span className="changes-indicator" title="Has uncommitted changes">
                  ●
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
