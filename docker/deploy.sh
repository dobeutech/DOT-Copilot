
#!/bin/bash

# ============================================
# Docker Deployment Script
# Full Stack Architecture Deployment
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Functions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    print_success "Docker is installed"
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    print_success "Docker Compose is available"
    
    # Check .env file
    if [ ! -f .env ]; then
        print_warning ".env file not found"
        if [ -f .env.example ]; then
            print_info "Copying .env.example to .env"
            cp .env.example .env
            print_warning "Please edit .env file with your configuration"
            exit 1
        else
            print_error ".env.example not found"
            exit 1
        fi
    fi
    print_success ".env file exists"
    
    # Validate .env has been edited
    if grep -q "CHANGE_ME" .env; then
        print_warning ".env file contains placeholder values"
        print_info "Please update all CHANGE_ME values in .env file"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Create necessary directories
create_directories() {
    print_header "Creating Directories"
    
    mkdir -p nginx/logs
    mkdir -p nginx/ssl
    mkdir -p database/init
    mkdir -p database/mongodb-init
    mkdir -p monitoring
    
    print_success "Directories created"
}

# Generate SSL certificates (self-signed for development)
generate_ssl_certs() {
    print_header "Generating SSL Certificates"
    
    if [ ! -f nginx/ssl/cert.pem ] || [ ! -f nginx/ssl/key.pem ]; then
        print_info "Generating self-signed SSL certificate..."
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout nginx/ssl/key.pem \
            -out nginx/ssl/cert.pem \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
        print_success "SSL certificates generated"
    else
        print_info "SSL certificates already exist"
    fi
}

# Pull Docker images
pull_images() {
    print_header "Pulling Docker Images"
    
    docker compose pull
    print_success "Images pulled"
}

# Build custom images
build_images() {
    print_header "Building Custom Images"
    
    docker compose build --no-cache
    print_success "Images built"
}

# Start services
start_services() {
    print_header "Starting Services"
    
    docker compose up -d
    print_success "Services started"
}

# Wait for services to be healthy
wait_for_services() {
    print_header "Waiting for Services to be Healthy"
    
    max_attempts=30
    attempt=0
    
    services=("api_server" "mcp_gateway" "database" "redis" "nginx")
    
    for service in "${services[@]}"; do
        attempt=0
        print_info "Waiting for $service..."
        
        while [ $attempt -lt $max_attempts ]; do
            if docker compose ps | grep "$service" | grep -q "Up"; then
                # Check health
                if docker inspect "${service}" 2>/dev/null | grep -q '"Health":' ; then
                    health=$(docker inspect "${service}" --format='{{.State.Health.Status}}' 2>/dev/null || echo "none")
                    if [ "$health" = "healthy" ] || [ "$health" = "none" ]; then
                        print_success "$service is ready"
                        break
                    fi
                else
                    print_success "$service is running"
                    break
                fi
            fi
            
            attempt=$((attempt + 1))
            sleep 2
        done
        
        if [ $attempt -eq $max_attempts ]; then
            print_error "$service failed to start"
            docker compose logs "$service"
        fi
    done
}

# Display service status
show_status() {
    print_header "Service Status"
    
    docker compose ps
    
    echo ""
    print_info "Service URLs:"
    echo "  - API Server: http://localhost/api"
    echo "  - API Docs: http://localhost/api/docs"
    echo "  - MCP Gateway: http://localhost/mcp"
    echo "  - Grafana: http://localhost:3000"
    echo "  - Prometheus: http://localhost:9090"
    echo ""
    
    print_info "View logs: docker compose logs -f [service_name]"
    print_info "Stop services: docker compose down"
    print_info "Restart services: docker compose restart [service_name]"
}

# Main deployment flow
main() {
    print_header "Docker Full Stack Deployment"
    
    check_prerequisites
    create_directories
    generate_ssl_certs
    pull_images
    build_images
    start_services
    wait_for_services
    show_status
    
    print_header "Deployment Complete!"
    print_success "All services are running"
}

# Run main function
main


