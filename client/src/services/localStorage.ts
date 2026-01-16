import { Comment } from '../types';

const STORAGE_KEY = 'git-diff-comments';

export const commentStorage = {
  /**
   * Get all comments from localStorage
   */
  getAll(): Comment[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to parse comments from localStorage:', error);
      return [];
    }
  },

  /**
   * Get comments for a specific file and line
   */
  getForLine(folderName: string, filePath: string, lineNumber: number | null): Comment[] {
    const all = this.getAll();
    return all.filter(
      (c) =>
        c.folderName === folderName &&
        c.filePath === filePath &&
        c.lineNumber === lineNumber
    );
  },

  /**
   * Get comments for a specific file
   */
  getForFile(folderName: string, filePath: string): Comment[] {
    const all = this.getAll();
    return all.filter(
      (c) => c.folderName === folderName && c.filePath === filePath
    );
  },

  /**
   * Add a new comment
   */
  add(comment: Omit<Comment, 'id' | 'timestamp'>): Comment {
    const newComment: Comment = {
      ...comment,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };

    const all = this.getAll();
    all.push(newComment);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));

    return newComment;
  },

  /**
   * Update a comment's content
   */
  update(commentId: string, newContent: string): void {
    const all = this.getAll();
    const updated = all.map((c) =>
      c.id === commentId ? { ...c, content: newContent, timestamp: Date.now() } : c
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  /**
   * Delete a comment by ID
   */
  delete(commentId: string): void {
    const all = this.getAll();
    const filtered = all.filter((c) => c.id !== commentId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  /**
   * Clear all comments
   */
  clearAll(): void {
    localStorage.removeItem(STORAGE_KEY);
  },

  /**
   * Clear comments for a specific folder
   */
  clearFolder(folderName: string): void {
    const all = this.getAll();
    const filtered = all.filter((c) => c.folderName !== folderName);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },
};
