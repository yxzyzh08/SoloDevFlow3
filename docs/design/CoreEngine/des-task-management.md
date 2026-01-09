---
id: des-task-management
type: design
domain: CoreEngine
feature: feat-task-management
status: draft
created: 2026-01-05
---

# Task Management Design

> 持久化任务管理模块技术设计

## 1. Design Overview

### 1.1 Problem Statement

Claude CLI 的 TodoWrite 是会话级别的，会话结束后任务丢失。需要：
1. 任务跨会话持久化
2. 任务间依赖关系管理
3. 为 impact-analyzer 提供批量创建接口

### 1.2 Solution Summary

创建独立的 `task-manager` 模块，提供：
- JSON 文件持久化存储 (`.solodevflow/tasks.json`)
- 完整的 CRUD API
- 依赖关系管理和可执行任务查询
- 批量创建接口

## 2. Architecture Alignment

### 2.1 Principles Compliance

| Principle | Compliance | Notes |
|-----------|------------|-------|
| TypeScript Only | ✅ | 使用 TypeScript 实现 |
| Types in src/types.ts | ✅ | Task 相关类型添加到 types.ts |
| CLI Entry Point | ⚠️ | 主要作为库使用，可选 CLI |
| YAML Frontmatter | N/A | 不涉及文档解析 |

### 2.2 Reuse Analysis

| Module | Reuse? | Reason |
|--------|--------|--------|
| doc-indexer | ❌ | Task 是独立概念，不复用 Feature 解析逻辑 |
| dependency-graph | ❌ | Task 依赖比 Feature 依赖简单，自行实现 |

**结论**: 创建独立模块 `src/task-manager/`

### 2.3 Interface Consistency

遵循现有模式：
- 使用 `async/await`
- 返回值使用 `{ success, error?, data? }` 模式
- 导出纯函数

### 2.4 Pattern Usage

| Pattern | Usage |
|---------|-------|
| Repository Pattern | TaskStore 封装存储细节 |
| Stateless Operations | 每次操作读取-修改-写入 |

**ADR Required**: 否（使用现有模式）

## 3. Detailed Design

### 3.1 Module Structure

```
src/task-manager/
├── index.ts        # 导出入口
├── types.ts        # Task 类型定义 (或合并到 src/types.ts)
├── store.ts        # 存储层 (读写 JSON)
└── operations.ts   # 业务操作 (CRUD + 查询)
```

### 3.2 Type Definitions

```typescript
// === 添加到 src/types.ts ===

// 任务类型
export type TaskType =
  | 'new_feature'
  | 'change_feature'
  | 'delete_feature'
  | 'design_change'
  | 'bug_fix'
  | 'refactor'
  | 'test'
  | 'doc';

// 任务状态
export type TaskStatus = 'pending' | 'in_progress' | 'done';

// 任务结构
export interface Task {
  id: string;
  type: TaskType;
  title: string;
  description?: string;
  status: TaskStatus;
  dependsOn?: string[];
  generatedBy?: 'manual' | 'impact-analyzer' | 'migration';
  created: string;      // ISO 8601
  completed?: string;   // ISO 8601
}

// 存储结构
export interface TaskStore {
  version: string;
  tasks: Task[];
}

// 操作结果
export interface TaskResult<T = Task> {
  success: boolean;
  error?: string;
  data?: T;
}
```

### 3.3 Storage Layer (`store.ts`)

```typescript
const STORE_PATH = '.solodevflow/tasks.json';
const STORE_VERSION = '1.0.0';

/**
 * 读取任务存储
 */
export async function loadStore(basePath: string): Promise<TaskStore> {
  const storePath = path.join(basePath, STORE_PATH);
  try {
    const content = await fs.readFile(storePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    // 文件不存在，返回空存储
    return { version: STORE_VERSION, tasks: [] };
  }
}

/**
 * 写入任务存储
 */
export async function saveStore(basePath: string, store: TaskStore): Promise<void> {
  const storePath = path.join(basePath, STORE_PATH);
  const dir = path.dirname(storePath);

  // 确保目录存在
  await fs.mkdir(dir, { recursive: true });

  // 写入文件
  await fs.writeFile(storePath, JSON.stringify(store, null, 2), 'utf-8');
}
```

### 3.4 Operations Layer (`operations.ts`)

#### Create Task

```typescript
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
  if (input.dependsOn) {
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
```

#### Batch Create

```typescript
export async function batchCreateTasks(
  basePath: string,
  input: {
    tasks: Array<{
      tempId?: string;  // 批次内临时 ID，用于依赖引用
      type: TaskType;
      title: string;
      description?: string;
      dependsOn?: string[];  // 可引用 tempId
    }>;
    generatedBy: Task['generatedBy'];
  }
): Promise<TaskResult<Task[]>> {
  const store = await loadStore(basePath);
  const createdTasks: Task[] = [];
  const tempIdToRealId = new Map<string, string>();

  // 第一遍：创建任务，建立 ID 映射
  for (const taskInput of input.tasks) {
    const id = `task-${Date.now()}-${createdTasks.length}`;

    if (taskInput.tempId) {
      tempIdToRealId.set(taskInput.tempId, id);
    }

    const task: Task = {
      id,
      type: taskInput.type,
      title: taskInput.title,
      description: taskInput.description,
      status: 'pending',
      dependsOn: [],  // 稍后填充
      generatedBy: input.generatedBy,
      created: new Date().toISOString()
    };

    createdTasks.push(task);
  }

  // 第二遍：解析依赖引用
  for (let i = 0; i < input.tasks.length; i++) {
    const taskInput = input.tasks[i];
    if (taskInput.dependsOn) {
      createdTasks[i].dependsOn = taskInput.dependsOn.map(depRef => {
        // 如果是 tempId，转换为真实 ID
        return tempIdToRealId.get(depRef) || depRef;
      });
    }
  }

  store.tasks.push(...createdTasks);
  await saveStore(basePath, store);

  return { success: true, data: createdTasks };
}
```

#### Update Task

```typescript
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

  // 状态变更为 in_progress 时，检查依赖
  if (updates.status === 'in_progress' && task.dependsOn?.length) {
    const unfinishedDeps = task.dependsOn.filter(depId => {
      const dep = store.tasks.find(t => t.id === depId);
      return dep && dep.status !== 'done';
    });

    if (unfinishedDeps.length > 0) {
      // 警告但不阻止
      console.warn(`警告: 依赖任务未完成: ${unfinishedDeps.join(', ')}`);
    }
  }

  // 应用更新
  Object.assign(task, updates);

  // 如果完成，记录时间
  if (updates.status === 'done') {
    task.completed = new Date().toISOString();
  }

  await saveStore(basePath, store);

  return { success: true, data: task };
}
```

#### Delete Task

```typescript
export async function deleteTask(
  basePath: string,
  id: string
): Promise<TaskResult<void>> {
  const store = await loadStore(basePath);

  // 检查是否被其他任务依赖
  const dependents = store.tasks.filter(t => t.dependsOn?.includes(id));
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
```

#### Query Tasks

```typescript
export async function queryTasks(
  basePath: string,
  filter?: {
    type?: TaskType;
    status?: TaskStatus;
    generatedBy?: Task['generatedBy'];
  }
): Promise<Task[]> {
  const store = await loadStore(basePath);

  return store.tasks.filter(task => {
    if (filter?.type && task.type !== filter.type) return false;
    if (filter?.status && task.status !== filter.status) return false;
    if (filter?.generatedBy && task.generatedBy !== filter.generatedBy) return false;
    return true;
  });
}
```

#### Get Executable Tasks

```typescript
export async function getExecutableTasks(basePath: string): Promise<Task[]> {
  const store = await loadStore(basePath);

  // 构建已完成任务集合
  const doneIds = new Set(
    store.tasks.filter(t => t.status === 'done').map(t => t.id)
  );

  // 筛选可执行任务：pending + 依赖全部完成
  return store.tasks.filter(task => {
    if (task.status !== 'pending') return false;

    // 无依赖，可执行
    if (!task.dependsOn || task.dependsOn.length === 0) return true;

    // 所有依赖都已完成
    return task.dependsOn.every(depId => doneIds.has(depId));
  });
}
```

### 3.5 Module Entry (`index.ts`)

```typescript
export * from './types.js';
export * from './store.js';
export * from './operations.js';
```

## 4. Integration

### 4.1 Dependency Interfaces

本模块不依赖其他模块，是独立的基础设施。

### 4.2 Consumers

| Consumer | Interface Used |
|----------|----------------|
| impact-analyzer (future) | `batchCreateTasks()` |
| Workflow Engine (future) | `getExecutableTasks()` |
| CLI | 所有操作 |

## 5. Test Strategy

### 5.1 Unit Tests

| Test Case | Description |
|-----------|-------------|
| create-task | 创建任务，验证 ID 生成和存储 |
| create-with-deps | 创建带依赖的任务 |
| batch-create | 批量创建，验证 tempId 解析 |
| update-status | 状态更新，验证完成时间 |
| delete-with-deps | 删除被依赖任务应失败 |
| query-filter | 按条件筛选 |
| executable-tasks | 可执行任务正确过滤 |

### 5.2 Integration Tests

| Test Case | Description |
|-----------|-------------|
| persistence | 跨进程数据持久化 |
| concurrent-access | 并发读写处理 |

## 6. Trade-offs & Alternatives

### 6.1 Storage Format

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| JSON | 简单，人可读 | 并发写入风险 | ✅ 选择 |
| SQLite | 并发安全 | 增加依赖 | ❌ |

**选择 JSON**: 单用户场景，简单优先。

### 6.2 ID Generation

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| timestamp | 简单，唯一 | 可预测 | ✅ 选择 |
| UUID | 标准 | 较长 | ❌ |
| sequential | 紧凑 | 需要维护计数器 | ❌ |

## 7. Architecture Checklist

- [x] 使用 TypeScript
- [x] 类型定义在 src/types.ts
- [ ] 提供 CLI 入口（可选，后续添加）
- [x] 复用分析已完成
- [x] 接口风格一致 ({ success, error })
- [x] 设计模式已记录
- [ ] 更新 ARCHITECTURE.md Component Map
- [ ] 更新 ARCHITECTURE.md Evolution Log

---

*Design: des-task-management*
*Feature: feat-task-management*
*Domain: CoreEngine*
*Created: 2026-01-05*
*Status: draft*
