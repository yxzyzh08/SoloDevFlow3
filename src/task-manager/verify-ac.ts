/**
 * AC Verification Script for feat-task-management
 * 验证所有 18 条验收标准
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { loadStore, saveStore, getStorePath } from './store';
import {
  createTask,
  updateTask,
  deleteTask,
  queryTasks,
  getExecutableTasks,
  batchCreateTasks
} from './operations';

const TEST_BASE = path.join(process.cwd(), '.test-temp');

async function cleanup() {
  try {
    await fs.rm(TEST_BASE, { recursive: true, force: true });
  } catch {}
}

async function setup() {
  await cleanup();
  await fs.mkdir(TEST_BASE, { recursive: true });
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string) {
  if (condition) {
    console.log(`  [PASS] ${name}`);
    passed++;
  } else {
    console.log(`  [FAIL] ${name}`);
    failed++;
  }
}

async function verifyAC1() {
  console.log('\n=== AC-1: Persistence ===');
  await setup();

  // 创建任务
  const result = await createTask(TEST_BASE, {
    type: 'new_feature',
    title: 'Test Task'
  });

  // AC-1.1: 文件存在
  const storePath = getStorePath(TEST_BASE);
  let fileExists = false;
  try {
    await fs.access(storePath);
    fileExists = true;
  } catch {}
  assert(fileExists, '创建任务后，.solodevflow/tasks.json 文件存在');

  // AC-1.2: 文件内容正确
  const content = JSON.parse(await fs.readFile(storePath, 'utf-8'));
  const task = content.tasks[0];
  const hasCorrectStructure = task &&
    typeof task.id === 'string' &&
    task.type === 'new_feature' &&
    task.title === 'Test Task' &&
    task.status === 'pending' &&
    typeof task.created === 'string';
  assert(hasCorrectStructure, '文件内容包含正确的 Task 结构（id, type, title, status, created）');

  // AC-1.3: 重新加载
  const reloaded = await loadStore(TEST_BASE);
  assert(reloaded.tasks.length === 1 && reloaded.tasks[0].id === task.id,
    '重新调用 loadStore() 能读取之前创建的任务');

  await cleanup();
}

async function verifyAC2() {
  console.log('\n=== AC-2: CRUD Operations ===');
  await setup();

  // AC-2.1: createTask 返回正确
  const createResult = await createTask(TEST_BASE, {
    type: 'bug_fix',
    title: 'Fix Bug'
  });
  assert(
    createResult.success &&
    createResult.data!.id.startsWith('task-') &&
    typeof createResult.data!.created === 'string',
    'createTask: 返回包含 id、created 的 Task'
  );

  const taskId = createResult.data!.id;

  // AC-2.2: updateTask 状态变更
  await updateTask(TEST_BASE, taskId, { status: 'in_progress' });
  let store = await loadStore(TEST_BASE);
  assert(store.tasks[0].status === 'in_progress', 'updateTask: 状态变更正确保存');

  // AC-2.3: updateTask 完成时填充 completed
  await updateTask(TEST_BASE, taskId, { status: 'done' });
  store = await loadStore(TEST_BASE);
  assert(typeof store.tasks[0].completed === 'string', 'updateTask: 设为 done 时自动填充 completed 字段');

  // 创建第二个任务用于删除测试
  const task2 = await createTask(TEST_BASE, { type: 'doc', title: 'Doc Task' });
  const task2Id = task2.data!.id;

  // AC-2.4: deleteTask
  await deleteTask(TEST_BASE, task2Id);
  store = await loadStore(TEST_BASE);
  assert(store.tasks.find(t => t.id === task2Id) === undefined, 'deleteTask: 任务从存储中移除');

  // AC-2.5: queryTasks
  await createTask(TEST_BASE, { type: 'test', title: 'Test 1' });
  await createTask(TEST_BASE, { type: 'test', title: 'Test 2' });
  await createTask(TEST_BASE, { type: 'doc', title: 'Doc 1' });

  const testTasks = await queryTasks(TEST_BASE, { type: 'test' });
  const pendingTasks = await queryTasks(TEST_BASE, { status: 'pending' });
  assert(
    testTasks.length === 2 && testTasks.every(t => t.type === 'test') &&
    pendingTasks.length === 3 && pendingTasks.every(t => t.status === 'pending'),
    'queryTasks: 按 type/status 筛选正确'
  );

  await cleanup();
}

async function verifyAC3() {
  console.log('\n=== AC-3: Dependency Management ===');
  await setup();

  // 创建三个任务：A（无依赖）, B（依赖A）, C（依赖B）
  const taskA = await createTask(TEST_BASE, { type: 'new_feature', title: 'Task A' });
  const taskB = await createTask(TEST_BASE, {
    type: 'new_feature',
    title: 'Task B',
    dependsOn: [taskA.data!.id]
  });
  const taskC = await createTask(TEST_BASE, {
    type: 'new_feature',
    title: 'Task C',
    dependsOn: [taskB.data!.id]
  });

  // AC-3.1: 无依赖的 pending 任务返回
  let executable = await getExecutableTasks(TEST_BASE);
  assert(
    executable.length === 1 && executable[0].id === taskA.data!.id,
    'getExecutableTasks: 无依赖的 pending 任务返回'
  );

  // AC-3.2: 依赖未完成的任务不返回
  assert(
    !executable.some(t => t.id === taskB.data!.id || t.id === taskC.data!.id),
    'getExecutableTasks: 依赖未完成的任务不返回'
  );

  // AC-3.3: 依赖全部 done 的任务返回
  await updateTask(TEST_BASE, taskA.data!.id, { status: 'done' });
  executable = await getExecutableTasks(TEST_BASE);
  assert(
    executable.length === 1 && executable[0].id === taskB.data!.id,
    'getExecutableTasks: 依赖全部 done 的任务返回'
  );

  // AC-3.4: 被依赖的任务删除失败
  const deleteResult = await deleteTask(TEST_BASE, taskA.data!.id);
  assert(
    !deleteResult.success && deleteResult.error!.includes('依赖'),
    'deleteTask: 被依赖的任务删除失败并返回错误'
  );

  await cleanup();
}

async function verifyAC4() {
  console.log('\n=== AC-4: Batch Create ===');
  await setup();

  // AC-4.1, AC-4.2, AC-4.3: 批量创建
  const batchResult = await batchCreateTasks(TEST_BASE, {
    tasks: [
      { tempId: 'temp-a', type: 'new_feature', title: 'Batch A' },
      { tempId: 'temp-b', type: 'new_feature', title: 'Batch B', dependsOn: ['temp-a'] },
      { type: 'new_feature', title: 'Batch C', dependsOn: ['temp-b'] }
    ],
    generatedBy: 'impact-analyzer'
  });

  assert(batchResult.success && batchResult.data!.length === 3, '一次创建多个任务，全部成功');

  const tasks = batchResult.data!;
  const taskA = tasks[0];
  const taskB = tasks[1];
  const taskC = tasks[2];

  assert(
    taskA.id.startsWith('task-') && taskB.id.startsWith('task-'),
    'tempId 正确解析为真实 ID'
  );

  assert(
    taskB.dependsOn!.includes(taskA.id) && taskC.dependsOn!.includes(taskB.id),
    '批次内 A→B 依赖关系正确建立'
  );

  await cleanup();
}

async function verifyAC5() {
  console.log('\n=== AC-5: Error Handling ===');
  await setup();

  // AC-5.1: createTask 依赖不存在
  const createResult = await createTask(TEST_BASE, {
    type: 'new_feature',
    title: 'Test',
    dependsOn: ['non-existent-id']
  });
  assert(!createResult.success && createResult.error!.includes('不存在'), 'createTask: 依赖不存在时返回错误');

  // AC-5.2: updateTask 任务不存在
  const updateResult = await updateTask(TEST_BASE, 'non-existent-id', { status: 'done' });
  assert(!updateResult.success && updateResult.error!.includes('不存在'), 'updateTask: 任务不存在时返回错误');

  // AC-5.3: deleteTask 任务不存在
  const deleteResult = await deleteTask(TEST_BASE, 'non-existent-id');
  assert(!deleteResult.success && deleteResult.error!.includes('不存在'), 'deleteTask: 任务不存在时返回错误');

  await cleanup();
}

async function main() {
  console.log('========================================');
  console.log('  feat-task-management AC Verification');
  console.log('========================================');

  await verifyAC1();
  await verifyAC2();
  await verifyAC3();
  await verifyAC4();
  await verifyAC5();

  console.log('\n========================================');
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log(`  Pass Rate: ${Math.round(passed / (passed + failed) * 100)}%`);
  console.log('========================================');

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);
