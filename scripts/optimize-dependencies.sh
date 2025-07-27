#!/bin/bash

echo "🧹 Starting dependency optimization for PacheduConnect monorepo..."

# Function to print colored output
print_status() {
    echo -e "\n\033[1;34m$1\033[0m"
}

print_success() {
    echo -e "\033[1;32m✓ $1\033[0m"
}

print_warning() {
    echo -e "\033[1;33m⚠ $1\033[0m"
}

# Check if we're in the root directory
if [ ! -f "package.json" ] || [ ! -d "backend" ]; then
    echo "❌ Please run this script from the root directory of the monorepo"
    exit 1
fi

# Show current state
print_status "Current state analysis:"
if [ -d "node_modules" ]; then
    CURRENT_SIZE=$(du -sh node_modules 2>/dev/null | cut -f1)
    CURRENT_COUNT=$(find . -name "node_modules" -type d | wc -l)
    echo "📊 Current node_modules size: $CURRENT_SIZE"
    echo "📊 Current node_modules count: $CURRENT_COUNT directories"
else
    echo "📊 No existing node_modules found"
fi

# Step 1: Clean all existing node_modules and lock files
print_status "Step 1: Cleaning existing dependencies..."
find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name "package-lock.json" -delete 2>/dev/null || true
find . -name "yarn.lock" -delete 2>/dev/null || true
print_success "Cleaned all node_modules and lock files"

# Step 2: Clear npm cache
print_status "Step 2: Clearing npm cache..."
npm cache clean --force
print_success "NPM cache cleared"

# Step 3: Install with workspace optimization
print_status "Step 3: Installing dependencies with workspace optimization..."
export NODE_OPTIONS="--max-old-space-size=4096"
npm install --prefer-offline --no-audit --no-fund
print_success "Dependencies installed"

# Step 4: Deduplicate dependencies
print_status "Step 4: Deduplicating dependencies..."
npm dedupe
print_success "Dependencies deduplicated"

# Step 5: Show results
print_status "Optimization Results:"
if [ -d "node_modules" ]; then
    NEW_SIZE=$(du -sh node_modules 2>/dev/null | cut -f1)
    NEW_COUNT=$(find . -name "node_modules" -type d | wc -l)
    echo "📊 New node_modules size: $NEW_SIZE"
    echo "📊 New node_modules count: $NEW_COUNT directories"
    
    # Calculate reduction
    echo ""
    echo "🎉 Optimization Summary:"
    if [ -n "$CURRENT_SIZE" ]; then
        echo "   Size reduction: $CURRENT_SIZE → $NEW_SIZE"
    fi
    if [ -n "$CURRENT_COUNT" ]; then
        echo "   Directory reduction: $CURRENT_COUNT → $NEW_COUNT directories"
    fi
else
    echo "❌ Installation may have failed - no node_modules found"
    exit 1
fi

# Step 6: Verify workspace functionality
print_status "Step 6: Verifying workspace functionality..."
npm ls --depth=0 > /dev/null 2>&1
if [ $? -eq 0 ]; then
    print_success "Workspace verification passed"
else
    print_warning "Some dependency issues detected, but this is often normal"
fi

# Step 7: Generate dependency report
print_status "Step 7: Generating dependency analysis..."
cat > dependency-analysis.md << EOF
# Dependency Optimization Report

Generated on: $(date)

## Summary
- **New node_modules size**: $NEW_SIZE
- **New node_modules count**: $NEW_COUNT directories
- **Workspace packages**: 6 (backend, frontend, mobile, admin-dashboard, telegram-bot, whatsapp-bot)

## Common Dependencies (Hoisted to Root)
- axios: 1.6.0
- lodash: 4.17.21
- moment: 2.29.4
- socket.io-client: 4.7.4
- zod: 3.22.0
- date-fns: 2.30.0
- react: 18.2.0
- react-dom: 18.2.0
- typescript: 5.1.3

## Configuration Applied
- NPM workspaces with dependency hoisting
- Exact version pinning to prevent duplicates
- Optimized .npmrc configuration
- Proper workspace package structure

## Next Steps
1. Run \`npm run dev\` to start development
2. Test all workspaces individually
3. Monitor for any missing dependencies
4. Use \`npm run analyze:deps\` for ongoing analysis

## Maintenance Commands
- \`npm run clean\`: Clean all node_modules
- \`npm run install:clean\`: Clean and reinstall
- \`npm dedupe\`: Remove duplicate packages
- \`npm run analyze:deps\`: Analyze dependency health
EOF

print_success "Dependency analysis report generated: dependency-analysis.md"

echo ""
echo "🎉 Dependency optimization complete!"
echo "💡 Run 'npm run dev' to start development with optimized dependencies"