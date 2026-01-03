---
allowed-tools: Read, Write, Edit, Grep, Glob
description: 推进到下一个工作流阶段（含门控检查）
argument-hint: <feature-id> [--force]
---

# Phase Transition with Gate Check

将指定 Feature 推进到 R-D-C-T 工作流的下一阶段，执行完整的门控检查。

## Arguments

- `<feature-id>`: 要推进的 Feature ID
- `--force`: 跳过门控检查强制推进（慎用）

## Phase Transition Rules

```
R (proposed/analyzing/analyzed) → D (designing)
D (designing)                   → C (implementing)
C (implementing)                → T (testing)
T (testing)                     → Done (done)
```

## Execution Flow

### Step 1: Locate Feature

```bash
Glob("docs/requirements/**/feat-*.md")
# 查找匹配 $ARGUMENTS 的文件
```

### Step 2: Read Current Status

```bash
Read(<feature-file>)
# 解析 YAML Frontmatter
```

### Step 3: Build Dependency Graph

执行 Doc Indexer 流程获取所有 Feature 信息：

```bash
Glob("docs/requirements/**/feat-*.md")
# 读取所有 Feature，构建依赖图
```

### Step 4: Gate Check

根据目标阶段执行门控检查：

#### R → D Gate Check

| Condition | Check | Description |
|-----------|-------|-------------|
| analyzed | `feature.analyzed == true` | 依赖分析已完成 |
| backlog-empty | 检查 backlog.md | 需求池无相关待分析项 |
| deps-ready | 检查 requires 中的 Feature | 所有前置依赖已就绪（status >= analyzed） |
| no-cycle | 运行循环检测算法 | 无循环依赖 |

**Cycle Detection Algorithm** (DFS + Coloring):

```
WHITE = 未访问
GRAY = 访问中（在当前路径上）
BLACK = 已完成

function detectCycle(featureId):
  if color[featureId] == GRAY:
    return true  // 发现环
  if color[featureId] == BLACK:
    return false

  color[featureId] = GRAY
  for each dep in requires[featureId]:
    if detectCycle(dep):
      return true
  color[featureId] = BLACK
  return false
```

#### D → C Gate Check

| Condition | Check | Description |
|-----------|-------|-------------|
| design-exists | 检查 docs/design/ | 设计文档已创建 |
| design-approved | 设计文档 status | 设计已确认（可选） |

#### C → T Gate Check

| Condition | Check | Description |
|-----------|-------|-------------|
| code-complete | 用户确认 | 编码已完成 |
| ac-defined | 检查 Feature 文档 | AC 已定义 |

#### T → Done Gate Check

| Condition | Check | Description |
|-----------|-------|-------------|
| all-ac-pass | 检查 AC 列表 | 所有 AC 已勾选 |

### Step 5: Execute Transition

如果门控检查通过：

```bash
Edit(<feature-file>)
# 更新 status 字段
```

同步更新 Domain index.md。

### Step 6: Trigger Next Phase Actions

| Target Phase | Action |
|--------------|--------|
| designing | 提示创建 `docs/design/<domain>/feat-<name>.md` |
| implementing | 提示开始编码 |
| testing | 提示验证所有 AC |
| done | 更新统计，汇报完成 |

## Output Format

### Gate Check Passed

```
=== Phase Transition ===

Feature: feat-doc-indexer
Current: analyzing
Target: designing

Gate Check (R → D):
  [PASS] 依赖分析完成 (analyzed: true)
  [PASS] 需求池已清空 (无相关待分析项)
  [PASS] 前置依赖就绪 (无前置依赖)
  [PASS] 无循环依赖

Result: CAN PROCEED

Confirm transition? (Y/n)
```

### Gate Check Failed

```
=== Phase Transition ===

Feature: feat-workflow-orchestration
Current: analyzing
Target: designing

Gate Check (R → D):
  [PASS] 依赖分析完成 (analyzed: true)
  [FAIL] 需求池未清空 (2 个待分析: backlog-001, backlog-002)
  [FAIL] 前置依赖未就绪 (等待: backlog-001, backlog-002)
  [PASS] 无循环依赖

Result: CANNOT PROCEED

Blockers:
  1. 需求池有 2 个待分析项
  2. 等待前置依赖完成

Options:
  - 分析待分析项: /backlog analyze
  - 强制推进 (不推荐): /next feat-workflow-orchestration --force
```

## Backlog Check Implementation

```bash
Read("docs/requirements/backlog.md")
# 解析待分析队列
# 查找 source == featureId 的项
```

## Dependency Ready Check

```
function checkDepsReady(featureId, allFeatures):
  feature = findFeature(featureId)
  requires = feature.dependencies?.requires || []
  notReady = []

  for each depId in requires:
    dep = findFeature(depId)
    if !dep:
      notReady.push(depId + " (不存在)")
    else if dep.status in ['backlog', 'proposed', 'analyzing']:
      notReady.push(depId + " (" + dep.status + ")")

  return {
    ready: notReady.length == 0,
    notReady: notReady
  }
```

## Example Execution

```
User: /next feat-doc-indexer

Claude:
1. 定位文件: docs/requirements/DocSystem/feat-doc-indexer.md
2. 当前状态: implementing
3. 目标状态: testing

Gate Check (C → T):
  [PASS] 编码已完成
  [PASS] AC 已定义 (8 条)

执行转换...
状态已更新: implementing → testing

下一步: 请验证以下 AC:
- AC-1: Full Scan
- AC-2: Frontmatter Parsing
- ...
```
