# Install GitHub CLI
cd ~
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh -y

# Login to GitHub (you'll be prompted for authentication)
gh auth login

# Create main repository for MCP configuration
cd ~/mcp
git init
git add .
git commit -m "Initial MCP server configuration"
gh repo create mcp-server-config --private --source=. --push

# Create repository for custom scripts
cd ~/scripts
cat > deploy-all.sh << 'EOF'
#!/bin/bash

# Deploy all MCP servers
echo "Deploying all MCP servers..."

source ~/mcp/configs/.env

for service in github brave vector filesystem docker zapier apidog; do
    echo "Deploying $service MCP server..."
    cd ~/mcp/$service
    docker compose down
    docker compose up -d --build
    sleep 5
done

echo "Deploying GraphQL gateway..."
cd ~/mcp/graphql
docker compose down
docker compose up -d --build

echo "All services deployed successfully!"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
EOF

chmod +x deploy-all.sh
git init
git add .
git commit -m "Deployment scripts"
gh repo create mcp-deployment-scripts --private --source=. --push