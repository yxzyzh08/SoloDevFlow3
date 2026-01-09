---
id: feat-task-management
type: feature
domain: CoreEngine
status: done
priority: high
created: 2026-01-04

# ===== Semantic Fields (AI-First) =====
summary: "持久化任务管理，支持任务依赖关系，统一管理所有待办项（包括待分析需求）"
tags: [task, dependency, persistence, infrastructure, requirement-management]

# ===== Feature Kind =====
feature_kind: code

# ===== Dependency Fields =====
dependencies:
  requires:
    - feat-doc-indexer
  blocks:
    - feat-impact-analyzer
analyzed: true
---

# Task Management

> 持久化任务管理，支持任务依赖关系，为影响分析提供基础设施。

## 1. Requirements

### 1.1 Background

Claude CLI 的 TodoWrite 是会话级别的，会话结束后任务丢失。我们需要：

1. **持久化存储** - 任务跨会话保持
2. **依赖关系** - 影响分析生成的任务有执行顺序
3. **批量创建** - 影响分析一次生成多个相关任务

### 1.2 User Stories

**US-1**: 作为**影响分析 Skill**，我需要**批量创建任务并设置依赖关系**，以便**用户按正确顺序处理**。

**US-2**: 作为**工作流引擎**，我需要**查询可执行任务（依赖已满足）**，以便**推荐下一步工作**。

**US-3**: 作为**开发者**，我希望**任务跨会话保持**，以便**下次继续工作**。

### 1.3 Scope

**包含**：
- 持久化存储 (tasks.json)
- 任务 CRUD
- 依赖关系管理 (dependsOn)
- 批量创建接口
- 查询可执行任务

**不包含**：
- 会话内进度显示（Claude CLI TodoWrite 负责）
- 可视化视图
- 自动调度

## 2. Specification

### 2.1 Data Structures

```typescript
// 任务类型 (可扩展)
type TaskType =
  | 'analyze_requirement' // 分析需求（替代 Backlog）
  | 'new_feature'         // 新增需求
  | 'change_feature'      // 变更需求
  | 'delete_feature'      // 删除需求
  | 'design_change'       // 修改设计
  | 'bug_fix'             // 修复 bug
  | 'refactor'            // 重构
  | 'test'                // 测试
  | 'doc';                // 文档

// 任务状态
type TaskStatus = 'pending' | 'in_progress' | 'done';

// 任务来源
type TaskSource = 'manual' | 'impact-analyzer' | 'discovery' | 'migration';

// 任务结构
interface Task {
  id: string;
  type: TaskType;
  title: string;
  description?: string;
  status: TaskStatus;

  // 依赖关系
  dependsOn?: string[];

  // 来源和优先级
  generatedBy?: TaskSource;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  source?: string;  // 来源 Feature/ADR ID

  // 时间
  created: string;
  completed?: string;
}

// 存储结构
interface TaskStore {
  version: string;
  tasks: Task[];
}
```

### 2.2 Storage

```
.solodevflow/tasks.json   # Source of Truth
```

### 2.3 Operations

#### Create Task
```
Input: { type, title, dependsOn?, description? }
Output: Task
```

#### Batch Create (影响分析专用)
```
Input: {
  tasks: [...],
  generatedBy: 'impact-analyzer'
}
Output: Task[]
```

#### Update Task
```
Input: { id, updates }
Output: Task
```

#### Delete Task
```
Input: { id }
Process: 检查是否被其他任务依赖
Output: { success }
```

#### Query Tasks
```
Input: { type?, status? }
Output: Task[]
```

#### Get Executable Tasks
```
Process: 返回 dependsOn 全部为 done 的 pending 任务
Output: Task[]
```

### 2.4 Dependency Rules

- 任务变为 `in_progress` 前，警告未完成的依赖（不强制阻止）
- 删除任务时，检查是否被其他任务依赖
- `done` 是终态

## 3. Dependency Analysis

### 3.1 Requires

| Dependency | Type | Status |
|------------|------|--------|
| feat-doc-indexer | Feature | done |

### 3.2 Affects

| Item | Impact |
|------|--------|
| feat-impact-analyzer | 调用 Batch Create |
| feat-dependency-graph | 查询 new_feature 类型任务 |

### 3.3 Analysis Conclusion

- [x] 依赖分析完成
- [x] 前置依赖就绪

**Status**: Ready for Design

## 4. Acceptance Criteria

### AC-1: Persistence
- [x] 创建任务后，`.solodevflow/tasks.json` 文件存在
- [x] 文件内容包含正确的 Task 结构（id, type, title, status, created）
- [x] 重新调用 `loadStore()` 能读取之前创建的任务

### AC-2: CRUD Operations
- [x] `createTask`: 返回包含 id、created 的 Task
- [x] `updateTask`: 状态变更正确保存
- [x] `updateTask`: 设为 done 时自动填充 completed 字段
- [x] `deleteTask`: 任务从存储中移除
- [x] `queryTasks`: 按 type/status 筛选正确

### AC-3: Dependency Management
- [x] `getExecutableTasks`: 无依赖的 pending 任务返回
- [x] `getExecutableTasks`: 依赖未完成的任务不返回
- [x] `getExecutableTasks`: 依赖全部 done 的任务返回
- [x] `deleteTask`: 被依赖的任务删除失败并返回错误

### AC-4: Batch Create
- [x] 一次创建多个任务，全部成功
- [x] tempId 正确解析为真实 ID
- [x] 批次内 A→B 依赖关系正确建立

### AC-5: Error Handling
- [x] `createTask`: 依赖不存在时返回错误
- [x] `updateTask`: 任务不存在时返回错误
- [x] `deleteTask`: 任务不存在时返回错误

## 5. Technical Constraints

- Storage: `.solodevflow/tasks.json`
- Stateless: 每次读取-修改-写入

## 6. Migration

迁移现有 backlog.md 到 tasks.json：

```
backlog-005 → { id: "task-001", type: "new_feature", ... }
```

---

*Feature: task-management*
*Domain: CoreEngine*
*Status: implementing*
*Kind: code*
