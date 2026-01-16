import React, { useState } from 'react';
import { Comment } from '../types';

interface CommentThreadProps {
  comments: Comment[];
  onAddComment: (content: string) => void;
  onUpdateComment: (commentId: string, newContent: string) => void;
  onDeleteComment: (commentId: string) => void;
  lineNumber: number | null;
  autoFocusInput?: boolean;
}

function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

export function CommentThread({
  comments,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  lineNumber,
  autoFocusInput = false,
}: CommentThreadProps) {
  const lineComments = comments.filter((c) => c.lineNumber === lineNumber);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [newContent, setNewContent] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newContent.trim()) {
      onAddComment(newContent.trim());
      setNewContent('');
    }
  };

  const handleEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const handleUpdateSubmit = (e: React.FormEvent, commentId: string) => {
    e.preventDefault();
    if (editContent.trim()) {
      onUpdateComment(commentId, editContent.trim());
      setEditingId(null);
      setEditContent('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  return (
    <div className="comment-thread">
      {lineComments.length > 0 && (
        <div className="comment-list">
          {lineComments.map((comment) => (
            <div key={comment.id} className="comment">
              {editingId === comment.id ? (
                <form className="comment-form" onSubmit={(e) => handleUpdateSubmit(e, comment.id)}>
                  <textarea
                    className="comment-input"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    autoFocus
                    rows={3}
                  />
                  <div className="comment-form-actions">
                    <button type="submit" className="btn btn-primary" disabled={!editContent.trim()}>
                      Save
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={handleCancelEdit}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="comment-header">
                    <span className="comment-time">{formatTimestamp(comment.timestamp)}</span>
                    <div className="comment-actions">
                      <button
                        className="comment-edit"
                        onClick={() => handleEdit(comment)}
                        title="Edit comment"
                      >
                        Edit
                      </button>
                      <button
                        className="comment-delete"
                        onClick={() => onDeleteComment(comment.id)}
                        title="Delete comment"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <div className="comment-body">{comment.content}</div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {lineComments.length === 0 && (
        <form className="comment-form" onSubmit={handleAddSubmit}>
          <textarea
            className="comment-input"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Add a comment..."
            autoFocus={autoFocusInput}
            rows={3}
          />
          <div className="comment-form-actions">
            <button type="submit" className="btn btn-primary" disabled={!newContent.trim()}>
              Save
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
