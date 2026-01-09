/**
 * Task Manager - Operations Layer
 * 业务操作：CRUD + 查询
 */

import { loadStore, saveStore } from './store.js';
import type { Task, TaskType, TaskStatus, TaskResult } from '../types.js';

/**
 * 创建任务
 */
export async function createTask(
  basePath: string,
  input: {
    type: TaskType;
    title: string;
    description?: string;
    dependsOn?: string[];
    generatedBy?: Task['generatedBy'];
  }
): Promise<TaskResult> {
  const store = await loadStore(basePath);

  // 生成 ID
  const id = `task-${Date.now()}`;

  // 验证依赖存在
  if (input.dependsOn && input.dependsOn.length > 0) {
    const existingIds = new Set(store.tasks.map(t => t.id));
    for (const depId of input.dependsOn) {
      if (!existingIds.has(depId)) {
        return { success: false, error: `依赖任务不存在: ${depId}` };
      }
    }
  }

  const task: Task = {
    id,
    type: input.type,
    title: input.title,
    description: input.description,
    status: 'pending',
    dependsOn: input.dependsOn,
    generatedBy: input.generatedBy || 'manual',
    created: new Date().toISOString()
  };

  store.tasks.push(task);
  await saveStore(basePath, store);

  return { success: true, data: task };
}

/**
 * 批量创建任务（支持批次内依赖引用）
 */
export async function batchCreateTasks(
  basePath: string,
  input: {
    tasks: Array<{
      tempId?: string;
      type: TaskType;
      title: string;
      description?: string;
      dependsOn?: string[];
    }>;
    generatedBy: Task['generatedBy'];
  }
): Promise<TaskResult<Task[]>> {
  const store = await loadStore(basePath);
  const createdTasks: Task[] = [];
  const tempIdToRealId = new Map<string, string>();
  const baseTime = Date.now();

  // 第一遍：创建任务，建立 ID 映射
  for (let i = 0; i < input.tasks.length; i++) {
    const taskInput = input.tasks[i];
    const id = `task-${baseTime}-${i}`;

    if (taskInput.tempId) {
      tempIdToRealId.set(taskInput.tempId, id);
    }

    const task: Task = {
      id,
      type: taskInput.type,
      title: taskInput.title,
      description: taskInput.description,
      status: 'pending',
      dependsOn: [],
      generatedBy: input.generatedBy,
      created: new Date().toISOString()
    };

    createdTasks.push(task);
  }

  // 第二遍：解析依赖引用
  const existingIds = new Set(store.tasks.map(t => t.id));
  for (let i = 0; i < input.tasks.length; i++) {
    const taskInput = input.tasks[i];
    if (taskInput.dependsOn && taskInput.dependsOn.length > 0) {
      const resolvedDeps: string[] = [];
      for (const depRef of taskInput.dependsOn) {
        // 优先查找 tempId 映射
        const realId = tempIdToRealId.get(depRef);
        if (realId) {
          resolvedDeps.push(realId);
        } else if (existingIds.has(depRef)) {
          // 引用已存在的任务
          resolvedDeps.push(depRef);
        } else {
          return {
            success: false,
            error: `任务 "${taskInput.title}" 的依赖不存在: ${depRef}`
          };
        }
      }
      createdTasks[i].dependsOn = resolvedDeps;
    }
  }

  store.tasks.push(...createdTasks);
  await saveStore(basePath, store);

  return { success: true, data: createdTasks };
}

/**
 * 更新任务
 */
export async function updateTask(
  basePath: string,
  id: string,
  updates: Partial<Pick<Task, 'title' | 'description' | 'status'>>
): Promise<TaskResult> {
  const store = await loadStore(basePath);
  const taskIndex = store.tasks.findIndex(t => t.id === id);

  if (taskIndex === -1) {
    return { success: false, error: `任务不存在: ${id}` };
  }

  const task = store.tasks[taskIndex];

  // 状态变更为 in_progress 时，检查依赖（警告但不阻止）
  if (updates.status === 'in_progress' && task.dependsOn && task.dependsOn.length > 0) {
    const unfinishedDeps = task.dependsOn.filter(depId => {
      const dep = store.tasks.find(t => t.id === depId);
      return dep && dep.status !== 'done';
    });

    if (unfinishedDeps.length > 0) {
      console.warn(`警告: 依赖任务未完成: ${unfinishedDeps.join(', ')}`);
    }
  }

  // 应用更新
  Object.assign(task, updates);

  // 如果完成，记录时间
  if (updates.status === 'done' && !task.completed) {
    task.completed = new Date().toISOString();
  }

  await saveStore(basePath, store);

  return { success: true, data: task };
}

/**
 * 删除任务
 */
export async function deleteTask(
  basePath: string,
  id: string
): Promise<TaskResult<void>> {
  const store = await loadStore(basePath);

  // 检查是否被其他任务依赖
  const dependents = store.tasks.filter(t =>
    t.dependsOn && t.dependsOn.includes(id)
  );
  if (dependents.length > 0) {
    return {
      success: false,
      error: `任务被其他任务依赖: ${dependents.map(t => t.id).join(', ')}`
    };
  }

  const taskIndex = store.tasks.findIndex(t => t.id === id);
  if (taskIndex === -1) {
    return { success: false, error: `任务不存在: ${id}` };
  }

  store.tasks.splice(taskIndex, 1);
  await saveStore(basePath, store);

  return { success: true };
}

/**
 * 查询任务
 */
export async function queryTasks(
  basePath: string,
  filter?: {
    type?: TaskType;
    status?: TaskStatus;
    generatedBy?: Task['generatedBy'];
  }
): Promise<Task[]> {
  const store = await loadStore(basePath);

  if (!filter) {
    return store.tasks;
  }

  return store.tasks.filter(task => {
    if (filter.type && task.type !== filter.type) return false;
    if (filter.status && task.status !== filter.status) return false;
    if (filter.generatedBy && task.generatedBy !== filter.generatedBy) return false;
    return true;
  });
}

/**
 * 获取可执行任务（依赖全部完成的 pending 任务）
 */
export async function getExecutableTasks(basePath: string): Promise<Task[]> {
  const store = await loadStore(basePath);

  // 构建已完成任务集合
  const doneIds = new Set(
    store.tasks.filter(t => t.status === 'done').map(t => t.id)
  );

  // 筛选可执行任务
  return store.tasks.filter(task => {
    // 必须是 pending 状态
    if (task.status !== 'pending') return false;

    // 无依赖，可执行
    if (!task.dependsOn || task.dependsOn.length === 0) return true;

    // 所有依赖都已完成
    return task.dependsOn.every(depId => doneIds.has(depId));
  });
}

/**
 * 获取单个任务
 */
export async function getTask(
  basePath: string,
  id: string
): Promise<Task | undefined> {
  const store = await loadStore(basePath);
  return store.tasks.find(t => t.id === id);
}
