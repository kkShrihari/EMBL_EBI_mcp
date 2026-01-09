#!/bin/bash

# ----------------------------------------
# Build and package miEAA3 MCP server
# ----------------------------------------

set -e  # Exit immediately if any command fails

echo "🔹 Starting miEAA3 MCP build & packaging process..."

# ----------------------------------------
# Step 1: Clean old artifacts
# ----------------------------------------

echo "🧹 Removing old build artifacts..."
rm -rf mieaa3_mcp.dxt
rm -rf dist

# ----------------------------------------
# Step 2: Build TypeScript → JavaScript
# ----------------------------------------

echo "⚙️ Running TypeScript build..."
npm run build
npx esbuild src/server.ts \
  --bundle \
  --platform=node \
  --format=esm \
  --target=node18 \
  --outfile=dist/server.js \
  --log-level=debug

# ----------------------------------------
# Step 3: Package into .dxt for Claude MCP
# ----------------------------------------

echo "📦 Creating miEAA3_mcp.dxt package..."

zip -r miEAA3_mcp.dxt \
  manifest.json \
  package.json \
  package-lock.json \
  tsconfig.json \
  dist \
  -x "*.ts" "*.map" "*.log"

# ----------------------------------------
# Step 4: Copy package to Windows Downloads
# ----------------------------------------

DEST="/mnt/c/Users/ASUS/Downloads/mcp"

echo "📁 Copying package to $DEST ..."
mkdir -p "$DEST"
cp miEAA3_mcp.dxt "$DEST/"

echo "✅ Build and packaging complete!"
echo "📦 Package location: $DEST/miEAA3_mcp.dxt"
