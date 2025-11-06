#!/usr/bin/env node

/**
 * Pre-commit hook to detect sensitive data in staged files
 * This prevents accidentally committing API keys, passwords, and other secrets
 */

const { execSync } = require('child_process');
const fs = require('fs');

// Patterns to detect various types of secrets
const SECRET_PATTERNS = [
  {
    name: 'Generic API Key',
    pattern: /(?:api[_-]?key|apikey|api[_-]?secret)["\s:=]+[a-zA-Z0-9_\-]{20,}/gi,
    severity: 'high'
  },
  {
    name: 'AWS Access Key',
    pattern: /AKIA[0-9A-Z]{16}/g,
    severity: 'critical'
  },
  {
    name: 'Private Key',
    pattern: /-----BEGIN (?:RSA|OPENSSH|DSA|EC) PRIVATE KEY-----/g,
    severity: 'critical'
  },
  {
    name: 'Generic Secret',
    pattern: /(?:secret|password|passwd|pwd)["\s:=]+[^\s"']{8,}/gi,
    severity: 'high'
  },
  {
    name: 'JWT Token',
    pattern: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,
    severity: 'medium'
  },
  {
    name: 'Database Connection String',
    pattern: /(?:postgres|mysql|mongodb):\/\/[^\s"']+:[^\s"']+@[^\s"']+/gi,
    severity: 'critical'
  },
  {
    name: 'Slack Token',
    pattern: /xox[baprs]-[0-9a-zA-Z-]{10,}/g,
    severity: 'high'
  },
  {
    name: 'GitHub Token',
    pattern: /ghp_[a-zA-Z0-9]{36}/g,
    severity: 'critical'
  },
  {
    name: 'Stripe API Key',
    pattern: /(?:sk|pk)_(?:live|test)_[a-zA-Z0-9]{24,}/g,
    severity: 'critical'
  }
];

// Files to always ignore
const IGNORED_PATTERNS = [
  /node_modules\//,
  /\.git\//,
  /dist\//,
  /build\//,
  /\.husky\//,
  /scripts\/detect-secrets\.js$/,
  /package-lock\.json$/,
  /bun\.lockb$/,
  /yarn\.lock$/
];

// Whitelist patterns - known safe values that match patterns
const WHITELIST = [
  /VITE_SUPABASE_PUBLISHABLE_KEY/,  // Publishable keys are safe
  /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqYnlsYmpieGpvdGJpanpyd21hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NzIxMTQsImV4cCI6MjA3NzQ0ODExNH0\.Wr4LCkzteMzDgd-SUsFEoBtb3WHf--2kwMkYC66K56o/, // Known anon key
  /example\.com/,
  /placeholder/i,
  /your_api_key_here/i,
  /\$\{.*\}/  // Environment variable placeholders
];

function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf-8'
    });
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    console.error('Error getting staged files:', error.message);
    return [];
  }
}

function shouldIgnoreFile(filePath) {
  return IGNORED_PATTERNS.some(pattern => pattern.test(filePath));
}

function isWhitelisted(content) {
  return WHITELIST.some(pattern => pattern.test(content));
}

function detectSecretsInFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const findings = [];

  for (const { name, pattern, severity } of SECRET_PATTERNS) {
    const matches = content.matchAll(pattern);
    
    for (const match of matches) {
      const matchedText = match[0];
      
      // Skip if whitelisted
      if (isWhitelisted(matchedText)) {
        continue;
      }

      // Get line number
      const beforeMatch = content.substring(0, match.index);
      const lineNumber = beforeMatch.split('\n').length;

      findings.push({
        file: filePath,
        line: lineNumber,
        type: name,
        severity,
        preview: matchedText.substring(0, 50) + (matchedText.length > 50 ? '...' : '')
      });
    }
  }

  return findings;
}

function main() {
  console.log('🔍 Scanning staged files for sensitive data...\n');

  const stagedFiles = getStagedFiles();
  
  if (stagedFiles.length === 0) {
    console.log('No staged files to check.');
    process.exit(0);
  }

  const filesToCheck = stagedFiles.filter(file => !shouldIgnoreFile(file));
  
  if (filesToCheck.length === 0) {
    console.log('No files to check after filtering.');
    process.exit(0);
  }

  console.log(`Checking ${filesToCheck.length} file(s)...\n`);

  let allFindings = [];

  for (const file of filesToCheck) {
    const findings = detectSecretsInFile(file);
    allFindings = allFindings.concat(findings);
  }

  if (allFindings.length === 0) {
    console.log('✅ No sensitive data detected. Safe to commit!\n');
    process.exit(0);
  }

  // Group findings by severity
  const critical = allFindings.filter(f => f.severity === 'critical');
  const high = allFindings.filter(f => f.severity === 'high');
  const medium = allFindings.filter(f => f.severity === 'medium');

  console.log('❌ SENSITIVE DATA DETECTED!\n');
  console.log('The following potential secrets were found in your staged files:\n');

  const printFindings = (findings, severityLabel) => {
    if (findings.length === 0) return;
    
    console.log(`\n${severityLabel}:`);
    findings.forEach(finding => {
      console.log(`  📁 ${finding.file}:${finding.line}`);
      console.log(`     Type: ${finding.type}`);
      console.log(`     Preview: ${finding.preview}`);
      console.log('');
    });
  };

  printFindings(critical, '🔴 CRITICAL');
  printFindings(high, '🟠 HIGH');
  printFindings(medium, '🟡 MEDIUM');

  console.log('\n⚠️  COMMIT BLOCKED TO PROTECT YOUR SECRETS!\n');
  console.log('What to do:');
  console.log('1. Remove the sensitive data from your files');
  console.log('2. Use environment variables instead (see .env.example)');
  console.log('3. For Supabase secrets, use the Lovable secrets feature');
  console.log('4. If this is a false positive, add it to the whitelist in scripts/detect-secrets.js\n');
  console.log('5. To skip this check (NOT RECOMMENDED), use: git commit --no-verify\n');

  process.exit(1);
}

main();
