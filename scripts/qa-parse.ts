#!/usr/bin/env npx tsx
/**
 * TS24 QA Report Parser
 *
 * Parses ALPHA QA test results and extracts actionable information.
 *
 * Usage:
 *   npx tsx scripts/qa-parse.ts <input-file>
 *   npx tsx scripts/qa-parse.ts --stdin < qa-results.txt
 *
 * Input formats supported:
 *   - Plain text test results
 *   - JSON test reports
 *   - Playwright JSON output
 */

import * as fs from 'fs';
import * as readline from 'readline';

// Severity levels
type Severity = 'P0' | 'P1' | 'P2' | 'P3';

// Test categories
type Category = 'SSO' | 'Cookie' | 'Routing' | 'UI' | 'API' | 'Auth' | 'Unknown';

// Parsed test result
interface ParsedTestResult {
  testName: string;
  status: 'pass' | 'fail' | 'skip';
  category: Category;
  severity: Severity;
  errorMessage?: string;
  suggestedFixArea: string[];
  filesToCheck: string[];
}

// Summary of parsing
interface ParseSummary {
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  byCategory: Record<Category, number>;
  bySeverity: Record<Severity, number>;
  criticalIssues: ParsedTestResult[];
  allResults: ParsedTestResult[];
}

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  bgRed: '\x1b[41m',
  bgYellow: '\x1b[43m',
  white: '\x1b[37m',
};

// Category detection patterns
const categoryPatterns: { pattern: RegExp; category: Category }[] = [
  { pattern: /sso|token|jwt|verify/i, category: 'SSO' },
  { pattern: /cookie|session/i, category: 'Cookie' },
  { pattern: /redirect|route|navigation|url/i, category: 'Routing' },
  { pattern: /render|display|component|button|input|form/i, category: 'UI' },
  { pattern: /api|endpoint|fetch|request|response/i, category: 'API' },
  { pattern: /login|logout|auth|permission|role/i, category: 'Auth' },
];

// Severity inference based on test name and error
const severityPatterns: { pattern: RegExp; severity: Severity }[] = [
  { pattern: /cannot login|login fail|auth.*fail|sso.*fail|critical/i, severity: 'P0' },
  { pattern: /partial|some users|intermittent|timeout/i, severity: 'P1' },
  { pattern: /edge case|minor|cosmetic|styling/i, severity: 'P3' },
];

// File mapping based on category
const categoryToFiles: Record<Category, string[]> = {
  SSO: [
    'server/ssoAuth.ts',
    'src/domains/auth/ssoBackend.ts',
    'src/components/Auth/SsoLoginPage.tsx',
  ],
  Cookie: [
    'server/app.ts',
    'src/domains/auth/ssoBackend.ts',
  ],
  Routing: [
    'src/App.tsx',
    'src/config/navigation.ts',
    'server/app.ts',
  ],
  UI: [
    'src/components/Auth/LoginPage.tsx',
    'src/components/Auth/SsoErrorDisplay.tsx',
  ],
  API: [
    'server/app.ts',
    'server/index.ts',
  ],
  Auth: [
    'src/domains/auth/',
    'server/ssoAuth.ts',
  ],
  Unknown: [],
};

// Detect category from test name/error
function detectCategory(testName: string, errorMessage?: string): Category {
  const combined = `${testName} ${errorMessage || ''}`;
  for (const { pattern, category } of categoryPatterns) {
    if (pattern.test(combined)) {
      return category;
    }
  }
  return 'Unknown';
}

// Infer severity from test name/error
function inferSeverity(testName: string, errorMessage?: string): Severity {
  const combined = `${testName} ${errorMessage || ''}`;
  for (const { pattern, severity } of severityPatterns) {
    if (pattern.test(combined)) {
      return severity;
    }
  }
  return 'P2'; // Default
}

// Get suggested fix areas based on error
function getSuggestedFixArea(category: Category, errorMessage?: string): string[] {
  const areas: string[] = [];

  if (errorMessage) {
    if (/signature|invalid.*token/i.test(errorMessage)) {
      areas.push('JWT signature verification in server/ssoAuth.ts');
    }
    if (/expired/i.test(errorMessage)) {
      areas.push('Token expiry handling');
    }
    if (/cookie.*not.*set|missing.*cookie/i.test(errorMessage)) {
      areas.push('Set-Cookie header in server/app.ts /sso-login route');
    }
    if (/redirect/i.test(errorMessage)) {
      areas.push('Redirect logic in App.tsx or server routes');
    }
    if (/401|unauthorized/i.test(errorMessage)) {
      areas.push('Authorization header parsing or token validation');
    }
    if (/500|internal.*error/i.test(errorMessage)) {
      areas.push('Server error handling - check logs');
    }
  }

  if (areas.length === 0) {
    areas.push(`General ${category} handling`);
  }

  return areas;
}

// Parse a single test result line (various formats)
function parseTestLine(line: string): ParsedTestResult | null {
  // Format: ✓ test name (duration)
  const passMatch = line.match(/[✓✔]\s+(.+?)(?:\s+\(\d+.*\))?$/);
  if (passMatch) {
    const testName = passMatch[1].trim();
    const category = detectCategory(testName);
    return {
      testName,
      status: 'pass',
      category,
      severity: 'P3',
      suggestedFixArea: [],
      filesToCheck: [],
    };
  }

  // Format: ✗ test name - error message
  const failMatch = line.match(/[✗✘×]\s+(.+?)(?:\s+-\s+(.+))?$/);
  if (failMatch) {
    const testName = failMatch[1].trim();
    const errorMessage = failMatch[2]?.trim();
    const category = detectCategory(testName, errorMessage);
    const severity = inferSeverity(testName, errorMessage);
    return {
      testName,
      status: 'fail',
      category,
      severity,
      errorMessage,
      suggestedFixArea: getSuggestedFixArea(category, errorMessage),
      filesToCheck: categoryToFiles[category],
    };
  }

  // Format: FAIL: test name
  const failMatch2 = line.match(/FAIL[ED]?:?\s+(.+)/i);
  if (failMatch2) {
    const testName = failMatch2[1].trim();
    const category = detectCategory(testName);
    const severity = inferSeverity(testName);
    return {
      testName,
      status: 'fail',
      category,
      severity,
      suggestedFixArea: getSuggestedFixArea(category),
      filesToCheck: categoryToFiles[category],
    };
  }

  // Format: - test name (skipped)
  const skipMatch = line.match(/[-○]\s+(.+?)(?:\s+\(skipped\))?$/i);
  if (skipMatch && /skip/i.test(line)) {
    return {
      testName: skipMatch[1].trim(),
      status: 'skip',
      category: 'Unknown',
      severity: 'P3',
      suggestedFixArea: [],
      filesToCheck: [],
    };
  }

  return null;
}

// Parse JSON format (Playwright/Jest)
function parseJsonReport(json: unknown): ParsedTestResult[] {
  const results: ParsedTestResult[] = [];

  // Handle Playwright format
  if (typeof json === 'object' && json !== null && 'suites' in json) {
    const report = json as { suites: unknown[] };
    const extractTests = (suites: unknown[]): void => {
      for (const suite of suites) {
        if (typeof suite === 'object' && suite !== null) {
          const s = suite as { specs?: unknown[]; suites?: unknown[] };
          if (s.specs) {
            for (const spec of s.specs) {
              if (typeof spec === 'object' && spec !== null) {
                const sp = spec as { title?: string; ok?: boolean; tests?: unknown[] };
                const testName = sp.title || 'Unknown test';
                const passed = sp.ok ?? true;
                const category = detectCategory(testName);
                const severity = passed ? 'P3' : inferSeverity(testName);
                results.push({
                  testName,
                  status: passed ? 'pass' : 'fail',
                  category,
                  severity,
                  suggestedFixArea: passed ? [] : getSuggestedFixArea(category),
                  filesToCheck: passed ? [] : categoryToFiles[category],
                });
              }
            }
          }
          if (s.suites) {
            extractTests(s.suites);
          }
        }
      }
    };
    extractTests(report.suites);
  }

  return results;
}

// Main parsing function
function parseQaOutput(input: string): ParseSummary {
  const summary: ParseSummary = {
    totalTests: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    byCategory: { SSO: 0, Cookie: 0, Routing: 0, UI: 0, API: 0, Auth: 0, Unknown: 0 },
    bySeverity: { P0: 0, P1: 0, P2: 0, P3: 0 },
    criticalIssues: [],
    allResults: [],
  };

  // Try JSON first
  try {
    const json = JSON.parse(input);
    const results = parseJsonReport(json);
    if (results.length > 0) {
      for (const result of results) {
        summary.totalTests++;
        summary.allResults.push(result);
        summary.byCategory[result.category]++;

        if (result.status === 'pass') {
          summary.passed++;
        } else if (result.status === 'fail') {
          summary.failed++;
          summary.bySeverity[result.severity]++;
          if (result.severity === 'P0' || result.severity === 'P1') {
            summary.criticalIssues.push(result);
          }
        } else {
          summary.skipped++;
        }
      }
      return summary;
    }
  } catch {
    // Not JSON, continue with line parsing
  }

  // Parse line by line
  const lines = input.split('\n');
  for (const line of lines) {
    const result = parseTestLine(line.trim());
    if (result) {
      summary.totalTests++;
      summary.allResults.push(result);
      summary.byCategory[result.category]++;

      if (result.status === 'pass') {
        summary.passed++;
      } else if (result.status === 'fail') {
        summary.failed++;
        summary.bySeverity[result.severity]++;
        if (result.severity === 'P0' || result.severity === 'P1') {
          summary.criticalIssues.push(result);
        }
      } else {
        summary.skipped++;
      }
    }
  }

  return summary;
}

// Print parsed summary
function printSummary(summary: ParseSummary): void {
  console.log(`\n${colors.bright}${colors.cyan}╔═══════════════════════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║                         TS24 QA REPORT ANALYSIS                              ║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}╚═══════════════════════════════════════════════════════════════════════════════╝${colors.reset}\n`);

  // Overall summary
  console.log(`${colors.bright}Overall Results:${colors.reset}`);
  console.log(`  Total:   ${summary.totalTests}`);
  console.log(`  ${colors.green}Passed:  ${summary.passed}${colors.reset}`);
  console.log(`  ${summary.failed > 0 ? colors.red : ''}Failed:  ${summary.failed}${colors.reset}`);
  console.log(`  ${colors.dim}Skipped: ${summary.skipped}${colors.reset}`);

  // By severity
  if (summary.failed > 0) {
    console.log(`\n${colors.bright}Failed by Severity:${colors.reset}`);
    if (summary.bySeverity.P0 > 0) {
      console.log(`  ${colors.bgRed}${colors.white} P0 CRITICAL ${colors.reset} ${summary.bySeverity.P0}`);
    }
    if (summary.bySeverity.P1 > 0) {
      console.log(`  ${colors.bgYellow}${colors.white} P1 URGENT   ${colors.reset} ${summary.bySeverity.P1}`);
    }
    if (summary.bySeverity.P2 > 0) {
      console.log(`  ${colors.yellow} P2 Normal   ${colors.reset} ${summary.bySeverity.P2}`);
    }
  }

  // By category
  console.log(`\n${colors.bright}By Category:${colors.reset}`);
  for (const [cat, count] of Object.entries(summary.byCategory)) {
    if (count > 0) {
      console.log(`  ${cat.padEnd(10)} ${count}`);
    }
  }

  // Critical issues detail
  if (summary.criticalIssues.length > 0) {
    console.log(`\n${colors.bright}${colors.red}⚠️  Critical Issues (P0/P1):${colors.reset}\n`);
    for (const issue of summary.criticalIssues) {
      const severityBadge = issue.severity === 'P0'
        ? `${colors.bgRed}${colors.white} P0 ${colors.reset}`
        : `${colors.bgYellow}${colors.white} P1 ${colors.reset}`;
      console.log(`  ${severityBadge} ${issue.testName}`);
      console.log(`    ${colors.dim}Category: ${issue.category}${colors.reset}`);
      if (issue.errorMessage) {
        console.log(`    ${colors.dim}Error: ${issue.errorMessage}${colors.reset}`);
      }
      console.log(`    ${colors.cyan}Suggested Fix:${colors.reset}`);
      for (const area of issue.suggestedFixArea) {
        console.log(`      → ${area}`);
      }
      console.log(`    ${colors.cyan}Files to Check:${colors.reset}`);
      for (const file of issue.filesToCheck) {
        console.log(`      📄 ${file}`);
      }
      console.log();
    }
  }

  // Failed tests summary
  const failedTests = summary.allResults.filter((r) => r.status === 'fail');
  if (failedTests.length > 0 && failedTests.length <= 20) {
    console.log(`${colors.bright}All Failed Tests:${colors.reset}\n`);
    for (const test of failedTests) {
      const severityColor =
        test.severity === 'P0' ? colors.red :
        test.severity === 'P1' ? colors.yellow : colors.dim;
      console.log(`  ${severityColor}[${test.severity}]${colors.reset} ${test.testName}`);
    }
  }

  // Quick action
  if (summary.criticalIssues.length > 0) {
    console.log(`\n${colors.bright}${colors.yellow}📋 Recommended Action:${colors.reset}`);
    console.log(`  1. Address P0 issues immediately (≤20 min)`);
    console.log(`  2. Create hotfix branch: hotfix/sso-qa-round1`);
    console.log(`  3. Focus on files: ${summary.criticalIssues[0].filesToCheck[0] || 'see above'}`);
  } else if (summary.failed === 0) {
    console.log(`\n${colors.bright}${colors.green}✅ All tests passed! Ready for QA PASS declaration.${colors.reset}`);
  }
}

// Main
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  let input: string;

  if (args.includes('--stdin') || args.length === 0) {
    // Read from stdin
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    const lines: string[] = [];
    for await (const line of rl) {
      lines.push(line);
    }
    input = lines.join('\n');
  } else {
    // Read from file
    const filePath = args[0];
    if (!fs.existsSync(filePath)) {
      console.error(`${colors.red}Error: File not found: ${filePath}${colors.reset}`);
      process.exit(1);
    }
    input = fs.readFileSync(filePath, 'utf-8');
  }

  if (!input.trim()) {
    console.log(`${colors.yellow}No input provided.${colors.reset}`);
    console.log(`Usage: npx tsx scripts/qa-parse.ts <file>`);
    console.log(`       npx tsx scripts/qa-parse.ts --stdin < results.txt`);
    process.exit(0);
  }

  const summary = parseQaOutput(input);
  printSummary(summary);

  // Exit with error code if P0/P1 issues
  if (summary.bySeverity.P0 > 0) {
    process.exit(2);
  }
  if (summary.bySeverity.P1 > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, err);
  process.exit(1);
});
