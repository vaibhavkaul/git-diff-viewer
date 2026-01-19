import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { Comment, CommentFile } from './types.js';

export class CommentService {
  private baseDir: string;
  private codeReviewDir: string;

  constructor(sourceDir: string) {
    this.baseDir = sourceDir;
    this.codeReviewDir = path.join(sourceDir, 'code-review');
  }

  /**
   * Ensures the code-review directory exists
   */
  async ensureCodeReviewDir(): Promise<void> {
    try {
      await fs.mkdir(this.codeReviewDir, { recursive: true });

      // Create .gitignore to exclude code-review from version control
      const gitignorePath = path.join(this.codeReviewDir, '.gitignore');
      try {
        await fs.access(gitignorePath);
      } catch {
        await fs.writeFile(gitignorePath, '# Exclude all comment files from git\n*\n!.gitignore\n');
      }
    } catch (error) {
      throw new Error(`Failed to create code-review directory: ${error}`);
    }
  }

  /**
   * Gets the path to the comments file for a folder
   */
  private async getCommentsFilePath(folderName: string): Promise<string> {
    this.validateFolderName(folderName);

    const folderDir = path.join(this.codeReviewDir, folderName);
    await fs.mkdir(folderDir, { recursive: true });

    return path.join(folderDir, 'comments.json');
  }

  /**
   * Validates folder name to prevent directory traversal
   */
  private validateFolderName(folderName: string): void {
    if (!folderName || typeof folderName !== 'string') {
      throw new Error('Invalid folder name');
    }

    // Prevent directory traversal
    if (folderName.includes('..') || folderName.includes('/') || folderName.includes('\\')) {
      throw new Error('Invalid folder name: path traversal not allowed');
    }

    // Check that resolved path is within code-review directory
    const resolvedPath = path.resolve(this.codeReviewDir, folderName);
    if (!resolvedPath.startsWith(this.codeReviewDir)) {
      throw new Error('Invalid folder name: must be within code-review directory');
    }
  }

  /**
   * Validates comment data structure
   */
  private validateCommentData(comment: any): void {
    if (!comment || typeof comment !== 'object') {
      throw new Error('Invalid comment data');
    }

    if (typeof comment.content !== 'string' || !comment.content.trim()) {
      throw new Error('Comment content is required');
    }

    if (typeof comment.filePath !== 'string' || !comment.filePath) {
      throw new Error('File path is required');
    }

    if (comment.lineNumber !== null && typeof comment.lineNumber !== 'number') {
      throw new Error('Line number must be a number or null');
    }
  }

  /**
   * Loads comments for a folder
   */
  async loadComments(folderName: string): Promise<Comment[]> {
    const filePath = await this.getCommentsFilePath(folderName);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data: CommentFile = JSON.parse(content);
      return data.comments || [];
    } catch (error: any) {
      // If file doesn't exist, return empty array
      if (error.code === 'ENOENT') {
        return [];
      }
      throw new Error(`Failed to load comments: ${error.message}`);
    }
  }

  /**
   * Saves comments for a folder (atomic write)
   */
  async saveComments(folderName: string, comments: Comment[]): Promise<void> {
    const filePath = await this.getCommentsFilePath(folderName);

    const data: CommentFile = {
      version: '1.0',
      repository: folderName,
      lastModified: new Date().toISOString(),
      comments
    };

    // Atomic write: write to temp file, then rename
    const tempPath = `${filePath}.tmp`;
    try {
      await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');
      await fs.rename(tempPath, filePath);
    } catch (error) {
      // Clean up temp file if it exists
      try {
        await fs.unlink(tempPath);
      } catch {
        // Ignore cleanup errors
      }
      throw new Error(`Failed to save comments: ${error}`);
    }
  }

  /**
   * Adds a new comment
   */
  async addComment(
    folderName: string,
    commentData: Omit<Comment, 'id' | 'timestamp'>
  ): Promise<Comment> {
    this.validateCommentData(commentData);

    const comments = await this.loadComments(folderName);

    const newComment: Comment = {
      id: randomUUID(),
      ...commentData,
      timestamp: Date.now()
    };

    comments.push(newComment);
    await this.saveComments(folderName, comments);

    return newComment;
  }

  /**
   * Updates an existing comment
   */
  async updateComment(
    folderName: string,
    commentId: string,
    content: string
  ): Promise<void> {
    if (!content || typeof content !== 'string' || !content.trim()) {
      throw new Error('Comment content is required');
    }

    const comments = await this.loadComments(folderName);
    const comment = comments.find(c => c.id === commentId);

    if (!comment) {
      throw new Error('Comment not found');
    }

    comment.content = content;
    comment.timestamp = Date.now();

    await this.saveComments(folderName, comments);
  }

  /**
   * Deletes a comment
   */
  async deleteComment(folderName: string, commentId: string): Promise<void> {
    const comments = await this.loadComments(folderName);
    const filtered = comments.filter(c => c.id !== commentId);

    if (filtered.length === comments.length) {
      throw new Error('Comment not found');
    }

    await this.saveComments(folderName, filtered);
  }

  /**
   * Clears all comments for a folder
   */
  async clearComments(folderName: string): Promise<void> {
    await this.saveComments(folderName, []);
  }

  /**
   * Migrates comments from localStorage format
   */
  async migrateFromLocalStorage(
    folderName: string,
    localComments: Comment[]
  ): Promise<void> {
    const existing = await this.loadComments(folderName);

    // Merge: keep file comments, add missing local comments
    const mergedComments = [...existing];
    for (const localComment of localComments) {
      if (!existing.find(c => c.id === localComment.id)) {
        mergedComments.push(localComment);
      }
    }

    await this.saveComments(folderName, mergedComments);
  }
}
