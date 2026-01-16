import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { Header, ViewMode } from './components/Header';
import { FolderBrowser } from './components/FolderBrowser';
import { DiffViewer } from './components/DiffViewer';
import { useFolders } from './hooks/useFolders';
import { useGitDiff } from './hooks/useGitDiff';
import { useComments } from './hooks/useComments';
import { commentStorage } from './services/localStorage';
import './styles/diff.css';

function AppContent() {
  const navigate = useNavigate();
  const { folderName } = useParams<{ folderName?: string }>();
  const [selectedFolder, setSelectedFolder] = useState<string | null>(folderName || null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('diffViewMode');
    return (saved === 'split' ? 'split' : 'unified') as ViewMode;
  });

  const { folders, loading: foldersLoading, error: foldersError } = useFolders();
  const { files, loading: diffLoading, error: diffError } = useGitDiff(selectedFolder);
  const { comments, addComment, updateComment, deleteComment, clearAll } = useComments(selectedFolder);

  // Update selected folder when URL param changes
  useEffect(() => {
    if (folderName && folderName !== selectedFolder) {
      setSelectedFolder(folderName);
      setSelectedFile(null);
    }
  }, [folderName]);

  const handleSelectFolder = (folderName: string) => {
    setSelectedFolder(folderName);
    setSelectedFile(null);
    navigate(`/${folderName}`);
  };

  const handleAddComment = (content: string, lineNumber: number | null, filePath: string) => {
    addComment(content, lineNumber, filePath);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('diffViewMode', mode);
  };

  const handleClearFolderComments = () => {
    if (selectedFolder) {
      commentStorage.clearFolder(selectedFolder);
      // Reload comments
      window.location.reload();
    }
  };

  // Comments are already filtered by folder from the hook
  const allComments = comments;

  return (
    <div className="app">
      <Header
        onClearComments={clearAll}
        onClearFolderComments={handleClearFolderComments}
        selectedFolder={selectedFolder}
        commentCount={allComments.length}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
      />

      <div className="main-content">
        <aside className="sidebar">
          <FolderBrowser
            folders={folders}
            selectedFolder={selectedFolder}
            onSelectFolder={handleSelectFolder}
            loading={foldersLoading}
            error={foldersError}
          />
        </aside>

        <main className="content">
          {selectedFolder ? (
            <DiffViewer
              files={files}
              comments={allComments}
              onAddComment={handleAddComment}
              onUpdateComment={updateComment}
              onDeleteComment={deleteComment}
              loading={diffLoading}
              error={diffError}
              viewMode={viewMode}
            />
          ) : (
            <div className="empty-state">
              <span className="icon">👈</span>
              <h3>Select a repository</h3>
              <p>Choose a repository from the sidebar to view uncommitted changes.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppContent />} />
        <Route path="/:folderName" element={<AppContent />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
