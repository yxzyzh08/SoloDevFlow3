---
id: feat-dependency-graph
type: feature
domain: DocSystem
status: done
priority: high
created: 2026-01-02
summary: 基于文档索引构建依赖图，提供拓扑排序、循环检测和 R→D 阶段门控检查能力
tags: [dependency, graph, topology, gate-check, docSystem]
dependencies:
  requires:
    - feat-doc-indexer  # 依赖索引数据作为输入
  blocks: []
analyzed: true
---

# Dependency Graph

> 基于文档索引构建依赖图，提供拓扑排序、循环检测和 R→D 阶段门控检查能力。

## 1. Requirements

### 1.1 Background

SoloDevFlow 的 R→D 阶段转换需要满足严格的门控条件：

1. **依赖分析完成** - Feature 的 `analyzed: true`
2. **需求池为空** - 所有相关依赖已分析完成
3. **前置依赖就绪** - 所有 `requires` 的 Feature 已处于可用状态

这些检查需要一个**依赖图分析器**来：

- 从 `feat-doc-indexer` 获取索引数据
- 构建 Feature 之间的依赖关系图
- 提供图算法支持（拓扑排序、循环检测）
- 执行阶段转换门控检查

### 1.2 User Stories

作为**开发者**，我希望能**看到 Feature 之间的依赖关系**，以便**理解项目结构和开发顺序**。

作为**工作流引擎**，我需要**检查阶段转换条件是否满足**，以便**自动判断 Feature 能否进入下一阶段**。

作为**项目管理者**，我希望能**发现循环依赖问题**，以便**及时调整需求拆分**。

### 1.3 Scope

**包含**：
- 基于索引数据构建依赖图
- 拓扑排序（确定可行的执行顺序）
- 循环依赖检测
- R→D 阶段门控检查
- 依赖路径查询
- 文本格式的依赖图输出

**不包含**：
- 图形化可视化（未来可扩展）
- 自动修复循环依赖
- 跨项目依赖分析

## 2. Specification

### 2.1 Data Structures

```typescript
interface DependencyGraph {
  nodes: Map<string, GraphNode>;
  edges: DependencyEdge[];
}

interface GraphNode {
  id: string;                    // feat-xxx
  status: FeatureStatus;
  priority: Priority;
  analyzed: boolean;
  domain: string;
}

interface DependencyEdge {
  from: string;                  // 依赖方
  to: string;                    // 被依赖方
  type: 'requires' | 'blocks';
}

interface GateCheckResult {
  featureId: string;
  canProceed: boolean;
  phase: 'R→D' | 'D→C' | 'C→T';
  conditions: GateCondition[];
}

interface GateCondition {
  name: string;
  satisfied: boolean;
  details: string;
}
```

### 2.2 Graph Building Algorithm

```
Input: IndexResult (来自 feat-doc-indexer)
Output: DependencyGraph

Algorithm:
1. 创建空图 G
2. for each feature in IndexResult.features:
     添加节点 G.nodes[feature.id] = {
       id: feature.id,
       status: feature.status,
       priority: feature.priority,
       analyzed: feature.analyzed,
       domain: feature.domain
     }
3. for each feature in IndexResult.features:
     for each reqId in feature.dependencies.requires:
       添加边 G.edges.push({from: feature.id, to: reqId, type: 'requires'})
     for each blockId in feature.dependencies.blocks:
       添加边 G.edges.push({from: feature.id, to: blockId, type: 'blocks'})
4. 返回 G
```

### 2.3 Topological Sort

```
Input: DependencyGraph
Output: string[] (Feature ID 按执行顺序排列) 或 CycleError

Algorithm (Kahn's Algorithm):
1. 计算每个节点的入度 (被依赖次数)
2. 将入度为 0 的节点加入队列
3. while 队列非空:
     取出节点 n
     添加到结果列表
     for each 依赖 n 的节点 m:
       m 的入度 - 1
       if m 的入度 == 0:
         将 m 加入队列
4. if 结果列表长度 != 节点总数:
     存在循环依赖，返回 CycleError
5. 返回结果列表
```

### 2.4 Cycle Detection

```
Input: DependencyGraph
Output: Cycle[] (所有循环路径)

Algorithm (DFS + Coloring):
1. 标记所有节点为 WHITE (未访问)
2. for each 节点 v:
     if v 是 WHITE:
       DFS(v)

DFS(v):
  标记 v 为 GRAY (访问中)
  for each v 的邻居 u:
    if u 是 GRAY:
      记录循环路径
    else if u 是 WHITE:
      DFS(u)
  标记 v 为 BLACK (已完成)
```

### 2.5 R→D Gate Check

```
Input: featureId, DependencyGraph, BacklogStatus
Output: GateCheckResult

Conditions:
1. analyzed_complete:
   - feature.analyzed == true
   - 消息: "依赖分析已完成" / "依赖分析未完成"

2. no_pending_backlog:
   - 需求池中无相关待分析项
   - 消息: "需求池已清空" / "需求池有 N 个待分析项"

3. requires_satisfied:
   - 所有 requires 的 Feature 存在且状态 >= analyzed
   - 消息: "所有前置依赖已就绪" / "等待: feat-a, feat-b"

4. no_cycle:
   - 不存在循环依赖
   - 消息: "无循环依赖" / "发现循环: A → B → A"

canProceed = 所有条件都满足
```

### 2.6 Path Query

```
Input: fromId, toId, DependencyGraph
Output: string[][] (所有路径)

Algorithm (BFS/DFS):
查找从 fromId 到 toId 的所有依赖路径
```

### 2.7 Output Format

#### Dependency Graph Output

```
=== Dependency Graph ===

feat-workflow-orchestration (analyzing, critical)
├── requires:
│   ├── feat-doc-indexer (proposed, high)
│   └── feat-dependency-graph (proposed, high)
└── blocks: (none)

feat-doc-indexer (proposed, high)
├── requires: (none)
└── blocks:
    └── feat-dependency-graph

Topological Order:
1. feat-doc-indexer
2. feat-dependency-graph
3. feat-workflow-orchestration

Cycle Detection: No cycles found
```

#### Gate Check Output

```
=== R→D Gate Check: feat-doc-indexer ===

Conditions:
  [PASS] 依赖分析已完成 (analyzed: true)
  [PASS] 需求池已清空 (无相关待分析项)
  [PASS] 所有前置依赖已就绪 (无前置依赖)
  [PASS] 无循环依赖

Result: Can proceed to Design phase
```

## 3. Dependency Analysis

### 3.1 Requires

| Dependency | Type | Status | Description |
|------------|------|--------|-------------|
| **feat-doc-indexer** | Feature | proposed | 提供索引数据作为图构建的输入 |
| Glob/Read Tools | Infra | Claude Built-in | 读取 backlog.md 检查需求池状态 |

**结论**: 本 Feature 依赖 `feat-doc-indexer`，但该 Feature 已分析完成，可并行进入 Design。

### 3.2 Affects

| Item | Type | Impact | Description |
|------|------|--------|-------------|
| /next Command | Command | High | 阶段转换前调用门控检查 |
| /status Command | Command | Medium | 显示依赖图和门控状态 |
| feat-workflow-orchestration | Feature | High | R→D 门控依赖本 Feature |

### 3.3 New Backlog Items

(无新增 - 所有依赖已识别)

### 3.4 Analysis Conclusion

- [x] 所有前置依赖已识别
- [x] 所有前置依赖已存在 (feat-doc-indexer 已分析完成)
- [x] 后续影响已评估
- [x] 无新增依赖到 Backlog

**Status**: Ready for Design

## 4. Acceptance Criteria

### AC-1: Graph Building
- [x] 能从 IndexResult 构建 DependencyGraph
- [x] 正确识别所有 requires 关系
- [x] 正确识别所有 blocks 关系

### AC-2: Topological Sort
- [x] 返回有效的执行顺序
- [x] 无依赖的 Feature 排在前面
- [x] 存在循环时正确报错

### AC-3: Cycle Detection
- [x] 能检测直接循环 (A → B → A)
- [x] 能检测间接循环 (A → B → C → A)
- [x] 返回完整的循环路径

### AC-4: R→D Gate Check
- [x] 检查 analyzed 状态
- [x] 检查需求池状态
- [x] 检查前置依赖就绪状态
- [x] 检查循环依赖
- [x] 返回结构化的检查结果

### AC-5: Path Query
- [x] 能查询两个 Feature 之间的依赖路径
- [x] 返回所有可能的路径

### AC-6: Text Output
- [x] 依赖图输出清晰可读
- [x] 门控检查结果易于理解
- [x] 阻塞原因明确

### AC-7: Integration
- [x] /next 命令调用门控检查
- [x] 条件不满足时给出明确提示

## 5. Technical Constraints

- **No Persistence**: 每次按需计算
- **Claude Tools Only**: 使用 Read 获取索引数据和 backlog 状态
- **Performance**: 图算法应在 1 秒内完成（<100 节点）
- **Dependency**: 必须先调用 feat-doc-indexer 获取数据

## 6. Relationship with feat-doc-indexer

```
┌─────────────────────┐
│  feat-doc-indexer   │
│  ─────────────────  │
│  • Scan documents   │
│  • Parse Frontmatter│
│  • Schema validation│
│  • Reverse links    │
│  • Output: IndexResult
└──────────┬──────────┘
           │
           ▼ provides data
┌─────────────────────────┐
│  feat-dependency-graph  │
│  ─────────────────────  │
│  • Build graph          │
│  • Topological sort     │
│  • Cycle detection      │
│  • Gate check           │
│  • Output: GateCheckResult
└─────────────────────────┘
```

**分工明确**：
- `doc-indexer`: 数据层，负责"读取和验证"
- `dependency-graph`: 逻辑层，负责"分析和决策"

---

*Feature: dependency-graph*
*Domain: DocSystem*
*Created: 2026-01-02*
*Status: done*
*Dependencies Analyzed: true*
