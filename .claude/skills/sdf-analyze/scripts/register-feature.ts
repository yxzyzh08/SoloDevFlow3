#!/usr/bin/env npx ts-node
/**
 * register-feature.ts
 *
 * 将 Feature 注册到 Domain 的 index.md
 *
 * Usage: npx ts-node register-feature.ts <domain> <feature-id>
 * Example: npx ts-node register-feature.ts DocSystem doc-indexer
 */

import * as fs from 'fs';
import * as path from 'path';

// 简单的 YAML frontmatter 解析（避免外部依赖）
function parseFrontmatter(content: string): Record<string, unknown> | null {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;

  const yamlContent = match[1];
  const result: Record<string, unknown> = {};

  // 简单解析 key: value 格式
  const lines = yamlContent.split('\n');
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      let value: unknown = line.slice(colonIndex + 1).trim();

      // 处理布尔值
      if (value === 'true') value = true;
      else if (value === 'false') value = false;

      result[key] = value;
    }
  }

  return result;
}

// 提取文档标题作为 name（在 frontmatter 之后查找）
function extractTitle(content: string): string {
  // 先移除 frontmatter，只在正文中搜索标题
  const withoutFrontmatter = content.replace(/^---[\s\S]*?---/, '');
  const match = withoutFrontmatter.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : 'Unknown';
}

// 解析 index.md 的 features 数组
function parseIndexFeatures(content: string): {
  frontmatterStart: number;
  frontmatterEnd: number;
  features: Array<{
    id: string;
    name: string;
    status: string;
    priority: string;
    path: string;
  }>;
  rawYaml: string;
} {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    throw new Error('index.md 缺少 YAML frontmatter');
  }

  const frontmatterStart = 4; // "---\n" length
  const frontmatterEnd = match.index! + match[0].length;
  const rawYaml = match[1];

  // 解析 features 数组
  const features: Array<{
    id: string;
    name: string;
    status: string;
    priority: string;
    path: string;
  }> = [];

  // 匹配 features 数组中的每个条目
  const featuresMatch = rawYaml.match(/features:\s*\n((?:\s+-[\s\S]*?)*)(?=\n\w|$)/);
  if (featuresMatch) {
    const featuresBlock = featuresMatch[1];
    const entryRegex = /-\s+id:\s*(\S+)\s*\n\s+name:\s*(.+)\s*\n\s+status:\s*(\S+)\s*\n\s+priority:\s*(\S+)\s*\n\s+path:\s*(\S+)/g;

    let entryMatch;
    while ((entryMatch = entryRegex.exec(featuresBlock)) !== null) {
      features.push({
        id: entryMatch[1],
        name: entryMatch[2].trim(),
        status: entryMatch[3],
        priority: entryMatch[4],
        path: entryMatch[5]
      });
    }
  }

  return { frontmatterStart, frontmatterEnd, features, rawYaml };
}

// 生成 features YAML 块
function generateFeaturesYaml(features: Array<{
  id: string;
  name: string;
  status: string;
  priority: string;
  path: string;
}>): string {
  if (features.length === 0) {
    return 'features: []';
  }

  const lines = ['features:'];
  for (const f of features) {
    lines.push(`  - id: ${f.id}`);
    lines.push(`    name: ${f.name}`);
    lines.push(`    status: ${f.status}`);
    lines.push(`    priority: ${f.priority}`);
    lines.push(`    path: ${f.path}`);
  }
  return lines.join('\n');
}

// 更新 index.md 的 features
function updateIndexContent(
  content: string,
  features: Array<{
    id: string;
    name: string;
    status: string;
    priority: string;
    path: string;
  }>
): string {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    throw new Error('index.md 缺少 YAML frontmatter');
  }

  const rawYaml = match[1];
  const newFeaturesYaml = generateFeaturesYaml(features);

  // 替换 features 部分
  let newYaml: string;
  if (/features:\s*\[?\]?/.test(rawYaml)) {
    // 已有 features 字段，替换它
    newYaml = rawYaml.replace(/features:[\s\S]*?(?=\n\w|$)/, newFeaturesYaml);
  } else {
    // 没有 features 字段，添加
    newYaml = rawYaml.trimEnd() + '\n' + newFeaturesYaml;
  }

  return content.replace(match[0], `---\n${newYaml}\n---`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: npx ts-node register-feature.ts <domain> <feature-id>');
    console.error('Example: npx ts-node register-feature.ts DocSystem doc-indexer');
    process.exit(1);
  }

  const [domain, featureId] = args;
  const fullFeatureId = featureId.startsWith('feat-') ? featureId : `feat-${featureId}`;
  const featureFileName = fullFeatureId + '.md';

  // 获取项目根目录（向上查找直到找到 .claude 目录）
  let projectRoot = process.cwd();
  while (!fs.existsSync(path.join(projectRoot, '.claude'))) {
    const parent = path.dirname(projectRoot);
    if (parent === projectRoot) {
      console.error('Error: Cannot find project root (.claude directory)');
      process.exit(1);
    }
    projectRoot = parent;
  }

  // 构建路径
  const featurePath = path.join(projectRoot, 'docs/requirements', domain, featureFileName);
  const indexPath = path.join(projectRoot, 'docs/requirements', domain, 'index.md');

  // 检查 Feature 文件是否存在
  if (!fs.existsSync(featurePath)) {
    console.error(`Error: Feature file not found: ${featurePath}`);
    process.exit(1);
  }

  // 检查 index.md 是否存在
  if (!fs.existsSync(indexPath)) {
    console.error(`Error: Domain index not found: ${indexPath}`);
    process.exit(1);
  }

  // 读取 Feature 文件
  const featureContent = fs.readFileSync(featurePath, 'utf-8');
  const frontmatter = parseFrontmatter(featureContent);

  if (!frontmatter) {
    console.error(`Error: Cannot parse frontmatter from ${featurePath}`);
    process.exit(1);
  }

  // 提取信息
  const id = (frontmatter.id as string) || fullFeatureId;
  const name = extractTitle(featureContent);
  const status = (frontmatter.status as string) || 'proposed';
  const priority = (frontmatter.priority as string) || 'medium';

  // 完整项目路径（从项目根目录开始）
  const relativePath = `docs/requirements/${domain}/${featureFileName}`;

  // 读取并更新 index.md
  const indexContent = fs.readFileSync(indexPath, 'utf-8');
  const { features } = parseIndexFeatures(indexContent);

  // 查找是否已存在
  const existingIndex = features.findIndex(f => f.id === id);

  const newEntry = {
    id,
    name,
    status,
    priority,
    path: relativePath
  };

  if (existingIndex >= 0) {
    // 更新已存在的条目
    features[existingIndex] = newEntry;
    console.log(`Updated ${id} in ${domain}/index.md`);
  } else {
    // 添加新条目
    features.push(newEntry);
    console.log(`Registered ${id} to ${domain}/index.md`);
  }

  // 写回 index.md
  const newContent = updateIndexContent(indexContent, features);
  fs.writeFileSync(indexPath, newContent, 'utf-8');

  console.log(`  path: ${relativePath}`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
