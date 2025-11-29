#!/bin/bash

# ============================================
# Dashboard Performance & Bug Fixes Setup
# Automated Setup Script
# ============================================

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo ""
    echo "========================================================================"
    echo -e "${BLUE}$1${NC}"
    echo "========================================================================"
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
    echo -e "   ℹ️  $1"
}

# Welcome
clear
echo ""
echo "========================================================================"
echo -e "${BLUE}🚀 Dashboard Performance & Bug Fixes Setup${NC}"
echo "========================================================================"
echo ""
echo "This script will:"
echo "  1. ✅ Guide you to apply database indexes"
echo "  2. ✅ Restart backend with fixes"
echo "  3. ✅ Clear frontend cache and restart"
echo "  4. ✅ Run automated tests"
echo ""
read -p "Press Enter to continue..."

# ============================================
# STEP 1: Database Indexes
# ============================================
print_header "STEP 1: Apply Database Indexes"

echo ""
echo "We need to apply database indexes in Supabase for better performance."
echo ""
echo "Choose a method:"
echo "  1) Supabase Dashboard (Recommended - Easy)"
echo "  2) Supabase CLI (Advanced)"
echo "  3) Skip (Already applied)"
echo ""
read -p "Enter choice [1-3]: " db_choice

case $db_choice in
    1)
        print_info "Opening SQL file for you to copy..."
        echo ""
        echo "📋 Instructions:"
        echo "  1. The SQL file will be displayed below"
        echo "  2. Copy ALL the content (Cmd+A / Ctrl+A, then Cmd+C / Ctrl+C)"
        echo "  3. Go to: https://supabase.com/dashboard"
        echo "  4. Select your project"
        echo "  5. Click 'SQL Editor' (left sidebar)"
        echo "  6. Paste and click 'RUN'"
        echo ""
        read -p "Press Enter when ready to see the SQL..."
        echo ""
        echo "========================================================================"
        cat backend/add_database_indexes.sql
        echo "========================================================================"
        echo ""
        read -p "After applying in Supabase, press Enter to continue..."
        print_success "Database indexes should now be applied!"
        ;;
    2)
        print_info "Using Supabase CLI..."
        if command -v supabase &> /dev/null; then
            cd backend
            supabase db push
            cd ..
            print_success "Database indexes applied via CLI!"
        else
            print_error "Supabase CLI not found!"
            print_info "Install: brew install supabase/tap/supabase"
            exit 1
        fi
        ;;
    3)
        print_warning "Skipping database indexes (assuming already applied)"
        ;;
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

# ============================================
# STEP 2: Restart Backend
# ============================================
print_header "STEP 2: Restart Backend"

echo ""
print_info "Checking if backend is running..."

# Check if backend is running on port 10000
if lsof -Pi :10000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    print_warning "Backend is running on port 10000"
    read -p "Do you want to restart it? [y/N]: " restart_backend

    if [[ $restart_backend =~ ^[Yy]$ ]]; then
        print_info "Stopping backend..."
        # Kill process on port 10000
        kill -9 $(lsof -ti:10000) 2>/dev/null || true
        print_success "Backend stopped"

        print_info "Starting backend in background..."
        cd backend
        nohup python main.py > backend.log 2>&1 &
        BACKEND_PID=$!
        cd ..

        print_info "Waiting for backend to start..."
        sleep 3

        if ps -p $BACKEND_PID > /dev/null; then
            print_success "Backend started (PID: $BACKEND_PID)"
            print_info "Logs: backend/backend.log"
        else
            print_error "Backend failed to start"
            print_info "Check logs: cat backend/backend.log"
            exit 1
        fi
    fi
else
    print_info "Backend not running, starting it..."
    cd backend

    # Check if Python is available
    if ! command -v python &> /dev/null && ! command -v python3 &> /dev/null; then
        print_error "Python not found!"
        exit 1
    fi

    # Use python3 if python is not available
    PYTHON_CMD="python"
    if ! command -v python &> /dev/null; then
        PYTHON_CMD="python3"
    fi

    nohup $PYTHON_CMD main.py > backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..

    print_info "Waiting for backend to start..."
    sleep 3

    if ps -p $BACKEND_PID > /dev/null; then
        print_success "Backend started (PID: $BACKEND_PID)"
        print_info "Logs: backend/backend.log"
    else
        print_error "Backend failed to start"
        print_info "Check logs: cat backend/backend.log"
        exit 1
    fi
fi

# ============================================
# STEP 3: Frontend Setup
# ============================================
print_header "STEP 3: Clear Frontend Cache & Restart"

echo ""
read -p "Do you want to clear frontend cache and restart? [y/N]: " restart_frontend

if [[ $restart_frontend =~ ^[Yy]$ ]]; then
    print_info "Clearing frontend cache..."

    if [ -d "frontend/node_modules/.vite" ]; then
        rm -rf frontend/node_modules/.vite
        print_success "Vite cache cleared"
    else
        print_info "No Vite cache found (already clean)"
    fi

    # Check if frontend is running on port 5173
    if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        print_warning "Frontend is running on port 5173"
        print_info "Please restart it manually:"
        echo "  1. Stop current frontend (Ctrl+C)"
        echo "  2. cd frontend"
        echo "  3. pnpm dev (or npm run dev)"
    else
        print_info "You can now start the frontend:"
        echo "  cd frontend"
        echo "  pnpm dev (or npm run dev)"
    fi
fi

# ============================================
# STEP 4: Run Tests
# ============================================
print_header "STEP 4: Run Automated Tests"

echo ""
read -p "Do you want to run tests now? [Y/n]: " run_tests

if [[ ! $run_tests =~ ^[Nn]$ ]]; then
    print_info "Running tests in 5 seconds (waiting for backend to be ready)..."
    sleep 5

    cd backend

    # Check if Python is available
    PYTHON_CMD="python"
    if ! command -v python &> /dev/null; then
        PYTHON_CMD="python3"
    fi

    # Check if requests module is available
    if ! $PYTHON_CMD -c "import requests" 2>/dev/null; then
        print_warning "requests module not found, installing..."
        pip install requests
    fi

    $PYTHON_CMD test_dashboard_performance.py
    cd ..
else
    print_info "Skipping tests. You can run them later:"
    echo "  cd backend"
    echo "  python test_dashboard_performance.py"
fi

# ============================================
# SUMMARY
# ============================================
print_header "🎉 Setup Complete!"

echo ""
echo "Next steps:"
echo ""
echo "1. 📊 Open Dashboard:"
echo "   http://localhost:5173/dashboard"
echo ""
echo "2. ✅ Test the fixes:"
echo "   - Dashboard should load in 1-2 seconds (was 5-10 seconds)"
echo "   - Filters should work instantly (vehicle, weather, cause)"
echo "   - Province heatmap should show casualties on hover"
echo "   - All graphs should display data"
echo ""
echo "3. 📖 Documentation:"
echo "   - Quick Start (Thai): DASHBOARD_FIX_QUICKSTART_TH.md"
echo "   - Full Docs (English): DASHBOARD_PERFORMANCE_FIX.md"
echo "   - Summary: FIXES_SUMMARY.md"
echo ""
echo "4. 🐛 If something doesn't work:"
echo "   - Check backend logs: tail -f backend/backend.log"
echo "   - Run tests: cd backend && python test_dashboard_performance.py"
echo "   - See troubleshooting: DASHBOARD_FIX_QUICKSTART_TH.md"
echo ""
echo "========================================================================"
print_success "All done! Enjoy your faster dashboard! 🚀"
echo "========================================================================"
echo ""
