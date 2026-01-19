import { Comment } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class CommentApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public originalError?: any
  ) {
    super(message);
    this.name = 'CommentApiError';
  }
}

async function fetchWithErrorHandling(url: string, options?: RequestInit): Promise<Response> {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new CommentApiError(
        error.error || `HTTP ${response.status}`,
        response.status,
        error
      );
    }

    return response;
  } catch (error) {
    if (error instanceof CommentApiError) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new CommentApiError('Failed to connect to server. Is the server running?', 0, error);
    }

    throw new CommentApiError('An unexpected error occurred', 0, error);
  }
}

export const commentApi = {
  /**
   * Loads all comments for a repository
   */
  async loadComments(folderName: string): Promise<Comment[]> {
    const response = await fetchWithErrorHandling(
      `${API_BASE}/api/comments/${encodeURIComponent(folderName)}`
    );
    const data = await response.json();
    return data.comments || [];
  },

  /**
   * Adds a new comment
   */
  async addComment(
    folderName: string,
    comment: Omit<Comment, 'id' | 'timestamp'>
  ): Promise<Comment> {
    const response = await fetchWithErrorHandling(
      `${API_BASE}/api/comments/${encodeURIComponent(folderName)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comment }),
      }
    );
    const data = await response.json();
    return data.comment;
  },

  /**
   * Updates an existing comment
   */
  async updateComment(
    folderName: string,
    commentId: string,
    content: string
  ): Promise<void> {
    await fetchWithErrorHandling(
      `${API_BASE}/api/comments/${encodeURIComponent(folderName)}/${encodeURIComponent(commentId)}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      }
    );
  },

  /**
   * Deletes a comment
   */
  async deleteComment(folderName: string, commentId: string): Promise<void> {
    await fetchWithErrorHandling(
      `${API_BASE}/api/comments/${encodeURIComponent(folderName)}/${encodeURIComponent(commentId)}`,
      {
        method: 'DELETE',
      }
    );
  },

  /**
   * Clears all comments for a repository
   */
  async clearComments(folderName: string): Promise<void> {
    await fetchWithErrorHandling(
      `${API_BASE}/api/comments/${encodeURIComponent(folderName)}`,
      {
        method: 'DELETE',
      }
    );
  },

  /**
   * Migrates comments from localStorage to server
   */
  async migrateComments(folderName: string, comments: Comment[]): Promise<number> {
    const response = await fetchWithErrorHandling(
      `${API_BASE}/api/comments/${encodeURIComponent(folderName)}/migrate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comments }),
      }
    );
    const data = await response.json();
    return data.migrated || 0;
  },
};

export { CommentApiError };
