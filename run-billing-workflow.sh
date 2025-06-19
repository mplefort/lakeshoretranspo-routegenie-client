#!/bin/bash

# Lakeshore Transportation Billing Workflow Launcher
# This script provides an easy way to run the billing workflow

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

echo_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

echo_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Node.js is installed
check_nodejs() {
    if ! command -v node &> /dev/null; then
        echo_error "Node.js is not installed. Please install Node.js 16 or later."
        exit 1
    fi
    
    local node_version=$(node --version | sed 's/v//')
    local major_version=$(echo $node_version | cut -d. -f1)
    
    if [ "$major_version" -lt 16 ]; then
        echo_error "Node.js version $node_version is too old. Please install Node.js 16 or later."
        exit 1
    fi
    
    echo_success "Node.js $node_version detected"
}

# Check if dependencies are installed
check_dependencies() {
    if [ ! -d "$PROJECT_DIR/node_modules" ]; then
        echo_warning "Dependencies not found. Installing..."
        cd "$PROJECT_DIR"
        npm install
        echo_success "Dependencies installed"
    fi
}

# Check if .env file exists
check_env_file() {
    if [ ! -f "$PROJECT_DIR/.env" ]; then
        echo_warning ".env file not found. Creating from template..."
        cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env"
        echo_error "Please edit .env file with your RouteGenie credentials before running the workflow."
        echo_info "Required variables: RG_CLIENT_ID, RG_CLIENT_SECRET"
        exit 1
    fi
}

# Show help
show_help() {
    echo "Lakeshore Transportation Billing Workflow Launcher"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -s, --start-date <date>      Start date (MM/DD/YYYY)"
    echo "  -e, --end-date <date>        End date (MM/DD/YYYY)"
    echo "  -n, --invoice-number <num>   Starting invoice number (default: 1000)"
    echo "  -o, --output-dir <path>      Output directory (default: ./reports/billing)"
    echo "  -i, --interactive            Interactive mode"
    echo "  -h, --help                   Show this help"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Use today's date, interactive mode"
    echo "  $0 -s 06/01/2025 -e 06/19/2025      # Specify date range"
    echo "  $0 --interactive                     # Force interactive mode"
    echo ""
}

# Main execution
main() {
    echo_info "Lakeshore Transportation Billing Workflow Launcher"
    
    # Check for help flag first
    for arg in "$@"; do
        if [[ "$arg" == "-h" || "$arg" == "--help" ]]; then
            show_help
            exit 0
        fi
    done
    
    # Perform checks
    check_nodejs
    check_dependencies  
    check_env_file
    
    echo_info "Starting billing workflow..."
    cd "$PROJECT_DIR"
    
    # Run the TypeScript version directly using global ts-node
    ts-node src/commands/billingWorkflowInteractive.ts "$@"
}

# Run main function with all arguments
main "$@"
