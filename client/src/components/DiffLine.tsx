import React, { useState, useMemo } from 'react';
import { DiffLine as DiffLineType, Comment } from '../types';
import { CommentThread } from './CommentThread';
import hljs from 'highlight.js';

interface DiffLineProps {
  line: DiffLineType;
  oldLine?: DiffLineType | null;  // For split view
  newLine?: DiffLineType | null;  // For split view
  comments: Comment[];
  onAddComment: (content: string, lineNumber: number | null) => void;
  onUpdateComment: (commentId: string, newContent: string) => void;
  onDeleteComment: (commentId: string) => void;
  language?: string;
  viewMode: 'unified' | 'split';
}

export function DiffLine({
  line,
  oldLine,
  newLine,
  comments,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  language,
  viewMode,
}: DiffLineProps) {
  // Calculate if this line has comments to determine initial state
  const hasExistingComments = useMemo(() => {
    if (viewMode === 'unified') {
      const lineNumber = line.newLineNumber || line.oldLineNumber;
      return comments.some((c) => c.lineNumber === lineNumber);
    } else {
      const oldLineNum = oldLine?.oldLineNumber ?? null;
      const newLineNum = newLine?.newLineNumber ?? null;
      return comments.some((c) => c.lineNumber === oldLineNum || c.lineNumber === newLineNum);
    }
  }, [comments, line, oldLine, newLine, viewMode]);

  const [showCommentButton, setShowCommentButton] = useState(false);
  const [showComments, setShowComments] = useState(hasExistingComments);

  const highlightCode = (code: string): string => {
    if (!language) return code;
    try {
      return hljs.highlight(code, { language }).value;
    } catch {
      return hljs.highlightAuto(code).value;
    }
  };

  const toggleComments = () => {
    setShowComments(!showComments);
  };

  // Unified view
  if (viewMode === 'unified') {
    // Use unique line identifier: for deletions use negative old line number
    // to differentiate from additions/context which use positive new line number
    const lineNumber = line.type === 'deletion' && line.newLineNumber === null
      ? -(line.oldLineNumber ?? 0)  // Negative for deletions
      : (line.newLineNumber ?? line.oldLineNumber ?? 0);  // Positive for additions/context

    const lineComments = comments.filter((c) => c.lineNumber === lineNumber);
    const hasComments = lineComments.length > 0;

    const getLineClass = () => {
      const classes = ['diff-line', `diff-line-${line.type}`];
      if (hasComments) classes.push('has-comments');
      return classes.join(' ');
    };

    const handleAddComment = (content: string) => {
      onAddComment(content, lineNumber);
    };

    return (
      <>
        <tr
          className={getLineClass()}
          onMouseEnter={() => setShowCommentButton(true)}
          onMouseLeave={() => setShowCommentButton(false)}
        >
          <td className="line-number old-line-number">
            {line.oldLineNumber !== null && line.oldLineNumber}
          </td>
          <td className="line-number new-line-number">
            {line.newLineNumber !== null && line.newLineNumber}
          </td>
          <td className="line-content">
            <div className="line-content-wrapper">
              {(showCommentButton || hasComments) && (
                <button
                  className={`comment-button ${hasComments ? 'has-comments' : ''}`}
                  onClick={toggleComments}
                  title={hasComments ? 'View comments' : 'Add comment'}
                >
                  {hasComments ? `💬 ${lineComments.length}` : '+'}
                </button>
              )}
              <code
                className="line-code"
                dangerouslySetInnerHTML={{ __html: highlightCode(line.content) }}
              />
            </div>
          </td>
        </tr>
        {showComments && (
          <tr className="comment-row">
            <td colSpan={3}>
              <CommentThread
                comments={comments}
                onAddComment={handleAddComment}
                onUpdateComment={onUpdateComment}
                onDeleteComment={onDeleteComment}
                lineNumber={lineNumber}
                autoFocusInput={!hasComments}
              />
            </td>
          </tr>
        )}
      </>
    );
  }

  // Split view
  const oldLineNum = oldLine?.oldLineNumber ?? null;
  const newLineNum = newLine?.newLineNumber ?? null;

  // Comments can be on old line or new line
  const oldLineComments = oldLineNum ? comments.filter((c) => c.lineNumber === oldLineNum) : [];
  const newLineComments = newLineNum ? comments.filter((c) => c.lineNumber === newLineNum) : [];
  const hasOldComments = oldLineComments.length > 0;
  const hasNewComments = newLineComments.length > 0;

  const handleAddOldComment = (content: string) => {
    if (oldLineNum) onAddComment(content, oldLineNum);
  };

  const handleAddNewComment = (content: string) => {
    if (newLineNum) onAddComment(content, newLineNum);
  };

  const getRowClass = () => {
    if (!oldLine && newLine) return 'diff-line diff-line-addition';
    if (oldLine && !newLine) return 'diff-line diff-line-deletion';
    return 'diff-line diff-line-context';
  };

  return (
    <>
      <tr
        className={getRowClass()}
        onMouseEnter={() => setShowCommentButton(true)}
        onMouseLeave={() => setShowCommentButton(false)}
      >
        {/* Old side */}
        <td className="line-number old-line-number">
          {oldLineNum !== null && oldLineNum}
        </td>
        <td className={`line-content ${oldLine ? 'line-content-old' : 'line-content-empty'}`}>
          {oldLine ? (
            <div className="line-content-wrapper">
              {(showCommentButton || hasOldComments) && (
                <button
                  className={`comment-button ${hasOldComments ? 'has-comments' : ''}`}
                  onClick={() => setShowComments(!showComments)}
                  title={hasOldComments ? 'View comments' : 'Add comment'}
                >
                  {hasOldComments ? `💬 ${oldLineComments.length}` : '+'}
                </button>
              )}
              <code
                className="line-code"
                dangerouslySetInnerHTML={{ __html: highlightCode(oldLine.content) }}
              />
            </div>
          ) : (
            <div className="line-content-wrapper line-empty" />
          )}
        </td>

        {/* New side */}
        <td className="line-number new-line-number">
          {newLineNum !== null && newLineNum}
        </td>
        <td className={`line-content ${newLine ? 'line-content-new' : 'line-content-empty'}`}>
          {newLine ? (
            <div className="line-content-wrapper">
              {(showCommentButton || hasNewComments) && (
                <button
                  className={`comment-button ${hasNewComments ? 'has-comments' : ''}`}
                  onClick={() => setShowComments(!showComments)}
                  title={hasNewComments ? 'View comments' : 'Add comment'}
                >
                  {hasNewComments ? `💬 ${newLineComments.length}` : '+'}
                </button>
              )}
              <code
                className="line-code"
                dangerouslySetInnerHTML={{ __html: highlightCode(newLine.content) }}
              />
            </div>
          ) : (
            <div className="line-content-wrapper line-empty" />
          )}
        </td>
      </tr>
      {showComments && (
        <tr className="comment-row split-comment-row">
          {/* Old side comments - only for deletions (when newLine doesn't exist) */}
          <td colSpan={2} className="split-comment-cell">
            {oldLineNum && !newLineNum && (
              <div className="split-comment-section">
                {oldLineComments.length > 0 && <strong>Old line {oldLineNum}:</strong>}
                <CommentThread
                  comments={comments}
                  onAddComment={handleAddOldComment}
                  onUpdateComment={onUpdateComment}
                  onDeleteComment={onDeleteComment}
                  lineNumber={oldLineNum}
                  autoFocusInput={!hasOldComments}
                />
              </div>
            )}
          </td>
          {/* New side comments - for additions and context lines */}
          <td colSpan={2} className="split-comment-cell">
            {newLineNum && (
              <div className="split-comment-section">
                {newLineComments.length > 0 && <strong>New line {newLineNum}:</strong>}
                <CommentThread
                  comments={comments}
                  onAddComment={handleAddNewComment}
                  onUpdateComment={onUpdateComment}
                  onDeleteComment={onDeleteComment}
                  lineNumber={newLineNum}
                  autoFocusInput={!hasNewComments}
                />
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
