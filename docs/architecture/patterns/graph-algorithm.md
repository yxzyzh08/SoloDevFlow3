---
id: pattern-graph-algorithm
title: Graph Data Structure and Algorithms
status: active
used_by: [dependency-graph]
---

# Graph Data Structure and Algorithms

## Intent

使用图数据结构表示实体间的依赖关系，并提供常用图算法支持。

## Data Structure: Adjacency List

```typescript
interface DependencyGraph {
  nodes: Map<string, GraphNode>;
  edges: {
    requires: Map<string, string[]>;  // A requires [B, C]
    blocks: Map<string, string[]>;    // A blocks [D, E]
  };
}
```

**优点**:
- 空间效率高（稀疏图）
- 遍历邻居 O(degree)
- 易于序列化

## Algorithm 1: Topological Sort (Kahn's Algorithm)

**用途**: 确定无循环依赖时的执行顺序

```
Input: DependencyGraph
Output: string[] (排序后的节点 ID) 或 CycleError

Algorithm:
1. 计算每个节点的入度
2. 将入度为 0 的节点入队
3. while 队列非空:
     取出节点 n
     添加到结果
     减少其邻居的入度
     入度变 0 的邻居入队
4. if 结果长度 != 节点数:
     存在循环
```

**复杂度**: O(V + E)

## Algorithm 2: Cycle Detection (DFS + Coloring)

**用途**: 检测是否存在循环依赖

```
Colors:
  WHITE = 未访问
  GRAY  = 访问中（在当前路径上）
  BLACK = 已完成

Algorithm:
1. 所有节点标记为 WHITE
2. 对每个 WHITE 节点执行 DFS:
     标记为 GRAY
     遍历邻居:
       if GRAY → 发现循环
       if WHITE → 递归 DFS
     标记为 BLACK
```

**复杂度**: O(V + E)

## Usage in SoloDevFlow

### Building the Graph

```typescript
function buildGraph(features: FeatureIndex[]): DependencyGraph {
  const graph = { nodes: new Map(), edges: { requires: new Map(), blocks: new Map() } };

  // Add nodes
  for (const f of features) {
    graph.nodes.set(f.id, { id: f.id, status: f.status, ... });
  }

  // Add edges
  for (const f of features) {
    graph.edges.requires.set(f.id, f.dependencies.requires);
    graph.edges.blocks.set(f.id, f.dependencies.blocks);
  }

  return graph;
}
```

### Gate Check with Graph

```typescript
function checkRToD(featureId: string, graph: DependencyGraph): GateCheckResult {
  // 检查前置依赖状态
  const deps = graph.edges.requires.get(featureId);
  for (const depId of deps) {
    const dep = graph.nodes.get(depId);
    if (dep.status not in ['analyzed', 'designing', 'done']) {
      // 依赖未就绪
    }
  }

  // 检查循环依赖
  const cycles = detectCycles(graph);
  if (cycles involving featureId) {
    // 存在循环
  }
}
```

## When to Use

- 表示实体间的依赖/引用关系
- 需要计算执行顺序
- 需要检测循环引用

## Related Patterns

- Dependency Injection
- Observer Pattern (事件图)
