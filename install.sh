#!/bin/bash

# Kit Marketing Automation MCP Installation Script

echo "🚀 Installing Kit Marketing Automation MCP..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Build the project
echo "🔨 Building TypeScript..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Failed to build project"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📄 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your Kit credentials"
fi

echo ""
echo "✅ Installation completed successfully!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your Kit API credentials"
echo "2. Test connection: npm start"
echo "3. Configure with Claude Code:"
echo ""
echo "   # Add to current project:"
echo "   claude mcp add kit-mcp $(pwd)/dist/index.js"
echo ""
echo "   # Or add for all projects:"
echo "   claude mcp add -s user kit-mcp $(pwd)/dist/index.js"
echo ""
echo "   # Verify configuration:"
echo "   claude mcp list"
echo ""
echo "4. Start using Kit marketing automation tools in Claude conversations!"
echo ""
echo "For more information, see README.md"