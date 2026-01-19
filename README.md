# Git Diff Viewer

A simple browser-based tool to view and comment on uncommitted git changes. Built for quickly reviewing diffs across multiple repositories with a GitHub PR-like interface.

## Quick Start

**1. Install dependencies:**

```bash
cd git-diff-viewer
npm i
```

**2. Configure environment variables:**

Copy the example environment files and customize them:

```bash
# Server configuration
cp server/.env.example server/.env.local
# Edit server/.env.local and set SOURCE_DIR to your repos directory

# Client configuration
cp client/.env.example client/.env.local
# Edit client/.env.local if you need to customize ports or use ngrok
```

**Minimum required:** Set `SOURCE_DIR` in `server/.env.local` to the directory containing your git repositories.

**Note:** Environment variables are automatically loaded from `.env.local` files when the servers start.

**3. Start the servers in two separate terminals:**

**Terminal 1 - Start Server:**

```bash
cd server
npm run dev
```

**Terminal 2 - Start Client:**

```bash
cd client
npm run dev
```

**4. Open your browser:**

Navigate to `http://localhost:3000`

That's it! Select a repository from the sidebar to see your uncommitted changes.

## What You Get

- **GitHub-style diff view** - Familiar PR interface with syntax highlighting
- **Inline comments** - Click the blue `+` button on any line to add comments
- **Unified & split views** - Toggle between viewing modes
- **Persistent comments** - Saved to JSON files in `code-review/` directory
- **Multiple repositories** - Browse and review changes across all your repos
- **LLM-friendly** - Comments stored in structured JSON format for AI assistant integration

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
- **Backend (port 3001)**: Executes git commands, serves diffs, and manages comment storage
- **Frontend (port 3000)**: React app for viewing and commenting

Comments are stored in JSON files at `SOURCE_DIR/code-review/{repository-name}/comments.json`, making them:
- Persistent across browsers and devices
- Easy to back up or version control
- Readable by LLMs and other tools

## Configuration

### Server Environment Variables

Create `server/.env.local` with the following:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SOURCE_DIR` | **Yes** | - | Path to directory containing git repositories |
| `PORT` | No | `3001` | Server port |
| `NGROK_URL` | No | - | Ngrok URL for CORS (e.g., `https://abc123.ngrok-free.app`) |

**Example `server/.env.local`:**
```bash
SOURCE_DIR=/Users/username/code
PORT=3001
NGROK_URL=https://6c214c00a1a2.ngrok-free.app
```

### Client Environment Variables

Create `client/.env.local` with the following:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_PORT` | No | `3000` | Client dev server port |
| `VITE_API_URL` | No | `http://localhost:3001` | Backend API URL for direct calls |
| `VITE_API_TARGET` | No | `http://localhost:3001` | Backend API URL for proxy |
| `VITE_NGROK_HOST` | No | - | Ngrok host (without protocol) for allowedHosts |

**Example `client/.env.local`:**
```bash
VITE_PORT=3000
VITE_API_URL=http://localhost:3001
VITE_API_TARGET=http://localhost:3001
VITE_NGROK_HOST=6c214c00a1a2.ngrok-free.app
```

### Using with Ngrok

To expose your local server via ngrok:

1. Start ngrok: `ngrok http 3000`
2. Copy the ngrok URL (e.g., `https://6c214c00a1a2.ngrok-free.app`)
3. Update both `.env.local` files:
   - `server/.env.local`: Set `NGROK_URL=https://6c214c00a1a2.ngrok-free.app`
   - `client/.env.local`: Set `VITE_NGROK_HOST=6c214c00a1a2.ngrok-free.app` (no protocol)
4. Restart both servers

### Comment Storage

Comments are stored as JSON files in your `SOURCE_DIR`:

```
SOURCE_DIR/
├── your-repo-1/
├── your-repo-2/
└── code-review/
    ├── .gitignore          # Excludes comments from git
    ├── your-repo-1/
    │   └── comments.json
    └── your-repo-2/
        └── comments.json
```

The `.gitignore` file is automatically created to prevent comments from being committed to your repositories.

## Troubleshooting

**"SOURCE_DIR environment variable is required"**
- Make sure you created `server/.env.local` and set `SOURCE_DIR`
- Use an absolute path, e.g., `SOURCE_DIR=/Users/username/code`
- Alternatively, set it inline: `SOURCE_DIR=/path npm run dev`

**"No git repositories found"**
- Verify the `SOURCE_DIR` directory contains git repositories with `.git` folders
- Check the path is correct and readable

**Port already in use**
- Change the port in `.env.local`:
  - Server: Set `PORT=4001` in `server/.env.local`
  - Client: Set `VITE_PORT=4000` in `client/.env.local`

**Comments not persisting**
- Check that the server has write permissions to `SOURCE_DIR`
- Look for `SOURCE_DIR/code-review/` directory creation
- Check browser console and server logs for errors

**Ngrok not working**
- Ensure both `server/.env.local` and `client/.env.local` are configured
- Server needs: `NGROK_URL=https://your-url.ngrok-free.app`
- Client needs: `VITE_NGROK_HOST=your-url.ngrok-free.app` (no https://)
- Restart both servers after changing environment variables

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, simple-git
- **Frontend**: React, TypeScript, Vite, highlight.js
- **Storage**: JSON files (with automatic localStorage migration)

## License

MIT
