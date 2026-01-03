/**
 * Validator Component
 * 验证 Frontmatter 符合 Schema 规范
 */

import type { FeatureIndex, ValidationResult, ValidationIssue } from '../types.js';

// 有效的状态值
const VALID_STATUSES = [
  'backlog', 'proposed', 'analyzing', 'analyzed',
  'waiting-deps', 'ready-for-design', 'designing',
  'implementing', 'testing', 'done', 'blocked'
];

// 有效的类型值
const VALID_TYPES = ['feature', 'bug', 'enhancement'];

// 有效的优先级值
const VALID_PRIORITIES = ['critical', 'high', 'medium', 'low'];

// ID 格式正则
const ID_PATTERN = /^(feat|bug|enh)-[\w-]+$/;

export interface ValidatorContext {
  allIds: Set<string>;
  registeredDomains: string[];
}

/**
 * 验证单个 Feature
 * @param feature 待验证的 Feature
 * @param ctx 验证上下文
 * @returns 验证问题列表
 */
export function validateFeature(
  feature: Partial<FeatureIndex>,
  ctx: ValidatorContext
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const file = feature.filePath || 'unknown';

  // Rule: id-required
  if (!feature.id) {
    issues.push({
      rule: 'id-required',
      severity: 'error',
      file,
      message: 'id 字段必须存在'
    });
  } else {
    // Rule: id-format
    if (!ID_PATTERN.test(feature.id)) {
      issues.push({
        rule: 'id-format',
        severity: 'error',
        file,
        message: `id 格式错误: "${feature.id}"，必须以 feat-/bug-/enh- 开头`
      });
    }

    // Rule: id-unique (检查重复)
    if (ctx.allIds.has(feature.id)) {
      issues.push({
        rule: 'id-unique',
        severity: 'error',
        file,
        message: `id "${feature.id}" 重复`
      });
    }
  }

  // Rule: type-required & type-enum
  if (!feature.type) {
    issues.push({
      rule: 'type-required',
      severity: 'error',
      file,
      message: 'type 字段必须存在'
    });
  } else if (!VALID_TYPES.includes(feature.type)) {
    issues.push({
      rule: 'type-enum',
      severity: 'error',
      file,
      message: `type 值无效: "${feature.type}"，必须是 ${VALID_TYPES.join('/')}`
    });
  }

  // Rule: domain-required & domain-registered
  if (!feature.domain) {
    issues.push({
      rule: 'domain-required',
      severity: 'error',
      file,
      message: 'domain 字段必须存在'
    });
  } else if (ctx.registeredDomains.length > 0 && !ctx.registeredDomains.includes(feature.domain)) {
    issues.push({
      rule: 'domain-registered',
      severity: 'error',
      file,
      message: `domain "${feature.domain}" 未在 product_context.md 注册`
    });
  }

  // Rule: status-required & status-enum
  if (!feature.status) {
    issues.push({
      rule: 'status-required',
      severity: 'error',
      file,
      message: 'status 字段必须存在'
    });
  } else if (!VALID_STATUSES.includes(feature.status)) {
    issues.push({
      rule: 'status-enum',
      severity: 'error',
      file,
      message: `status 值无效: "${feature.status}"，有效值: ${VALID_STATUSES.join(', ')}`
    });
  }

  // Rule: priority-required & priority-enum
  if (!feature.priority) {
    issues.push({
      rule: 'priority-required',
      severity: 'error',
      file,
      message: 'priority 字段必须存在'
    });
  } else if (!VALID_PRIORITIES.includes(feature.priority)) {
    issues.push({
      rule: 'priority-enum',
      severity: 'error',
      file,
      message: `priority 值无效: "${feature.priority}"，必须是 ${VALID_PRIORITIES.join('/')}`
    });
  }

  // Rule: summary-required
  if (!feature.summary) {
    issues.push({
      rule: 'summary-required',
      severity: 'error',
      file,
      message: 'summary 字段必须存在'
    });
  } else {
    // Rule: summary-length (warning)
    const len = feature.summary.length;
    if (len < 10 || len > 100) {
      issues.push({
        rule: 'summary-length',
        severity: 'warning',
        file,
        message: `summary 长度建议 10-100 字符，当前 ${len} 字符`
      });
    }
  }

  // Rule: tags-recommended (warning)
  if (!feature.tags || feature.tags.length === 0) {
    issues.push({
      rule: 'tags-recommended',
      severity: 'warning',
      file,
      message: '建议添加 tags 字段'
    });
  }

  return issues;
}

/**
 * 验证依赖存在性
 * @param features 所有 Feature
 * @returns 验证问题列表
 */
export function validateDependencies(features: FeatureIndex[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const allIds = new Set(features.map(f => f.id));

  for (const feature of features) {
    for (const depId of feature.dependencies.requires) {
      if (!allIds.has(depId)) {
        issues.push({
          rule: 'deps-exist',
          severity: 'warning',
          file: feature.filePath,
          message: `依赖 "${depId}" 不存在`
        });
      }
    }
  }

  return issues;
}

/**
 * 汇总验证结果
 * @param issues 所有验证问题
 * @returns 验证结果
 */
export function summarizeValidation(issues: ValidationIssue[]): ValidationResult {
  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
