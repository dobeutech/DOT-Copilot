#!/bin/bash

# Create MCP network first
docker network create mcp_network 2>/dev/null || echo "Network mcp_network already exists"

# Create the directory structure
mkdir -p ~/mcp/github/data

# Create docker-compose.yml using GitHub's OFFICIAL MCP server
cat > ~/mcp/github/docker-compose.yml << 'EOF'
version: '3.8'

services:
  github-mcp:
    image: ghcr.io/github/github-mcp-server:latest
    container_name: github_mcp_server
    restart: unless-stopped
    environment:
      - GITHUB_PERSONAL_ACCESS_TOKEN=${GITHUB_TOKEN}
      # Optional: Enable specific toolsets
      # - GITHUB_TOOLSETS=repos,issues,pull_requests,code_security
      # Optional: Enable read-only mode
      # - GITHUB_READ_ONLY=1
    ports:
      - "8001:8000"
    networks:
      - mcp_network
    volumes:
      - ./data:/app/data
    stdin_open: true
    tty: true

networks:
  mcp_network:
    external: true
EOF

# Create alternative NPM-based setup for TypeScript version
cat > ~/mcp/github/mcp-config.json << 'EOF'
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
EOF

# Create alternative Docker run script
cat > ~/mcp/github/run_docker.sh << 'EOF'
#!/bin/bash

# Load environment variables
if [ -f ~/mcp/configs/.env ]; then
    source ~/mcp/configs/.env
    echo "Environment loaded"
else
    echo "Error: .env file not found at ~/mcp/configs/.env"
    echo "Please run ~/mcp/configs/env_setup.sh first"
    exit 1
fi

# Check if GITHUB_TOKEN is set
if [ -z "$GITHUB_TOKEN" ]; then
    echo "Error: GITHUB_TOKEN not set. Please check your .env file"
    exit 1
fi

echo "Starting GitHub MCP server using official Docker image..."

# Run the official GitHub MCP server
docker run -i --rm \
  -e GITHUB_PERSONAL_ACCESS_TOKEN="$GITHUB_TOKEN" \
  -p 8001:8000 \
  --network mcp_network \
  --name github_mcp_server \
  ghcr.io/github/github-mcp-server:latest

echo "GitHub MCP server started on port 8001"
EOF

chmod +x ~/mcp/github/run_docker.sh

# Create NPM-based setup script (alternative method)
cat > ~/mcp/github/setup_npm.sh << 'EOF'
#!/bin/bash

echo "Setting up GitHub MCP server using NPM (TypeScript version)..."

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "NPM is not installed. Installing Node.js and NPM..."
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Check Node.js version
NODE_VERSION=$(node --version 2>/dev/null | sed 's/v//')
echo "Node.js version: $NODE_VERSION"

# Test the GitHub MCP server
echo "Testing GitHub MCP server installation..."
npx -y @modelcontextprotocol/server-github --help

echo "✅ GitHub MCP server (NPM version) is ready!"
echo "You can use it in MCP-compatible clients with:"
echo "Command: npx"
echo "Args: [\"-y\", \"@modelcontextprotocol/server-github\"]"
EOF

chmod +x ~/mcp/github/setup_npm.sh

# Enhanced deployment script
cat > ~/mcp/github/deploy.sh << 'EOF'
#!/bin/bash

set -e

echo "🚀 Deploying GitHub MCP Server..."

# Source environment variables
if [ -f ~/mcp/configs/.env ]; then
    source ~/mcp/configs/.env
    echo "✅ Environment loaded"
else
    echo "❌ Warning: .env file not found at ~/mcp/configs/.env"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Please run ~/mcp/configs/env_setup.sh first"
        exit 1
    fi
fi

# Check if GITHUB_TOKEN is set
if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ Error: GITHUB_TOKEN not set"
    echo "Please run ~/mcp/configs/env_setup.sh to set up your GitHub token"
    exit 1
fi

cd ~/mcp/github

echo "Choose deployment method:"
echo "1) Docker Compose (recommended - uses official image)"
echo "2) Direct Docker run"
echo "3) NPM/TypeScript version"
echo "4) Test connection only"

read -p "Enter choice (1-4): " choice

case $choice in
    1)
        echo "🐳 Starting with Docker Compose..."
        docker compose pull
        docker compose up -d
        
        # Wait for service
        echo "⏳ Waiting for service to start..."
        sleep 5
        
        if docker compose ps | grep -q "Up"; then
            echo "✅ GitHub MCP server deployed successfully!"
            echo "📍 Service available at: http://localhost:8001"
            echo "📋 View logs: docker compose logs -f"
        else
            echo "❌ Failed to start. Checking logs..."
            docker compose logs
        fi
        ;;
    2)
        echo "🐳 Starting with direct Docker run..."
        ./run_docker.sh
        ;;
    3)
        echo "📦 Setting up NPM version..."
        ./setup_npm.sh
        ;;
    4)
        echo "🔍 Testing GitHub token and Docker connectivity..."
        
        # Test GitHub token
        echo "Testing GitHub token..."
        if curl -s -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user | grep -q "login"; then
            echo "✅ GitHub token is valid"
        else
            echo "❌ GitHub token test failed"
        fi
        
        # Test Docker
        echo "Testing Docker..."
        if docker run --rm hello-world > /dev/null 2>&1; then
            echo "✅ Docker is working"
        else
            echo "❌ Docker test failed"
        fi
        
        # Test official image
        echo "Testing GitHub MCP server image..."
        if docker pull ghcr.io/github/github-mcp-server:latest > /dev/null 2>&1; then
            echo "✅ GitHub MCP server image is accessible"
        else
            echo "❌ Cannot pull GitHub MCP server image"
        fi
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac
EOF

chmod +x ~/mcp/github/deploy.sh

# Create a configuration helper
cat > ~/mcp/github/mcp_client_configs.md << 'EOF'
# GitHub MCP Server Client Configurations

## For Claude Desktop
Add to ~/.config/claude_desktop/claude_desktop_config.json:

```json
{
  "mcpServers": {
    "github": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "GITHUB_PERSONAL_ACCESS_TOKEN",
        "ghcr.io/github/github-mcp-server"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your_github_token_here"
      }
    }
  }
}
```

## For VS Code (Copilot)
The official GitHub MCP server is natively supported in VS Code.

## For Cursor
Add to ~/.cursor/mcp.json:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your_github_token_here"
      }
    }
  }
}
```

## Available Tools
- Repository management (list, create, search)
- Issues (create, list, comment, update)
- Pull requests (create, list, review, merge)
- File operations (read, write, search)
- User information (get_me)
- Code security scanning

## Optional Environment Variables
- GITHUB_TOOLSETS: Comma-separated list (repos,issues,pull_requests,code_security)
- GITHUB_READ_ONLY: Set to 1 for read-only mode
- GITHUB_HOST: For GitHub Enterprise (https://your-github-enterprise.com)
EOF

# Quick setup execution
echo "🚀 Starting GitHub MCP setup..."

# Load environment if available
if [ -f ~/mcp/configs/.env ]; then
    source ~/mcp/configs/.env
    echo "✅ Environment loaded"
fi

cd ~/mcp/github

# Run deployment
echo "Executing deployment script..."
./deploy.sh