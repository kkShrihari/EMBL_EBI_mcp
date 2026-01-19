#!/bin/bash
set -e

echo "🔹 Starting EMBL-EBI MCP build & packaging process..."

# ----------------------------------------
# Step 1: Clean old artifacts
# ----------------------------------------

echo "🧹 Removing old build artifacts..."
rm -rf embl_ebi_mcp.dxt
rm -rf dist

# ----------------------------------------
# Step 2: Build with esbuild ONLY
# ----------------------------------------

echo "⚙️ Bundling MCP server with esbuild..."

npx esbuild src/server.ts \
  --bundle \
  --platform=node \
  --format=esm \
  --target=node18 \
  --outfile=dist/server.js \
  --log-level=info

# ----------------------------------------
# Step 3: Package into .dxt
# ----------------------------------------

echo "📦 Creating embl_ebi_mcp.dxt package..."

zip -r embl_ebi_mcp.dxt \
  manifest.json \
  package.json \
  package-lock.json \
  dist \
  -x "*.ts" "*.map" "*.log"

# ----------------------------------------
# Step 4: Copy package
# ----------------------------------------

DEST="/mnt/c/Users/ASUS/Downloads/mcp"

echo "📁 Copying package to $DEST ..."
mkdir -p "$DEST"
cp embl_ebi_mcp.dxt "$DEST/"

echo "✅ Build and packaging complete!"
echo "📦 Package location: $DEST/embl_ebi_mcp.dxt"
