// Load environment variables first
import './config.js';

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { GitService } from './git.js';
import { CommentService } from './comments.js';

const app = express();
const PORT = process.env.PORT || 3001;
const SOURCE_DIR = process.env.SOURCE_DIR;

if (!SOURCE_DIR) {
  console.error('ERROR: SOURCE_DIR environment variable is required');
  console.error('Usage: SOURCE_DIR=/path/to/repos npm start');
  process.exit(1);
}

// Initialize services
const gitService = new GitService(SOURCE_DIR);
const commentService = new CommentService(SOURCE_DIR);

// Ensure code-review directory exists
commentService.ensureCodeReviewDir().catch(err => {
  console.error('Warning: Failed to initialize code-review directory:', err);
});

// Build CORS allowed origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
];

// Add ngrok URLs from environment variables if provided
if (process.env.NGROK_URL) {
  allowedOrigins.push(process.env.NGROK_URL);
  // Also add HTTP version if HTTPS is provided
  if (process.env.NGROK_URL.startsWith('https://')) {
    allowedOrigins.push(process.env.NGROK_URL.replace('https://', 'http://'));
  }
}

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// API Routes

/**
 * GET /api/folders
 * Returns list of git repositories in SOURCE_DIR
 */
app.get('/api/folders', async (req: Request, res: Response) => {
  try {
    const folders = await gitService.getFolders();
    res.json({ folders });
  } catch (error) {
    console.error('Error getting folders:', error);
    res.status(500).json({ error: String(error) });
  }
});

/**
 * GET /api/status/:folderName
 * Returns git status for a folder
 */
app.get('/api/status/:folderName', async (req: Request, res: Response) => {
  try {
    const { folderName } = req.params;
    const status = await gitService.getStatus(folderName);
    res.json(status);
  } catch (error) {
    console.error('Error getting status:', error);
    res.status(500).json({ error: String(error) });
  }
});

/**
 * GET /api/diff/:folderName
 * Returns git diff for uncommitted changes
 */
app.get('/api/diff/:folderName', async (req: Request, res: Response) => {
  try {
    const { folderName } = req.params;
    const result = await gitService.getDiff(folderName);
    res.json(result);
  } catch (error) {
    console.error('Error getting diff:', error);
    res.status(500).json({ error: String(error) });
  }
});

/**
 * GET /api/file/:folderName/*
 * Returns file content
 */
app.get('/api/file/:folderName/*', async (req: Request, res: Response) => {
  try {
    const { folderName } = req.params;
    const filePath = req.params[0];

    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    const content = await gitService.getFileContent(folderName, filePath);
    res.json({ content });
  } catch (error) {
    console.error('Error getting file content:', error);
    res.status(500).json({ error: String(error) });
  }
});

// Comment Routes

/**
 * GET /api/comments/:folderName
 * Returns all comments for a repository
 */
app.get('/api/comments/:folderName', async (req: Request, res: Response) => {
  try {
    const { folderName } = req.params;
    const comments = await commentService.loadComments(folderName);
    res.json({ comments });
  } catch (error) {
    console.error('Error loading comments:', error);
    res.status(500).json({ error: String(error) });
  }
});

/**
 * POST /api/comments/:folderName
 * Adds a new comment
 */
app.post('/api/comments/:folderName', async (req: Request, res: Response) => {
  try {
    const { folderName } = req.params;
    const { comment } = req.body;

    if (!comment) {
      return res.status(400).json({ error: 'Comment data is required' });
    }

    const newComment = await commentService.addComment(folderName, comment);
    res.json({ comment: newComment });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(400).json({ error: String(error) });
  }
});

/**
 * PUT /api/comments/:folderName/:commentId
 * Updates an existing comment
 */
app.put('/api/comments/:folderName/:commentId', async (req: Request, res: Response) => {
  try {
    const { folderName, commentId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    await commentService.updateComment(folderName, commentId, content);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating comment:', error);
    const status = String(error).includes('not found') ? 404 : 400;
    res.status(status).json({ error: String(error) });
  }
});

/**
 * DELETE /api/comments/:folderName/:commentId
 * Deletes a comment
 */
app.delete('/api/comments/:folderName/:commentId', async (req: Request, res: Response) => {
  try {
    const { folderName, commentId } = req.params;
    await commentService.deleteComment(folderName, commentId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    const status = String(error).includes('not found') ? 404 : 500;
    res.status(status).json({ error: String(error) });
  }
});

/**
 * DELETE /api/comments/:folderName
 * Clears all comments for a repository
 */
app.delete('/api/comments/:folderName', async (req: Request, res: Response) => {
  try {
    const { folderName } = req.params;
    await commentService.clearComments(folderName);
    res.json({ success: true });
  } catch (error) {
    console.error('Error clearing comments:', error);
    res.status(500).json({ error: String(error) });
  }
});

/**
 * POST /api/comments/:folderName/migrate
 * Migrates comments from localStorage
 */
app.post('/api/comments/:folderName/migrate', async (req: Request, res: Response) => {
  try {
    const { folderName } = req.params;
    const { comments } = req.body;

    if (!comments || !Array.isArray(comments)) {
      return res.status(400).json({ error: 'Comments array is required' });
    }

    await commentService.migrateFromLocalStorage(folderName, comments);
    res.json({ success: true, migrated: comments.length });
  } catch (error) {
    console.error('Error migrating comments:', error);
    res.status(500).json({ error: String(error) });
  }
});

/**
 * GET /api/metadata/:folderName
 * Returns metadata about the code review system and comments
 */
app.get('/api/metadata/:folderName', async (req: Request, res: Response) => {
  try {
    const { folderName } = req.params;

    // Get comments for this folder
    const comments = await commentService.loadComments(folderName);

    // Get git status
    const status = await gitService.getStatus(folderName);
    const hasChanges = status.staged.length > 0 || status.unstaged.length > 0 || status.untracked.length > 0;

    // Get diff to count files
    let fileCount = 0;
    if (hasChanges) {
      const diff = await gitService.getDiff(folderName);
      fileCount = diff.files?.length || 0;
    }

    // Build metadata response
    const metadata = {
      system: 'git-diff-code-review',
      version: '1.0',
      repository: folderName,
      description: 'This is a code review system for viewing git diffs and adding inline comments to specific lines of code.',
      commentStorage: {
        location: `SOURCE_DIR/code-review/${folderName}/comments.json`,
        format: 'JSON',
        structure: {
          version: '1.0',
          repository: folderName,
          lastModified: 'ISO 8601 timestamp',
          comments: [
            {
              id: 'UUID',
              folderName: 'string',
              filePath: 'relative/path/to/file',
              lineNumber: 'number | null (null for file-level comments)',
              content: 'string',
              timestamp: 'number (Unix timestamp in milliseconds)'
            }
          ]
        }
      },
      statistics: {
        totalComments: comments.length,
        filesWithChanges: fileCount,
        commentsByFile: comments.reduce((acc: Record<string, number>, comment) => {
          acc[comment.filePath] = (acc[comment.filePath] || 0) + 1;
          return acc;
        }, {})
      },
      comments: comments.map(comment => ({
        id: comment.id,
        filePath: comment.filePath,
        lineNumber: comment.lineNumber,
        content: comment.content,
        timestamp: comment.timestamp,
        dateCreated: new Date(comment.timestamp).toISOString()
      })),
      apiEndpoints: {
        loadComments: `GET /api/comments/${folderName}`,
        addComment: `POST /api/comments/${folderName}`,
        updateComment: `PUT /api/comments/${folderName}/:commentId`,
        deleteComment: `DELETE /api/comments/${folderName}/:commentId`,
        clearComments: `DELETE /api/comments/${folderName}`,
        metadata: `GET /api/metadata/${folderName}`
      },
      gitStatus: {
        staged: status.staged.length,
        unstaged: status.unstaged.length,
        untracked: status.untracked.length
      }
    };

    res.json(metadata);
  } catch (error) {
    console.error('Error getting metadata:', error);
    res.status(500).json({ error: String(error) });
  }
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    sourceDir: SOURCE_DIR,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Git Diff Viewer Server`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📂 Source Directory: ${SOURCE_DIR}`);
  console.log(`🌐 Server running on: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
});
