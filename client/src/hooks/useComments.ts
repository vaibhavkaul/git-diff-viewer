import { useState, useEffect, useCallback } from 'react';
import { commentApi, CommentApiError } from '../services/commentApi';
import { Comment } from '../types';

export function useComments(folderName: string | null) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    if (!folderName) {
      setComments([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await commentApi.loadComments(folderName);
      setComments(data);
    } catch (err) {
      const errorMessage = err instanceof CommentApiError
        ? err.message
        : 'Failed to load comments';
      setError(errorMessage);
      console.error('Error loading comments:', err);
    } finally {
      setLoading(false);
    }
  }, [folderName]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const addComment = useCallback(
    async (content: string, lineNumber: number | null, filePath: string) => {
      if (!folderName) return;

      // Optimistic update
      const tempComment: Comment = {
        id: `temp-${Date.now()}`,
        folderName,
        filePath,
        lineNumber,
        content,
        timestamp: Date.now(),
      };
      setComments(prev => [...prev, tempComment]);

      try {
        const newComment = await commentApi.addComment(folderName, {
          folderName,
          filePath,
          lineNumber,
          content,
        });
        // Replace temp comment with real one
        setComments(prev => prev.map(c => c.id === tempComment.id ? newComment : c));
        setError(null);
      } catch (err) {
        // Rollback optimistic update
        setComments(prev => prev.filter(c => c.id !== tempComment.id));
        const errorMessage = err instanceof CommentApiError
          ? err.message
          : 'Failed to add comment';
        setError(errorMessage);
        console.error('Error adding comment:', err);
      }
    },
    [folderName]
  );

  const updateComment = useCallback(
    async (commentId: string, newContent: string) => {
      if (!folderName) return;

      // Optimistic update
      const previousComments = comments;
      setComments(prev => prev.map(c =>
        c.id === commentId
          ? { ...c, content: newContent, timestamp: Date.now() }
          : c
      ));

      try {
        await commentApi.updateComment(folderName, commentId, newContent);
        setError(null);
      } catch (err) {
        // Rollback optimistic update
        setComments(previousComments);
        const errorMessage = err instanceof CommentApiError
          ? err.message
          : 'Failed to update comment';
        setError(errorMessage);
        console.error('Error updating comment:', err);
      }
    },
    [folderName, comments]
  );

  const deleteComment = useCallback(
    async (commentId: string) => {
      if (!folderName) return;

      // Optimistic update
      const previousComments = comments;
      setComments(prev => prev.filter(c => c.id !== commentId));

      try {
        await commentApi.deleteComment(folderName, commentId);
        setError(null);
      } catch (err) {
        // Rollback optimistic update
        setComments(previousComments);
        const errorMessage = err instanceof CommentApiError
          ? err.message
          : 'Failed to delete comment';
        setError(errorMessage);
        console.error('Error deleting comment:', err);
      }
    },
    [folderName, comments]
  );

  const clearAll = useCallback(async () => {
    if (!folderName) return;

    // Optimistic update
    const previousComments = comments;
    setComments([]);

    try {
      await commentApi.clearComments(folderName);
      setError(null);
    } catch (err) {
      // Rollback optimistic update
      setComments(previousComments);
      const errorMessage = err instanceof CommentApiError
        ? err.message
        : 'Failed to clear comments';
      setError(errorMessage);
      console.error('Error clearing comments:', err);
    }
  }, [folderName, comments]);

  return {
    comments,
    loading,
    error,
    addComment,
    updateComment,
    deleteComment,
    clearAll,
  };
}
