/**
 * Parser Component
 * 解析 YAML Frontmatter 提取元数据
 */

import * as fs from 'fs/promises';
import * as YAML from 'yaml';
import type { FeatureIndex, FeatureDependencies, FeatureType, FeatureStatus, Priority } from '../types.js';

export interface ParseResult {
  success: boolean;
  feature?: Partial<FeatureIndex>;
  error?: string;
}

/**
 * 解析文件的 YAML Frontmatter
 * @param filePath 文件路径
 * @returns 解析结果
 */
export async function parseFeatureFile(filePath: string): Promise<ParseResult> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return parseContent(content, filePath);
  } catch (err) {
    return {
      success: false,
      error: `读取文件失败: ${err instanceof Error ? err.message : String(err)}`
    };
  }
}

/**
 * 解析文件内容的 Frontmatter
 * @param content 文件内容
 * @param filePath 文件路径（用于错误报告）
 * @returns 解析结果
 */
export function parseContent(content: string, filePath: string): ParseResult {
  // 提取 YAML Frontmatter
  const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);

  if (!frontmatterMatch) {
    return {
      success: false,
      error: '未找到 YAML Frontmatter'
    };
  }

  try {
    const yamlContent = frontmatterMatch[1];
    const parsed = YAML.parse(yamlContent);

    if (!parsed || typeof parsed !== 'object') {
      return {
        success: false,
        error: 'Frontmatter 解析结果为空或非对象'
      };
    }

    // 构建 Feature 对象
    const feature: Partial<FeatureIndex> = {
      id: parsed.id,
      type: parsed.type as FeatureType,
      domain: parsed.domain,
      status: parsed.status as FeatureStatus,
      priority: parsed.priority as Priority,
      summary: parsed.summary,
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      dependencies: normalizeDependencies(parsed.dependencies),
      analyzed: parsed.analyzed === true,
      filePath,
      created: parsed.created,
      computed: { requiredBy: [], blockedBy: [] }
    };

    return {
      success: true,
      feature
    };
  } catch (err) {
    return {
      success: false,
      error: `YAML 解析错误: ${err instanceof Error ? err.message : String(err)}`
    };
  }
}

/**
 * 规范化依赖配置
 */
function normalizeDependencies(deps: unknown): FeatureDependencies {
  if (!deps || typeof deps !== 'object') {
    return { requires: [], blocks: [] };
  }

  const d = deps as Record<string, unknown>;
  return {
    requires: Array.isArray(d.requires) ? d.requires : [],
    blocks: Array.isArray(d.blocks) ? d.blocks : []
  };
}
