/**
 * TS24 Hotfix Template
 *
 * Use this template when creating rapid fixes during QA.
 *
 * Instructions:
 * 1. Copy this file to src/domains/<domain>/ or appropriate location
 * 2. Rename to describe the fix: fix-<issue>-<description>.ts
 * 3. Implement the fix
 * 4. Create corresponding test file
 * 5. Run tests: npm test -- --run
 * 6. Create PR to feature/qa-release-prep
 *
 * Hotfix: <ISSUE-NUMBER>
 * Description: <Brief description of the bug>
 * Root Cause: <What caused the bug>
 * Solution: <How this fix resolves it>
 * Author: <Your name>
 * Date: <YYYY-MM-DD>
 */

// ============================================================================
// HOTFIX CONFIGURATION
// ============================================================================

export interface HotfixConfig {
  /** Unique identifier for this hotfix */
  hotfixId: string;
  /** Issue number this fixes */
  issueNumber: string;
  /** Brief description */
  description: string;
  /** Whether this hotfix is enabled */
  enabled: boolean;
  /** Date when this was applied */
  appliedAt: Date;
}

export const HOTFIX_CONFIG: HotfixConfig = {
  hotfixId: 'HOTFIX-XXX',
  issueNumber: 'XXX',
  description: 'Brief description of what this fixes',
  enabled: true,
  appliedAt: new Date(),
};

// ============================================================================
// HOTFIX IMPLEMENTATION
// ============================================================================

/**
 * Main hotfix function.
 *
 * Replace this with the actual fix implementation.
 *
 * @example
 * // Before (buggy behavior):
 * const result = buggyFunction(input);
 *
 * // After (fixed behavior):
 * const result = applyHotfix(input);
 */
export function applyHotfix<T>(input: T): T {
  // TODO: Implement the fix
  // Example patterns:

  // Pattern 1: Value transformation
  // if (typeof input === 'string') {
  //   return input.trim() as T;
  // }

  // Pattern 2: Null safety
  // if (input === null || input === undefined) {
  //   return defaultValue as T;
  // }

  // Pattern 3: Type coercion fix
  // if (typeof input === 'number' && isNaN(input)) {
  //   return 0 as T;
  // }

  return input;
}

/**
 * Validation function to check if hotfix should be applied.
 *
 * Use this to conditionally apply the fix based on runtime conditions.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function shouldApplyHotfix(_context?: Record<string, unknown>): boolean {
  // Check if hotfix is enabled
  if (!HOTFIX_CONFIG.enabled) {
    return false;
  }

  // Add additional conditions if needed
  // Example: only apply in certain environments
  // if (process.env.NODE_ENV === 'production') {
  //   return true;
  // }

  // Example: only apply for certain tenants
  // if (_context?.tenant === 'affected-tenant') {
  //   return true;
  // }

  return true;
}

/**
 * Wrapper function that applies hotfix conditionally.
 *
 * Use this in the codebase where the bug occurs.
 */
export function withHotfix<T>(
  originalValue: T,
  context?: Record<string, unknown>
): T {
  if (shouldApplyHotfix(context)) {
    return applyHotfix(originalValue);
  }
  return originalValue;
}

// ============================================================================
// QA SIGNAL LOGGING (if QA_MODE enabled)
// ============================================================================

const isQaMode = process.env.QA_MODE === '1';

export function logHotfixApplied(details?: Record<string, unknown>): void {
  if (isQaMode) {
    console.info('[qa-signal] hotfix:applied', {
      hotfixId: HOTFIX_CONFIG.hotfixId,
      issueNumber: HOTFIX_CONFIG.issueNumber,
      timestamp: new Date().toISOString(),
      ...details,
    });
  }
}

export function logHotfixSkipped(reason: string): void {
  if (isQaMode) {
    console.info('[qa-signal] hotfix:skipped', {
      hotfixId: HOTFIX_CONFIG.hotfixId,
      reason,
      timestamp: new Date().toISOString(),
    });
  }
}

// ============================================================================
// CLEANUP INSTRUCTIONS
// ============================================================================

/**
 * After QA approval and production deployment:
 *
 * 1. If this is a temporary workaround:
 *    - Schedule proper fix in next sprint
 *    - Add TODO comment with ticket number
 *    - Set reminder to remove this file
 *
 * 2. If this is the permanent fix:
 *    - Refactor into proper module/function
 *    - Remove hotfix wrapper functions
 *    - Update tests to test the permanent solution
 *    - Delete this template file
 *
 * 3. Document in CHANGELOG:
 *    - What was fixed
 *    - Which versions are affected
 *    - How users can verify the fix
 */
