/**
 * Case Data Schema & Validators
 *
 * Runtime validation for CaseData structure.
 * Provides type-safe validation without external dependencies.
 */

import type { CaseData } from '../../types';

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  path: string;
  message: string;
  expected?: string;
  received?: string;
}

// ============================================================================
// Type Guards
// ============================================================================

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

// ============================================================================
// Field Validators
// ============================================================================

function validatePersonData(data: unknown, path: string): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!isObject(data)) {
    errors.push({ path, message: 'Expected object', expected: 'object', received: typeof data });
    return errors;
  }

  const required = ['name', 'aliases', 'birthYear', 'currentAddress', 'addressHistory', 'primaryRole', 'uboStatus', 'pepStatus', 'sanctionsScreening', 'socmintProfile'];
  for (const field of required) {
    if (!(field in data)) {
      errors.push({ path: `${path}.${field}`, message: `Missing required field: ${field}` });
    }
  }

  if ('name' in data && !isString(data.name)) {
    errors.push({ path: `${path}.name`, message: 'Expected string', expected: 'string', received: typeof data.name });
  }

  if ('aliases' in data && !isArray(data.aliases)) {
    errors.push({ path: `${path}.aliases`, message: 'Expected array', expected: 'array', received: typeof data.aliases });
  }

  return errors;
}

function validateCompaniesData(data: unknown, path: string): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!isArray(data)) {
    errors.push({ path, message: 'Expected array', expected: 'array', received: typeof data });
    return errors;
  }

  data.forEach((company, index) => {
    if (!isObject(company)) {
      errors.push({ path: `${path}[${index}]`, message: 'Expected object', expected: 'object', received: typeof company });
      return;
    }

    const required = ['id', 'name', 'cvr', 'role', 'industryCode', 'established', 'owner', 'director', 'auditor', 'status', 'notes'];
    for (const field of required) {
      if (!(field in company)) {
        errors.push({ path: `${path}[${index}].${field}`, message: `Missing required field: ${field}` });
      }
    }
  });

  return errors;
}

function validateFinancialData(data: unknown, path: string): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!isArray(data)) {
    errors.push({ path, message: 'Expected array', expected: 'array', received: typeof data });
    return errors;
  }

  data.forEach((year, index) => {
    if (!isObject(year)) {
      errors.push({ path: `${path}[${index}]`, message: 'Expected object', expected: 'object', received: typeof year });
      return;
    }

    const required = ['year', 'revenueOrGrossProfit', 'profitAfterTax', 'staffCount', 'equityEndOfYear', 'currentAssets'];
    for (const field of required) {
      if (!(field in year)) {
        errors.push({ path: `${path}[${index}].${field}`, message: `Missing required field: ${field}` });
      }
    }

    if ('year' in year && !isNumber(year.year)) {
      errors.push({ path: `${path}[${index}].year`, message: 'Expected number', expected: 'number', received: typeof year.year });
    }
  });

  return errors;
}

function validateRiskHeatmapData(data: unknown, path: string): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!isArray(data)) {
    errors.push({ path, message: 'Expected array', expected: 'array', received: typeof data });
    return errors;
  }

  const validCategories = ['Financial', 'Legal/Compliance', 'Governance', 'SOCMINT/Reputation', 'Sector/Operations'];
  const validRiskLevels = ['KRITISK', 'HØJ', 'MODERAT', 'LAV'];

  data.forEach((risk, index) => {
    if (!isObject(risk)) {
      errors.push({ path: `${path}[${index}]`, message: 'Expected object', expected: 'object', received: typeof risk });
      return;
    }

    if ('category' in risk && isString(risk.category) && !validCategories.includes(risk.category)) {
      errors.push({ path: `${path}[${index}].category`, message: `Invalid category`, expected: validCategories.join(' | '), received: risk.category });
    }

    if ('riskLevel' in risk && isString(risk.riskLevel) && !validRiskLevels.includes(risk.riskLevel)) {
      errors.push({ path: `${path}[${index}].riskLevel`, message: `Invalid risk level`, expected: validRiskLevels.join(' | '), received: risk.riskLevel });
    }
  });

  return errors;
}

function validateTotalRiskScore(data: unknown, path: string): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!isObject(data)) {
    errors.push({ path, message: 'Expected object', expected: 'object', received: typeof data });
    return errors;
  }

  const required = ['score', 'maxScore', 'level', 'summary'];
  for (const field of required) {
    if (!(field in data)) {
      errors.push({ path: `${path}.${field}`, message: `Missing required field: ${field}` });
    }
  }

  return errors;
}

function validateTimelineData(data: unknown, path: string): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!isArray(data)) {
    errors.push({ path, message: 'Expected array', expected: 'array', received: typeof data });
    return errors;
  }

  const validTypes = ['Etablering', 'Regnskab', 'Struktur', 'Adresse', 'Finansiel', 'Operationel', 'Compliance'];

  data.forEach((event, index) => {
    if (!isObject(event)) {
      errors.push({ path: `${path}[${index}]`, message: 'Expected object', expected: 'object', received: typeof event });
      return;
    }

    const required = ['date', 'type', 'title', 'description', 'source'];
    for (const field of required) {
      if (!(field in event)) {
        errors.push({ path: `${path}[${index}].${field}`, message: `Missing required field: ${field}` });
      }
    }

    if ('type' in event && isString(event.type) && !validTypes.includes(event.type)) {
      errors.push({ path: `${path}[${index}].type`, message: `Invalid type`, expected: validTypes.join(' | '), received: event.type });
    }
  });

  return errors;
}

function validateActionsData(data: unknown, path: string): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!isArray(data)) {
    errors.push({ path, message: 'Expected array', expected: 'array', received: typeof data });
    return errors;
  }

  const validCategories = ['Juridisk', 'Efterretning', 'Finansiel', 'Kommerciel', 'Regulatorisk', 'Governance', 'Strategisk'];
  const validPriorities = ['Påkrævet', 'Høj', 'Middel'];
  const validStatuses = ['Ikke startet', 'I gang', 'Afsluttet'];

  data.forEach((action, index) => {
    if (!isObject(action)) {
      errors.push({ path: `${path}[${index}]`, message: 'Expected object', expected: 'object', received: typeof action });
      return;
    }

    const required = ['id', 'title', 'category', 'priority', 'description', 'evidenceType', 'status'];
    for (const field of required) {
      if (!(field in action)) {
        errors.push({ path: `${path}[${index}].${field}`, message: `Missing required field: ${field}` });
      }
    }

    if ('category' in action && isString(action.category) && !validCategories.includes(action.category)) {
      errors.push({ path: `${path}[${index}].category`, message: `Invalid category`, expected: validCategories.join(' | '), received: action.category });
    }

    if ('priority' in action && isString(action.priority) && !validPriorities.includes(action.priority)) {
      errors.push({ path: `${path}[${index}].priority`, message: `Invalid priority`, expected: validPriorities.join(' | '), received: action.priority });
    }

    if ('status' in action && isString(action.status) && !validStatuses.includes(action.status)) {
      errors.push({ path: `${path}[${index}].status`, message: `Invalid status`, expected: validStatuses.join(' | '), received: action.status });
    }
  });

  return errors;
}

function validateHypothesesData(data: unknown, path: string): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!isArray(data)) {
    errors.push({ path, message: 'Expected array', expected: 'array', received: typeof data });
    return errors;
  }

  data.forEach((hypothesis, index) => {
    if (!isObject(hypothesis)) {
      errors.push({ path: `${path}[${index}]`, message: 'Expected object', expected: 'object', received: typeof hypothesis });
      return;
    }

    const required = ['id', 'title', 'summary', 'description', 'analysisNote', 'status', 'category', 'impact', 'evidenceLevel', 'relatedViews'];
    for (const field of required) {
      if (!(field in hypothesis)) {
        errors.push({ path: `${path}[${index}].${field}`, message: `Missing required field: ${field}` });
      }
    }
  });

  return errors;
}

function validateExecutiveSummary(data: unknown, path: string): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!isObject(data)) {
    errors.push({ path, message: 'Expected object', expected: 'object', received: typeof data });
    return errors;
  }

  const required = ['financial', 'risk', 'actions'];
  for (const field of required) {
    if (!(field in data)) {
      errors.push({ path: `${path}.${field}`, message: `Missing required field: ${field}` });
    }
  }

  return errors;
}

// ============================================================================
// Main Validator
// ============================================================================

/**
 * Validates a CaseData object against the schema.
 * Returns validation result with any errors found.
 */
export function validateCaseData(data: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (!isObject(data)) {
    return {
      valid: false,
      errors: [{ path: 'root', message: 'CaseData must be an object', expected: 'object', received: typeof data }]
    };
  }

  // Validate each required field
  errors.push(...validatePersonData(data.personData, 'personData'));
  errors.push(...validateCompaniesData(data.companiesData, 'companiesData'));
  errors.push(...validateFinancialData(data.financialData, 'financialData'));
  errors.push(...validateHypothesesData(data.hypothesesData, 'hypothesesData'));
  errors.push(...validateRiskHeatmapData(data.riskHeatmapData, 'riskHeatmapData'));
  errors.push(...validateTotalRiskScore(data.totalRiskScore, 'totalRiskScore'));
  errors.push(...validateTimelineData(data.timelineData, 'timelineData'));
  errors.push(...validateActionsData(data.actionsData, 'actionsData'));
  errors.push(...validateExecutiveSummary(data.executiveSummary, 'executiveSummary'));

  // Check for required array fields
  const arrayFields = [
    'relationRiskData',
    'cashflowYearlyData',
    'sectorBenchmarkYearlyData',
    'sectorComparisonData',
    'sectorDriversData',
    'macroRiskData',
    'networkNodes',
    'networkEdges',
    'counterpartiesData',
    'scenariosData'
  ];

  for (const field of arrayFields) {
    if (!(field in data)) {
      errors.push({ path: field, message: `Missing required field: ${field}` });
    } else if (!isArray(data[field])) {
      errors.push({ path: field, message: 'Expected array', expected: 'array', received: typeof data[field] });
    }
  }

  // Check cashflowSummary
  if (!('cashflowSummary' in data)) {
    errors.push({ path: 'cashflowSummary', message: 'Missing required field: cashflowSummary' });
  } else if (!isObject(data.cashflowSummary)) {
    errors.push({ path: 'cashflowSummary', message: 'Expected object', expected: 'object', received: typeof data.cashflowSummary });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Type guard that validates and narrows the type.
 */
export function isCaseData(data: unknown): data is CaseData {
  return validateCaseData(data).valid;
}

/**
 * Validates CaseData and throws if invalid.
 */
export function assertCaseData(data: unknown): asserts data is CaseData {
  const result = validateCaseData(data);
  if (!result.valid) {
    const errorMessages = result.errors.map(e => `${e.path}: ${e.message}`).join('\n');
    throw new Error(`Invalid CaseData:\n${errorMessages}`);
  }
}
