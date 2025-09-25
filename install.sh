#!/bin/bash

version="0.0.15"

# Check if extension is already installed
if code --list-extensions | grep -q "liquid-java" 2>/dev/null; then
    echo "✅ LiquidJava extension already installed!"
    exit 0
fi

# Setup script for LiquidJava development environment
echo "🚀 Starting LiquidJava development environment setup..."

# Install Git LFS if not already installed
if ! command -v git-lfs &> /dev/null; then
    echo "📦 Installing Git LFS..."
    sudo apt-get update && sudo apt-get install -y git-lfs
    git lfs install
else
    echo "✅ Git LFS already installed"
fi

# Pull LFS files
echo "🔄 Pulling Git LFS files..."
git lfs pull

# Check if the VSIX file exists and is valid
if [ -f "./client/extension/liquid-java-$version.vsix" ]; then
    echo "🔍 VSIX file found, checking integrity..."
    file_size=$(stat -c%s "./client/extension/liquid-java-$version.vsix")
    if [ "$file_size" -lt 1000 ]; then
        echo "❌ VSIX file appears to be an LFS pointer file (too small)"
    else
        echo "✅ VSIX file appears to be valid ($file_size bytes)"
    fi
else
    echo "❌ VSIX file not found at ./extension/liquid-java-$version.vsix"
fi

# Install extension
echo "🔧 Installing LiquidJava VSCode extension..."
code --install-extension ./client/extension/liquid-java-$version.vsix
if [ $? -eq 0 ]; then
    echo "✅ Extension installed successfully"
else
    echo "❌ Failed to install the extension"
fi

echo "🎉 Installation complete!"