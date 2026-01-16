import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { GitService } from './git.js';

const app = express();
const PORT = process.env.PORT || 3001;
const SOURCE_DIR = process.env.SOURCE_DIR;

if (!SOURCE_DIR) {
  console.error('ERROR: SOURCE_DIR environment variable is required');
  console.error('Usage: SOURCE_DIR=/path/to/repos npm start');
  process.exit(1);
}

// Initialize GitService
const gitService = new GitService(SOURCE_DIR);

// Middleware
app.use(cors());
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
