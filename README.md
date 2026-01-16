# Git Diff Viewer

A simple browser-based tool to view and comment on uncommitted git changes. Built for quickly reviewing diffs across multiple repositories with a GitHub PR-like interface.

## Quick Start

**1. Install dependencies:**

```bash
cd git-diff-viewer
npm i
```

**2. Start the servers in two separate terminals:**

**Terminal 1 - Start Server:**

```bash
cd server
SOURCE_DIR=/path/to/your/repos npm run dev
```

For example:
```bash
cd server
SOURCE_DIR=/Users/vkaul/code npm run dev
```

**Terminal 2 - Start Client:**

```bash
cd client
npm run dev
```

**3. Open your browser:**

Navigate to `http://localhost:3000`

That's it! Select a repository from the sidebar to see your uncommitted changes.

## What You Get

- **GitHub-style diff view** - Familiar PR interface with syntax highlighting
- **Inline comments** - Click the blue `+` button on any line to add comments
- **Unified & split views** - Toggle between viewing modes
- **Persistent comments** - Saved in browser localStorage until you commit
- **Multiple repositories** - Browse and review changes across all your repos

## Key Features

### Adding Comments
1. Hover over any line in the diff
2. Click the blue `+` button that appears on the left
3. Type your comment and click Save
4. Comments persist until you clear them or commit your changes

### Editing Comments
- Click "Edit" on any comment to modify it
- Click "✕" to delete a comment
- Click "Clear Comments" in the header to remove all comments for the current repo

### View Modes
- **Unified view**: Traditional side-by-side (+/- in one column)
- **Split view**: Old code on left, new code on right
- Toggle between views using the buttons in the header

### Collapsing Files
- Click any file header to collapse/expand that file's diff
- All files expand by default on page reload

## Requirements

- Node.js >= 18.0.0
- Git repositories with uncommitted changes

## How It Works

The tool runs two servers:
- **Backend (port 3001)**: Executes git commands and serves diffs
- **Frontend (port 3000)**: React app for viewing and commenting

Comments are stored in your browser's localStorage, so they're private to your machine and browser.

## Troubleshooting

**"SOURCE_DIR environment variable is required"**
- Make sure you're setting `SOURCE_DIR` when running the command
- Use an absolute path: `SOURCE_DIR=/full/path/to/repos npm run dev`

**"No git repositories found"**
- Verify the directory contains git repositories with `.git` folders
- Check the path is correct and readable

**Port already in use**
- Stop other processes on ports 3000/3001, or change the port:
  ```bash
  PORT=4001 SOURCE_DIR=/path npm run dev:server
  ```

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, simple-git
- **Frontend**: React, TypeScript, Vite, highlight.js
- **Storage**: Browser localStorage

## License

MIT
