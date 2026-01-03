/**
 * Graph Algorithms
 * 拓扑排序和循环检测
 */

import type { DependencyGraph } from '../types.js';

// ============ Topological Sort (Kahn's Algorithm) ============

export interface TopologicalSortResult {
  success: boolean;
  order: string[];
  error?: string;
}

/**
 * 拓扑排序 - Kahn's Algorithm
 * @param graph 依赖图
 * @returns 排序结果
 */
export function topologicalSort(graph: DependencyGraph): TopologicalSortResult {
  // 计算入度
  const inDegree = new Map<string, number>();
  for (const nodeId of graph.nodes.keys()) {
    inDegree.set(nodeId, 0);
  }

  // 注意：requires 边表示 "from 依赖 to"
  // 所以 from 的入度增加（它需要等待 to 完成）
  for (const [from, toList] of graph.edges.requires) {
    for (const to of toList) {
      if (graph.nodes.has(to)) {
        // from 依赖 to，所以 from 的入度 +1
        inDegree.set(from, (inDegree.get(from) || 0) + 1);
      }
    }
  }

  // 入度为 0 的节点入队（没有依赖的节点）
  const queue: string[] = [];
  for (const [nodeId, degree] of inDegree) {
    if (degree === 0) {
      queue.push(nodeId);
    }
  }

  // BFS
  const result: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(current);

    // 找到所有依赖 current 的节点，减少它们的入度
    for (const [from, toList] of graph.edges.requires) {
      if (toList.includes(current)) {
        const newDegree = (inDegree.get(from) || 0) - 1;
        inDegree.set(from, newDegree);
        if (newDegree === 0) {
          queue.push(from);
        }
      }
    }
  }

  // 检查是否有环
  if (result.length !== graph.nodes.size) {
    return {
      success: false,
      order: result,
      error: '存在循环依赖，无法完成拓扑排序'
    };
  }

  return {
    success: true,
    order: result
  };
}

// ============ Cycle Detection (DFS + Coloring) ============

enum Color {
  WHITE = 0,  // 未访问
  GRAY = 1,   // 访问中（在当前路径上）
  BLACK = 2   // 已完成
}

export interface CycleDetectionResult {
  hasCycle: boolean;
  cycles: string[][];
}

/**
 * 循环检测 - DFS + 着色算法
 * @param graph 依赖图
 * @returns 检测结果
 */
export function detectCycles(graph: DependencyGraph): CycleDetectionResult {
  const color = new Map<string, Color>();
  const cycles: string[][] = [];

  // 初始化所有节点为 WHITE
  for (const nodeId of graph.nodes.keys()) {
    color.set(nodeId, Color.WHITE);
  }

  function dfs(node: string, path: string[]): void {
    color.set(node, Color.GRAY);
    path.push(node);

    const deps = graph.edges.requires.get(node) || [];
    for (const dep of deps) {
      // 跳过不存在的依赖
      if (!graph.nodes.has(dep)) continue;

      if (color.get(dep) === Color.GRAY) {
        // 发现环！
        const cycleStart = path.indexOf(dep);
        const cycle = path.slice(cycleStart);
        cycle.push(dep);  // 闭合环
        cycles.push(cycle);
      } else if (color.get(dep) === Color.WHITE) {
        dfs(dep, path);
      }
    }

    path.pop();
    color.set(node, Color.BLACK);
  }

  // 从每个未访问的节点开始 DFS
  for (const nodeId of graph.nodes.keys()) {
    if (color.get(nodeId) === Color.WHITE) {
      dfs(nodeId, []);
    }
  }

  return {
    hasCycle: cycles.length > 0,
    cycles
  };
}

/**
 * 查找两个节点之间的所有路径
 * @param graph 依赖图
 * @param from 起始节点
 * @param to 目标节点
 * @returns 所有路径
 */
export function findPaths(
  graph: DependencyGraph,
  from: string,
  to: string
): string[][] {
  const paths: string[][] = [];
  const visited = new Set<string>();

  function dfs(current: string, path: string[]): void {
    if (current === to) {
      paths.push([...path, current]);
      return;
    }

    if (visited.has(current)) return;
    visited.add(current);

    const deps = graph.edges.requires.get(current) || [];
    for (const dep of deps) {
      if (graph.nodes.has(dep)) {
        dfs(dep, [...path, current]);
      }
    }

    visited.delete(current);
  }

  dfs(from, []);
  return paths;
}

/**
 * 格式化拓扑排序结果
 */
export function formatTopologicalOrder(
  result: TopologicalSortResult,
  graph: DependencyGraph
): string {
  const lines: string[] = [];
  lines.push('=== Execution Order ===');
  lines.push('');

  if (!result.success) {
    lines.push(`Error: ${result.error}`);
    lines.push('');
    lines.push('Partial order (before cycle detected):');
  } else {
    lines.push('Recommended sequence (based on dependencies):');
  }

  for (let i = 0; i < result.order.length; i++) {
    const nodeId = result.order[i];
    const deps = graph.edges.requires.get(nodeId) || [];
    const depStr = deps.length > 0 ? `[requires: ${deps.join(', ')}]` : '[no deps]';
    lines.push(`${i + 1}. ${nodeId}  ${depStr}`);
  }

  return lines.join('\n');
}
