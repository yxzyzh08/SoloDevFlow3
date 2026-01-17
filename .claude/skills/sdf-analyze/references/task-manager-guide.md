# 需求池管理指南 (Task Manager)

> 本文档详细说明如何使用 Task Manager CLI 管理需求池。

## 触发词

"查看需求池"、"待分析需求"、"添加到需求池"、"任务列表"

## 存储位置

**Location**: `.solodevflow/tasks.json` (自动管理)

## 需求池操作

### 查看待分析需求 (list)

**触发**: "查看需求池"、"待分析需求"

```bash
cd src && node dist/index.js task list --type=analyze_requirement --status=pending
```

**输出示例**:
```
=== Task List ===

| ID | Type | Title | Status | Priority | Source |
|----|------|-------|--------|----------|--------|
| task-xxx | analyze_requirement | 分析需求：用户认证 | pending | critical | feat-xx |
| task-yyy | analyze_requirement | 分析需求：Session 管理 | pending | high | feat-xx |

Total: 2 task(s)
```

### 添加到需求池 (add)

**触发**: "添加到需求池"、"新需求"

```bash
cd src && node dist/index.js task add \
  --type=analyze_requirement \
  --title="分析需求：<需求描述>" \
  --priority=<critical|high|medium|low> \
  --source=<来源Feature ID>
```

**示例**:
```bash
cd src && node dist/index.js task add \
  --type=analyze_requirement \
  --title="分析需求：用户认证模块" \
  --priority=high \
  --source=feat-login
```

### 完成需求分析 (done)

**触发**: "完成分析"、"标记完成"

```bash
cd src && node dist/index.js task done <task-id>
```

**示例**:
```bash
cd src && node dist/index.js task done task-1736500000000
```

### 需求池统计 (stats)

**触发**: "需求池统计"、"任务统计"

```bash
cd src && node dist/index.js task stats
```

**输出示例**:
```
=== Task Statistics ===

Total: 5 task(s)
Executable (deps satisfied): 3

By Status:
  pending: 3
  done: 2

By Type:
  analyze_requirement: 5

=== R→D Gate Status ===
⚠️  3 pending requirement(s) - must analyze before Design:
   - task-xxx: 分析需求：用户认证
   - task-yyy: 分析需求：Session 管理
```

## 与需求分析的关系

需求池管理是 R 阶段的核心功能：

```
用户描述新需求
    ↓
sdf-analyze 执行分析
    ↓
发现新依赖 → 调用 task add 添加到任务池 (Step 5)
    ↓
用户继续分析任务池中的需求
    ↓
task stats 显示池为空 → 可进入 D 阶段
```

## R→D 门控集成

门控检查自动查询 Task Manager：
```bash
cd src && node dist/index.js next <feature-id>
```

门控条件 `pending-requirements-clear` 会检查：
- `queryTasks({ type: 'analyze_requirement', status: 'pending' })`
- 如果存在待分析需求，阻止进入 D 阶段
