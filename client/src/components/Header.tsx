import React from 'react';

export type ViewMode = 'unified' | 'split';

interface HeaderProps {
  onClearComments: () => void;
  onClearFolderComments: () => void;
  selectedFolder: string | null;
  commentCount: number;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function Header({
  onClearComments,
  onClearFolderComments,
  selectedFolder,
  commentCount,
  viewMode,
  onViewModeChange
}: HeaderProps) {
  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear ALL comments from ALL repositories? This cannot be undone.')) {
      onClearComments();
    }
  };

  const handleClearFolder = () => {
    if (selectedFolder && window.confirm(`Clear all comments for "${selectedFolder}"? This cannot be undone.`)) {
      onClearFolderComments();
    }
  };

  return (
    <header className="header">
      <div className="header-content">
        <h1 className="header-title">
          <span className="icon">📝</span>
          Git Diff Viewer
        </h1>
        <div className="header-actions">
          {commentCount > 0 && (
            <div className="comment-badge">
              {commentCount} comment{commentCount !== 1 ? 's' : ''} {selectedFolder && `in ${selectedFolder}`}
            </div>
          )}
          <div className="view-mode-toggle">
            <button
              className={`btn btn-toggle ${viewMode === 'unified' ? 'active' : ''}`}
              onClick={() => onViewModeChange('unified')}
              title="Unified view"
            >
              Unified
            </button>
            <button
              className={`btn btn-toggle ${viewMode === 'split' ? 'active' : ''}`}
              onClick={() => onViewModeChange('split')}
              title="Split view"
            >
              Split
            </button>
          </div>
          {selectedFolder && (
            <button
              className="btn btn-secondary"
              onClick={handleClearFolder}
              disabled={commentCount === 0}
              title={commentCount > 0 ? `Clear all comments for ${selectedFolder}` : 'No comments to clear'}
            >
              Clear Comments
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
