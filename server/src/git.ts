import simpleGit, { SimpleGit, DiffResult } from 'simple-git';
import { promises as fs } from 'fs';
import path from 'path';
import { DiffFile, DiffChunk, DiffLine, GitStatus, FolderInfo } from './types.js';

export class GitService {
  private sourceDir: string;

  constructor(sourceDir: string) {
    this.sourceDir = sourceDir;
  }

  /**
   * Get list of folders in the source directory that are git repositories
   */
  async getFolders(): Promise<FolderInfo[]> {
    try {
      const entries = await fs.readdir(this.sourceDir, { withFileTypes: true });
      const folders: FolderInfo[] = [];

      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          const folderPath = path.join(this.sourceDir, entry.name);
          const isGitRepo = await this.isGitRepository(folderPath);

          if (isGitRepo) {
            const hasChanges = await this.hasUncommittedChanges(folderPath);
            const branch = await this.getCurrentBranch(folderPath);
            folders.push({
              name: entry.name,
              path: folderPath,
              hasChanges,
              branch
            });
          }
        }
      }

      return folders.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      throw new Error(`Failed to read folders: ${error}`);
    }
  }

  /**
   * Check if a directory is a git repository
   */
  private async isGitRepository(folderPath: string): Promise<boolean> {
    try {
      const git = simpleGit(folderPath);
      await git.status();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if a repository has uncommitted changes
   */
  private async hasUncommittedChanges(folderPath: string): Promise<boolean> {
    try {
      const git = simpleGit(folderPath);
      const status = await git.status();
      return !status.isClean();
    } catch {
      return false;
    }
  }

  /**
   * Get the current branch name
   */
  private async getCurrentBranch(folderPath: string): Promise<string> {
    try {
      const git = simpleGit(folderPath);
      const branch = await git.revparse(['--abbrev-ref', 'HEAD']);
      return branch.trim();
    } catch {
      return 'unknown';
    }
  }

  /**
   * Get git status for a folder
   */
  async getStatus(folderName: string): Promise<GitStatus> {
    const folderPath = path.join(this.sourceDir, folderName);
    await this.validateGitRepo(folderPath);

    const git = simpleGit(folderPath);
    const status = await git.status();

    return {
      staged: status.staged,
      unstaged: status.modified.concat(status.deleted),
      untracked: status.not_added
    };
  }

  /**
   * Get diff for uncommitted changes
   */
  async getDiff(folderName: string): Promise<{ diff: string; files: DiffFile[] }> {
    const folderPath = path.join(this.sourceDir, folderName);
    await this.validateGitRepo(folderPath);

    const git = simpleGit(folderPath);

    // Get both staged and unstaged changes
    const stagedDiff = await git.diff(['--cached', '--unified=3']);
    const unstagedDiff = await git.diff(['HEAD', '--unified=3']);

    // Get untracked files
    const status = await git.status();
    const untrackedDiff = await this.generateUntrackedFilesDiff(folderPath, status.not_added);

    // Combine all diffs
    const fullDiff = stagedDiff + '\n' + unstagedDiff + '\n' + untrackedDiff;

    if (!fullDiff.trim()) {
      return { diff: '', files: [] };
    }

    const files = this.parseDiff(fullDiff);

    return {
      diff: fullDiff,
      files
    };
  }

  /**
   * Get file content
   */
  async getFileContent(folderName: string, filePath: string): Promise<string> {
    const folderPath = path.join(this.sourceDir, folderName);
    await this.validateGitRepo(folderPath);

    const fullPath = path.join(folderPath, filePath);

    // Security check: ensure the file is within the repo
    if (!fullPath.startsWith(folderPath)) {
      throw new Error('Invalid file path');
    }

    try {
      return await fs.readFile(fullPath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read file: ${error}`);
    }
  }

  /**
   * Generate diff output for untracked files
   */
  private async generateUntrackedFilesDiff(folderPath: string, untrackedFiles: string[]): Promise<string> {
    if (untrackedFiles.length === 0) {
      return '';
    }

    const diffs: string[] = [];

    for (const filePath of untrackedFiles) {
      const fullPath = path.join(folderPath, filePath);

      // Security check
      if (!fullPath.startsWith(folderPath)) {
        continue;
      }

      try {
        const content = await fs.readFile(fullPath, 'utf-8');
        const lines = content.split('\n');

        // Generate git diff format for new file
        let diff = `diff --git a/${filePath} b/${filePath}\n`;
        diff += `new file mode 100644\n`;
        diff += `index 0000000..0000000\n`;
        diff += `--- /dev/null\n`;
        diff += `+++ b/${filePath}\n`;
        diff += `@@ -0,0 +1,${lines.length} @@\n`;

        // Add all lines as additions
        for (const line of lines) {
          diff += `+${line}\n`;
        }

        diffs.push(diff);
      } catch (error) {
        // Skip files that can't be read (binary files, permission issues, etc.)
        console.warn(`Skipping untracked file ${filePath}: ${error}`);
      }
    }

    return diffs.join('\n');
  }

  /**
   * Validate that a path is a git repository
   */
  private async validateGitRepo(folderPath: string): Promise<void> {
    if (!folderPath.startsWith(this.sourceDir)) {
      throw new Error('Invalid folder path');
    }

    const isGit = await this.isGitRepository(folderPath);
    if (!isGit) {
      throw new Error('Not a git repository');
    }
  }

  /**
   * Parse git diff output into structured format
   */
  private parseDiff(diffText: string): DiffFile[] {
    const files: DiffFile[] = [];
    const fileBlocks = diffText.split(/^diff --git /m).filter(Boolean);

    for (const block of fileBlocks) {
      const file = this.parseFileBlock(block);
      if (file) {
        files.push(file);
      }
    }

    return files;
  }

  /**
   * Parse a single file block from git diff
   */
  private parseFileBlock(block: string): DiffFile | null {
    const lines = block.split('\n');

    // Parse file paths from first line: a/path/to/file b/path/to/file
    const pathMatch = lines[0].match(/^a\/(.+) b\/(.+)$/);
    if (!pathMatch) return null;

    const oldPath = pathMatch[1];
    const newPath = pathMatch[2];

    // Find the start of actual diff content (after headers)
    let diffStartIndex = lines.findIndex(line => line.startsWith('@@'));
    if (diffStartIndex === -1) return null;

    const chunks: DiffChunk[] = [];
    let currentChunk: DiffChunk | null = null;
    let oldLineNum = 0;
    let newLineNum = 0;
    let additions = 0;
    let deletions = 0;

    for (let i = diffStartIndex; i < lines.length; i++) {
      const line = lines[i];

      // New chunk header
      if (line.startsWith('@@')) {
        if (currentChunk) {
          chunks.push(currentChunk);
        }

        const chunkMatch = line.match(/^@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@(.*)$/);
        if (chunkMatch) {
          oldLineNum = parseInt(chunkMatch[1]);
          const oldCount = chunkMatch[2] ? parseInt(chunkMatch[2]) : 1;
          newLineNum = parseInt(chunkMatch[3]);
          const newCount = chunkMatch[4] ? parseInt(chunkMatch[4]) : 1;

          currentChunk = {
            oldStart: oldLineNum,
            oldLines: oldCount,
            newStart: newLineNum,
            newLines: newCount,
            header: line,
            lines: []
          };
        }
        continue;
      }

      if (!currentChunk) continue;

      // Parse diff line
      const diffLine: DiffLine = {
        type: 'context',
        content: line.substring(1), // Remove the first character (+, -, or space)
        oldLineNumber: null,
        newLineNumber: null
      };

      if (line.startsWith('+')) {
        diffLine.type = 'addition';
        diffLine.newLineNumber = newLineNum++;
        additions++;
      } else if (line.startsWith('-')) {
        diffLine.type = 'deletion';
        diffLine.oldLineNumber = oldLineNum++;
        deletions++;
      } else if (line.startsWith(' ')) {
        diffLine.type = 'context';
        diffLine.oldLineNumber = oldLineNum++;
        diffLine.newLineNumber = newLineNum++;
      } else {
        // Handle lines without prefix (shouldn't happen in well-formed diffs)
        continue;
      }

      currentChunk.lines.push(diffLine);
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return {
      path: newPath,
      oldPath: oldPath !== newPath ? oldPath : undefined,
      additions,
      deletions,
      chunks
    };
  }
}
