import { useState, useEffect, useCallback } from 'react';
import { commentStorage } from '../services/localStorage';
import { Comment } from '../types';

export function useComments(folderName: string | null) {
  const [comments, setComments] = useState<Comment[]>([]);

  const loadComments = useCallback(() => {
    if (!folderName) {
      setComments([]);
      return;
    }
    // Load all comments for this folder
    const allComments = commentStorage.getAll().filter(c => c.folderName === folderName);
    setComments(allComments);
  }, [folderName]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const addComment = useCallback(
    (content: string, lineNumber: number | null, filePath: string) => {
      if (!folderName) return;

      commentStorage.add({
        folderName,
        filePath,
        lineNumber,
        content,
      });

      loadComments();
    },
    [folderName, loadComments]
  );

  const updateComment = useCallback(
    (commentId: string, newContent: string) => {
      commentStorage.update(commentId, newContent);
      loadComments();
    },
    [loadComments]
  );

  const deleteComment = useCallback(
    (commentId: string) => {
      commentStorage.delete(commentId);
      loadComments();
    },
    [loadComments]
  );

  const clearAll = useCallback(() => {
    commentStorage.clearAll();
    loadComments();
  }, [loadComments]);

  return {
    comments,
    addComment,
    updateComment,
    deleteComment,
    clearAll,
  };
}
