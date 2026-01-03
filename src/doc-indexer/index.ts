/**
 * Doc Indexer
 * 扫描、解析、索引所有 Feature 文档
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as YAML from 'yaml';
import { scanFeatureFiles, extractDomain } from './scanner.js';
import { parseFeatureFile } from './parser.js';
import {
  validateFeature,
  validateDependencies,
  summarizeValidation,
  type ValidatorContext
} from './validator.js';
import type {
  FeatureIndex,
  IndexResult,
  DomainSummary,
  IndexStats,
  ValidationIssue
} from '../types.js';

/**
 * 执行完整的文档索引流程
 * @param basePath 项目根目录
 * @returns 索引结果
 */
export async function indexFeatures(basePath: string): Promise<IndexResult> {
  const allIssues: ValidationIssue[] = [];

  // Step 1: 扫描文件
  const scanResult = await scanFeatureFiles(basePath);
  for (const err of scanResult.errors) {
    allIssues.push({
      rule: 'scan-error',
      severity: 'error',
      file: basePath,
      message: err
    });
  }

  // Step 2: 获取注册的 Domains
  const registeredDomains = await getRegisteredDomains(basePath);

  // Step 3: 解析所有文件
  const features: FeatureIndex[] = [];
  const ctx: ValidatorContext = {
    allIds: new Set(),
    registeredDomains
  };

  for (const filePath of scanResult.files) {
    const parseResult = await parseFeatureFile(filePath);

    if (!parseResult.success || !parseResult.feature) {
      allIssues.push({
        rule: 'parse-error',
        severity: 'error',
        file: filePath,
        message: parseResult.error || '解析失败'
      });
      continue;
    }

    // 补充 domain（如果未指定，从路径推断）
    const feature = parseResult.feature;
    if (!feature.domain) {
      feature.domain = extractDomain(filePath, basePath);
    }

    // Step 4: 验证 Schema
    const featureIssues = validateFeature(feature, ctx);
    allIssues.push(...featureIssues);

    // 记录 ID（用于唯一性检查）
    if (feature.id) {
      ctx.allIds.add(feature.id);
    }

    // 添加到列表（即使有错误也添加，以便后续分析）
    features.push(feature as FeatureIndex);
  }

  // Step 5: 验证依赖存在性
  const depIssues = validateDependencies(features);
  allIssues.push(...depIssues);

  // Step 6: 计算反向链接
  calculateReverseLinks(features);

  // Step 7: 按 Domain 分组
  const domains = groupByDomain(features, registeredDomains);

  // Step 8: 计算统计信息
  const stats = calculateStats(features, allIssues);

  // Step 9: 汇总验证结果
  const validation = summarizeValidation(allIssues);

  return {
    features,
    domains,
    stats,
    validation
  };
}

/**
 * 获取 product_context.md 中注册的 Domains
 */
async function getRegisteredDomains(basePath: string): Promise<string[]> {
  try {
    const contextPath = path.join(basePath, 'docs/product_context.md');
    const content = await fs.readFile(contextPath, 'utf-8');

    const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!frontmatterMatch) return [];

    const parsed = YAML.parse(frontmatterMatch[1]);
    if (parsed?.domains && Array.isArray(parsed.domains)) {
      return parsed.domains.map((d: { id: string }) => d.id);
    }

    return [];
  } catch {
    return [];
  }
}

/**
 * 计算反向链接
 */
function calculateReverseLinks(features: FeatureIndex[]): void {
  // 初始化
  for (const feature of features) {
    feature.computed = { requiredBy: [], blockedBy: [] };
  }

  // 构建 ID -> Feature 映射
  const featureMap = new Map(features.map(f => [f.id, f]));

  // 计算反向链接
  for (const feature of features) {
    // 处理 requires 关系
    for (const depId of feature.dependencies.requires) {
      const dep = featureMap.get(depId);
      if (dep) {
        dep.computed.requiredBy.push(feature.id);
      }
    }

    // 处理 blocks 关系
    for (const blockId of feature.dependencies.blocks) {
      const blocked = featureMap.get(blockId);
      if (blocked) {
        blocked.computed.blockedBy.push(feature.id);
      }
    }
  }
}

/**
 * 按 Domain 分组
 */
function groupByDomain(
  features: FeatureIndex[],
  registeredDomains: string[]
): DomainSummary[] {
  const domainMap = new Map<string, FeatureIndex[]>();

  // 分组
  for (const feature of features) {
    const domain = feature.domain || 'unknown';
    if (!domainMap.has(domain)) {
      domainMap.set(domain, []);
    }
    domainMap.get(domain)!.push(feature);
  }

  // 转换为 DomainSummary
  const summaries: DomainSummary[] = [];
  for (const [id, domainFeatures] of domainMap) {
    summaries.push({
      id,
      description: '',  // TODO: 从 product_context.md 获取
      featureCount: domainFeatures.length,
      features: domainFeatures
    });
  }

  return summaries;
}

/**
 * 计算统计信息
 */
function calculateStats(
  features: FeatureIndex[],
  issues: ValidationIssue[]
): IndexStats {
  const byStatus: Record<string, number> = {};
  const byPriority: Record<string, number> = {};
  let analyzedCount = 0;

  for (const feature of features) {
    // 按状态统计
    byStatus[feature.status] = (byStatus[feature.status] || 0) + 1;

    // 按优先级统计
    byPriority[feature.priority] = (byPriority[feature.priority] || 0) + 1;

    // 已分析数量
    if (feature.analyzed) {
      analyzedCount++;
    }
  }

  // 有效数量（无 error 的 Feature）
  const errorFiles = new Set(
    issues.filter(i => i.severity === 'error').map(i => i.file)
  );
  const validCount = features.filter(f => !errorFiles.has(f.filePath)).length;

  return {
    total: features.length,
    byStatus,
    byPriority,
    analyzedCount,
    validCount
  };
}

/**
 * 格式化输出索引结果
 */
export function formatIndexResult(result: IndexResult): string {
  const lines: string[] = [];

  lines.push('=== Feature Index ===');
  lines.push('');

  // 验证摘要
  const { errors, warnings } = result.validation;
  lines.push(`Validation: ${errors.length} errors, ${warnings.length} warnings`);

  // 显示错误
  if (errors.length > 0) {
    lines.push('');
    lines.push('Errors:');
    for (const err of errors) {
      lines.push(`  [${err.rule}] ${err.message}`);
      lines.push(`    - ${err.file}`);
    }
  }

  // 显示警告
  if (warnings.length > 0) {
    lines.push('');
    lines.push('Warnings:');
    for (const warn of warnings) {
      lines.push(`  [${warn.rule}] ${warn.message}`);
    }
  }

  lines.push('');
  lines.push('---');

  // 按 Domain 显示
  for (const domain of result.domains) {
    lines.push('');
    lines.push(`Domain: ${domain.id} (${domain.featureCount} features)`);
    lines.push('| ID | Status | Priority | RequiredBy |');
    lines.push('|----|--------|----------|------------|');

    for (const feature of domain.features) {
      const requiredBy = feature.computed.requiredBy.length > 0
        ? feature.computed.requiredBy.join(', ')
        : '(none)';
      lines.push(`| ${feature.id} | ${feature.status} | ${feature.priority} | ${requiredBy} |`);
    }
  }

  // 统计信息
  lines.push('');
  lines.push('Stats:');
  lines.push(`- Total: ${result.stats.total} features`);

  const statusStr = Object.entries(result.stats.byStatus)
    .map(([k, v]) => `${k}(${v})`)
    .join(', ');
  lines.push(`- By Status: ${statusStr}`);

  const priorityStr = Object.entries(result.stats.byPriority)
    .map(([k, v]) => `${k}(${v})`)
    .join(', ');
  lines.push(`- By Priority: ${priorityStr}`);

  lines.push(`- Analyzed: ${result.stats.analyzedCount}/${result.stats.total}`);
  lines.push(`- Valid: ${result.stats.validCount}/${result.stats.total}`);

  return lines.join('\n');
}

// 导出所有子模块
export * from './scanner.js';
export * from './parser.js';
export * from './validator.js';
