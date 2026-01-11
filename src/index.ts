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
import type { Task, IndexResult, DependencyGraph } from './types.js';
import {
  queryTasks,
  createTask,
  updateTask,
  deleteTask,
  getExecutableTasks
} from './task-manager/index.js';
import type { TaskType, TaskStatus, TaskSource } from './types.js';

// 获取项目根目录
function getBasePath(): string {
  // 从 src 目录向上一级
  return path.resolve(process.cwd(), '..');
}

// 获取待分析需求任务
async function getPendingRequirements(): Promise<Task[]> {
  const basePath = getBasePath();
  return queryTasks(basePath, { type: 'analyze_requirement', status: 'pending' });
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

  // 获取待分析需求
  const pendingRequirements = await getPendingRequirements();

  // 执行门控检查
  const gateResult = checkRToD(featureId, graph, pendingRequirements);
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

// ============ Task Commands ============

/**
 * 解析命令行参数
 */
function parseArgs(args: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      result[key] = value || 'true';
    }
  }
  return result;
}

/**
 * task list 命令
 */
async function taskListCommand(basePath: string, args: string[]): Promise<void> {
  const params = parseArgs(args);

  const filter: { type?: TaskType; status?: TaskStatus } = {};
  if (params.type) filter.type = params.type as TaskType;
  if (params.status) filter.status = params.status as TaskStatus;

  const tasks = await queryTasks(basePath, Object.keys(filter).length > 0 ? filter : undefined);

  if (tasks.length === 0) {
    console.log('No tasks found.');
    return;
  }

  // 按优先级排序
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3, undefined: 4 };
  tasks.sort((a, b) => {
    const pa = priorityOrder[a.priority || 'undefined'];
    const pb = priorityOrder[b.priority || 'undefined'];
    return pa - pb;
  });

  console.log('=== Task List ===\n');
  console.log('| ID | Type | Title | Status | Priority | Source |');
  console.log('|----|------|-------|--------|----------|--------|');

  for (const task of tasks) {
    const priority = task.priority || '-';
    const source = task.source || '-';
    console.log(`| ${task.id} | ${task.type} | ${task.title} | ${task.status} | ${priority} | ${source} |`);
  }

  console.log(`\nTotal: ${tasks.length} task(s)`);
}

/**
 * task add 命令
 */
async function taskAddCommand(basePath: string, args: string[]): Promise<void> {
  const params = parseArgs(args);

  if (!params.type || !params.title) {
    console.error('Error: --type and --title are required');
    console.log('Usage: task add --type=analyze_requirement --title="Task title" [--priority=high] [--source=feat-xxx]');
    return;
  }

  const result = await createTask(basePath, {
    type: params.type as TaskType,
    title: params.title,
    description: params.description,
    generatedBy: (params.generatedBy as TaskSource) || 'manual'
  });

  if (result.success && result.data) {
    // 如果有 priority 和 source，需要更新
    if (params.priority || params.source) {
      const task = result.data;
      task.priority = params.priority as Task['priority'];
      task.source = params.source;
      // 直接修改存储
      const store = await import('./task-manager/store.js');
      const taskStore = await store.loadStore(basePath);
      const idx = taskStore.tasks.findIndex(t => t.id === task.id);
      if (idx !== -1) {
        taskStore.tasks[idx] = task;
        await store.saveStore(basePath, taskStore);
      }
    }
    console.log(`✅ Task created: ${result.data.id}`);
    console.log(`   Type: ${result.data.type}`);
    console.log(`   Title: ${result.data.title}`);
  } else {
    console.error(`❌ Failed to create task: ${result.error}`);
  }
}

/**
 * task done 命令
 */
async function taskDoneCommand(basePath: string, taskId: string): Promise<void> {
  if (!taskId) {
    console.error('Error: Task ID is required');
    console.log('Usage: task done <task-id>');
    return;
  }

  const result = await updateTask(basePath, taskId, { status: 'done' });

  if (result.success) {
    console.log(`✅ Task marked as done: ${taskId}`);
  } else {
    console.error(`❌ Failed to update task: ${result.error}`);
  }
}

/**
 * task delete 命令
 */
async function taskDeleteCommand(basePath: string, taskId: string): Promise<void> {
  if (!taskId) {
    console.error('Error: Task ID is required');
    console.log('Usage: task delete <task-id>');
    return;
  }

  const result = await deleteTask(basePath, taskId);

  if (result.success) {
    console.log(`✅ Task deleted: ${taskId}`);
  } else {
    console.error(`❌ Failed to delete task: ${result.error}`);
  }
}

/**
 * task stats 命令
 */
async function taskStatsCommand(basePath: string): Promise<void> {
  const allTasks = await queryTasks(basePath);
  const executableTasks = await getExecutableTasks(basePath);

  // 统计
  const byStatus: Record<string, number> = {};
  const byType: Record<string, number> = {};
  const byPriority: Record<string, number> = {};

  for (const task of allTasks) {
    byStatus[task.status] = (byStatus[task.status] || 0) + 1;
    byType[task.type] = (byType[task.type] || 0) + 1;
    if (task.priority) {
      byPriority[task.priority] = (byPriority[task.priority] || 0) + 1;
    }
  }

  console.log('=== Task Statistics ===\n');
  console.log(`Total: ${allTasks.length} task(s)`);
  console.log(`Executable (deps satisfied): ${executableTasks.length}`);
  console.log('');

  console.log('By Status:');
  for (const [status, count] of Object.entries(byStatus)) {
    console.log(`  ${status}: ${count}`);
  }
  console.log('');

  console.log('By Type:');
  for (const [type, count] of Object.entries(byType)) {
    console.log(`  ${type}: ${count}`);
  }

  if (Object.keys(byPriority).length > 0) {
    console.log('');
    console.log('By Priority:');
    for (const [priority, count] of Object.entries(byPriority)) {
      console.log(`  ${priority}: ${count}`);
    }
  }

  // R→D 门控状态
  const pendingRequirements = allTasks.filter(
    t => t.type === 'analyze_requirement' && t.status === 'pending'
  );
  console.log('');
  console.log('=== R→D Gate Status ===');
  if (pendingRequirements.length === 0) {
    console.log('✅ No pending requirements - can proceed to Design phase');
  } else {
    console.log(`⚠️  ${pendingRequirements.length} pending requirement(s) - must analyze before Design:`);
    for (const task of pendingRequirements) {
      console.log(`   - ${task.id}: ${task.title}`);
    }
  }
}

/**
 * task 命令路由
 */
async function taskCommand(basePath: string, subCommand: string, args: string[]): Promise<void> {
  switch (subCommand) {
    case 'list':
      await taskListCommand(basePath, args);
      break;
    case 'add':
      await taskAddCommand(basePath, args);
      break;
    case 'done':
      await taskDoneCommand(basePath, args[0]);
      break;
    case 'delete':
      await taskDeleteCommand(basePath, args[0]);
      break;
    case 'stats':
      await taskStatsCommand(basePath);
      break;
    default:
      console.log('Task Manager Commands:');
      console.log('');
      console.log('  task list [--type=xxx] [--status=xxx]');
      console.log('    List tasks with optional filters');
      console.log('');
      console.log('  task add --type=xxx --title="xxx" [--priority=xxx] [--source=xxx]');
      console.log('    Create a new task');
      console.log('    Types: analyze_requirement, new_feature, change_feature, bug_fix, etc.');
      console.log('');
      console.log('  task done <task-id>');
      console.log('    Mark a task as done');
      console.log('');
      console.log('  task delete <task-id>');
      console.log('    Delete a task');
      console.log('');
      console.log('  task stats');
      console.log('    Show task statistics and R→D gate status');
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

    case 'task':
      await taskCommand(basePath, args[1], args.slice(2));
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
      console.log('');
      console.log('  task <subcommand>           Task management');
      console.log('    task list                 List all tasks');
      console.log('    task add                  Create a new task');
      console.log('    task done <id>            Mark task as done');
      console.log('    task stats                Show statistics');
  }
}

main().catch(console.error);

// 导出供其他模块使用
export * from './types.js';
export * from './doc-indexer/index.js';
export * from './dependency-graph/index.js';
