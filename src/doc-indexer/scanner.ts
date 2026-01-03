/**
 * Scanner Component
 * 扫描 docs/requirements/ 目录下所有 Feature 文件
 */

import { glob } from 'glob';
import * as path from 'path';

export interface ScanResult {
  files: string[];
  errors: string[];
}

/**
 * 扫描 Feature 文件
 * @param basePath 项目根目录
 * @returns 扫描结果
 */
export async function scanFeatureFiles(basePath: string): Promise<ScanResult> {
  const errors: string[] = [];

  try {
    const pattern = path.join(basePath, 'docs/requirements/**/feat-*.md');
    const files = await glob(pattern, {
      nodir: true,
      windowsPathsNoEscape: true
    });

    // 过滤掉 index.md 和 backlog.md（虽然 glob 模式已经排除）
    const filteredFiles = files.filter(f => {
      const basename = path.basename(f);
      return !['index.md', 'backlog.md'].includes(basename);
    });

    return {
      files: filteredFiles,
      errors
    };
  } catch (err) {
    errors.push(`扫描失败: ${err instanceof Error ? err.message : String(err)}`);
    return { files: [], errors };
  }
}

/**
 * 从文件路径提取 Domain
 * @param filePath 文件路径
 * @param basePath 项目根目录
 * @returns Domain ID
 */
export function extractDomain(filePath: string, basePath: string): string {
  const relativePath = path.relative(basePath, filePath);
  const parts = relativePath.split(path.sep);
  // docs/requirements/<domain>/feat-xxx.md
  if (parts.length >= 3 && parts[0] === 'docs' && parts[1] === 'requirements') {
    return parts[2];
  }
  return 'unknown';
}
