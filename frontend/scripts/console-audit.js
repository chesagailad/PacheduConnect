#!/usr/bin/env node

/**
 * Console Statement Audit Script
 * 
 * This script helps identify any console.* statements in the frontend codebase
 * to maintain production code quality and security.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Console Statement Audit');
console.log('='.repeat(50));

// Directories to scan
const scanDirectories = [
  'src/components',
  'src/app',
  'src/pages',
  'src/utils',
];

// File extensions to check
const extensions = ['*.tsx', '*.ts', '*.jsx', '*.js'];

// Allowed console patterns (for specific development/test files)
const allowedPatterns = [
  'console-audit.js', // This script itself
  '*.test.ts',       // Test files
  '*.test.tsx',      // Test files
  '*.spec.ts',       // Spec files
  '*.spec.tsx',      // Spec files
];

let totalFound = 0;
let criticalIssues = 0;

console.log('\n📋 Scanning directories:');
scanDirectories.forEach(dir => console.log(`  - ${dir}`));

console.log('\n🔎 Searching for console statements...\n');

scanDirectories.forEach(directory => {
  const fullPath = path.join(process.cwd(), directory);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Directory not found: ${directory}`);
    return;
  }

  extensions.forEach(ext => {
    try {
      const searchPattern = path.join(directory, '**', ext);
      const command = `grep -r "console\\." ${fullPath} --include="${ext}" -n || true`;
      
      const result = execSync(command, { encoding: 'utf8' });
      
      if (result.trim()) {
        const lines = result.trim().split('\n');
        
        lines.forEach(line => {
          totalFound++;
          
          // Parse the grep output: filepath:lineNumber:content
          const [filePath, lineNumber, ...contentParts] = line.split(':');
          const content = contentParts.join(':').trim();
          
          // Check if this is in an allowed file
          const isAllowed = allowedPatterns.some(pattern => {
            if (pattern.includes('*')) {
              const regex = new RegExp(pattern.replace('*', '.*'));
              return regex.test(path.basename(filePath));
            }
            return filePath.includes(pattern);
          });

          if (isAllowed) {
            console.log(`🟡 ${path.relative(process.cwd(), filePath)}:${lineNumber}`);
            console.log(`   ℹ️  Allowed in this file type: ${content}`);
          } else {
            criticalIssues++;
            console.log(`🔴 ${path.relative(process.cwd(), filePath)}:${lineNumber}`);
            console.log(`   ❌ Should use logger: ${content}`);
          }
          
          console.log('');
        });
      }
    } catch (error) {
      // Ignore errors from grep when no matches found
      if (error.status !== 1) {
        console.error(`Error scanning ${directory}:`, error.message);
      }
    }
  });
});

console.log('\n📊 Audit Results');
console.log('-'.repeat(30));
console.log(`Total console statements found: ${totalFound}`);
console.log(`Critical issues (production code): ${criticalIssues}`);
console.log(`Allowed (test/dev files): ${totalFound - criticalIssues}`);

if (criticalIssues > 0) {
  console.log('\n❌ AUDIT FAILED');
  console.log('   Fix the critical issues above before deploying to production.');
  console.log('   Replace console statements with logger utility:');
  console.log('   import logger from "@/utils/logger";');
  console.log('   logger.debug() or logger.error() instead of console.*');
  process.exit(1);
} else {
  console.log('\n✅ AUDIT PASSED');
  console.log('   No console statements found in production code.');
  if (totalFound > 0) {
    console.log('   Some console statements found in allowed files (tests, scripts).');
  }
}

console.log('\n🛠️  Maintenance Commands:');
console.log('   npm run console-audit     - Run this audit');
console.log('   npm run build             - Verify production build strips console');
console.log('   grep -r "console\\." src/ - Manual search for console statements');

console.log('\n📖 For more information, see: src/utils/console-audit.md');