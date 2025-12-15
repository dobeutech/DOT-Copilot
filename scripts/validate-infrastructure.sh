#!/bin/bash
# =============================================================================
# Infrastructure Validation Script
# =============================================================================
# Validates infrastructure configuration and deployment
# Usage: ./validate-infrastructure.sh [environment]
# =============================================================================

set -e

# Configuration
ENVIRONMENT="${1:-development}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
    ((PASSED_CHECKS++))
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
    ((WARNING_CHECKS++))
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
    ((FAILED_CHECKS++))
}

check() {
    ((TOTAL_CHECKS++))
    local description="$1"
    local command="$2"
    
    if eval "$command" > /dev/null 2>&1; then
        log_success "$description"
        return 0
    else
        log_error "$description"
        return 1
    fi
}

check_warning() {
    ((TOTAL_CHECKS++))
    local description="$1"
    local command="$2"
    
    if eval "$command" > /dev/null 2>&1; then
        log_success "$description"
        return 0
    else
        log_warning "$description"
        return 1
    fi
}

# Header
echo ""
echo "========================================="
echo "Infrastructure Validation"
echo "Environment: $ENVIRONMENT"
echo "========================================="
echo ""

# =============================================================================
# 1. File Structure Validation
# =============================================================================
log_info "Checking file structure..."

check "docker-compose.yml exists" "test -f $PROJECT_ROOT/docker/docker-compose.yml"
check ".env.example exists" "test -f $PROJECT_ROOT/docker/.env.example"
check "Backend Dockerfile exists" "test -f $PROJECT_ROOT/cursor-projects/DOT-Copilot/backend/Dockerfile"
check "Frontend Dockerfile exists" "test -f $PROJECT_ROOT/cursor-projects/DOT-Copilot/frontend/Dockerfile"
check ".dockerignore files exist" "test -f $PROJECT_ROOT/cursor-projects/DOT-Copilot/backend/.dockerignore"

echo ""

# =============================================================================
# 2. Docker Configuration Validation
# =============================================================================
log_info "Validating Docker configuration..."

if command -v docker &> /dev/null; then
    check "Docker is installed" "docker --version"
    check "Docker daemon is running" "docker info"
    
    if command -v docker-compose &> /dev/null; then
        check "docker-compose is installed" "docker-compose --version"
        
        # Validate docker-compose.yml syntax
        cd "$PROJECT_ROOT/docker"
        if check_warning "docker-compose.yml syntax is valid" "docker-compose config"; then
            :
        else
            log_warning "Run: cd docker && docker-compose config"
        fi
        cd "$PROJECT_ROOT"
    else
        log_error "docker-compose is not installed"
    fi
else
    log_error "Docker is not installed"
fi

echo ""

# =============================================================================
# 3. Environment Variables Validation
# =============================================================================
log_info "Checking environment variables..."

if [ -f "$PROJECT_ROOT/docker/.env" ]; then
    log_success ".env file exists"
    
    # Check required variables
    source "$PROJECT_ROOT/docker/.env" 2>/dev/null || true
    
    check_warning "POSTGRES_PASSWORD is set" "test -n '$POSTGRES_PASSWORD'"
    check_warning "REDIS_PASSWORD is set" "test -n '$REDIS_PASSWORD'"
    check_warning "MONGO_ROOT_PASSWORD is set" "test -n '$MONGO_ROOT_PASSWORD'"
    check_warning "JWT_SECRET is set" "test -n '$JWT_SECRET'"
else
    log_warning ".env file not found (using .env.example as reference)"
fi

echo ""

# =============================================================================
# 4. Security Validation
# =============================================================================
log_info "Checking security configuration..."

# Check for hardcoded secrets in docker-compose
if grep -r "password.*:" "$PROJECT_ROOT/docker/docker-compose.yml" | grep -v "PASSWORD" | grep -v "#" > /dev/null; then
    log_error "Potential hardcoded passwords found in docker-compose.yml"
else
    log_success "No hardcoded passwords in docker-compose.yml"
fi

# Check .gitignore
if grep -q "^\.env$" "$PROJECT_ROOT/.gitignore"; then
    log_success ".env is in .gitignore"
else
    log_error ".env is NOT in .gitignore"
fi

# Check for exposed ports
if grep -q "0.0.0.0:" "$PROJECT_ROOT/docker/docker-compose.yml"; then
    log_warning "Some services expose ports to 0.0.0.0 (consider localhost binding)"
else
    log_success "No services exposed to 0.0.0.0"
fi

echo ""

# =============================================================================
# 5. Docker Image Validation
# =============================================================================
log_info "Checking Docker images..."

if command -v docker &> /dev/null; then
    # Check if images are built
    if docker images | grep -q "dot-copilot"; then
        log_success "DOT-Copilot images found"
        
        # Check image sizes
        BACKEND_SIZE=$(docker images --format "{{.Size}}" dot-copilot-backend 2>/dev/null | head -1)
        if [ -n "$BACKEND_SIZE" ]; then
            log_info "Backend image size: $BACKEND_SIZE"
        fi
    else
        log_warning "No DOT-Copilot images found (run: docker-compose build)"
    fi
fi

echo ""

# =============================================================================
# 6. Network Configuration Validation
# =============================================================================
log_info "Checking network configuration..."

if command -v docker &> /dev/null && docker info &> /dev/null; then
    # Check if networks are defined
    if docker network ls | grep -q "dot-copilot"; then
        log_success "DOT-Copilot networks exist"
    else
        log_warning "DOT-Copilot networks not found (run: docker-compose up)"
    fi
fi

echo ""

# =============================================================================
# 7. Volume Configuration Validation
# =============================================================================
log_info "Checking volume configuration..."

if command -v docker &> /dev/null && docker info &> /dev/null; then
    # Check if volumes are defined
    if docker volume ls | grep -q "dot-copilot"; then
        log_success "DOT-Copilot volumes exist"
    else
        log_warning "DOT-Copilot volumes not found (run: docker-compose up)"
    fi
fi

echo ""

# =============================================================================
# 8. Service Health Checks
# =============================================================================
log_info "Checking service health (if running)..."

if command -v docker &> /dev/null && docker info &> /dev/null; then
    # Check if services are running
    if docker-compose -f "$PROJECT_ROOT/docker/docker-compose.yml" ps | grep -q "Up"; then
        log_success "Some services are running"
        
        # Check individual services
        for service in nginx api_server mcp_gateway database redis mongodb; do
            if docker-compose -f "$PROJECT_ROOT/docker/docker-compose.yml" ps | grep "$service" | grep -q "Up"; then
                log_success "$service is running"
            else
                log_warning "$service is not running"
            fi
        done
    else
        log_warning "No services are running (run: docker-compose up -d)"
    fi
fi

echo ""

# =============================================================================
# 9. Backup Scripts Validation
# =============================================================================
log_info "Checking backup scripts..."

check "backup-postgres.sh exists" "test -f $PROJECT_ROOT/scripts/backup-postgres.sh"
check "restore-postgres.sh exists" "test -f $PROJECT_ROOT/scripts/restore-postgres.sh"
check "backup-mongodb.sh exists" "test -f $PROJECT_ROOT/scripts/backup-mongodb.sh"
check "restore-mongodb.sh exists" "test -f $PROJECT_ROOT/scripts/restore-mongodb.sh"

# Check if scripts are executable
check "backup-postgres.sh is executable" "test -x $PROJECT_ROOT/scripts/backup-postgres.sh"
check "restore-postgres.sh is executable" "test -x $PROJECT_ROOT/scripts/restore-postgres.sh"

echo ""

# =============================================================================
# 10. Documentation Validation
# =============================================================================
log_info "Checking documentation..."

check "README exists" "test -f $PROJECT_ROOT/README.md"
check "OPERATIONAL_HANDBOOK.md exists" "test -f $PROJECT_ROOT/OPERATIONAL_HANDBOOK.md"
check "DISASTER_RECOVERY.md exists" "test -f $PROJECT_ROOT/DISASTER_RECOVERY.md"
check "IAC_SECURITY_AUDIT.md exists" "test -f $PROJECT_ROOT/IAC_SECURITY_AUDIT.md"

echo ""

# =============================================================================
# 11. Azure Configuration Validation (if applicable)
# =============================================================================
if [ "$ENVIRONMENT" = "production" ] || [ "$ENVIRONMENT" = "staging" ]; then
    log_info "Checking Azure configuration..."
    
    if command -v az &> /dev/null; then
        check "Azure CLI is installed" "az --version"
        
        if az account show &> /dev/null; then
            log_success "Azure CLI is authenticated"
            
            # Check Bicep files
            check "Azure Bicep main.bicep exists" "test -f $PROJECT_ROOT/cursor-projects/DOT-Copilot/infrastructure/azure/main.bicep"
            
            if command -v az bicep &> /dev/null; then
                cd "$PROJECT_ROOT/cursor-projects/DOT-Copilot/infrastructure/azure"
                check "Bicep syntax is valid" "az bicep build --file main.bicep --stdout"
                cd "$PROJECT_ROOT"
            fi
        else
            log_warning "Azure CLI not authenticated (run: az login)"
        fi
    else
        log_warning "Azure CLI not installed (not required for local development)"
    fi
    
    echo ""
fi

# =============================================================================
# 12. Git Configuration Validation
# =============================================================================
log_info "Checking Git configuration..."

if command -v git &> /dev/null; then
    check "Git is installed" "git --version"
    check "Git repository initialized" "test -d $PROJECT_ROOT/.git"
    
    # Check for uncommitted changes
    cd "$PROJECT_ROOT"
    if git diff --quiet && git diff --cached --quiet; then
        log_success "No uncommitted changes"
    else
        log_warning "Uncommitted changes detected"
    fi
    
    # Check current branch
    CURRENT_BRANCH=$(git branch --show-current)
    log_info "Current branch: $CURRENT_BRANCH"
fi

echo ""

# =============================================================================
# Summary
# =============================================================================
echo "========================================="
echo "Validation Summary"
echo "========================================="
echo -e "Total Checks:    $TOTAL_CHECKS"
echo -e "${GREEN}Passed:          $PASSED_CHECKS${NC}"
echo -e "${YELLOW}Warnings:        $WARNING_CHECKS${NC}"
echo -e "${RED}Failed:          $FAILED_CHECKS${NC}"
echo "========================================="

# Calculate success rate
SUCCESS_RATE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
echo -e "Success Rate:    ${SUCCESS_RATE}%"
echo ""

# Exit code
if [ $FAILED_CHECKS -eq 0 ]; then
    if [ $WARNING_CHECKS -eq 0 ]; then
        echo -e "${GREEN}✓ All checks passed!${NC}"
        exit 0
    else
        echo -e "${YELLOW}⚠ Validation completed with warnings${NC}"
        exit 0
    fi
else
    echo -e "${RED}✗ Validation failed with $FAILED_CHECKS errors${NC}"
    exit 1
fi
