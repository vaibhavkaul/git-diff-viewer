#!/bin/bash

# Git Diff Viewer Server Startup Script
# Usage: ./start.sh [source_directory]
# Example: ./start.sh /Users/vkaul/code/my-repos

if [ -z "$1" ]; then
  echo "Error: Source directory is required"
  echo "Usage: ./start.sh <source_directory>"
  echo "Example: ./start.sh /Users/vkaul/code/my-repos"
  exit 1
fi

SOURCE_DIR="$1"

if [ ! -d "$SOURCE_DIR" ]; then
  echo "Error: Directory '$SOURCE_DIR' does not exist"
  exit 1
fi

echo "Starting Git Diff Viewer Server..."
echo "Source Directory: $SOURCE_DIR"

export SOURCE_DIR="$SOURCE_DIR"
npm run dev
