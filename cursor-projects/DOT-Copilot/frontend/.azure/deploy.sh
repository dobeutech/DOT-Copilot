#!/bin/bash
# Azure deployment script for frontend
# This script is used by Azure App Service for deployment

echo "Building frontend application..."

# Install dependencies
npm ci

# Build application
npm run build

echo "Build completed. Files in ./dist are ready for deployment."

