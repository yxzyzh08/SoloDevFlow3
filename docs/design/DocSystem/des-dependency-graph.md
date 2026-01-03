---
id: des-dependency-graph
type: design
domain: DocSystem
status: draft
created: 2026-01-02
requirement: docs/requirements/DocSystem/feat-dependency-graph.md
depends-on: des-doc-indexer
---

# Dependency Graph - Technical Design

> 技术设计文档：定义 Claude 如何实现依赖图分析和门控检查功能。

## 1. Design Overview

### 1.1 Relationship with Doc Indexer

```
┌─────────────────────┐
│  feat-doc-indexer   │
│  ─────────────────  │
│  Output:            │
│  - features[]       │
│  - validation       │
│  - stats            │
└──────────┬──────────┘
           │
           ▼ Input
┌─────────────────────────┐
│  feat-dependency-graph  │
│  ─────────────────────  │
│  Operations:            │
│  - Build Graph          │
│  - Topological Sort     │
│  - Cycle Detection      │
│  - Gate Check           │
└─────────────────────────┘
```

### 1.2 Implementation Approach

与 Doc Indexer 一样，Dependency Graph 是：

1. **Algorithm-Based**: 在 Claude 内实现图算法
2. **Stateless**: 每次调用重新计算
3. **Composable**: 可独立调用各个操作

## 2. Data Structures

### 2.1 Graph Representation

```typescript
// 使用邻接表表示
interface DependencyGraph {
  nodes: Map<FeatureId, GraphNode>;
  edges: {
    requires: Map<FeatureId, FeatureId[]>;  // A requires [B, C]
    blocks: Map<FeatureId, FeatureId[]>;    // A blocks [D, E]
  };
}

interface GraphNode {
  id: string;
  status: FeatureStatus;
  priority: Priority;
  analyzed: boolean;
  domain: string;
}
```

### 2.2 Gate Check Result

```typescript
interface GateCheckResult {
  featureId: string;
  targetPhase: 'R→D' | 'D→C' | 'C→T';
  canProceed: boolean;
  conditions: GateCondition[];
  blockers: string[];  // 阻塞原因列表
}

interface GateCondition {
  id: string;
  name: string;
  satisfied: boolean;
  details: string;
}
```

## 3. Algorithm Design

### 3.1 Graph Building

**Input**: `features[]` from Doc Indexer
**Output**: `DependencyGraph`

```
Algorithm BuildGraph(features):
  graph = {
    nodes: new Map(),
    edges: { requires: new Map(), blocks: new Map() }
  }

  // Step 1: Add all nodes
  for each feature in features:
    graph.nodes.set(feature.id, {
      id: feature.id,
      status: feature.status,
      priority: feature.priority,
      analyzed: feature.analyzed,
      domain: feature.domain
    })
    graph.edges.requires.set(feature.id, [])
    graph.edges.blocks.set(feature.id, [])

  // Step 2: Add edges
  for each feature in features:
    if feature.dependencies?.requires:
      graph.edges.requires.set(feature.id, feature.dependencies.requires)
    if feature.dependencies?.blocks:
      graph.edges.blocks.set(feature.id, feature.dependencies.blocks)

  return graph
```

### 3.2 Topological Sort (Kahn's Algorithm)

**Input**: `DependencyGraph`
**Output**: `FeatureId[]` (sorted) or `CycleError`

```
Algorithm TopologicalSort(graph):
  // 只考虑 requires 边（表示执行顺序依赖）
  inDegree = new Map()  // 入度计数
  result = []
  queue = []

  // Step 1: 计算入度
  for each nodeId in graph.nodes:
    inDegree.set(nodeId, 0)

  for each (from, toList) in graph.edges.requires:
    for each to in toList:
      if graph.nodes.has(to):  // 确保目标节点存在
        inDegree.set(from, inDegree.get(from) + 1)

  // Step 2: 入度为 0 的节点入队
  for each (nodeId, degree) in inDegree:
    if degree == 0:
      queue.push(nodeId)

  // Step 3: BFS
  while queue.length > 0:
    current = queue.shift()
    result.push(current)

    // 找到所有依赖 current 的节点
    for each (from, toList) in graph.edges.requires:
      if current in toList:
        inDegree.set(from, inDegree.get(from) - 1)
        if inDegree.get(from) == 0:
          queue.push(from)

  // Step 4: 检查是否有环
  if result.length != graph.nodes.size:
    return CycleError("存在循环依赖")

  return result
```

### 3.3 Cycle Detection (DFS + Coloring)

**Input**: `DependencyGraph`
**Output**: `Cycle[]` (所有检测到的环)

```
Algorithm DetectCycles(graph):
  WHITE = 0  // 未访问
  GRAY = 1   // 访问中（在当前路径上）
  BLACK = 2  // 已完成

  color = new Map()  // 节点颜色
  parent = new Map() // 用于重建路径
  cycles = []

  for each nodeId in graph.nodes:
    color.set(nodeId, WHITE)

  function DFS(node, path):
    color.set(node, GRAY)
    path.push(node)

    for each dep in graph.edges.requires.get(node):
      if !graph.nodes.has(dep):
        continue  // 跳过不存在的依赖

      if color.get(dep) == GRAY:
        // 发现环！
        cycleStart = path.indexOf(dep)
        cycle = path.slice(cycleStart)
        cycle.push(dep)  // 闭合环
        cycles.push(cycle)

      else if color.get(dep) == WHITE:
        DFS(dep, path)

    path.pop()
    color.set(node, BLACK)

  for each nodeId in graph.nodes:
    if color.get(nodeId) == WHITE:
      DFS(nodeId, [])

  return cycles
```

### 3.4 R→D Gate Check

**Input**: `featureId`, `graph`, `backlogStatus`
**Output**: `GateCheckResult`

```
Algorithm CheckRToD(featureId, graph, backlog):
  conditions = []
  blockers = []
  feature = graph.nodes.get(featureId)

  // Condition 1: 分析完成
  cond1 = {
    id: 'analyzed',
    name: '依赖分析完成',
    satisfied: feature.analyzed == true,
    details: feature.analyzed
      ? 'analyzed: true'
      : 'analyzed: false，需完成依赖分析'
  }
  conditions.push(cond1)
  if !cond1.satisfied: blockers.push('依赖分析未完成')

  // Condition 2: 需求池状态
  relatedBacklog = backlog.filter(b => b.source == featureId)
  cond2 = {
    id: 'backlog-empty',
    name: '需求池已清空',
    satisfied: relatedBacklog.length == 0,
    details: relatedBacklog.length == 0
      ? '无相关待分析项'
      : `${relatedBacklog.length} 个待分析: ${relatedBacklog.map(b=>b.id).join(', ')}`
  }
  conditions.push(cond2)
  if !cond2.satisfied: blockers.push(`需求池有 ${relatedBacklog.length} 个待分析`)

  // Condition 3: 前置依赖就绪
  requires = graph.edges.requires.get(featureId) || []
  notReady = []
  for each depId in requires:
    dep = graph.nodes.get(depId)
    if !dep or dep.status in ['backlog', 'proposed', 'analyzing']:
      notReady.push(depId)

  cond3 = {
    id: 'deps-ready',
    name: '前置依赖就绪',
    satisfied: notReady.length == 0,
    details: notReady.length == 0
      ? requires.length == 0 ? '无前置依赖' : '所有依赖已就绪'
      : `等待: ${notReady.join(', ')}`
  }
  conditions.push(cond3)
  if !cond3.satisfied: blockers.push(`等待依赖: ${notReady.join(', ')}`)

  // Condition 4: 无循环依赖
  cycles = DetectCycles(graph)
  involvedCycles = cycles.filter(c => c.includes(featureId))
  cond4 = {
    id: 'no-cycle',
    name: '无循环依赖',
    satisfied: involvedCycles.length == 0,
    details: involvedCycles.length == 0
      ? '无循环'
      : `发现循环: ${involvedCycles[0].join(' → ')}`
  }
  conditions.push(cond4)
  if !cond4.satisfied: blockers.push('存在循环依赖')

  return {
    featureId: featureId,
    targetPhase: 'R→D',
    canProceed: conditions.every(c => c.satisfied),
    conditions: conditions,
    blockers: blockers
  }
```

## 4. Output Formats

### 4.1 Dependency Graph Output

```
=== Dependency Graph ===

feat-workflow-orchestration (analyzing, critical)
├── requires:
│   ├── feat-doc-indexer (designing)
│   ├── feat-dependency-graph (designing)
│   ├── backlog-001 (pending)
│   └── backlog-002 (pending)
└── blocks: (none)

feat-doc-indexer (designing, high)
├── requires: (none)
└── blocks:
    └── feat-dependency-graph

feat-dependency-graph (designing, high)
├── requires:
│   └── feat-doc-indexer
└── blocks: (none)
```

### 4.2 Topological Order Output

```
=== Execution Order ===

Recommended sequence (based on dependencies):
1. feat-doc-indexer        [no deps]
2. feat-dependency-graph   [requires: feat-doc-indexer]
3. feat-workflow-orchestration [requires: doc-indexer, dependency-graph, ...]

Note: Items with pending backlog dependencies not included
```

### 4.3 Gate Check Output

```
=== R→D Gate Check: feat-doc-indexer ===

Conditions:
  [PASS] 依赖分析完成 (analyzed: true)
  [PASS] 需求池已清空 (无相关待分析项)
  [PASS] 前置依赖就绪 (无前置依赖)
  [PASS] 无循环依赖

Result: CAN PROCEED to Design phase
```

```
=== R→D Gate Check: feat-workflow-orchestration ===

Conditions:
  [PASS] 依赖分析完成 (analyzed: true)
  [FAIL] 需求池未清空 (2 个待分析: backlog-001, backlog-002)
  [FAIL] 前置依赖未就绪 (等待: backlog-001, backlog-002)
  [PASS] 无循环依赖

Result: CANNOT PROCEED

Blockers:
  1. 需求池有 2 个待分析
  2. 等待依赖: backlog-001, backlog-002
```

## 5. Integration Design

### 5.1 Integration with /next Command

```
User: /next feat-doc-indexer

Flow:
1. 调用 Doc Indexer 获取 features[]
2. 构建 DependencyGraph
3. 读取 backlog.md 获取需求池状态
4. 调用 CheckRToD(feat-doc-indexer, graph, backlog)
5. 显示 GateCheckResult
6. 如果 canProceed:
   - 提示用户确认
   - 更新 status: proposed → designing
```

### 5.2 Integration with /status Command

```
User: /status

Flow:
1. 调用 Doc Indexer
2. 构建 DependencyGraph
3. 显示：
   - Feature 列表（按 Domain 分组）
   - 依赖关系摘要
   - 门控状态检查（哪些可以进入下一阶段）
```

## 6. Edge Cases

### 6.1 Missing Dependencies

```
Scenario: Feature A requires feat-xxx，但 feat-xxx 不存在
Handling:
  - 在 validation 中报告 warning
  - 门控检查视为"未就绪"
  - 建议添加到 backlog
```

### 6.2 Self-Reference

```
Scenario: Feature A requires feat-a（自己依赖自己）
Handling:
  - 检测为循环依赖
  - 报告 error
```

### 6.3 Orphan Features

```
Scenario: Feature 没有任何依赖关系
Handling:
  - 正常处理，视为独立节点
  - 拓扑排序中可以出现在任意位置
```

## 7. Performance

| Operation | Complexity | Notes |
|-----------|------------|-------|
| Graph Build | O(N + E) | N=节点数, E=边数 |
| Topological Sort | O(N + E) | Kahn's algorithm |
| Cycle Detection | O(N + E) | DFS |
| Gate Check | O(N + E) | 调用 cycle detection |

对于当前规模（<50 个 Feature），所有操作应在 1 秒内完成。

---

*Design: feat-dependency-graph*
*Domain: DocSystem*
*Created: 2026-01-02*
*Status: draft*
*Depends On: feat-doc-indexer*
