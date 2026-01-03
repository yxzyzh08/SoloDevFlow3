/**
 * SoloDevFlow CLI
 * AI-First 开发框架命令行工具
 */

import * as path from 'path';
import * as fs from 'fs/promises';
import { indexFeatures, formatIndexResult } from './doc-indexer/index.js';
import {
  buildGraph,
  formatGraph,
  topologicalSort,
  formatTopologicalOrder,
  detectCycles,
  checkRToD,
  formatGateCheckResult
} from './dependency-graph/index.js';
import type { BacklogItem, IndexResult, DependencyGraph } from './types.js';

// 获取项目根目录
function getBasePath(): string {
  // 从 src 目录向上一级
  return path.resolve(process.cwd(), '..');
}

// 模拟读取 backlog（实际实现需要解析 backlog.md）
async function getBacklog(): Promise<BacklogItem[]> {
  // TODO: 实现从 backlog.md 解析
  return [];
}

// ============ Export Functions ============

/**
 * 生成完整的 Markdown 报告
 */
function generateFullReport(
  result: IndexResult,
  graph: DependencyGraph
): string {
  const lines: string[] = [];
  const now = new Date().toISOString().split('T')[0];

  // Header
  lines.push('---');
  lines.push('type: generated');
  lines.push('description: Feature 索引和依赖图（自动生成）');
  lines.push(`generated_at: ${now}`);
  lines.push('---');
  lines.push('');
  lines.push('# Feature Index & Dependency Graph');
  lines.push('');
  lines.push('> 本文件由 `node dist/index.js status --export` 自动生成，请勿手动编辑。');
  lines.push('');

  // Part 1: Feature Index
  lines.push('## 1. Feature Index');
  lines.push('');
  lines.push(formatIndexResult(result));
  lines.push('');

  // Part 2: Dependency Graph
  lines.push('## 2. Dependency Graph');
  lines.push('');
  lines.push('```');
  lines.push(formatGraph(graph));
  lines.push('```');
  lines.push('');

  // Part 3: Execution Order
  const sortResult = topologicalSort(graph);
  lines.push('## 3. Execution Order');
  lines.push('');
  lines.push('```');
  lines.push(formatTopologicalOrder(sortResult, graph));
  lines.push('```');
  lines.push('');

  // Part 4: Cycle Detection
  const cycleResult = detectCycles(graph);
  lines.push('## 4. Cycle Detection');
  lines.push('');
  if (cycleResult.hasCycle) {
    lines.push(`**Warning**: Found ${cycleResult.cycles.length} cycle(s):`);
    lines.push('');
    cycleResult.cycles.forEach((cycle, i) => {
      lines.push(`${i + 1}. \`${cycle.join(' → ')}\``);
    });
  } else {
    lines.push('**Status**: No circular dependencies found.');
  }
  lines.push('');

  // Part 5: Gate Check Status
  lines.push('## 5. Gate Check Status');
  lines.push('');
  lines.push('| Feature | Can Proceed to Design | Blockers |');
  lines.push('|---------|----------------------|----------|');

  for (const feature of result.features) {
    const gateResult = checkRToD(feature.id, graph, []);
    const status = gateResult.canProceed ? '✅ Yes' : '❌ No';
    const blockers = gateResult.blockers.length > 0
      ? gateResult.blockers.join('; ')
      : '-';
    lines.push(`| ${feature.id} | ${status} | ${blockers} |`);
  }
  lines.push('');

  return lines.join('\n');
}

/**
 * 导出报告到文件
 */
async function exportReport(basePath: string, content: string): Promise<string> {
  const outputDir = path.join(basePath, '.solodevflow', 'index');
  const outputFile = path.join(outputDir, 'feature-index.md');

  // 确保目录存在
  await fs.mkdir(outputDir, { recursive: true });

  // 写入文件
  await fs.writeFile(outputFile, content, 'utf-8');

  return outputFile;
}

// ============ Commands ============

/**
 * /status 命令实现
 */
async function statusCommand(basePath: string, args: string[]): Promise<void> {
  console.log('Scanning feature documents...\n');

  const result = await indexFeatures(basePath);
  const graph = buildGraph(result.features);

  // 如果指定了 --export，导出完整报告到文件
  if (args.includes('--export')) {
    const report = generateFullReport(result, graph);
    const outputFile = await exportReport(basePath, report);
    console.log(`Exported to: ${outputFile}`);
    console.log('');
  }

  // 显示索引
  console.log(formatIndexResult(result));

  // 如果指定了 --graph，显示依赖图
  if (args.includes('--graph')) {
    console.log('\n');
    console.log(formatGraph(graph));
  }

  // 如果指定了 --order，显示拓扑排序
  if (args.includes('--order')) {
    const sortResult = topologicalSort(graph);
    console.log('\n');
    console.log(formatTopologicalOrder(sortResult, graph));
  }
}

/**
 * /next 命令实现
 */
async function nextCommand(
  basePath: string,
  featureId: string,
  args: string[]
): Promise<void> {
  if (!featureId) {
    console.error('Error: 请指定 Feature ID');
    console.log('Usage: npm run next <feature-id> [--force]');
    return;
  }

  console.log(`Checking gate conditions for ${featureId}...\n`);

  // 获取索引数据
  const result = await indexFeatures(basePath);
  const graph = buildGraph(result.features);

  // 获取 backlog
  const backlog = await getBacklog();

  // 执行门控检查
  const gateResult = checkRToD(featureId, graph, backlog);
  console.log(formatGateCheckResult(gateResult));

  // 如果可以推进且不是 --force
  if (gateResult.canProceed) {
    console.log('\nConfirm transition? (Y/n)');
    // TODO: 实际实现需要处理用户输入
  } else if (args.includes('--force')) {
    console.log('\n[FORCE] Skipping gate check, proceeding anyway...');
    // TODO: 更新文档状态
  }
}

/**
 * /check-cycles 命令实现
 */
async function checkCyclesCommand(basePath: string): Promise<void> {
  console.log('Checking for circular dependencies...\n');

  const result = await indexFeatures(basePath);
  const graph = buildGraph(result.features);
  const cycleResult = detectCycles(graph);

  if (cycleResult.hasCycle) {
    console.log(`Found ${cycleResult.cycles.length} cycle(s):\n`);
    cycleResult.cycles.forEach((cycle, i) => {
      console.log(`  ${i + 1}. ${cycle.join(' → ')}`);
    });
  } else {
    console.log('No circular dependencies found.');
  }
}

// ============ Main ============

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];
  const basePath = getBasePath();

  switch (command) {
    case 'status':
      await statusCommand(basePath, args.slice(1));
      break;

    case 'next':
      await nextCommand(basePath, args[1], args.slice(2));
      break;

    case 'check-cycles':
      await checkCyclesCommand(basePath);
      break;

    default:
      console.log('SoloDevFlow CLI');
      console.log('');
      console.log('Commands:');
      console.log('  status [options]            Show feature index and status');
      console.log('    --graph                   Include dependency graph');
      console.log('    --order                   Include execution order');
      console.log('    --export                  Export full report to .solodevflow/index/feature-index.md');
      console.log('');
      console.log('  next <feature-id> [--force] Check gate and transition to next phase');
      console.log('  check-cycles                Check for circular dependencies');
  }
}

main().catch(console.error);

// 导出供其他模块使用
export * from './types.js';
export * from './doc-indexer/index.js';
export * from './dependency-graph/index.js';
